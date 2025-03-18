import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BreezeChannelIdentifier, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, Event, Exception, IConfig, IEnvelope, IOfflineListener, ISample,
    IStorageBuffer, Metric, PageView, PageViewPerformance, ProcessLegacy, RemoteDependencyData, RequestHeaders, SampleRate, Trace,
    createOfflineListener, eRequestHeaders, isInternalApplicationInsightsEndpoint, urlParseUrl, utlCanUseSessionStorage, utlSetStoragePrefix
} from "@microsoft/applicationinsights-common";
import {
    ActiveStatus, BaseTelemetryPlugin, IAppInsightsCore, IBackendResponse, IChannelControls, IConfigDefaults, IConfiguration,
    IDiagnosticLogger, IInternalOfflineSupport, INotificationManager, IPayloadData, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, IStatsBeat, IStatsBeatEvent, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState,
    IXDomainRequest, IXHROverride, OnCompleteCallback, SendPOSTFunction, SendRequestReason, SenderPostManager, TransportType,
    _ISendPostMgrConfig, _ISenderOnComplete, _eInternalMessageId, _throwInternal, _warnToConsole, arrForEach, cfgDfBoolean, cfgDfValidate,
    createProcessTelemetryContext, createUniqueNamespace, dateNow, dumpObj, eLoggingSeverity, formatErrorMessageXdr, formatErrorMessageXhr,
    getExceptionName, getIEVersion, isArray, isBeaconsSupported, isFetchSupported, isNullOrUndefined, mergeEvtNamespace, objExtend,
    onConfigChange, parseResponse, prependTransports, runTargetUnload
} from "@microsoft/applicationinsights-core-js";
import { IPromise } from "@nevware21/ts-async";
import {
    ITimerHandler, isNumber, isPromiseLike, isString, isTruthy, mathFloor, mathMax, mathMin, objDeepFreeze, objDefine, scheduleTimeout
} from "@nevware21/ts-utils";
import {
    DependencyEnvelopeCreator, EnvelopeCreator, EventEnvelopeCreator, ExceptionEnvelopeCreator, MetricEnvelopeCreator,
    PageViewEnvelopeCreator, PageViewPerformanceEnvelopeCreator, TraceEnvelopeCreator
} from "./EnvelopeCreator";
import { IInternalStorageItem, ISenderConfig } from "./Interfaces";
import { ArraySendBuffer, ISendBuffer, SessionStorageSendBuffer } from "./SendBuffer";
import { Serializer } from "./Serializer";
import { Sample } from "./TelemetryProcessors/Sample";

const UNDEFINED_VALUE: undefined = undefined;
const EMPTY_STR = "";

const FetchSyncRequestSizeLimitBytes = 65000; // approx 64kb (the current Edge, Firefox and Chrome max limit)

interface IInternalPayloadData extends IPayloadData {
    oriPayload: IInternalStorageItem[];
    retryCnt?: number;
    statsBeatData?: IStatsBeatEvent;
}


function _getResponseText(xhr: XMLHttpRequest | IXDomainRequest) {
    try {
        return xhr.responseText;
    } catch (e) {
        // Best effort, as XHR may throw while XDR wont so just ignore
    }

    return null;
}

function isOverrideFn(httpXHROverride: any) {
    return httpXHROverride && httpXHROverride.sendPOST;
}


const defaultAppInsightsChannelConfig: IConfigDefaults<ISenderConfig> = objDeepFreeze({
    // Use the default value (handles empty string in the configuration)
    endpointUrl: cfgDfValidate(isTruthy, DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH),
    emitLineDelimitedJson: cfgDfBoolean(),
    maxBatchInterval: 15000,
    maxBatchSizeInBytes: 102400,  // 100kb
    disableTelemetry: cfgDfBoolean(),
    enableSessionStorageBuffer: cfgDfBoolean(true),
    isRetryDisabled: cfgDfBoolean(),
    isBeaconApiDisabled: cfgDfBoolean(true),
    disableSendBeaconSplit: cfgDfBoolean(true),
    disableXhr: cfgDfBoolean(),
    onunloadDisableFetch: cfgDfBoolean(),
    onunloadDisableBeacon: cfgDfBoolean(),
    instrumentationKey: UNDEFINED_VALUE,  // Channel doesn't need iKey, it should be set already
    namePrefix: UNDEFINED_VALUE,
    samplingPercentage: cfgDfValidate(_chkSampling, 100),
    customHeaders: UNDEFINED_VALUE,
    convertUndefined: UNDEFINED_VALUE,
    eventsLimitInMem: 10000,
    bufferOverride: false,
    httpXHROverride: { isVal: isOverrideFn, v:UNDEFINED_VALUE },
    alwaysUseXhrOverride: cfgDfBoolean(),
    transports: UNDEFINED_VALUE,
    retryCodes: UNDEFINED_VALUE,
    maxRetryCnt: {isVal: isNumber, v:10}
});

function _chkSampling(value: number) {
    return !isNaN(value) && value > 0 && value <= 100;
}

type EnvelopeCreator = (logger: IDiagnosticLogger, telemetryItem: ITelemetryItem, customUndefinedValue?: any) => IEnvelope;

const EnvelopeTypeCreator: { [key:string] : EnvelopeCreator } = {
    [Event.dataType]:                   EventEnvelopeCreator,
    [Trace.dataType]:                   TraceEnvelopeCreator,
    [PageView.dataType]:                PageViewEnvelopeCreator,
    [PageViewPerformance.dataType]:     PageViewPerformanceEnvelopeCreator,
    [Exception.dataType]:               ExceptionEnvelopeCreator,
    [Metric.dataType]:                  MetricEnvelopeCreator,
    [RemoteDependencyData.dataType]:    DependencyEnvelopeCreator
};

export type SenderFunction = (payload: string[] | IInternalStorageItem[], isAsync: boolean) => void | IPromise<boolean>;

export class Sender extends BaseTelemetryPlugin implements IChannelControls {

    public static constructEnvelope(orig: ITelemetryItem, iKey: string, logger: IDiagnosticLogger, convertUndefined?: any): IEnvelope {
        let envelope: ITelemetryItem;
        if (iKey !== orig.iKey && !isNullOrUndefined(iKey)) {
            envelope = {
                ...orig,
                iKey
            };
        } else {
            envelope = orig;
        }
    
        let creator: EnvelopeCreator = EnvelopeTypeCreator[envelope.baseType] || EventEnvelopeCreator;
    
        return creator(logger, envelope, convertUndefined);
    }
    
    public readonly priority: number = 1001;

    public readonly identifier: string = BreezeChannelIdentifier;

    /**
     * The configuration for this sender instance
     */
    public readonly _senderConfig: ISenderConfig;

    /**
     * A method which will cause data to be send to the url
     */
    public _sender: SenderFunction;

    /**
     * A send buffer object
     */
    public _buffer: ISendBuffer;

    /**
     * AppId of this component parsed from some backend response.
     */
    public _appId: string;

    protected _sample: ISample;

    constructor() {
        super();

        // Don't set the defaults here, set them in the _initDefaults() as this is also called during unload
        let _consecutiveErrors: number;         // How many times in a row a retryable error condition has occurred.
        let _retryAt: number;                   // The time to retry at in milliseconds from 1970/01/01 (this makes the timer calculation easy).
        let _lastSend: number;                  // The time of the last send operation.
        let _paused: boolean;                   // Flag indicating that the sending should be paused
        let _timeoutHandle: ITimerHandler;      // Handle to the timer for delayed sending of batches of data.
        let _serializer: Serializer;
        let _stamp_specific_redirects: number;
        let _headers: { [name: string]: string };
        let _syncFetchPayload = 0;              // Keep track of the outstanding sync fetch payload total (as sync fetch has limits)
        let _syncUnloadSender: SenderFunction;  // The identified sender to use for the synchronous unload stage
        let _offlineListener: IOfflineListener;
        let _evtNamespace: string | string[];
        let _endpointUrl: string;
        let _statsBeat: IStatsBeat;
        let _orgEndpointUrl: string;
        let _maxBatchSizeInBytes: number;
        let _beaconSupported: boolean;
        let _beaconOnUnloadSupported: boolean;
        let _beaconNormalSupported: boolean;
        let _customHeaders: Array<{header: string, value: string}>;
        let _disableTelemetry: boolean;
        let _instrumentationKey: string;
        let _convertUndefined: any;
        let _isRetryDisabled: boolean;
        let _maxBatchInterval: number;
        let _sessionStorageUsed: boolean;
        let _bufferOverrideUsed: IStorageBuffer | false;
        let _namePrefix: string;
        let _enableSendPromise: boolean;
        let _alwaysUseCustomSend: boolean;
        let _disableXhr: boolean;
        let _fetchKeepAlive: boolean;
        let _xhrSend: SenderFunction;
        let _fallbackSend: SenderFunction;
        let _disableBeaconSplit: boolean;
        let _sendPostMgr: SenderPostManager;
        let _retryCodes: number[];

        dynamicProto(Sender, this, (_self, _base) => {

            _initDefaults();

            _self.pause = () => {
                _clearScheduledTimer();
                _paused = true;
            };
        
            _self.resume = () => {
                if (_paused) {
                    _paused = false;
                    _retryAt = null;

                    // flush if we have exceeded the max-size already
                    _checkMaxSize();
                    _setupTimer();
                }
            };
        
            _self.flush = (isAsync: boolean = true, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason) => {
                if (!_paused) {
                    // Clear the normal schedule timer as we are going to try and flush ASAP
                    _clearScheduledTimer();

                    try {
                        return _self.triggerSend(isAsync, null, sendReason || SendRequestReason.ManualFlush);
                    } catch (e) {
                        _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.FlushFailed,
                            "flush failed, telemetry will not be collected: " + getExceptionName(e),
                            { exception: dumpObj(e) });
                    }
                }
            };
        
            _self.onunloadFlush = () => {
                if (!_paused) {
                    if (_beaconSupported || _alwaysUseCustomSend) {
                        try {
                            return _self.triggerSend(true, _doUnloadSend, SendRequestReason.Unload);
                        } catch (e) {
                            _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.FailedToSendQueuedTelemetry,
                                "failed to flush with beacon sender on page unload, telemetry will not be collected: " + getExceptionName(e),
                                { exception: dumpObj(e) });
                        }
                    } else {
                        _self.flush(false);
                    }
                }
            };

            _self.addHeader = (name: string, value: string) => {
                _headers[name] = value;
            };
        
            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain): void => {
                if (_self.isInitialized()) {
                    _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "Sender is already initialized");
                }

             
                _base.initialize(config, core, extensions, pluginChain);
                let identifier = _self.identifier;
                _serializer = new Serializer(core.logger);
                _consecutiveErrors = 0;
                _retryAt = null;
                _lastSend = 0;
                _self._sender = null;
                _stamp_specific_redirects = 0;
                let diagLog = _self.diagLog();
                _evtNamespace = mergeEvtNamespace(createUniqueNamespace("Sender"), core.evtNamespace && core.evtNamespace());
                _offlineListener = createOfflineListener(_evtNamespace);

                // This function will be re-called whenever any referenced configuration is changed
                _self._addHook(onConfigChange(config, (details) => {
                    let config = details.cfg;
                    if (config.storagePrefix){
                        utlSetStoragePrefix(config.storagePrefix);
                    }
                    let ctx = createProcessTelemetryContext(null, config, core);
                    // getExtCfg only finds undefined values from core
                    let senderConfig = ctx.getExtCfg(identifier, defaultAppInsightsChannelConfig);

                    let curExtUrl = senderConfig.endpointUrl;
                    _statsBeat = core.getStatsBeat();
                    
                    if (_statsBeat && !_statsBeat.isInitialized()) {
                        _statsBeat.setInitialized(true); // otherwise, it will fall into infinite loop of creating new sender
                        var endpointHost = urlParseUrl(_self._senderConfig.endpointUrl).hostname;
                        _statsBeat.initialize(core, senderConfig.instrumentationKey, endpointHost, EnvelopeCreator.Version);
                    }
                    if (config.disableStatsBeat !== false){
                        _statsBeat.setInitialized(false);
                    }
                    // if it is not inital change (_endpointUrl has value)
                    // if current sender endpoint url is not changed directly
                    // means ExtCfg is not changed directly
                    // then we need to monitor endpoint url changes from core
                    if (_endpointUrl && curExtUrl === _endpointUrl) {
                        let coreUrl = config.endpointUrl as any;
                        // if core endpoint url is changed
                        if (coreUrl && coreUrl !== curExtUrl) {
                            // and endpoint promise changes is handled by this as well
                            senderConfig.endpointUrl = coreUrl;
                        }
                    }

                    if(isPromiseLike(senderConfig.instrumentationKey)) {
                        // if it is promise, means the endpoint url is from core.endpointurl
                        senderConfig.instrumentationKey = config.instrumentationKey as any;
                    }
                    objDefine(_self, "_senderConfig", {
                        g: function() {
                            return senderConfig;
                        }
                    });

                    // Only update the endpoint if the original config !== the current config
                    // This is so any redirect endpointUrl is not overwritten
                    if (_orgEndpointUrl !== senderConfig.endpointUrl) {
                        if (_orgEndpointUrl) {
                            // TODO: add doc to remind users to flush before changing endpoint, otherwise all unsent payload will be sent to new endpoint
                        }
                        _endpointUrl = _orgEndpointUrl = senderConfig.endpointUrl;
                    }

                    // or is not string
                    if (core.activeStatus() === ActiveStatus.PENDING) {
                        // waiting for core promises to be resolved
                        // NOTE: if active status is set to pending, stop sending, clear timer here
                        _self.pause();
                    } else if (core.activeStatus() === ActiveStatus.ACTIVE) {
                        // core status changed from pending to other status
                        _self.resume();
    
                    }

                    if (_customHeaders && _customHeaders !== senderConfig.customHeaders) {
                        // Removing any previously defined custom headers as they have changed
                        arrForEach(_customHeaders, customHeader => {
                            delete _headers[customHeader.header];
                        });
                    }

                    _maxBatchSizeInBytes = senderConfig.maxBatchSizeInBytes;
                    _beaconSupported = (senderConfig.onunloadDisableBeacon === false || senderConfig.isBeaconApiDisabled === false) && isBeaconsSupported();
                    _beaconOnUnloadSupported = senderConfig.onunloadDisableBeacon === false  && isBeaconsSupported();
                    _beaconNormalSupported = senderConfig.isBeaconApiDisabled === false && isBeaconsSupported();

                    _alwaysUseCustomSend = senderConfig.alwaysUseXhrOverride;
                    _disableXhr = !!senderConfig.disableXhr;
                    _retryCodes = senderConfig.retryCodes;
                    
                    let bufferOverride = senderConfig.bufferOverride;
                    let canUseSessionStorage = !!senderConfig.enableSessionStorageBuffer &&
                        (!!bufferOverride || utlCanUseSessionStorage());
                    let namePrefix = senderConfig.namePrefix;
                 
                    //Note: emitLineDelimitedJson and eventsLimitInMem is directly accessed via config in senderBuffer
                    //Therefore, if canUseSessionStorage is not changed, we do not need to re initialize a new one
                    let shouldUpdate = (canUseSessionStorage !== _sessionStorageUsed)
                                    || (canUseSessionStorage && (_namePrefix !== namePrefix))  // prefixName is only used in session storage
                                    || (canUseSessionStorage && (_bufferOverrideUsed !== bufferOverride));

                    if (_self._buffer) {
                        // case1 (Pre and Now enableSessionStorageBuffer settings are same)
                        // if namePrefix changes, transfer current buffer to new buffer
                        // else no action needed

                        //case2 (Pre and Now enableSessionStorageBuffer settings are changed)
                        // transfer current buffer to new buffer
                       
                        if (shouldUpdate) {
                            try {
                                
                                _self._buffer = _self._buffer.createNew(diagLog, senderConfig, canUseSessionStorage);
                       
                            } catch (e) {
                                _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL,
                                    _eInternalMessageId.FailedAddingTelemetryToBuffer,
                                    "failed to transfer telemetry to different buffer storage, telemetry will be lost: " + getExceptionName(e),
                                    { exception: dumpObj(e) });
                            }
                        }
                        _checkMaxSize();
                    } else {
                        _self._buffer = canUseSessionStorage
                            ? new SessionStorageSendBuffer(diagLog, senderConfig) : new ArraySendBuffer(diagLog, senderConfig);
                    }

                    _namePrefix = namePrefix;
                    _sessionStorageUsed = canUseSessionStorage;
                    _bufferOverrideUsed = bufferOverride;
                    _fetchKeepAlive = !senderConfig.onunloadDisableFetch && isFetchSupported(true);
                    _disableBeaconSplit = !!senderConfig.disableSendBeaconSplit;

                    _self._sample = new Sample(senderConfig.samplingPercentage, diagLog);

                    _instrumentationKey = senderConfig.instrumentationKey;
                    if(!isPromiseLike(_instrumentationKey) && !_validateInstrumentationKey(_instrumentationKey, config)) {
                        _throwInternal(diagLog,
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.InvalidInstrumentationKey, "Invalid Instrumentation key " + _instrumentationKey);
                    }

                    _customHeaders = senderConfig.customHeaders;
                    if (isString(_endpointUrl) && !isInternalApplicationInsightsEndpoint(_endpointUrl) && _customHeaders && _customHeaders.length > 0) {
                        arrForEach(_customHeaders, customHeader => {
                            this.addHeader(customHeader.header, customHeader.value);
                        });
                    } else {
                        _customHeaders = null;
                    }
                    _enableSendPromise = senderConfig.enableSendPromise;
                    let sendPostConfig = _getSendPostMgrConfig();

                    // only init it once
                    if (!_sendPostMgr) {
                        _sendPostMgr = new SenderPostManager();
                        _sendPostMgr.initialize(sendPostConfig, diagLog);
                    } else {
                        _sendPostMgr.SetConfig(sendPostConfig);
                    }

                    let customInterface = senderConfig.httpXHROverride;
                    let httpInterface: IXHROverride = null;
                    let syncInterface: IXHROverride = null;
                   
                    // User requested transport(s) values > Beacon > Fetch > XHR
                    // Beacon would be filtered out if user has set disableBeaconApi to true at _getSenderInterface
                    let theTransports: TransportType[] = prependTransports([TransportType.Beacon, TransportType.Xhr, TransportType.Fetch], senderConfig.transports);

                    httpInterface = _sendPostMgr && _sendPostMgr.getSenderInst(theTransports, false);
                  
                    let xhrInterface = _sendPostMgr && _sendPostMgr.getFallbackInst();
                    _xhrSend = (payload: IInternalStorageItem[], isAsync: boolean) => {
                        return _doSend(xhrInterface, payload, isAsync);
                    };
                    _fallbackSend = (payload: IInternalStorageItem[], isAsync: boolean) => { // for fallback send, should NOT mark payload as sent again!
                        return _doSend(xhrInterface, payload, isAsync, false);
                    };
    
                    httpInterface = _alwaysUseCustomSend? customInterface : (httpInterface || customInterface || xhrInterface);

                    _self._sender = (payload: IInternalStorageItem[], isAsync: boolean) => {
                        return _doSend(httpInterface, payload, isAsync);
                    };

                    if (_fetchKeepAlive) {
                        // Try and use the fetch with keepalive
                        _syncUnloadSender = _fetchKeepAliveSender;
                    }
                    
                    let syncTransports: TransportType[] = prependTransports([TransportType.Beacon, TransportType.Xhr], senderConfig.unloadTransports);
                    if (!_fetchKeepAlive){
                        // remove fetch from theTransports
                        syncTransports = syncTransports.filter(transport => transport !== TransportType.Fetch);
                    }

                    syncInterface = _sendPostMgr && _sendPostMgr.getSenderInst(syncTransports, true);
                    syncInterface = _alwaysUseCustomSend? customInterface : (syncInterface || customInterface);
                   
                    if ((_alwaysUseCustomSend || senderConfig.unloadTransports || !_syncUnloadSender) && syncInterface) {
                        _syncUnloadSender = (payload: IInternalStorageItem[], isAsync: boolean) => {
                            return _doSend(syncInterface, payload, isAsync);
                        };
                    }

                    if (!_syncUnloadSender) {
                        _syncUnloadSender = _xhrSend;
                    }

                    _disableTelemetry = senderConfig.disableTelemetry;
                    _convertUndefined = senderConfig.convertUndefined || UNDEFINED_VALUE;
                    _isRetryDisabled = senderConfig.isRetryDisabled;
                    _maxBatchInterval = senderConfig.maxBatchInterval;
                }));
            };
            
            _self.processTelemetry = (telemetryItem: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                itemCtx = _self._getTelCtx(itemCtx);
                let diagLogger = itemCtx.diagLog();
                
                try {
                    let isValidate = _validate(telemetryItem, diagLogger);
                    if (!isValidate) {
                        return;
                    }
        
                    let aiEnvelope = _getEnvelope(telemetryItem, diagLogger);
                    if (!aiEnvelope) {
                        return;
                    }
        
                    // check if the incoming payload is too large, truncate if necessary
                    const payload: string = _serializer.serialize(aiEnvelope);
        
                    // flush if we would exceed the max-size limit by adding this item
                    const buffer = _self._buffer;
                    _checkMaxSize(payload);
                    let payloadItem = {
                        item: payload,
                        cnt: 0 // inital cnt will always be 0
                    } as IInternalStorageItem;

                    // enqueue the payload
                    buffer.enqueue(payloadItem);
        
                    // ensure an invocation timeout is set
                    _setupTimer();
        
                } catch (e) {
                    _throwInternal(diagLogger,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.FailedAddingTelemetryToBuffer,
                        "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
        
                // hand off the telemetry item to the next plugin
                _self.processNext(telemetryItem, itemCtx);
            };

            _self.isCompletelyIdle = () => {
                return !_paused && _syncFetchPayload === 0 && _self._buffer.count() === 0;
            }

            _self.getOfflineListener = () => {
                return _offlineListener;
            }
        
            /**
             * xhr state changes
             */
            _self._xhrReadyStateChange = (xhr: XMLHttpRequest, payload: string[] | IInternalStorageItem[], countOfItemsInPayload: number) => {
                // since version 3.2.0, this function is no-op
                if (_isStringArr(payload)) {
                    return;
                }
                return _xhrReadyStateChange(xhr, payload as IInternalStorageItem[], countOfItemsInPayload, statsBeat);

            }
        
            /**
             * Immediately send buffered data
             * @param async - Indicates if the events should be sent asynchronously
             * @param forcedSender - Indicates the forcedSender, undefined if not passed
             */
            _self.triggerSend = (async = true, forcedSender?: SenderFunction, sendReason?: SendRequestReason) => {
                let result: void | IPromise<boolean>;
                if (!_paused) {
                    try {
                        const buffer = _self._buffer;
    
                        // Send data only if disableTelemetry is false
                        if (!_disableTelemetry) {
            
                            if (buffer.count() > 0) {
                                const payload = buffer.getItems();
            
                                _notifySendRequest(sendReason||SendRequestReason.Undefined, async);
            
                                // invoke send
                                if (forcedSender) {
                                    result = forcedSender.call(_self, payload, async);
                                } else {
                                    result = _self._sender(payload, async);
                                }
                            }
            
                            // update lastSend time to enable throttling
                            _lastSend = +new Date;
                        } else {
                            buffer.clear();
                        }
            
                        _clearScheduledTimer();
                    } catch (e) {
                        /* Ignore this error for IE under v10 */
                        let ieVer = getIEVersion();
                        if (!ieVer || ieVer > 9) {
                            _throwInternal(_self.diagLog(),
                                eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.TransmissionFailed,
                                "Telemetry transmission failed, some telemetry will be lost: " + getExceptionName(e),
                                { exception: dumpObj(e) });
                        }
                    }
                }

                return result;
            };
            
            _self.getOfflineSupport = () => {
                return {
                    getUrl: () => {
                        return _endpointUrl;
                    },
                    createPayload:_createPayload,
                    serialize: _serialize,
                    batch: _batch,
                    shouldProcess:(evt) => {
                        return !!_validate(evt);
                    }
                } as IInternalOfflineSupport;
            }
        
            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _self.onunloadFlush();
                runTargetUnload(_offlineListener, false);
                _initDefaults();
            };

            /**
             * error handler
             */
            _self._onError = (payload: IInternalStorageItem[] | string[], message: string, event?: ErrorEvent) => {
                // since version 3.1.3, string[] is no-op
                if (_isStringArr(payload)) {
                    return;
                }
                return _onError(payload as IInternalStorageItem[], message, event);
            };
        
            /**
             * partial success handler
             */
            _self._onPartialSuccess = (payload: IInternalStorageItem[] | string[], results: IBackendResponse) => {
                // since version 3.1.3, string[] is no-op
                if (_isStringArr(payload)) {
                    return;
                }
                return _onPartialSuccess(payload as IInternalStorageItem[], results);
            };
        
            /**
             * success handler
             */
            _self._onSuccess = (payload: IInternalStorageItem[] | string[], countOfItemsInPayload: number) => {
                // since version 3.1.3, string[] is no-op
                if (_isStringArr(payload)) {
                    return;
                }
                return _onSuccess(payload as IInternalStorageItem[], countOfItemsInPayload);
                
                //_self._buffer && _self._buffer.clearSent(payload);
            };

        
            /**
             * xdr state changes
             */
            _self._xdrOnLoad = (xdr: IXDomainRequest, payload: IInternalStorageItem[] | string[]) => {
                // since version 3.1.3, string[] is no-op
                if (_isStringArr(payload)) {
                    return;
                }
                return _xdrOnLoad(xdr, payload as IInternalStorageItem[]);

            }

            function _xdrOnLoad (xdr: IXDomainRequest, payload: IInternalStorageItem[]) {
                const responseText = _getResponseText(xdr);
                if (xdr && (responseText + "" === "200" || responseText === "")) {
                    _consecutiveErrors = 0;
                    _self._onSuccess(payload, 0);
                    var endpointHost = urlParseUrl(_self._senderConfig.endpointUrl).hostname;
                } else {
                    const results = parseResponse(responseText);
        
                    if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                        && !_isRetryDisabled) {
                        _self._onPartialSuccess(payload, results);
                    } else {
                        _self._onError(payload, formatErrorMessageXdr(xdr));
                    }
                }

            }

            function _getSendPostMgrConfig(): _ISendPostMgrConfig {
                try {
                    let onCompleteFuncs = {
                        xdrOnComplete: (xdr: IXDomainRequest, oncomplete: OnCompleteCallback,payload?: IPayloadData) => {
                            let payloadArr = _getPayloadArr(payload);
                            if (!payloadArr) {
                                return;
                            }
                            return _xdrOnLoad(xdr, payloadArr);
                           
                        },
                        fetchOnComplete: (response: Response, onComplete: OnCompleteCallback, resValue?: string, payload?: IPayloadData) => {
                            let payloadArr = _getPayloadArr(payload);
                            if (!payloadArr) {
                                return;
                            }
                            return _checkResponsStatus(response.status, payloadArr, response.url, payloadArr.length, response.statusText, resValue || "");
                        },
                        xhrOnComplete: (request: XMLHttpRequest, oncomplete: OnCompleteCallback, payload?: IPayloadData) => {
                            let payloadArr = _getPayloadArr(payload);
                            if (!payloadArr) {
                                return;
                            }
                            return _xhrReadyStateChange(request, payloadArr, payloadArr.length);
                            
                        },
                        beaconOnRetry: (data: IPayloadData, onComplete: OnCompleteCallback, canSend: (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => boolean) => {
                            return _onBeaconRetry(data, onComplete, canSend);
                        }
    
                    } as _ISenderOnComplete;

                    let config = {
                        enableSendPromise: _enableSendPromise,
                        isOneDs: false,
                        disableCredentials: false,
                        disableXhr: _disableXhr,
                        disableBeacon: !_beaconNormalSupported,
                        disableBeaconSync: !_beaconOnUnloadSupported,
                        senderOnCompleteCallBack: onCompleteFuncs
                    } as _ISendPostMgrConfig;
                    return config;
                 

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return null;

            }

            /**
             * xhr state changes
             */
            function _xhrReadyStateChange (xhr: XMLHttpRequest, payload: IInternalStorageItem[], countOfItemsInPayload: number) {
                if (xhr.readyState === 4) {
                    
                    _checkResponsStatus(xhr.status, payload, xhr.responseURL, countOfItemsInPayload, formatErrorMessageXhr(xhr), _getResponseText(xhr) || xhr.response);
                }
            }

            /**
             * error handler
             */
            function _onError(payload: IInternalStorageItem[], message: string, event?: ErrorEvent) {
                _throwInternal(_self.diagLog(),
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.OnError,
                    "Failed to send telemetry.",
                    { message });
        
                _self._buffer && _self._buffer.clearSent(payload);
                var endpointHost = urlParseUrl(_self._senderConfig.endpointUrl).hostname;
                _statsBeat.countException(endpointHost, event);
            }
            /**
             * partial success handler
             */
            function _onPartialSuccess(payload: IInternalStorageItem[], results: IBackendResponse) {
                const failed: IInternalStorageItem[] = [];
                const retry: IInternalStorageItem[] = [];
        
                // Iterate through the reversed array of errors so that splicing doesn't have invalid indexes after the first item.
                const errors = results.errors.reverse();
                for (const error of errors) {
                    const extracted = payload.splice(error.index, 1)[0];
                    if (_isRetriable(error.statusCode)) {
                        retry.push(extracted);
                    } else {
                        // All other errors, including: 402 (Monthly quota exceeded) and 439 (Too many requests and refresh cache).
                        failed.push(extracted);
                    }
                }
        
                if (payload.length > 0) {
                    _self._onSuccess(payload, results.itemsAccepted);
                }
        
                if (failed.length > 0) {
                    _self._onError(failed, formatErrorMessageXhr(null, ["partial success", results.itemsAccepted, "of", results.itemsReceived].join(" ")));
                }
        
                if (retry.length > 0) {
                    _resendPayload(retry);
        
                    _throwInternal(_self.diagLog(),
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, "Partial success. " +
                        "Delivered: " + payload.length + ", Failed: " + failed.length +
                        ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
                }
            }

             
            /**
             * success handler
             */
            function _onSuccess(payload: IInternalStorageItem[], countOfItemsInPayload: number) {
                _self._buffer && _self._buffer.clearSent(payload);
            }


            function _getPayloadArr(payload?: IPayloadData) {
                try {
                    if (payload) {
                        let internalPayload = payload as IInternalPayloadData;
                        let arr = internalPayload.oriPayload;
                        if (arr && arr.length)  {
                            return arr;
                        }
                        return null;
                    }

                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return null;

            }

            function _validate(telemetryItem: ITelemetryItem, diagLogger?: IDiagnosticLogger) {
                if (_disableTelemetry) {
                    // Do not send/save data
                    return false;
                }
    
                // validate input
                if (!telemetryItem) {
                    diagLogger && _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                    return false;
                }
    
                // validate event
                if (telemetryItem.baseData && !telemetryItem.baseType) {
                    diagLogger && _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.InvalidEvent, "Cannot send telemetry without baseData and baseType");
                    return false;
                }
    
                if (!telemetryItem.baseType) {
                    // Default
                    telemetryItem.baseType = "EventData";
                }
    
                // ensure a sender was constructed
                if (!_self._sender) {
                    diagLogger && _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "Sender was not initialized");
                    return false;
                }
              
                // check if this item should be sampled in, else add sampleRate tag
                if (!_isSampledIn(telemetryItem)) {
                    // Item is sampled out, do not send it
                    diagLogger && _throwInternal(diagLogger, eLoggingSeverity.WARNING, _eInternalMessageId.TelemetrySampledAndNotSent,
                        "Telemetry item was sampled out and not sent", { SampleRate: _self._sample.sampleRate });
                    return false;
                } else {
                    telemetryItem[SampleRate] = _self._sample.sampleRate;
                }
                return true;
            }

            function _getEnvelope(telemetryItem: ITelemetryItem, diagLogger: IDiagnosticLogger) {
                // construct an envelope that Application Insights endpoint can understand
                // if ikey of telemetry is provided and not empty, envelope will use this iKey instead of senderConfig iKey
                let defaultEnvelopeIkey = telemetryItem.iKey || _instrumentationKey;
                let aiEnvelope = Sender.constructEnvelope(telemetryItem, defaultEnvelopeIkey, diagLogger, _convertUndefined);
                if (!aiEnvelope) {
                    _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                    return;
                }
    
                let doNotSendItem = false;
                // this is for running in legacy mode, where customer may already have a custom initializer present
                if (telemetryItem.tags && telemetryItem.tags[ProcessLegacy]) {
                    arrForEach(telemetryItem.tags[ProcessLegacy], (callBack: (env: IEnvelope) => boolean | void) => {
                        try {
                            if (callBack && callBack(aiEnvelope) === false) {
                                doNotSendItem = true;
                                _warnToConsole(diagLogger, "Telemetry processor check returns false");
                            }
                        } catch (e) {
                            // log error but dont stop executing rest of the telemetry initializers
                            // doNotSendItem = true;
                            _throwInternal(diagLogger,
                                eLoggingSeverity.CRITICAL, _eInternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e),
                                { exception: dumpObj(e) }, true);
                        }
                    });
    
                    delete telemetryItem.tags[ProcessLegacy];
                }
                if (doNotSendItem) {
                    return; // do not send, no need to execute next plugin
                }
                return aiEnvelope;
            }

            function _serialize(item: ITelemetryItem) {
                let rlt = EMPTY_STR;
                let diagLogger = _self.diagLog();
                try {
                    let valid = _validate(item, diagLogger);
                    let envelope = null;
                    if (valid) {
                        envelope = _getEnvelope(item, diagLogger);
                    }
                    if (envelope) {
                        rlt = _serializer.serialize(envelope);
                    }

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return rlt;
               
            }

            function _batch(arr: string[]) {
                let rlt = EMPTY_STR;
                if (arr && arr.length) {
                    rlt = "[" + arr.join(",") + "]";
                }
                return rlt;
            }

            function _createPayload(data: string |Uint8Array) {
                let headers = _getHeaders();
                return {
                    urlString: _endpointUrl,
                    data: data,
                    headers: headers
                } as IPayloadData;
            }
        
            function _isSampledIn(envelope: ITelemetryItem): boolean {
                return _self._sample.isSampledIn(envelope);
            }

            function _getOnComplete(payload: IInternalStorageItem[], status: number, headers: {[headerName: string]: string;}, response?: string) {

                // ***********************************************************************************************
                //TODO: handle other status codes
                if (status === 200 && payload) {
                    _self._onSuccess(payload, payload.length);
                } else {
                    response && _self._onError(payload, response);
                }
            }

            function _doSend(sendInterface: IXHROverride, payload: IInternalStorageItem[], isAsync: boolean, markAsSent: boolean = true): void | IPromise<boolean> {
                let onComplete = (status: number, headers: {[headerName: string]: string;}, response?: string) => {
                    console.log("onComplete", status, headers, response, payloadData.statsBeatData.startTime);
                    var endpointHost = urlParseUrl(_self._senderConfig.endpointUrl).hostname;
                    _statsBeat.count(status, payloadData, endpointHost);
                    return _getOnComplete(payload, status, headers, response);
                }
                let payloadData = _getPayload(payload);
                payloadData.statsBeatData = {startTime: dateNow()};
                let sendPostFunc:  SendPOSTFunction = sendInterface && sendInterface.sendPOST;
                if (sendPostFunc && payloadData) {
                    // ***********************************************************************************************
                    // mark payload as sent at the beginning of calling each send function
                    if (markAsSent) {
                        _self._buffer.markAsSent(payload);
                    }

                    return sendPostFunc(payloadData, onComplete, !isAsync);
                }
                return null;
            }

            function _getPayload(payload: IInternalStorageItem[]): IInternalPayloadData {
                if (isArray(payload) && payload.length > 0) {
                    let batch = _self._buffer.batchPayloads(payload);
                    let headers = _getHeaders();
                    let payloadData: IInternalPayloadData = {
                        data: batch,
                        urlString: _endpointUrl,
                        headers: headers,
                        disableXhrSync: _disableXhr,
                        disableFetchKeepAlive: !_fetchKeepAlive,
                        oriPayload: payload
                    };
                    return payloadData;
                }
                
                return null;
            }

            function _getHeaders() {
                try {
                    let headers = _headers || {};
                    if (isInternalApplicationInsightsEndpoint(_endpointUrl)) {
                        headers[RequestHeaders[eRequestHeaders.sdkContextHeader]] = RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest];
                    }
                    return headers;

                } catch(e) {
                    // eslint-disable-next-line no-empty

                }
                return null;
            }

            function _checkMaxSize(incomingPayload?: string): boolean {
                let incomingSize = incomingPayload? incomingPayload.length : 0;
                if ((_self._buffer.size() + incomingSize) > _maxBatchSizeInBytes) {
                    if (!_offlineListener || _offlineListener.isOnline()) { // only trigger send when currently online
                        _self.triggerSend(true, null, SendRequestReason.MaxBatchSize);
                    }

                    return true;
                }
                return false;
            }

            function _checkResponsStatus(status: number, payload: IInternalStorageItem[], responseUrl: string, countOfItemsInPayload: number, errorMessage: string, res: any) {
                let response: IBackendResponse = null;
                if (!_self._appId) {
                    response = parseResponse(res);
                    if (response && response.appId) {
                        _self._appId = response.appId;
                    }
                }
    
                if ((status < 200 || status >= 300) && status !== 0) {

                    // Update End Point url if permanent redirect or moved permanently
                    // Updates the end point url before retry
                    if(status === 301 || status === 307 || status === 308) {
                        if(!_checkAndUpdateEndPointUrl(responseUrl)) {
                            _self._onError(payload, errorMessage);
                            return;
                        }
                    }

                    if (_offlineListener && !_offlineListener.isOnline()) { // offline
                        // Note: Don't check for status == 0, since adblock gives this code
                        if (!_isRetryDisabled) {
                            const offlineBackOffMultiplier = 10; // arbritrary number
                            _resendPayload(payload, offlineBackOffMultiplier);
        
                            _throwInternal(_self.diagLog(),
                                eLoggingSeverity.WARNING,
                                _eInternalMessageId.TransmissionFailed, `. Offline - Response Code: ${status}. Offline status: ${!_offlineListener.isOnline()}. Will retry to send ${payload.length} items.`);
                        }
                        return;
                    }
                    if (!_isRetryDisabled && _isRetriable(status)) {
                        _resendPayload(payload);
                        _throwInternal(_self.diagLog(),
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.TransmissionFailed, ". " +
                            "Response code " + status + ". Will retry to send " + payload.length + " items.");
                    } else {
                        _self._onError(payload, errorMessage);
                    }
                } else {
                    // check if the xhr's responseURL or fetch's response.url is same as endpoint url
                    // TODO after 10 redirects force send telemetry with 'redirect=false' as query parameter.
                    _checkAndUpdateEndPointUrl(responseUrl);
                    
                    if (status === 206) {
                        if (!response) {
                            response = parseResponse(res);
                        }
    
                        if (response && !_isRetryDisabled) {
                            _self._onPartialSuccess(payload, response);
                        } else {
                            _self._onError(payload, errorMessage);
                        }
                    } else {
                        _consecutiveErrors = 0;
                        _self._onSuccess(payload, countOfItemsInPayload);
                    }
                }
            }

            function _checkAndUpdateEndPointUrl(responseUrl: string) {
                // Maximum stamp specific redirects allowed(uncomment this when breeze is ready with not allowing redirects feature)
                if(_stamp_specific_redirects >= 10) {
                    //  _self._senderConfig.endpointUrl = () => Sender._getDefaultAppInsightsChannelConfig().endpointUrl()+"/?redirect=false";
                    //  _stamp_specific_redirects = 0;
                    return false;
                }
                if(!isNullOrUndefined(responseUrl) && responseUrl !== "") {
                    if(responseUrl !== _endpointUrl) {
                        _endpointUrl = responseUrl;
                        ++_stamp_specific_redirects;
                        return true;
                    }
                }
                return false;
            }

            function _doUnloadSend(payload: IInternalStorageItem[], isAsync: boolean) {

                if (_syncUnloadSender) {
                    // We are unloading so always call the sender with sync set to false
                    _syncUnloadSender(payload, false);
                } else {
                    
                    // Fallback to the previous beacon Sender (which causes a CORB warning on chrome now)
                    let beaconInst = _sendPostMgr && _sendPostMgr.getSenderInst([TransportType.Beacon], true);
                    return _doSend(beaconInst, payload, isAsync);
                }
            }

            function _onBeaconRetry(payload: IPayloadData, onComplete: OnCompleteCallback, canSend:(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => boolean) {

                let internalPayload = payload as IInternalPayloadData;
                let data = internalPayload  && internalPayload.oriPayload;
                if (!_disableBeaconSplit) {
                    // Failed to send entire payload so try and split data and try to send as much events as possible
                    let droppedPayload: IInternalStorageItem[] = [];
                    for (let lp = 0; lp < data.length; lp++) {
                        const thePayload = data[lp];
                        let arr = [thePayload];
                        let item = _getPayload(arr);
                        if (!canSend(item, onComplete)) {
                            // Can't send anymore, so split the batch and drop the rest
                            droppedPayload.push(thePayload);
                        } else {
                            _self._onSuccess(arr, arr.length);
                        }
                    }
                    if (droppedPayload.length > 0) {
                        _fallbackSend && _fallbackSend(droppedPayload, true);
                        _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                    }
                } else {
                    _fallbackSend && _fallbackSend(data, true);
                    _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                }

            }

            function _isStringArr(arr: string[] | IInternalStorageItem[]) {
                try {
                    if (arr && arr.length){
                        return (isString(arr[0]));
                    }

                } catch(e) {
                    //TODO: log, sender use IInternalStorageItem instead of string since 3.1.3
                }
                return null;
                
            }


            function _fetchKeepAliveSender(payload: IInternalStorageItem[], isAsync: boolean) {
             
                let transport  = null;
                if (isArray(payload)) {
                    let payloadSize = payload.length;
                    for (let lp = 0; lp < payload.length; lp++) {
                        payloadSize += payload[lp].item.length;
                    }

                    let syncFetchPayload = _sendPostMgr.getSyncFetchPayload();

                    if ((syncFetchPayload + payloadSize) <= FetchSyncRequestSizeLimitBytes) {
                        transport = TransportType.Fetch;
                    } else if (isBeaconsSupported()) {
                        // Fallback to beacon sender as we at least get told which events can't be scheduled
                        transport = TransportType.Beacon;
                    } else {
                        // Payload is going to be too big so just try and send via XHR
                        transport = TransportType.Xhr;
                        _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
                    }
                    let inst = _sendPostMgr && _sendPostMgr.getSenderInst([transport], true);
                    return _doSend(inst, payload, isAsync);
                }
                return null;

            }

            /**
             * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
             * @param payload
             */
            function _resendPayload(payload: IInternalStorageItem[], linearFactor: number = 1) {
                if (!payload || payload.length === 0) {
                    return;
                }
        
                const buffer = _self._buffer;
                buffer.clearSent(payload);
                _consecutiveErrors++;
        
                for (const item of payload) {
                    item.cnt = item.cnt || 0; // to make sure we have cnt for each payload
                    item.cnt ++; // when resend, increase cnt
                    buffer.enqueue(item);
                }
        
                // setup timer
                _setRetryTime(linearFactor);
                _setupTimer();
            }
        
            /**
             * Calculates the time to wait before retrying in case of an error based on
             * http://en.wikipedia.org/wiki/Exponential_backoff
             */
            function _setRetryTime(linearFactor: number) {
                const SlotDelayInSeconds = 10;
                let delayInSeconds: number;
        
                if (_consecutiveErrors <= 1) {
                    delayInSeconds = SlotDelayInSeconds;
                } else {
                    const backOffSlot = (Math.pow(2, _consecutiveErrors) - 1) / 2;
                    // tslint:disable-next-line:insecure-random
                    let backOffDelay = mathFloor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
                    backOffDelay = linearFactor * backOffDelay;
                    delayInSeconds = mathMax(mathMin(backOffDelay, 3600), SlotDelayInSeconds);
                }
        
                // TODO: Log the backoff time like the C# version does.
                const retryAfterTimeSpan = dateNow() + (delayInSeconds * 1000);
        
                // TODO: Log the retry at time like the C# version does.
                _retryAt = retryAfterTimeSpan;
            }
        
            /**
             * Sets up the timer which triggers actually sending the data.
             */
            function _setupTimer() {
                if (!_timeoutHandle && !_paused) {
                    const retryInterval = _retryAt ? mathMax(0, _retryAt - dateNow()) : 0;
                    const timerValue = mathMax(_maxBatchInterval, retryInterval);
        
                    _timeoutHandle = scheduleTimeout(() => {
                        _timeoutHandle = null;
                        _self.triggerSend(true, null, SendRequestReason.NormalSchedule);
                    }, timerValue);
                }
            }

            function _clearScheduledTimer() {
                _timeoutHandle && _timeoutHandle.cancel();
                _timeoutHandle = null;
                _retryAt = null;
            }
        
            /**
             * Checks if the SDK should resend the payload after receiving this status code from the backend.
             * @param statusCode
             */
            function _isRetriable(statusCode: number): boolean {
                // retryCodes = [] means should not retry
                if (!isNullOrUndefined(_retryCodes)) {
                    return _retryCodes.length && _retryCodes.indexOf(statusCode) > -1;
                }

                return statusCode === 401 // Unauthorized
                    // Removing as private links can return a 403 which causes excessive retries and session storage usage
                    // || statusCode === 403 // Forbidden
                    || statusCode === 408 // Timeout
                    || statusCode === 429 // Too many requests.
                    || statusCode === 500 // Internal server error.
                    || statusCode === 502 // Bad Gateway.
                    || statusCode === 503 // Service unavailable.
                    || statusCode === 504; // Gateway timeout.
            }
        
            // Using function lookups for backward compatibility as the getNotifyMgr() did not exist until after v2.5.6
            function _getNotifyMgr() : INotificationManager {
                const func = "getNotifyMgr";
                if (_self.core[func]) {
                    return _self.core[func]();
                }

                // using _self.core['_notificationManager'] for backward compatibility
                return _self.core["_notificationManager"];
            }

            function _notifySendRequest(sendRequest: SendRequestReason, isAsync: boolean) {
                let manager = _getNotifyMgr();
                if (manager && manager.eventsSendRequest) {
                    try {
                        manager.eventsSendRequest(sendRequest, isAsync);
                    } catch (e) {
                        _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.NotificationException,
                            "send request notification failed: " + getExceptionName(e),
                            { exception: dumpObj(e) });
                    }
                }
            }

            

            /**
             * Validate UUID Format
             * Specs taken from https://tools.ietf.org/html/rfc4122 and breeze repo
             */
            function _validateInstrumentationKey(instrumentationKey: string, config: IConfiguration & IConfig) :boolean {
                let disableValidation = config.disableInstrumentationKeyValidation;
                const disableIKeyValidationFlag = isNullOrUndefined(disableValidation) ? false : disableValidation;
                if(disableIKeyValidationFlag) {
                    return true;
                }

                const UUID_Regex = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                const regexp = new RegExp(UUID_Regex);
                return regexp.test(instrumentationKey);
            }
        
            function _initDefaults() {
                _self._sender = null;
                _self._buffer = null;
                _self._appId = null;
                _self._sample = null;
                _headers = {};
                _offlineListener = null;
                _consecutiveErrors = 0;
                _retryAt = null;
                _lastSend = null;
                _paused = false;
                _timeoutHandle = null;
                _serializer = null;
                _stamp_specific_redirects = 0;
                _syncFetchPayload = 0;
                _syncUnloadSender = null;
                _evtNamespace = null;
                _endpointUrl = null;
                _orgEndpointUrl = null;
                _maxBatchSizeInBytes = 0;
                _beaconSupported = false;
                _customHeaders = null;
                _disableTelemetry = false;
                _instrumentationKey = null;
                _convertUndefined = UNDEFINED_VALUE;
                _isRetryDisabled = false;
                _sessionStorageUsed = null;
                _namePrefix = UNDEFINED_VALUE;
                _disableXhr = false;
                _fetchKeepAlive = false;
                _disableBeaconSplit = false;
                _xhrSend = null;
                _fallbackSend = null;
                _sendPostMgr = null;

                objDefine(_self, "_senderConfig", {
                    g: function() {
                        return objExtend({}, defaultAppInsightsChannelConfig);
                    }
                });
            }
        });
    }

    /**
     * Pause the sending (transmission) of events, this will cause all events to be batched only until the maximum limits are
     * hit at which point new events are dropped. Will also cause events to NOT be sent during page unload, so if Session storage
     * is disabled events will be lost.
     * SessionStorage Limit is 2000 events, In-Memory (Array) Storage is 10,000 events (can be configured via the eventsLimitInMem).
     */
    public pause(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resume the sending (transmission) of events, this will restart the timer and any batched events will be sent using the normal
     * send interval.
     */
    public resume(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Flush to send data immediately; channel should default to sending data asynchronously. If executing asynchronously (the default) and
     * you DO NOT pass a callback function then a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the flush is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - send data asynchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @returns - If a callback is provided `true` to indicate that callback will be called after the flush is complete otherwise the caller
     * should assume that any provided callback will never be called, Nothing or if occurring asynchronously a
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) which will be resolved once the unload is complete,
     * the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) will only be returned when no callback is provided
     * and async is true.
     */
    public flush(async: boolean = true, callBack?: (flushComplete?: boolean) => void): void | IPromise<boolean> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Flush the batched events synchronously (if possible -- based on configuration).
     * Will not flush if the Send has been paused.
     */
    public onunloadFlush() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(telemetryItem: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * xhr state changes
     * @deprecated
     * since version 3.2.0, if the payload is string[], this function is no-op (string[] is only used for backwards Compatibility)
     */
    public _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[] | IInternalStorageItem[], countOfItemsInPayload: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        // TODO: no-op
        // add note to users, this will be removed
    }

    /**
     * Trigger the immediate send of buffered data; If executing asynchronously (the default) this may (not required) return
     * an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) that will resolve once the
     * send is complete. The actual implementation of the `IPromise` will be a native Promise (if supported) or the default
     * as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - Indicates if the events should be sent asynchronously
     * @param forcedSender - Indicates the forcedSender, undefined if not passed
     * @returns - Nothing or optionally, if occurring asynchronously a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * which will be resolved (or reject) once the send is complete, the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * should only be returned when async is true.
     */
    public triggerSend(async = true, forcedSender?: SenderFunction, sendReason?: SendRequestReason): void | IPromise<boolean> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * error handler
     * @Internal
     * since version 3.2.0, if the payload is string[], this function is no-op (string[] is only used for backwards Compatibility)
     */
    public _onError(payload: string[] | IInternalStorageItem[], message: string, event?: ErrorEvent) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * partial success handler
     * @Internal
     * since version 3.2.0, if the payload is string[], this function is no-op (string[] is only used for backwards Compatibility)
     */
    public _onPartialSuccess(payload: string[] | IInternalStorageItem[], results: IBackendResponse) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * success handler
     * @Internal
     * since version 3.2.0, if the payload is string[], this function is no-op (string[] is only used for backwards Compatibility)
     */
    public _onSuccess(payload: string[] | IInternalStorageItem[], countOfItemsInPayload: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * xdr state changes
     * @deprecated
     * since version 3.2.0, if the payload is string[], this function is no-op (string[] is only used for backwards Compatibility)
     */
    public _xdrOnLoad(xdr: IXDomainRequest, payload: string[] | IInternalStorageItem[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add header to request
     * @param name - Header name.
     * @param value - Header value.
     */
    public addHeader(name: string, value: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Check if there are no active requests being sent.
     * @returns True if idle, false otherwise.
     */
    public isCompletelyIdle(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }
    /**
     * Get Offline Serializer support
     * @returns internal Offline Serializer object
     */
    public getOfflineSupport(): IInternalOfflineSupport {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get Offline listener
     * @returns offlineListener
     * @since 3.3.4
     */
    public getOfflineListener(): IOfflineListener {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

}
