import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BreezeChannelIdentifier, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, DisabledPropertyName, Event, Exception, IConfig, IEnvelope,
    IOfflineListener, ISample, Metric, PageView, PageViewPerformance, RemoteDependencyData, RequestHeaders, Trace, eRequestHeaders,
    isInternalApplicationInsightsEndpoint, utlSetStoragePrefix
} from "@microsoft/applicationinsights-common";
import {
    IAppInsightsCore, IConfigDefaults, IConfiguration, IDiagnosticLogger, IPayloadData, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryUnloadState, IUnloadHookContainer, IXHROverride, OnCompleteCallback,
    SendPOSTFunction, SendRequestReason, TransportType, _eInternalMessageId, _throwInternal, arrForEach, cfgDfBoolean, cfgDfValidate,
    createProcessTelemetryContext, dateNow, dumpObj, eLoggingSeverity, getExceptionName, getJSON, getNavigator, getWindow, isArray,
    isBeaconsSupported, isFetchSupported, isNullOrUndefined, isXhrSupported, objKeys, onConfigChange, useXDomainRequest
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import { ITimerHandler, isFunction, isNumber, isTruthy, objDeepFreeze, objForEachKey, scheduleTimeout } from "@nevware21/ts-utils";
import {
    DependencyEnvelopeCreator, EventEnvelopeCreator, ExceptionEnvelopeCreator, MetricEnvelopeCreator, PageViewEnvelopeCreator,
    PageViewPerformanceEnvelopeCreator, TraceEnvelopeCreator
} from "./Helpers/EnvelopeCreator";
import { ILocalStorageConfiguration, IOfflineSenderConfig } from "./Interfaces/IOfflineProvider";
import { IBackendResponse, ISenderConfig, XDomainRequest, XDomainRequest as IXDomainRequest } from "./Interfaces/ISender";

const UNDEFINED_VALUE: undefined = undefined;
const DefaultOfflineIdentifier = "OfflineChannel";
const FetchSyncRequestSizeLimitBytes = 65000; // approx 64kb (the current Edge, Firefox and Chrome max limit)


declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};

interface IInternalPayloadData extends IPayloadData {
    oriPayload: string[];
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

function _prependTransports(theTransports: TransportType[], newTransports: TransportType | TransportType[]) {
    if (newTransports) {
        if (isNumber(newTransports)) {
            theTransports = [newTransports as TransportType].concat(theTransports);
        } else if (isArray(newTransports)) {
            theTransports = newTransports.concat(theTransports);
        }
    }
    return theTransports;
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
    disableSendBeaconSplit: cfgDfBoolean(),
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
    transports: UNDEFINED_VALUE
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

export type SenderFunction = (payload: string[], isAsync: boolean) => void | IPromise<boolean>;

export class Sender {

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

    /**
     * The configuration for this sender instance
     */
    public readonly _senderConfig: ISenderConfig;

    // /**
    //  * A method which will cause data to be send to the url
    //  */
    // public _sender: SenderFunction;

    // /**
    //  * AppId of this component parsed from some backend response.
    //  */
    public _appId: string;

    // protected _sample: ISample;

    constructor() {

        // Don't set the defaults here, set them in the _initDefaults() as this is also called during unload
        let _consecutiveErrors: number;         // How many times in a row a retryable error condition has occurred.
        let _retryAt: number;                   // The time to retry at in milliseconds from 1970/01/01 (this makes the timer calculation easy).
        //let _lastSend: number;                  // The time of the last send operation.
        let _paused: boolean;                   // Flag indicating that the sending should be paused
        let _timeoutHandle: ITimerHandler;      // Handle to the timer for delayed sending of batches of data.
        //let _serializer: Serializer;
        let _stamp_specific_redirects: number;
        let _headers: { [name: string]: string };
        let _syncFetchPayload = 0;              // Keep track of the outstanding sync fetch payload total (as sync fetch has limits)
        let _syncUnloadSender: SendPOSTFunction;  // The identified sender to use for the synchronous unload stage
        let _offlineListener: IOfflineListener;
        let _endpointUrl: string;
        let _orgEndpointUrl: string;
        let _beaconSupported: boolean;
        let _beaconOnUnloadSupported: boolean;
        let _beaconNormalSupported: boolean;
        let _customHeaders: Array<{header: string, value: string}>;
        let _instrumentationKey: string;
        let _isRetryDisabled: boolean;
        let _maxBatchInterval: number;
        let _enableSendPromise: boolean;
        let _alwaysUseCustomSend: boolean;
        let _disableXhr: boolean;
        let _fetchKeepAlive: boolean;
        let _fallbackSend:  SendPOSTFunction;
        let _isInitialized: boolean;
        let _diagLog: IDiagnosticLogger;
        let _core: IAppInsightsCore;
        let _httpInterface: IXHROverride;
        let _syncHttpInterface: IXHROverride;
        let _onlineChannelId: string;
       

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
                    _setupTimer();
                }
            };
        
            _self.getOnunloadInst = (): IXHROverride => {
                return {
                    sendPOST: _doUnloadSend
                } as IXHROverride;
            }

            _self.getXhrInst = (sync?: boolean): IXHROverride => {
                if (!!sync) {
                    return _syncHttpInterface
                }
                return _httpInterface;
            }

            _self.addHeader = (name: string, value: string) => {
                _headers[name] = value;
            };

            _self.getHeaders = () => {
                return _headers;
            };
        
            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, cxt: IProcessTelemetryContext, diagLog: IDiagnosticLogger,  unloadHookContainer?: IUnloadHookContainer): void => {
                
                _diagLog = diagLog || core.logger;
                if (_isInitialized) {
                    _throwInternal(_diagLog, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "Sender is already initialized");
                }
                _core = core;
                _consecutiveErrors = 0;
                _retryAt = null;
                _stamp_specific_redirects = 0;

                // This function will be re-called whenever any referenced configuration is changed
                let hook = onConfigChange(config, (details) => {
                    let config = details.cfg;
                    if (config.storagePrefix){
                        utlSetStoragePrefix(config.storagePrefix);
                    }
                    let ctx = createProcessTelemetryContext(null, config, core);
                    let onlineConfig = ctx.getExtCfg(BreezeChannelIdentifier, defaultAppInsightsChannelConfig);
                    let offlineSenderCfg = (ctx.getExtCfg(DefaultOfflineIdentifier) as ILocalStorageConfiguration).senderCfg || {} as IOfflineSenderConfig;
                    _onlineChannelId = offlineSenderCfg.primaryOnlineChannelId || BreezeChannelIdentifier;
                    let senderConfig = _getSenderConfig(onlineConfig, offlineSenderCfg);

                    // Only update the endpoint if the original config !== the current config
                    // This is so any redirect endpointUrl is not overwritten
                    if (_orgEndpointUrl !== senderConfig.endpointUrl) {
                        if (_orgEndpointUrl) {
                            // TODO: add doc to remind users to flush before changing endpoint, otherwise all unsent payload will be sent to new endpoint
                        }
                        _endpointUrl = _orgEndpointUrl = senderConfig.endpointUrl;
                    }

                    if (_customHeaders && _customHeaders !== senderConfig.customHeaders) {
                        // Removing any previously defined custom headers as they have changed
                        arrForEach(_customHeaders, customHeader => {
                            delete _headers[customHeader.header];
                        });
                    }

                    //_maxBatchSizeInBytes = senderConfig.maxBatchSizeInBytes;
                    _beaconSupported = (senderConfig.onunloadDisableBeacon === false || senderConfig.isBeaconApiDisabled === false) && isBeaconsSupported();
                    _beaconOnUnloadSupported = senderConfig.onunloadDisableBeacon === false  && isBeaconsSupported();
                    _beaconNormalSupported = senderConfig.isBeaconApiDisabled === false && isBeaconsSupported();

                    _alwaysUseCustomSend = senderConfig.alwaysUseXhrOverride;
                    _disableXhr = !!senderConfig.disableXhr;
                
                    
                    _instrumentationKey = senderConfig.instrumentationKey;
                    if(!_validateInstrumentationKey(_instrumentationKey, config)) {
                        _throwInternal(_diagLog,
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.InvalidInstrumentationKey, "Invalid Instrumentation key " + _instrumentationKey);
                    }

                    _customHeaders = senderConfig.customHeaders;
                    if (!isInternalApplicationInsightsEndpoint(_endpointUrl) && _customHeaders && _customHeaders.length > 0) {
                        arrForEach(_customHeaders, customHeader => {
                            this.addHeader(customHeader.header, customHeader.value);
                        });
                    } else {
                        _customHeaders = null;
                    }
                    _enableSendPromise = senderConfig.enableSendPromise;

                    let customInterface = senderConfig.httpXHROverride;
                    let httpInterface: IXHROverride = null;
                    let syncInterface: IXHROverride = null;

                    // User requested transport(s) values > Beacon > Fetch > XHR
                    // Beacon would be filtered out if user has set disableBeaconApi to true at _getSenderInterface
                    let theTransports: TransportType[] = _prependTransports([TransportType.Beacon, TransportType.Xhr, TransportType.Fetch], senderConfig.transports);

                    httpInterface = _getSenderInterface(theTransports, false);
                  
                    let xhrInterface = { sendPOST: _xhrSender} as IXHROverride;
                    _fallbackSend =  _xhrSender;

                  
    
                    httpInterface = _alwaysUseCustomSend? customInterface : (httpInterface || customInterface || xhrInterface);

                    if (_fetchKeepAlive) {
                        // Try and use the fetch with keepalive
                        _syncUnloadSender = (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                            _fetchKeepAliveSender(payload)
                        };
                    }
                    
                    let syncTransports: TransportType[] = _prependTransports([TransportType.Beacon, TransportType.Xhr], senderConfig.unloadTransports);
                    if (!_fetchKeepAlive){
                        // remove fetch from theTransports
                        syncTransports = syncTransports.filter(transport => transport !== TransportType.Fetch);
                    }

                    syncInterface = _getSenderInterface(syncTransports, true);
                    syncInterface = _alwaysUseCustomSend? customInterface : (syncInterface || customInterface);
                   
                    if ((_alwaysUseCustomSend || senderConfig.unloadTransports || !_syncUnloadSender) && syncInterface) {
                        _syncUnloadSender = syncInterface.sendPOST;
                    }

                    if (!_syncUnloadSender) {
                        _syncUnloadSender = _xhrSender;
                    }

                    _httpInterface = httpInterface;
                    _syncHttpInterface = syncInterface;

                    //_convertUndefined = senderConfig.convertUndefined || UNDEFINED_VALUE;
                    _isRetryDisabled = senderConfig.isRetryDisabled;
                    _maxBatchInterval = senderConfig.maxBatchInterval;
                });
                unloadHookContainer && unloadHookContainer.add(hook);
            };
            

            _self.isCompletelyIdle = (): boolean => {
                try {
                    let senderPlugin = (_core.getPlugin(_onlineChannelId).plugin as any);
                    if (senderPlugin && isFunction(senderPlugin.isCompletelyIdle)) {
                        if(!senderPlugin.isCompletelyIdle()) {
                            return false;
                        }
                    }

                } catch (e) {
                    // if can't get idle status of online sender, then isidle status only depends on offine sender idle status

                }
                return !_paused && _syncFetchPayload === 0;
            };
        
        
            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                //_self.onunloadFlush();
                //runTargetUnload(_offlineListener, false);
                _initDefaults();
            };

            /**
             * success handler
             */
            function _onSuccess (res?: string, onComplete?: OnCompleteCallback) {
                _doOnComplete(onComplete, 200, {}, res);
                //_self._buffer && _self._buffer.clearSent(payload);
            }

            /**
             * error handler
             */
            function _onError(message: string, onComplete?: OnCompleteCallback) {
                _throwInternal(_diagLog,
                    eLoggingSeverity.WARNING,
                    _eInternalMessageId.OnError,
                    "Failed to send telemetry.",
                    { message });
                _doOnComplete(onComplete, 400, {});
                //_self._buffer && _self._buffer.clearSent(payload);
            }
        
            /**
             * partial success handler
             */
            // function _onPartialSuccess (payload: string[], results: IBackendResponse, onComplete?: OnCompleteCallback) {
            //     const failed: string[] = [];
            //     const retry: string[] = [];
        
            //     // Iterate through the reversed array of errors so that splicing doesn't have invalid indexes after the first item.
            //     const errors = results.errors.reverse();
            //     for (const error of errors) {
            //         const extracted = payload.splice(error.index, 1)[0];
            //         if (_isRetriable(error.statusCode)) {
            //             retry.push(extracted);
            //         } else {
            //             // All other errors, including: 402 (Monthly quota exceeded) and 439 (Too many requests and refresh cache).
            //             failed.push(extracted);
            //         }
            //     }
        
            //     if (payload.length > 0) {
            //         _onSuccess(payload, results.itemsAccepted, onComplete);
            //     }
        
            //     if (failed.length > 0) {
            //         _onError(failed, _formatErrorMessageXhr(null, ["partial success", results.itemsAccepted, "of", results.itemsReceived].join(" ")), onComplete);
            //     }
        
            //     if (retry.length > 0) {
            //         _resendPayload(retry);
        
            //         _throwInternal(_diagLog,
            //             eLoggingSeverity.WARNING,
            //             _eInternalMessageId.TransmissionFailed, "Partial success. " +
            //             "Delivered: " + payload.length + ", Failed: " + failed.length +
            //             ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
            //     }
            // }
        
            

            /**
             * xhr state changes
             */
            function _xhrReadyStateChange(xhr: XMLHttpRequest, countOfItemsInPayload: number, onComplete?: OnCompleteCallback) {
                if (xhr.readyState === 4) {
                    _checkResponsStatus(xhr.status, xhr.responseURL, countOfItemsInPayload, _formatErrorMessageXhr(xhr), _getResponseText(xhr) || xhr.response, onComplete);
                }
            }


            function _getSenderConfig(senderCfg: ISenderConfig, offlineSenderCfg: IOfflineSenderConfig) {
                let config = {} as ISenderConfig;
                objForEachKey(senderCfg, (key, val) => {
                    let offlineVal = offlineSenderCfg[key];
                    config[key] = !isNullOrUndefined(offlineVal)? offlineVal : val;
                });
                return config;
            }
        

            function _getSenderInterface(transports: TransportType[], syncSupport: boolean): IXHROverride {
                let transportType: TransportType = null;
                let sendPostFunc: SendPOSTFunction = null;
                let lp = 0;
                while (sendPostFunc == null && lp < transports.length) {
                    transportType = transports[lp];
                    if (!_disableXhr && transportType === TransportType.Xhr) {
                        if (useXDomainRequest()) {
                            // IE 8 and 9
                            sendPostFunc = _xdrSender;
                        } else if (isXhrSupported()) {
                            sendPostFunc = _xhrSender;
                        }
                    } else if (transportType === TransportType.Fetch && isFetchSupported(syncSupport)) {
                        sendPostFunc = _fetchSender;
                    } else if (transportType === TransportType.Beacon && (syncSupport ? _beaconOnUnloadSupported : _beaconNormalSupported)) {
                        sendPostFunc = _beaconSender;
                    }

                    lp++;
                }

                if (sendPostFunc) {
                    return {
                        sendPOST: sendPostFunc
                    };
                }

                return null;
            }


            /**
             * Send fetch API request
             * @param payload - {string} - The data payload to be sent.
             * @param oncomplete - {function} on complete function
             * @param sync - {boolean} - not used
             */
            function _fetchSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) {
                return _doFetchSender(payload, oncomplete, false);
            }


            function _checkResponsStatus(status: number, responseUrl: string, countOfItemsInPayload: number, errorMessage: string, res: any, oncomplete: OnCompleteCallback) {
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
                            _onError(errorMessage, oncomplete);
                            return;
                        }
                    }
                    if (!_isRetryDisabled) {
                        _onError(errorMessage, oncomplete);

                    }

                    _doOnComplete(oncomplete, status, {}, res);
                    // if (!_isRetryDisabled && _isRetriable(status)) {
                    //     _resendPayload(payload);
                    //     _throwInternal(_diagLog,
                    //         eLoggingSeverity.WARNING,
                    //         _eInternalMessageId.TransmissionFailed, ". " +
                    //         "Response code " + status + ". Will retry to send " + payload.length + " items.");
                    // } else {
                    //     _onError(payload, errorMessage);
                    // }
                } else if (_offlineListener && !_offlineListener.isOnline()) { // offline
                    // Note: Don't check for status == 0, since adblock gives this code
                    // if (!_isRetryDisabled) {
                    //     const offlineBackOffMultiplier = 10; // arbritrary number
                    //     //_resendPayload(payload, offlineBackOffMultiplier);
    
                    //     _throwInternal(_diagLog,
                    //         eLoggingSeverity.WARNING,
                    //         _eInternalMessageId.TransmissionFailed, `. Offline - Response Code: ${status}. Offline status: ${!_offlineListener.isOnline()}. Will retry to send ${payload.length} items.`);
                    // }
                } else {

                    // check if the xhr's responseURL or fetch's response.url is same as endpoint url
                    // TODO after 10 redirects force send telemetry with 'redirect=false' as query parameter.
                    _checkAndUpdateEndPointUrl(responseUrl);
                    
                    if (status === 206) {
                        if (!response) {
                            response = _parseResponse(res);
                        }
    
                        if (response && !_isRetryDisabled) {
                            //_onPartialSuccess(payload, response);
                            _onSuccess(res, oncomplete);
                        } else {
                            _onError(errorMessage, oncomplete);
                        }
                    } else {
                        _consecutiveErrors = 0;
                        _onSuccess(res, oncomplete);
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

            function _doOnComplete(oncomplete: OnCompleteCallback, status: number, headers: { [headerName: string]: string }, response?: string) {
                try {
                    oncomplete && oncomplete(status, headers, response);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }
        
            function _doUnloadSend(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) {
                if (_syncUnloadSender) {
                    // We are unloading so always call the sender with sync set to false
                    // _syncUnloadSender(payload, false);
                    _syncUnloadSender(payload, oncomplete, false);
                } else {
                    // Fallback to the previous beacon Sender (which causes a CORB warning on chrome now)
                    //_beaconSender(payloadData, onComplete, !isAsync);
                    _beaconSender(payload, oncomplete, sync);
                }
            }

            
            function _doBeaconSend(payload: IPayloadData, oncomplete?: OnCompleteCallback) {
                const nav = getNavigator();
                const url = _endpointUrl;
                let data = payload.data;
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
                //const batch = buffer.batchPayloads(payload);
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
                const plainTextBatch = new Blob([data], { type: "text/plain;charset=UTF-8" });
        
                // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                const queued = nav.sendBeacon(url, plainTextBatch);

                if (queued) {
                    _onSuccess(null, oncomplete);
                }

                return queued;
            }

            /**
             * Send Beacon API request
             * @param payload - {string} - The data payload to be sent.
             * @param sync - {boolean} - not used
             * Note: Beacon API does not support custom headers and we are not able to get
             * appId from the backend for the correct correlation.
             */
            function _beaconSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) {
                let internalPayload = payload as IInternalPayloadData;
                let data = internalPayload  && internalPayload.oriPayload;
                if (isArray(data) && data.length > 0) {
                    // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                    if (!_doBeaconSend(payload, oncomplete)) {
                        _fallbackSend && _fallbackSend(payload, oncomplete,true);
                        _throwInternal(_diagLog, eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                        // if (!_disableBeaconSplit) {
                        //     // Failed to send entire payload so try and split data and try to send as much events as possible
                        //     let droppedPayload: string[] = [];
                        //     for (let lp = 0; lp < data.length; lp++) {
                        //         const thePayload = data[lp];
                        //         if (!_doBeaconSend([thePayload], oncomplete)) {
                        //             // Can't send anymore, so split the batch and drop the rest
                        //             droppedPayload.push(thePayload);
                        //         }
                        //     }
                        //     if (droppedPayload.length > 0) {
                        //         _fallbackSend && _fallbackSend(droppedPayload, true);
                        //         _throwInternal(_diagLog, eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                        //     }
                        // } else {
                            
                        // }
                    }
                }
                return;
            }
        
            /**
             * Send XMLHttpRequest
             * @param payload - {string} - The data payload to be sent.
             * @param sync - {boolean} - Indicates if the request should be sent synchronously
             */
            function _xhrSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean): void | IPromise<boolean> {
                let  internalPayload = payload as IInternalPayloadData;
                let thePromise: void | IPromise<boolean>;
                let resolveFunc: (sendComplete: boolean) => void;
                let rejectFunc: (reason?: any) => void;
                let headers = payload.headers || [];

                const xhr = new XMLHttpRequest();
                const endPointUrl = payload.urlString || _endpointUrl;
                try {
                    xhr[DisabledPropertyName] = true;
                } catch(e) {
                    // If the environment has locked down the XMLHttpRequest (preventExtensions and/or freeze), this would
                    // cause the request to fail and we no telemetry would be sent
                }
                
                xhr.open("POST", endPointUrl, !sync);
                xhr.setRequestHeader("Content-type", "application/json");
        
                // append Sdk-Context request header only in case of breeze endpoint
                if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                    xhr.setRequestHeader(RequestHeaders[eRequestHeaders.sdkContextHeader], RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest]);
                }

                arrForEach(objKeys(headers), (headerName) => {
                    xhr.setRequestHeader(headerName, headers[headerName]);
                });
        
                xhr.onreadystatechange = () => {
                    let oriPayload = internalPayload.oriPayload || [];
                    _xhrReadyStateChange(xhr, oriPayload.length, oncomplete);
                    if (xhr.readyState === 4) {
                        resolveFunc && resolveFunc(true);
                    }
                }

                xhr.onerror = (event: ErrorEvent|any) => {
                    _doOnComplete(oncomplete, 400, {}, _formatErrorMessageXhr(xhr));
                    rejectFunc && rejectFunc(event);
                }
        
                if (!sync && _enableSendPromise) {
                    thePromise = createPromise<boolean>((resolve, reject) => {
                        resolveFunc = resolve;
                        rejectFunc = reject;
                    });
                }

                xhr.send(payload.data);

                return thePromise;
            }


            function _fetchKeepAliveSender(payload: IPayloadData) {
                let data = payload.data;
                try {
                    if (data) {
                        let payloadSize = data.length;
                        if ((_syncFetchPayload + payloadSize) <= FetchSyncRequestSizeLimitBytes) {
                            return _doFetchSender;
                            //return _doFetchSender(payload, onComplete, true);
                        } else if (isBeaconsSupported()) {
                            // Fallback to beacon sender as we at least get told which events can't be scheduled
                            return _beaconSender;
                        } else {
                            // Payload is going to be too big so just try and send via XHR
                            if (_fallbackSend) {
                                return _fallbackSend;
                            }
                            _throwInternal(_diagLog, eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
                        }
                    }
                    

                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
            }

            /**
             * Send fetch API request
             * @param payload - {string} - The data payload to be sent.
             * @param sync - {boolean} - For fetch this identifies whether we are "unloading" (false) or a normal request
             */
            function _doFetchSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean): void | IPromise<boolean> {
                const endPointUrl = payload.urlString || _endpointUrl;
                let internalPayload = payload as IInternalPayloadData;
                const batch = internalPayload.data;
                const plainTextBatch = new Blob([batch], { type: "application/json" });
                let thePromise: void | IPromise<boolean>;
                let resolveFunc: (sendComplete: boolean) => void;
                let rejectFunc: (reason?: any) => void;
                let requestHeaders = new Headers();
                let batchLength = batch.length;
                let ignoreResponse = false;
                let responseHandled = false;
                let headers = payload.headers || [];

                // append Sdk-Context request header only in case of breeze endpoint
                if (isInternalApplicationInsightsEndpoint(endPointUrl)) {
                    requestHeaders.append(RequestHeaders[eRequestHeaders.sdkContextHeader], RequestHeaders[eRequestHeaders.sdkContextHeaderAppIdRequest]);
                }
                
                arrForEach(objKeys(headers), (headerName) => {
                    requestHeaders.append(headerName, headers[headerName]);
                });

                const init: RequestInit = {
                    method: "POST",
                    headers: requestHeaders,
                    body: plainTextBatch,// payload.data?
                    [DisabledPropertyName]: true            // Mark so we don't attempt to track this request
                };

                if (sync) {
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

                if (!sync && _enableSendPromise) {
                    thePromise = createPromise<boolean>((resolve, reject) => {
                        resolveFunc = resolve;
                        rejectFunc = reject;
                    });
                }
                try {
                    doAwaitResponse(fetch(request), (result) => {
                        if (sync) {
                            _syncFetchPayload -= batchLength;
                            batchLength = 0;
                        }

                        if (!responseHandled) {
                            responseHandled = true;

                            if (!result.rejected) {
                                let response = result.value;

                                /**
                                 * The Promise returned from fetch() won’t reject on HTTP error status even if the response is an HTTP 404 or 500.
                                 * Instead, it will resolve normally (with ok status set to false), and it will only reject on network failure
                                 * or if anything prevented the request from completing.
                                 */
                                if (!response.ok) {
                                    _doOnComplete(oncomplete, 400, {}, response.statusText);
                                    
                                    resolveFunc && resolveFunc(false);
                                } else {
                                    doAwaitResponse(response.text(), (resp) => {
                                        let oriPayload = internalPayload.oriPayload || [];
                                        _checkResponsStatus(response.status, response.url, oriPayload.length, response.statusText, resp.value || "", oncomplete);
                                        resolveFunc && resolveFunc(true);
                                    });
                                }
                            } else {
                                _doOnComplete(oncomplete, 400, {}, result.reason && result.reason.message);
                                rejectFunc && rejectFunc(result.reason);
                            }
                        }
                    });
                } catch (e) {
                    if (!responseHandled) {
                        _doOnComplete(oncomplete, 400, {},  dumpObj(e));
                        rejectFunc && rejectFunc(e);
                    }
                }

                if (ignoreResponse && !responseHandled) {
                    // Assume success during unload processing as we most likely won't get the response
                    responseHandled = true;
                    _doOnComplete(oncomplete, 200, {});
                    resolveFunc && resolveFunc(true);
                }

                return thePromise;
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
                    _throwInternal(_diagLog,
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
             * Calculates the time to wait before retrying in case of an error based on
             * http://en.wikipedia.org/wiki/Exponential_backoff
         
        
            /**
             * Sets up the timer which triggers actually sending the data.
             */
            function _setupTimer() {
                if (!_timeoutHandle && !_paused) {
                    const retryInterval = _retryAt ? Math.max(0, _retryAt - dateNow()) : 0;
                    const timerValue = Math.max(_maxBatchInterval, retryInterval);
        
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
        
        
            function _formatErrorMessageXhr(xhr: XMLHttpRequest, message?: string): string {
                if (xhr) {
                    return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + _getResponseText(xhr) || xhr.response || "";
                }
        
                return message;
            }
        
            /**
             * Send XDomainRequest
             * @param payload - {string} - The data payload to be sent.
             * @param sync - {boolean} - Indicates if the request should be sent synchronously
             *
             * Note: XDomainRequest does not support sync requests. This 'isAsync' parameter is added
             * to maintain consistency with the xhrSender's contract
             * Note: XDomainRequest does not support custom headers and we are not able to get
             * appId from the backend for the correct correlation.
             */
            function _xdrSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) {
                // It doesn't support custom headers, so no action is taken with current requestHeaders
                let internalPayload = payload as IInternalPayloadData;
                let _window = getWindow();
                const xdr = new XDomainRequest();
                
                let data = internalPayload.data;
                // NOTE: xdr may send previous retry payload to new endpoint since we are not able to check response URL
                xdr.onload = () => {
                    let response = _getResponseText(xdr);
                    // we will assume onload means the request succeeded.
                    _doOnComplete(oncomplete, 200, {}, response);
                    _xdrOnLoad(xdr, oncomplete)
                };
              
                xdr.onerror = () => {
                    _doOnComplete(oncomplete, 400, {}, _formatErrorMessageXdr(xdr));
                };

                xdr.ontimeout = () => {
                    _doOnComplete(oncomplete, 500, {});
                };

                
                xdr.onprogress = () => { };
        
                // XDomainRequest requires the same protocol as the hosting page.
                // If the protocol doesn't match, we can't send the telemetry :(.
                const hostingProtocol = _window && _window.location && _window.location.protocol || "";
                if (_endpointUrl.lastIndexOf(hostingProtocol, 0) !== 0) {
                    _throwInternal(_diagLog,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, ". " +
                        "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");
        
                    //_self._buffer.clear();
                    return;
                }
        
                const endpointUrl = (payload.urlString || _endpointUrl).replace(/^(https?:)/, "");
                xdr.open("POST", endpointUrl);
        
                xdr.send(data as any);
              
            }

            /**
             * xdr state changes
             */
            function _xdrOnLoad(xdr: IXDomainRequest, oncomplete: OnCompleteCallback){
                const responseText = _getResponseText(xdr);
                if (xdr && (responseText + "" === "200" || responseText === "")) {
                    _consecutiveErrors = 0;
                    _onSuccess(responseText, oncomplete);
                } else {
                    const results = _parseResponse(responseText);
                    if (results && results.itemsAccepted) {
                        // TODO: onPartial success
                        _onSuccess(responseText, oncomplete);

                    } else {
                        _onError(_formatErrorMessageXdr(xdr), oncomplete);
                    }
        
                    // if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                    //     && !_isRetryDisabled) {
                    //     _onPartialSuccess(payload, results, oncomplete);
                    // } else {
                    //     _onError(payload, _formatErrorMessageXdr(xdr), oncomplete);
                    // }
                }
            }
        
            function _formatErrorMessageXdr(xdr: IXDomainRequest, message?: string): string {
                if (xdr) {
                    return "XDomainRequest,Response:" + _getResponseText(xdr) || "";
                }
        
                return message;
            }
        
            // Using function lookups for backward compatibility as the getNotifyMgr() did not exist until after v2.5.6
            // function _getNotifyMgr() : INotificationManager {
            //     const func = "getNotifyMgr";
            //     if (_core[func]) {
            //         return _core[func]();
            //     }

            //     // using _self.core['_notificationManager'] for backward compatibility
            //     return _core["_notificationManager"];
            // }

            // function _notifySendRequest(sendRequest: SendRequestReason, isAsync: boolean) {
            //     let manager = _getNotifyMgr();
            //     if (manager && manager.eventsSendRequest) {
            //         try {
            //             manager.eventsSendRequest(sendRequest, isAsync);
            //         } catch (e) {
            //             _throwInternal(_diagLog, eLoggingSeverity.CRITICAL,
            //                 _eInternalMessageId.NotificationException,
            //                 "send request notification failed: " + getExceptionName(e),
            //                 { exception: dumpObj(e) });
            //         }
            //     }
            // }

            /**
             * Validate UUID Format
             * Specs taken from https://tools.ietf.org/html/rfc4122 and breeze repo
             */
            //TODO:  Move to core
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
                _self._appId = null;
                _headers = {};
                _offlineListener = null;
                _consecutiveErrors = 0;
                _retryAt = null;
                _paused = false;
                _timeoutHandle = null;
                _stamp_specific_redirects = 0;
                _syncFetchPayload = 0;
                _syncUnloadSender = null;
                _endpointUrl = null;
                _orgEndpointUrl = null;
                _beaconSupported = false;
                _customHeaders = null;
                _instrumentationKey = null;
                _isRetryDisabled = false;
                _disableXhr = false;
                _fetchKeepAlive = false;
                _isInitialized = false;
                _fallbackSend = null;
                _core = null;
                _onlineChannelId = null;
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

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, cxt: IProcessTelemetryContext, diagLog: IDiagnosticLogger,  unloadHookContainer?: IUnloadHookContainer): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

   
    /**
     * Trigger the immediate send of buffered data; If executing asynchronously (the default) this may (not required) return
     * an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) that will resolve once the
     * send is complete. The actual implementation of the `IPromise` will be a native Promise (if supported) or the default
     * as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - Indicates if the events should be sent asynchronously
     * @param forcedSender - {SenderFunction} - Indicates the forcedSender, undefined if not passed
     * @returns - Nothing or optionally, if occurring asynchronously a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * which will be resolved (or reject) once the send is complete, the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * should only be returned when async is true.
     */
    public triggerSend(async = true, forcedSender?: SenderFunction, sendReason?: SendRequestReason): void | IPromise<boolean> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
     * Get current xhr instance
     */
    public getXhrInst(sync?: boolean) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get current xhr instance
     */
    public getOnunloadInst() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;

    }

    /**
     * Add request header
     * @param name - Header name.
     * @param value - Header value.
     */
    public addHeader = (name: string, value: string) => {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
      
    };

    /**
     * Get all request headers
     * @param name - Header name.
     * @param value - Header value.
     */
    public getHeaders() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public _doTeardown (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
