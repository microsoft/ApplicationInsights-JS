import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BreezeChannelIdentifier, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, DisabledPropertyName, Event, Exception, IChannelControlsAI,
    IConfig, IEnvelope, ISample, Metric, PageView, PageViewPerformance, ProcessLegacy, RemoteDependencyData, RequestHeaders, SampleRate,
    Trace, eRequestHeaders, isInternalApplicationInsightsEndpoint, utlCanUseSessionStorage, utlSetStoragePrefix
} from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IConfiguration, IDiagnosticLogger, INotificationManager, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, SendRequestReason, _eInternalMessageId,
    _throwInternal, _warnToConsole, arrForEach, arrIndexOf, createUniqueNamespace, dateNow, dumpObj, eLoggingSeverity, getExceptionName,
    getIEVersion, getJSON, getNavigator, getWindow, isArray, isBeaconsSupported, isFetchSupported, isNullOrUndefined, isXhrSupported,
    mergeEvtNamespace, objForEachKey, objKeys, useXDomainRequest
} from "@microsoft/applicationinsights-core-js";
import {
    DependencyEnvelopeCreator, EventEnvelopeCreator, ExceptionEnvelopeCreator, MetricEnvelopeCreator, PageViewEnvelopeCreator,
    PageViewPerformanceEnvelopeCreator, TraceEnvelopeCreator
} from "./EnvelopeCreator";
import { IBackendResponse, ISenderConfig, XDomainRequest as IXDomainRequest } from "./Interfaces";
import { IOfflineListener, createOfflineListener } from "./Offline";
import { ArraySendBuffer, ISendBuffer, SessionStorageSendBuffer } from "./SendBuffer";
import { Serializer } from "./Serializer";
import { Sample } from "./TelemetryProcessors/Sample";

const FetchSyncRequestSizeLimitBytes = 65000; // approx 64kb (the current Edge, Firefox and Chrome max limit)

declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};

export type SenderFunction = (payload: string[], isAsync: boolean) => void;

function _getResponseText(xhr: XMLHttpRequest | IXDomainRequest) {
    try {
        return xhr.responseText;
    } catch (e) {
        // Best effort, as XHR may throw while XDR wont so just ignore
    }

    return null;
}

function _getDefaultAppInsightsChannelConfig(): ISenderConfig {
    let defaultValue: string;
    let defaultCustomHeaders: [{header: string, value: string}];

    // set default values
    return {
        endpointUrl: () => DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH,
        emitLineDelimitedJson: () => false,
        maxBatchInterval: () => 15000,
        maxBatchSizeInBytes: () => 102400,  // 100kb
        disableTelemetry: () => false,
        enableSessionStorageBuffer: () => true,
        bufferOverride: () => false,
        isRetryDisabled: () => false,
        isBeaconApiDisabled: () => true,
        disableXhr: () => false,
        onunloadDisableFetch: () => false,
        onunloadDisableBeacon: () => false,
        instrumentationKey: () => defaultValue,  // Channel doesn't need iKey, it should be set already
        namePrefix: () => defaultValue,
        samplingPercentage: () => 100,
        customHeaders: () => defaultCustomHeaders,
        convertUndefined: () => defaultValue,
        eventsLimitInMem: () => 10000,
        retryCodes: () => null
    }
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

export class Sender extends BaseTelemetryPlugin implements IChannelControlsAI {

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
    public readonly _senderConfig: ISenderConfig = _getDefaultAppInsightsChannelConfig();

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
        let _timeoutHandle: any;                // Handle to the timer for delayed sending of batches of data.
        let _serializer: Serializer;
        let _stamp_specific_redirects: number;
        let _headers: { [name: string]: string };
        let _syncFetchPayload = 0;              // Keep track of the outstanding sync fetch payload total (as sync fetch has limits)
        let _fallbackSender: SenderFunction;    // The sender to use if the payload size is too large
        let _syncUnloadSender: SenderFunction;  // The identified sender to use for the synchronous unload stage
        let _offlineListener: IOfflineListener;
        let _evtNamespace: string | string[];
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
                    if (_self._buffer.size() > _self._senderConfig.maxBatchSizeInBytes()) {
                        _self.triggerSend(true, null, SendRequestReason.MaxBatchSize);
                    }

                    _setupTimer();
                }
            };
        
            _self.flush = (isAsync: boolean = true, callBack?: () => void, sendReason?: SendRequestReason) => {
                if (!_paused) {
                    // Clear the normal schedule timer as we are going to try and flush ASAP
                    _clearScheduledTimer();

                    try {
                        _self.triggerSend(isAsync, null, sendReason || SendRequestReason.ManualFlush);
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
                    if ((_self._senderConfig.onunloadDisableBeacon() === false || _self._senderConfig.isBeaconApiDisabled() === false) && isBeaconsSupported()) {
                        try {
                            _self.triggerSend(true, _doUnloadSend, SendRequestReason.Unload);
                        } catch (e) {
                            _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL,
                                _eInternalMessageId.FailedToSendQueuedTelemetry,
                                "failed to flush with beacon sender on page unload, telemetry will not be collected: " + getExceptionName(e),
                                { exception: dumpObj(e) });
                        }
                    } else {
                        _self.flush();
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
                let ctx = _self._getTelCtx();
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

                // TODO v3.x: Change the ISenderConfig to not be function calls
                const defaultConfig = _getDefaultAppInsightsChannelConfig();
                objForEachKey(defaultConfig, (field, value) => {
                    _self._senderConfig[field] = () => {
                        let theValue = ctx.getConfig(identifier, field, value())
                        if (!theValue && field === "endpointUrl") {
                            // Use the default value (handles empty string in the configuration)
                            theValue = value();
                        }
                        return theValue;
                    }
                });

                _retryCodes = _self._senderConfig.retryCodes();

                if (config.storagePrefix){
                    utlSetStoragePrefix(config.storagePrefix);
                }
        
                const useSessionStorage = _self._senderConfig.enableSessionStorageBuffer() &&
                    !!(_self._senderConfig.bufferOverride() || utlCanUseSessionStorage())
                _self._buffer = useSessionStorage
                    ? new SessionStorageSendBuffer(diagLog, _self._senderConfig)
                    : new ArraySendBuffer(diagLog, _self._senderConfig);
                _self._sample = new Sample(_self._senderConfig.samplingPercentage(), diagLog);
                
                if(!_validateInstrumentationKey(config)) {
                    _throwInternal(diagLog,
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.InvalidInstrumentationKey, "Invalid Instrumentation key "+config.instrumentationKey);
                }

                if (!isInternalApplicationInsightsEndpoint(_self._senderConfig.endpointUrl()) && _self._senderConfig.customHeaders() && _self._senderConfig.customHeaders().length > 0) {
                    arrForEach(_self._senderConfig.customHeaders(), customHeader => {
                        this.addHeader(customHeader.header, customHeader.value);
                    });
                }

                let senderConfig = _self._senderConfig;
                let sendPostFunc: SenderFunction = null;
                if (!senderConfig.disableXhr() && useXDomainRequest()) {
                    sendPostFunc = _xdrSender; // IE 8 and 9
                } else if (!senderConfig.disableXhr() && isXhrSupported()) {
                    sendPostFunc = _xhrSender;
                }

                if (!sendPostFunc && isFetchSupported()) {
                    sendPostFunc = _fetchSender;
                }

                // always fallback to XHR
                _fallbackSender = sendPostFunc || _xhrSender;

                if (!senderConfig.isBeaconApiDisabled() && isBeaconsSupported()) {
                    // Config is set to always used beacon sending
                    sendPostFunc = _beaconSender;
                }

                _self._sender = sendPostFunc || _xhrSender;

                if (!senderConfig.onunloadDisableFetch() && isFetchSupported(true)) {
                    // Try and use the fetch with keepalive
                    _syncUnloadSender = _fetchKeepAliveSender;
                } else if (isBeaconsSupported()) {
                    // Try and use sendBeacon
                    _syncUnloadSender = _beaconSender;
                } else if (!senderConfig.disableXhr() && useXDomainRequest()) {
                    _syncUnloadSender = _xdrSender; // IE 8 and 9
                } else if (!senderConfig.disableXhr() && isXhrSupported()) {
                    _syncUnloadSender = _xhrSender;
                } else {
                    _syncUnloadSender = _fallbackSender;
                }
            };
        
            _self.processTelemetry = (telemetryItem: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                itemCtx = _self._getTelCtx(itemCtx);
                let diagLogger = itemCtx.diagLog();
                
                try {
                    // if master off switch is set, don't send any data
                    if (_self._senderConfig.disableTelemetry()) {
                        // Do not send/save data
                        return;
                    }
        
                    // validate input
                    if (!telemetryItem) {
                        _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                        return;
                    }
        
                    // validate event
                    if (telemetryItem.baseData && !telemetryItem.baseType) {
                        _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.InvalidEvent, "Cannot send telemetry without baseData and baseType");
                        return;
                    }
        
                    if (!telemetryItem.baseType) {
                        // Default
                        telemetryItem.baseType = "EventData";
                    }
        
                    // ensure a sender was constructed
                    if (!_self._sender) {
                        _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "Sender was not initialized");
                        return;
                    }
                  
                    // check if this item should be sampled in, else add sampleRate tag
                    if (!_isSampledIn(telemetryItem)) {
                        // Item is sampled out, do not send it
                        _throwInternal(diagLogger, eLoggingSeverity.WARNING, _eInternalMessageId.TelemetrySampledAndNotSent,
                            "Telemetry item was sampled out and not sent", { SampleRate: _self._sample.sampleRate });
                        return;
                    } else {
                        telemetryItem[SampleRate] = _self._sample.sampleRate;
                    }
        
                    const convertUndefined = _self._senderConfig.convertUndefined() || undefined;
                    // construct an envelope that Application Insights endpoint can understand
                    // if ikey of telemetry is provided and not empty, envelope will use this iKey instead of senderConfig iKey
                    let defaultEnvelopeIkey = telemetryItem.iKey || _self._senderConfig.instrumentationKey();
                    let aiEnvelope = Sender.constructEnvelope(telemetryItem, defaultEnvelopeIkey, diagLogger, convertUndefined);
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
        
                    // check if the incoming payload is too large, truncate if necessary
                    const payload: string = _serializer.serialize(aiEnvelope);
        
                    // flush if we would exceed the max-size limit by adding this item
                    const buffer = _self._buffer;
                    const bufferSize = buffer.size();
        
                    if ((bufferSize + payload.length) > _self._senderConfig.maxBatchSizeInBytes()) {
                        if (!_offlineListener || _offlineListener.isOnline()) { // only trigger send when currently online
                            _self.triggerSend(true, null, SendRequestReason.MaxBatchSize);
                        }
                    }
        
                    // enqueue the payload
                    buffer.enqueue(payload);
        
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
        
            /**
             * xhr state changes
             */
            _self._xhrReadyStateChange = (xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number) => {
                if (xhr.readyState === 4) {
                    _checkResponsStatus(xhr.status, payload, xhr.responseURL, countOfItemsInPayload, _formatErrorMessageXhr(xhr), _getResponseText(xhr) || xhr.response);
                }
            };
        
            /**
             * Immediately send buffered data
             * @param async {boolean} - Indicates if the events should be sent asynchronously
             * @param forcedSender {SenderFunction} - Indicates the forcedSender, undefined if not passed
             */
            _self.triggerSend = (async = true, forcedSender?: SenderFunction, sendReason?: SendRequestReason) => {
                if (!_paused) {
                    try {
                        const buffer = _self._buffer;
    
                        // Send data only if disableTelemetry is false
                        if (!_self._senderConfig.disableTelemetry()) {
            
                            if (buffer.count() > 0) {
                                const payload = buffer.getItems();
            
                                _notifySendRequest(sendReason||SendRequestReason.Undefined, async);
            
                                // invoke send
                                if (forcedSender) {
                                    forcedSender.call(_self, payload, async);
                                } else {
                                    _self._sender(payload, async);
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
            };
        
            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _self.onunloadFlush();
                _offlineListener.unload();
                _initDefaults();
            };

            /**
             * error handler
             */
            _self._onError = (payload: string[], message: string, event?: ErrorEvent) => {
                _throwInternal(_self.diagLog(),
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.OnError,
                    "Failed to send telemetry.",
                    { message });
        
                _self._buffer && _self._buffer.clearSent(payload);
            };
        
            /**
             * partial success handler
             */
            _self._onPartialSuccess = (payload: string[], results: IBackendResponse) => {
                const failed: string[] = [];
                const retry: string[] = [];
        
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
                    _self._onError(failed, _formatErrorMessageXhr(null, ["partial success", results.itemsAccepted, "of", results.itemsReceived].join(" ")));
                }
        
                if (retry.length > 0) {
                    _resendPayload(retry);
        
                    _throwInternal(_self.diagLog(),
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, "Partial success. " +
                        "Delivered: " + payload.length + ", Failed: " + failed.length +
                        ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
                }
            };
        
            /**
             * success handler
             */
            _self._onSuccess = (payload: string[], countOfItemsInPayload: number) => {
                _self._buffer && _self._buffer.clearSent(payload);
            };
        
            /**
             * xdr state changes
             */
            _self._xdrOnLoad = (xdr: IXDomainRequest, payload: string[]) => {
                const responseText = _getResponseText(xdr);
                if (xdr && (responseText + "" === "200" || responseText === "")) {
                    _consecutiveErrors = 0;
                    _self._onSuccess(payload, 0);
                } else {
                    const results = _parseResponse(responseText);
        
                    if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                        && !_self._senderConfig.isRetryDisabled()) {
                        _self._onPartialSuccess(payload, results);
                    } else {
                        _self._onError(payload, _formatErrorMessageXdr(xdr));
                    }
                }
            };
        
            function _isSampledIn(envelope: ITelemetryItem): boolean {
                return _self._sample.isSampledIn(envelope);
            }

            function _checkResponsStatus(status: number, payload: string[], responseUrl: string, countOfItemsInPayload: number, errorMessage: string, res: any) {
                let response: IBackendResponse = null;

                if (!_self._appId) {
                    response = _parseResponse(res);
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

                    if (!_self._senderConfig.isRetryDisabled() && _isRetriable(status)) {
                        _resendPayload(payload);
                        _throwInternal(_self.diagLog(),
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.TransmissionFailed, ". " +
                            "Response code " + status + ". Will retry to send " + payload.length + " items.");
                    } else {
                        _self._onError(payload, errorMessage);
                    }
                } else if (_offlineListener && !_offlineListener.isOnline()) { // offline
                    // Note: Don't check for status == 0, since adblock gives this code
                    if (!_self._senderConfig.isRetryDisabled()) {
                        const offlineBackOffMultiplier = 10; // arbritrary number
                        _resendPayload(payload, offlineBackOffMultiplier);
    
                        _throwInternal(_self.diagLog(),
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.TransmissionFailed, `. Offline - Response Code: ${status}. Offline status: ${!_offlineListener.isOnline()}. Will retry to send ${payload.length} items.`);
                    }
                } else {

                    // check if the xhr's responseURL or fetch's response.url is same as endpoint url
                    // TODO after 10 redirects force send telemetry with 'redirect=false' as query parameter.
                    _checkAndUpdateEndPointUrl(responseUrl);
                    
                    if (status === 206) {
                        if (!response) {
                            response = _parseResponse(res);
                        }
    
                        if (response && !_self._senderConfig.isRetryDisabled()) {
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
                    if(responseUrl !== _self._senderConfig.endpointUrl()) {
                        _self._senderConfig.endpointUrl = () => responseUrl;
                        ++_stamp_specific_redirects;
                        return true;
                    }
                }
                return false;
            }
        
            function _doUnloadSend(payload: string[], isAsync: boolean) {
                if (_syncUnloadSender) {
                    // We are unloading so always call the sender with sync set to false
                    _syncUnloadSender(payload, false);
                } else {
                    // Fallback to the previous beacon Sender (which causes a CORB warning on chrome now)
                    _beaconSender(payload, isAsync);
                }
            }

            function _doBeaconSend(payload: string[]) {
                const nav = getNavigator();
                const buffer = _self._buffer;
                const url = _self._senderConfig.endpointUrl();
                const batch = _self._buffer.batchPayloads(payload);
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
                const plainTextBatch = new Blob([batch], { type: "text/plain;charset=UTF-8" });
        
                // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                const queued = nav.sendBeacon(url, plainTextBatch);
                if (queued) {
                    buffer.markAsSent(payload);
                    // no response from beaconSender, clear buffer
                    _self._onSuccess(payload, payload.length);
                }

                return queued;
            }
            /**
             * Send Beacon API request
             * @param payload {string} - The data payload to be sent.
             * @param isAsync {boolean} - not used
             * Note: Beacon API does not support custom headers and we are not able to get
             * appId from the backend for the correct correlation.
             */
            function _beaconSender(payload: string[], isAsync: boolean) {
                if (isArray(payload) && payload.length > 0) {
                    // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                    if (!_doBeaconSend(payload)) {
                        // Failed to send entire payload so try and split data and try to send as much events as possible
                        let droppedPayload: string[] = [];
                        for (let lp = 0; lp < payload.length; lp++) {
                            const thePayload = payload[lp];
    
                            if (!_doBeaconSend([thePayload])) {
                                // Can't send anymore, so split the batch and drop the rest
                                droppedPayload.push(thePayload);
                            }
                        }
    
                        if (droppedPayload.length > 0) {
                            _fallbackSender && _fallbackSender(droppedPayload, true);
                            _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                        }
                    }
                }
            }
        
            /**
             * Send XMLHttpRequest
             * @param payload {string} - The data payload to be sent.
             * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
             */
            function _xhrSender(payload: string[], isAsync: boolean) {
                const xhr = new XMLHttpRequest();
                const endPointUrl = _self._senderConfig.endpointUrl();
                try {
                    xhr[DisabledPropertyName] = true;
                } catch(e) {
                    // If the environment has locked down the XMLHttpRequest (preventExtensions and/or freeze), this would
                    // cause the request to fail and we no telemetry would be sent
                }
                xhr.open("POST", endPointUrl, isAsync);
                xhr.setRequestHeader("Content-type", "application/json");
        
                // append Sdk-Context request header only in case of breeze endpoint
                if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                    xhr.setRequestHeader(RequestHeaders[eRequestHeaders.sdkContextHeader], RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest]);
                }

                arrForEach(objKeys(_headers), (headerName) => {
                    xhr.setRequestHeader(headerName, _headers[headerName]);
                });
        
                xhr.onreadystatechange = () => _self._xhrReadyStateChange(xhr, payload, payload.length);
                xhr.onerror = (event: ErrorEvent|any) => _self._onError(payload, _formatErrorMessageXhr(xhr), event);
        
                // compose an array of payloads
                const batch = _self._buffer.batchPayloads(payload);
                xhr.send(batch);
        
                _self._buffer.markAsSent(payload);
            }

            function _fetchKeepAliveSender(payload: string[], isAsync: boolean) {
                if (isArray(payload)) {
                    let payloadSize = payload.length;
                    for (let lp = 0; lp < payload.length; lp++) {
                        payloadSize += payload[lp].length;
                    }

                    if ((_syncFetchPayload + payloadSize) <= FetchSyncRequestSizeLimitBytes) {
                        _doFetchSender(payload, false);
                    } else if (isBeaconsSupported()) {
                        // Fallback to beacon sender as we at least get told which events can't be scheduled
                        _beaconSender(payload, isAsync);
                    } else {
                        // Payload is going to be too big so just try and send via XHR
                        _fallbackSender && _fallbackSender(payload, true);
                        _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
                    }
                }
            }

            /**
             * Send fetch API request
             * @param payload {string} - The data payload to be sent.
             * @param isAsync {boolean} - not used
             */
            function _fetchSender(payload: string[], isAsync: boolean) {
                _doFetchSender(payload, true);
            }

            /**
             * Send fetch API request
             * @param payload {string} - The data payload to be sent.
             * @param isAsync {boolean} - For fetch this identifies whether we are "unloading" (false) or a normal request
             */
            function _doFetchSender(payload: string[], isAsync: boolean) {
                const endPointUrl = _self._senderConfig.endpointUrl();
                const batch = _self._buffer.batchPayloads(payload);
                const plainTextBatch = new Blob([batch], { type: "application/json" });
                let requestHeaders = new Headers();
                let batchLength = batch.length;
                let ignoreResponse = false;
                let responseHandled = false;

                // append Sdk-Context request header only in case of breeze endpoint
                if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                    requestHeaders.append(RequestHeaders[eRequestHeaders.sdkContextHeader], RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest]);
                }
                
                arrForEach(objKeys(_headers), (headerName) => {
                    requestHeaders.append(headerName, _headers[headerName]);
                });

                const init: RequestInit = {
                    method: "POST",
                    headers: requestHeaders,
                    body: plainTextBatch,
                    [DisabledPropertyName]: true            // Mark so we don't attempt to track this request
                };

                if (!isAsync) {
                    init.keepalive = true;
                    // As a sync request (during unload), it is unlikely that we will get a chance to process the response so
                    // just like beacon send assume that the events have been accepted and processed
                    ignoreResponse = true;
                    _syncFetchPayload += batchLength;
                }

                const request = new Request(endPointUrl, init);
                try {
                    // Also try and tag the request (just in case the value in init is not copied over)
                    request[DisabledPropertyName] = true;
                } catch(e) {
                    // If the environment has locked down the XMLHttpRequest (preventExtensions and/or freeze), this would
                    // cause the request to fail and we no telemetry would be sent
                }

                _self._buffer.markAsSent(payload);

                try {
                    fetch(request).then(response => {
                        if (!isAsync) {
                            _syncFetchPayload -= batchLength;
                            batchLength = 0;
                        }
    
                        if (!responseHandled) {
                            responseHandled = true;

                            /**
                             * The Promise returned from fetch() won’t reject on HTTP error status even if the response is an HTTP 404 or 500.
                             * Instead, it will resolve normally (with ok status set to false), and it will only reject on network failure
                             * or if anything prevented the request from completing.
                             */
                            if (!response.ok) {
                                _self._onError(payload, response.statusText)
                            } else {
                                response.text().then(text => {
                                    _checkResponsStatus(response.status, payload, response.url, payload.length, response.statusText, text);
                                });
                            }
                        }
                    }).catch((error: Error) => {
                        if (!isAsync) {
                            _syncFetchPayload -= batchLength;
                            batchLength = 0;
                        }
    
                        if (!responseHandled) {
                            responseHandled = true;
                            _self._onError(payload, error.message)
                        }
                    });
                } catch (e) {
                    if (!responseHandled) {
                        _self._onError(payload, dumpObj(e));
                    }
                }

                if (ignoreResponse && !responseHandled) {
                    // Assume success during unload processing as we most likely won't get the response
                    responseHandled = true;
                    _self._onSuccess(payload, payload.length);
                }
            }
        
            /**
             * Parses the response from the backend.
             * @param response - XMLHttpRequest or XDomainRequest response
             */
            function _parseResponse(response: any): IBackendResponse {
                try {
                    if (response && response !== "") {
                        const result = getJSON().parse(response);
        
                        if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                            result.itemsReceived - result.itemsAccepted === result.errors.length) {
                            return result;
                        }
                    }
                } catch (e) {
                    _throwInternal(_self.diagLog(),
                        eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.InvalidBackendResponse,
                        "Cannot parse the response. " + getExceptionName(e),
                        {
                            response
                        });
                }
        
                return null;
            }
        
            /**
             * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
             * @param payload
             */
            function _resendPayload(payload: string[], linearFactor: number = 1) {
                if (!payload || payload.length === 0) {
                    return;
                }
        
                const buffer = _self._buffer;
                buffer.clearSent(payload);
                _consecutiveErrors++;
        
                for (const item of payload) {
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
                    let backOffDelay = Math.floor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
                    backOffDelay = linearFactor * backOffDelay;
                    delayInSeconds = Math.max(Math.min(backOffDelay, 3600), SlotDelayInSeconds);
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
                    const retryInterval = _retryAt ? Math.max(0, _retryAt - dateNow()) : 0;
                    const timerValue = Math.max(_self._senderConfig.maxBatchInterval(), retryInterval);
        
                    _timeoutHandle = setTimeout(() => {
                        _timeoutHandle = null;
                        _self.triggerSend(true, null, SendRequestReason.NormalSchedule);
                    }, timerValue);
                }
            }

            function _clearScheduledTimer() {
                clearTimeout(_timeoutHandle);
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
                    return _retryCodes.length && arrIndexOf(_retryCodes, statusCode) > -1;
                }

                return statusCode === 401 // Unauthorized
                    // Removing as private links can return a 403 which causes excessive retries and session storage usage
                    //|| statusCode === 403 // Forbidden
                    || statusCode === 408 // Timeout
                    || statusCode === 429 // Too many requests.
                    || statusCode === 500 // Internal server error.
                    || statusCode === 502 // Bad Gateway.
                    || statusCode === 503 // Service unavailable.
                    || statusCode === 504; // Gateway timeout.
            }
        
            function _formatErrorMessageXhr(xhr: XMLHttpRequest, message?: string): string {
                if (xhr) {
                    return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + _getResponseText(xhr) || xhr.response || "";
                }
        
                return message;
            }
        
            /**
             * Send XDomainRequest
             * @param payload {string} - The data payload to be sent.
             * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
             *
             * Note: XDomainRequest does not support sync requests. This 'isAsync' parameter is added
             * to maintain consistency with the xhrSender's contract
             * Note: XDomainRequest does not support custom headers and we are not able to get
             * appId from the backend for the correct correlation.
             */
            function _xdrSender(payload: string[], isAsync: boolean) {
                const buffer = _self._buffer;
                let _window = getWindow();
                const xdr = new XDomainRequest();
                xdr.onload = () => _self._xdrOnLoad(xdr, payload);
                xdr.onerror = (event: ErrorEvent|any) => _self._onError(payload, _formatErrorMessageXdr(xdr), event);
        
                // XDomainRequest requires the same protocol as the hosting page.
                // If the protocol doesn't match, we can't send the telemetry :(.
                const hostingProtocol = _window && _window.location && _window.location.protocol || "";
                if (_self._senderConfig.endpointUrl().lastIndexOf(hostingProtocol, 0) !== 0) {
                    _throwInternal(_self.diagLog(),
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, ". " +
                        "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");
        
                    buffer.clear();
                    return;
                }
        
                const endpointUrl = _self._senderConfig.endpointUrl().replace(/^(https?:)/, "");
                xdr.open("POST", endpointUrl);
        
                // compose an array of payloads
                const batch = buffer.batchPayloads(payload);
                xdr.send(batch);
        
                buffer.markAsSent(payload);
            }
        
            function _formatErrorMessageXdr(xdr: IXDomainRequest, message?: string): string {
                if (xdr) {
                    return "XDomainRequest,Response:" + _getResponseText(xdr) || "";
                }
        
                return message;
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
            function _validateInstrumentationKey(config: IConfiguration & IConfig) :boolean {
                const disableIKeyValidationFlag = isNullOrUndefined(config.disableInstrumentationKeyValidation) ? false : config.disableInstrumentationKeyValidation;
                if(disableIKeyValidationFlag) {
                    return true;
                }
                const UUID_Regex = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                const regexp = new RegExp(UUID_Regex);
                return regexp.test(config.instrumentationKey);
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
                _fallbackSender = null;
                _syncUnloadSender = null;
                _evtNamespace = null;
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
     * Flush the batched events immediately (not synchronously).
     * Will not flush if the Sender has been paused.
     */
    public flush() {
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
     */
    public _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Immediately send buffered data
     * @param async {boolean} - Indicates if the events should be sent asynchronously
     * @param forcedSender {SenderFunction} - Indicates the forcedSender, undefined if not passed
     */
    public triggerSend(async = true, forcedSender?: SenderFunction, sendReason?: SendRequestReason) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * error handler
     */
    public _onError(payload: string[], message: string, event?: ErrorEvent) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * partial success handler
     */
    public _onPartialSuccess(payload: string[], results: IBackendResponse) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * success handler
     */
    public _onSuccess(payload: string[], countOfItemsInPayload: number) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * xdr state changes
     */
    public _xdrOnLoad(xdr: IXDomainRequest, payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add header to request
     * @param name   - Header name.
     * @param value  - Header value.
     */
    public addHeader(name: string, value: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }
}
