import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BreezeChannelIdentifier, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, DisabledPropertyName, IConfig, utlSetStoragePrefix
} from "@microsoft/applicationinsights-common";
import {
    IAppInsightsCore, IConfiguration, IDiagnosticLogger, IPayloadData, IProcessTelemetryContext, IProcessTelemetryUnloadContext,
    ITelemetryUnloadState, IUnloadHookContainer, IXHROverride, OnCompleteCallback, SendPOSTFunction, SendRequestReason, TransportType,
    _eInternalMessageId, _throwInternal, arrForEach, createProcessTelemetryContext, dumpObj, eLoggingSeverity, getExceptionName, getJSON,
    getLocation, getNavigator, getWindow, isArray, isBeaconsSupported, isFetchSupported, isXhrSupported, objKeys, onConfigChange,
    useXDomainRequest
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import { isFunction, isNumber } from "@nevware21/ts-utils";
import { ILocalStorageConfiguration, IOfflineSenderConfig } from "./Interfaces/IOfflineProvider";
import { IBackendResponse, XDomainRequest as IXDomainRequest } from "./Interfaces/ISender";

const DefaultOfflineIdentifier = "OfflineChannel";
//const FetchSyncRequestSizeLimitBytes = 65000; // approx 64kb (the current Edge, Firefox and Chrome max limit)
const PostChannelId = "PostChannel";


declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};


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


export type SenderFunction = (payload: string[], isAsync: boolean) => void | IPromise<boolean>;

export class Sender {

    public _appId: string; //TODO: set id

    constructor(endpointUrl?: string) {

        let _consecutiveErrors: number;         // How many times in a row a retryable error condition has occurred.
        let _retryAt: number;                   // The time to retry at in milliseconds from 1970/01/01 (this makes the timer calculation easy).
        //let _lastSend: number;                  // The time of the last send operation.
        let _paused: boolean;                   // Flag indicating that the sending should be paused
        let _stamp_specific_redirects: number;
        let _syncFetchPayload = 0;              // Keep track of the outstanding sync fetch payload total (as sync fetch has limits)
        let _endpointUrl: string;
        let _enableSendPromise: boolean;
        let _alwaysUseCustomSend: boolean;
        let _disableXhr: boolean;
        let _fallbackSend:  SendPOSTFunction;
        let _isInitialized: boolean;
        let _diagLog: IDiagnosticLogger;
        let _core: IAppInsightsCore;
        let _httpInterface: IXHROverride;
        let _onlineChannelId: string;
        let _isOneDs: boolean;
       

        dynamicProto(Sender, this, (_self, _base) => {

            let _sendCredentials = true; // for 1ds
            _initDefaults();

            _self.pause = () => {
                _clearScheduledTimer();
                _paused = true;
            };
        
            _self.resume = () => {
                if (_paused) {
                    _paused = false;
                    _retryAt = null;
                }
            };

            _self.getXhrInst = (sync?: boolean): IXHROverride => {
                // unload events will be saved. so not return unload interface
                return _httpInterface;
            }
        
            _self.initialize = (config: IConfiguration & IConfig, core: IAppInsightsCore, cxt: IProcessTelemetryContext, diagLog: IDiagnosticLogger,  channelId?: string, unloadHookContainer?: IUnloadHookContainer): void => {
                
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
                   
                    let offlineCfg = ctx.getExtCfg(DefaultOfflineIdentifier) as ILocalStorageConfiguration;
                    _onlineChannelId = channelId || BreezeChannelIdentifier;
                    let senderConfig = ctx.getExtCfg(_onlineChannelId, {}) as any;
                    let offlineSenderCfg = offlineCfg.senderCfg || {} as IOfflineSenderConfig;
                  
                    if (_onlineChannelId == PostChannelId) {
                        _isOneDs = true;
                    }
                    
                    _endpointUrl = endpointUrl || senderConfig.endpointUrl || config.endpointUrl || DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;

                    _alwaysUseCustomSend = offlineSenderCfg.alwaysUseXhrOverride;

                    // default true
                    _enableSendPromise = !(senderConfig.enableSendPromise === false);
                    let xhrOverride = senderConfig.httpXHROverride;

                    let customInterface = isOverrideFn(xhrOverride)? xhrOverride : null;
                    if (!customInterface && _isOneDs) {
                        let location = getLocation();
                        if (location && location.protocol && location.protocol.toLowerCase() === "file:") {
                            // Special case where a local html file fails with a CORS error on Chromium browsers
                            _sendCredentials = false;
                        }
                    }
                    let httpInterface: IXHROverride = null;
                    let customTransPorts = offlineSenderCfg.transports || senderConfig.transports || [];

                    // User requested transport(s) values > Beacon > Fetch > XHR
                    // Beacon would be filtered out if user has set disableBeaconApi to true at _getSenderInterface
                    let theTransports: TransportType[] = _prependTransports([TransportType.Xhr, TransportType.Fetch, TransportType.Beacon], customTransPorts);

                    httpInterface = _getSenderInterface(theTransports, false);
                  
                    let xhrInterface = { sendPOST: _xhrSender} as IXHROverride;
                    _fallbackSend =  _xhrSender;
                    httpInterface = _alwaysUseCustomSend? customInterface : (httpInterface || customInterface || xhrInterface);

                    _httpInterface = httpInterface || xhrInterface;

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
                _initDefaults();
            };

            /**
             * success handler
             */
            function _onSuccess (res?: string, onComplete?: OnCompleteCallback) {
                _doOnComplete(onComplete, 200, {}, res);
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
            }
        
            /**
             * partial success handler
             */
            //TODO: partial success handler
            // function _onPartialSuccess (payload: string[], results: IBackendResponse, onComplete?: OnCompleteCallback) {
            // }

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
                    } else if (transportType === TransportType.Beacon && isBeaconsSupported()) {
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


            function _doOnComplete(oncomplete: OnCompleteCallback, status: number, headers: { [headerName: string]: string }, response?: string) {
                try {
                    oncomplete && oncomplete(status, headers, response);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            
            function _doBeaconSend(payload: IPayloadData, oncomplete?: OnCompleteCallback) {
                const nav = getNavigator();
                const url = payload.urlString || _endpointUrl;
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
                let data = payload.data
                if (data) {
                    // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                    if (!_doBeaconSend(payload, oncomplete)) {
                        _fallbackSend && _fallbackSend(payload, oncomplete,true);
                        _throwInternal(_diagLog, eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
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
                //let  internalPayload = payload as IInternalPayloadData;
                let thePromise: void | IPromise<boolean>;
                let resolveFunc: (sendComplete: boolean) => void;
                let rejectFunc: (reason?: any) => void;
                let headers = payload.headers || {};

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
    
                arrForEach(objKeys(headers), (headerName) => {
                    xhr.setRequestHeader(headerName, headers[headerName]);
                });
        
                xhr.onreadystatechange = () => {
                    let response = _getResponseText(xhr);
                    if (xhr.readyState !== 4) {
                        //TODO: this should not need, add in case
                        _handleResponse(oncomplete, xhr.status, {}, response);
                        resolveFunc && resolveFunc(false);
                    }
                    _handleResponse(oncomplete, xhr.status, {}, response);
                    resolveFunc && resolveFunc(true);
                }

                xhr.onerror = (event: ErrorEvent|any) => {
                    _doOnComplete(oncomplete, 400, {}, _formatErrorMessageXhr(xhr));
                    rejectFunc && rejectFunc(event);
                }

                xhr.ontimeout = () => {
                    _doOnComplete(oncomplete, 500, {}, _formatErrorMessageXhr(xhr));
                    resolveFunc && resolveFunc(false);
                };
        
                if (!sync && _enableSendPromise) {
                    thePromise = createPromise<boolean>((resolve, reject) => {
                        resolveFunc = resolve;
                        rejectFunc = reject;
                    });
                }

                xhr.send(payload.data);

                return thePromise;
            }


            /**
             * Send fetch API request
             * @param payload - {string} - The data payload to be sent.
             * @param sync - {boolean} - For fetch this identifies whether we are "unloading" (false) or a normal request
             */
            function _doFetchSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean): void | IPromise<boolean> {
                const endPointUrl = payload.urlString || _endpointUrl;
                const batch = payload.data;
                const plainTextBatch = new Blob([batch], { type: "application/json" });
                let thePromise: void | IPromise<boolean>;
                let resolveFunc: (sendComplete: boolean) => void;
                let rejectFunc: (reason?: any) => void;
                let requestHeaders = new Headers();
                let batchLength = batch.length;
                let ignoreResponse = false;
                let responseHandled = false;
                let headers = payload.headers || [];
                //TODO: handle time out for 1ds
                
                arrForEach(objKeys(headers), (headerName) => {
                    requestHeaders.append(headerName, headers[headerName]);
                });

                const init: RequestInit = {
                    method: "POST",
                    headers: requestHeaders,
                    body: plainTextBatch,
                    [DisabledPropertyName]: true            // Mark so we don't attempt to track this request
                };

                if (_sendCredentials && _isOneDs) {
                    // for 1ds, Don't send credentials when URL is file://
                    init.credentials = "include";
                }

                if (sync) {
                    // since offline will not trigger sync call
                    // this will not be called, add it here in case
                    init.keepalive = true;
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
                                        let status = response.status;
                                        _handleResponse(oncomplete, status, {}, response.statusText);
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

            function _handleResponse(oncomplete: OnCompleteCallback, status: number, headers?: {}, response?: string) {
                if (status == 206 && !_isOneDs) {
                    // for breeze, 206 is partially success, currently consider success
                    // TODO: handle partial success
                    _doOnComplete(oncomplete, 200, headers, response);  // TODO: doc (support partial success)-> partial success add known issue (breeze)
                } else if (status == 204 && _isOneDs) {
                    // one collector
                    _doOnComplete(oncomplete, 200, headers, response);

                } else {
                    _doOnComplete(oncomplete, status, headers, response);
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
                        if(_isOneDs) {
                            return result;
                        }
        
                        // TODO: handle partial success
                        // if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                        //     result.itemsReceived - result.itemsAccepted === result.errors.length) {
                        //     return result;
                        // }

                        if (result && result.itemsReceived) {
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


            function _clearScheduledTimer() {
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
                let _window = getWindow();
                const xdr = new XDomainRequest();
                
                let data = payload.data;

                xdr.onload = () => {
                    let response = _getResponseText(xdr);
                    
                    if (_isOneDs) {
                        // for 1ds. we will assume onload means the request succeeded.
                        _doOnComplete(oncomplete, 200, {}, response);
                    } else {
                        _xdrOnLoad(xdr, oncomplete);
                    }

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
                let endpoint = payload.urlString || _endpointUrl;
                if (endpoint.lastIndexOf(hostingProtocol, 0) !== 0) {
                    _throwInternal(_diagLog,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, ". " +
                        "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");
        
                    return;
                }
        
                const endpointUrl = endpoint.replace(/^(https?:)/, "");
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
                        // TODO: onPartial success for appInsights
                        _onSuccess(responseText, oncomplete);

                    } else {
                        _onError(_formatErrorMessageXdr(xdr), oncomplete);
                    }
                }
            }
        
            function _formatErrorMessageXdr(xdr: IXDomainRequest, message?: string): string {
                if (xdr) {
                    return "XDomainRequest,Response:" + _getResponseText(xdr) || "";
                }
        
                return message;
            }
            
            // TDOD: add notification manager
            // TODO: handler one collector "MSFPC"


        
            function _initDefaults() {
                _self._appId = null;
                _consecutiveErrors = 0;
                _retryAt = null;
                _paused = false;
                _stamp_specific_redirects = 0;
                _syncFetchPayload = 0;
                _endpointUrl = null;
                _disableXhr = false;
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

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, cxt: IProcessTelemetryContext, diagLog: IDiagnosticLogger,  channelId?: string, unloadHookContainer?: IUnloadHookContainer): void {
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

    public _doTeardown (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
