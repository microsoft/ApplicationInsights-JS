// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, IPayloadData, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IXHROverride, OnCompleteCallback,
    SendPOSTFunction, TransportType, _eInternalMessageId, _throwInternal, arrForEach, dumpObj, eLoggingSeverity, getLocation, getNavigator,
    getWindow, isBeaconsSupported, isFetchSupported, isFunction, isXhrSupported, objKeys, useXDomainRequest
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import { DisabledPropertyName } from "./Constants";
import { ISendPostMgrConfig, ISenderOnComplete } from "./Interfaces/ISenderPostManager";
import { IXDomainRequest } from "./Interfaces/IXDomainRequest";
import { formatErrorMessageXdr, formatErrorMessageXhr, getResponseText } from "./Util";

const STR_EMPTY = "";
declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};


export class SenderPostManager {

    constructor() {

        let _syncFetchPayload = 0;              // Keep track of the outstanding sync fetch payload total (as sync fetch has limits)
        let _enableSendPromise: boolean;
        let _isInitialized: boolean;
        let _diagLog: IDiagnosticLogger;
        let _isOneDs: boolean;
        let _onCompleteFuncs: ISenderOnComplete;
        let _disableCredentials: boolean;
        let _fallbackInst: IXHROverride;
        let _disableXhr: boolean;
        let _disableBeacon: boolean;
        let _disableBeaconSync: boolean;
       

        dynamicProto(SenderPostManager, this, (_self, _base) => {

            let _sendCredentials = true; // for 1ds
            _initDefaults();


           
            _self.initialize = (config: ISendPostMgrConfig, diagLog: IDiagnosticLogger): void => {
                
                _diagLog = diagLog;
                if (_isInitialized) {
                    _throwInternal(_diagLog, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "Sender is already initialized");
                }
                _self.SetConfig(config);
                _isInitialized = true;

            };

            _self["_getDbgPlgTargets"] = () => {
                return [_isInitialized, _isOneDs, _disableCredentials, _enableSendPromise];
            };

            // This componet might get its config from sender, offline sender, 1ds post
            // so set this function to mock dynamic changes
            _self.SetConfig = (config: ISendPostMgrConfig): boolean => {
                try {
                    _onCompleteFuncs = config.senderOnCompleteCallBack || {};
                    _disableCredentials = !!config.disableCredentials;
                    _isOneDs = !!config.isOneDs;
                    _enableSendPromise = !!config.enableSendPromise;
                    _disableXhr = !! config.disableXhr;
                    _disableBeacon = !!config.disableBeacon;
                    _disableBeaconSync = !!config.disableBeaconSync;
    
                    _fallbackInst = { sendPOST: _xhrSender} as IXHROverride;
    
                    if (_disableCredentials) {
                        let location = getLocation();
                        if (location && location.protocol && location.protocol.toLowerCase() === "file:") {
                            // Special case where a local html file fails with a CORS error on Chromium browsers
                            _sendCredentials = false;
                        }
                    }
                    return true;

                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return false;
            };


            _self.getSyncFetchPayload = (): number => {
                return _syncFetchPayload;
            };

            _self.getXhrInst = (transports: TransportType[], sync?: boolean): IXHROverride => {
                if (transports && transports.length) {
                    return _getSenderInterface(transports, sync);

                }
                return null;
            }

            _self.getFallbackInst = (): IXHROverride => {
                return _fallbackInst;
            }
            
            _self.setSendOnComplete = (funcs: ISenderOnComplete) => {
                if (funcs) {
                    _onCompleteFuncs = funcs;
                }
            }
        
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

            function _onNoPayloadUrl(onComplete?: OnCompleteCallback) {
                _onError( "No endpoint url is provided for the batch", onComplete);
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
                        sendPostFunc = _doFetchSender;
                    } else if (transportType === TransportType.Beacon && isBeaconsSupported() && (syncSupport? !_disableBeaconSync : !_disableBeacon)) {
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

            function _doOnComplete(oncomplete: OnCompleteCallback, status: number, headers: { [headerName: string]: string }, response?: string) {
                try {
                    oncomplete && oncomplete(status, headers, response);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            }

            
            function _doBeaconSend(payload: IPayloadData, oncomplete?: OnCompleteCallback) {
                const nav = getNavigator();
                const url = payload.urlString;
                if (!url) {
                    _onNoPayloadUrl(oncomplete);
                    // return true here, because we don't want to retry it with fallback sender
                    return true;
                }
                let data = payload.data;
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
                //const batch = buffer.batchPayloads(payload);
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
                const plainTextBatch = new Blob([data], { type: "text/plain;charset=UTF-8" });
        
                // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                const queued = nav.sendBeacon(url, plainTextBatch);

                // if (queued) {
                //     _onSuccess(null, oncomplete);
                // }

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
                        let onRetry= _onCompleteFuncs && _onCompleteFuncs.beaconOnRetry;
                        if (onRetry && isFunction(onRetry)) {
                            onRetry(payload, oncomplete, _doBeaconSend);
                        } else {
                            _fallbackInst && _fallbackInst.sendPOST(payload, oncomplete,true);
                            _throwInternal(_diagLog, eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                        }
                        
                    } else {
                        // if can send
                        _onSuccess(null, oncomplete);
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
                if (!sync && _enableSendPromise) {
                    thePromise = createPromise<boolean>((resolve, reject) => {
                        resolveFunc = resolve;
                        rejectFunc = reject;
                    });
                }

                const xhr = new XMLHttpRequest();
                const endPointUrl = payload.urlString;
                if (!endPointUrl) {
                    _onNoPayloadUrl(oncomplete);
                    resolveFunc && resolveFunc(false);
                    return;
                }

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
                    let response = getResponseText(xhr);
                    if (xhr.readyState !== 4) {
                        //this should not need, add in case
                        _doOnComplete(oncomplete, xhr.status, {}, response);
                        resolveFunc && resolveFunc(false);
                        return;
                    }
                    let onReadyFunc = _onCompleteFuncs && _onCompleteFuncs.xhrOnComplete;
                    if (onReadyFunc && isFunction(onReadyFunc)) {
                        onReadyFunc(xhr, oncomplete);
                    } else {
                        _doOnComplete(oncomplete, xhr.status, {}, response);
                    }
                    resolveFunc && resolveFunc(true);
                }

                xhr.onerror = (event: ErrorEvent|any) => {
                    _doOnComplete(oncomplete, 400, {}, formatErrorMessageXhr(xhr));
                    rejectFunc && rejectFunc(event);
                }

                xhr.ontimeout = () => {
                    _doOnComplete(oncomplete, 500, {}, formatErrorMessageXhr(xhr));
                    resolveFunc && resolveFunc(false);
                };
        
                xhr.send(payload.data);

                return thePromise;
            }


            /**
             * Send fetch API request
             * @param payload - {string} - The data payload to be sent.
             * @param sync - {boolean} - For fetch this identifies whether we are "unloading" (false) or a normal request
             */
            function _doFetchSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean): void | IPromise<boolean> {
                const endPointUrl = payload.urlString;
                const batch = payload.data;
                const plainTextBatch = new Blob([batch], { type: "application/json" });
                let thePromise: void | IPromise<boolean>;
                let resolveFunc: (sendComplete: boolean) => void;
                let rejectFunc: (reason?: any) => void;
                let requestHeaders = new Headers();
                let batchLength = batch.length;
                let ignoreResponse = false;
                let responseHandled = false;
                let headers = payload.headers || {};
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
                if (!endPointUrl) {
                    _onNoPayloadUrl(oncomplete);
                    resolveFunc && resolveFunc(false);
                    return;
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
                                        let onCompleteFunc = _onCompleteFuncs.fetchOnComplete;
                                        if (onCompleteFunc && isFunction(onCompleteFunc)) {
                                            onCompleteFunc(response, oncomplete, resp.value || STR_EMPTY);
                                        } else {
                                            _doOnComplete(oncomplete, status, {}, resp.value || STR_EMPTY);
                                        }
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
                    let response = getResponseText(xdr);
                    let onloadFunc = _onCompleteFuncs && _onCompleteFuncs.xdrOnComplete;
                    if (onloadFunc && isFunction(onloadFunc)) {
                        onloadFunc(xdr, oncomplete);
                    } else {
                        _doOnComplete(oncomplete, 200, {}, response);

                    }
                    
                };
              
                xdr.onerror = () => {
                    _doOnComplete(oncomplete, 400, {}, formatErrorMessageXdr(xdr));
                };

                xdr.ontimeout = () => {
                    _doOnComplete(oncomplete, 500, {});
                };

                
                xdr.onprogress = () => { };
        
                // XDomainRequest requires the same protocol as the hosting page.
                // If the protocol doesn't match, we can't send the telemetry :(.
                const hostingProtocol = _window && _window.location && _window.location.protocol || "";
                let endpoint = payload.urlString;
                if (!endpoint) {
                    _onNoPayloadUrl(oncomplete);
                    return;
                }
                if (endpoint.lastIndexOf(hostingProtocol, 0) !== 0) {
                    let msg = "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.";
                    _throwInternal(_diagLog,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, ". " + msg);
                    _onError(msg, oncomplete);
        
                    return;
                }
        
                const endpointUrl = endpoint.replace(/^(https?:)/, "");
                xdr.open("POST", endpointUrl);
        
                xdr.send(data as any);
              
            }
        
            function _initDefaults() {
                _syncFetchPayload = 0;
                _isInitialized = false;
                _enableSendPromise = false;
                _diagLog = null;
                //let _core: IAppInsightsCore;
                _isOneDs = null;
                _onCompleteFuncs = null;
                _disableCredentials = null;
                _fallbackInst = null;
                _disableXhr = false;
                _disableBeacon = false;
                _disableBeaconSync = false;
            }
        });
    }



    public initialize(config: ISendPostMgrConfig, diagLog: IDiagnosticLogger): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get size of current sync fetch payload
     */
    public getSyncFetchPayload(): number {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * reset Config
     * @returns True if set is successfully
     */
    public SetConfig(config: ISendPostMgrConfig): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get current xhr instance
     */
    public getXhrInst(transports: TransportType[], sync?: boolean): IXHROverride {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get current fallback sender instance
     */
    public getFallbackInst(): IXHROverride {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Set send OnComplete Function
     */
    public setSendOnComplete(funcs: ISenderOnComplete): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public _doTeardown (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
