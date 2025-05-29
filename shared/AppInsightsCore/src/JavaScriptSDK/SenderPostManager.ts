// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { AwaitResponse, IPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import { arrForEach, dumpObj, getInst, getNavigator, getWindow, isFunction, isString, objKeys } from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { SendRequestReason, TransportType } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { IProcessTelemetryUnloadContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import {
    _IInternalXhrOverride, _ISendPostMgrConfig, _ISenderOnComplete, _ITimeoutOverrideWrapper
} from "../JavaScriptSDK.Interfaces/ISenderPostManager";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { IXDomainRequest } from "../JavaScriptSDK.Interfaces/IXDomainRequest";
import { IPayloadData, IXHROverride, OnCompleteCallback, SendPOSTFunction } from "../JavaScriptSDK.Interfaces/IXHROverride";
import { DisabledPropertyName } from "./Constants";
import { _throwInternal, _warnToConsole } from "./DiagnosticLogger";
import { getLocation, isBeaconsSupported, isFetchSupported, isXhrSupported, useXDomainRequest } from "./EnvUtils";
import { _getAllResponseHeaders, formatErrorMessageXdr, formatErrorMessageXhr, getResponseText, openXhr } from "./HelperFuncs";
import { STR_EMPTY } from "./InternalConstants";

const STR_NO_RESPONSE_BODY = "NoResponseBody";
const _noResponseQs =  "&" + STR_NO_RESPONSE_BODY + "=true";
const STR_POST_METHOD = "POST";
declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};


/**
 * This Internal component
 * Manager SendPost functions
 * SendPostManger
 * @internal for internal use only
 */
export class SenderPostManager {

    constructor() {

        let _syncFetchPayload = 0;              // Keep track of the outstanding sync fetch payload total (as sync fetch has limits)
        let _enableSendPromise: boolean;
        let _isInitialized: boolean;
        let _diagLog: IDiagnosticLogger;
        let _isOneDs: boolean;
        let _onCompleteFuncs: _ISenderOnComplete;
        let _disableCredentials: boolean;
        let _fetchCredentials: RequestCredentials;
        let _fallbackInst: IXHROverride;
        let _disableXhr: boolean;
        let _disableBeacon: boolean;
        let _disableBeaconSync: boolean;
        let _disableFetchKeepAlive: boolean;
        let _addNoResponse: boolean;
        let _timeoutWrapper: _ITimeoutOverrideWrapper;
       

        dynamicProto(SenderPostManager, this, (_self, _base) => {

            let _sendCredentials = true; // for 1ds
            _initDefaults();


           
            _self.initialize = (config: _ISendPostMgrConfig, diagLog: IDiagnosticLogger): void => {
                
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
            _self.SetConfig = (config: _ISendPostMgrConfig): boolean => {
                try {
                    _onCompleteFuncs = config.senderOnCompleteCallBack || {};
                    _disableCredentials = !!config.disableCredentials;
                    _fetchCredentials = config.fetchCredentials;
                    _isOneDs = !!config.isOneDs;
                    _enableSendPromise = !!config.enableSendPromise;
                    _disableXhr = !! config.disableXhr;
                    _disableBeacon = !!config.disableBeacon;
                    _disableBeaconSync = !!config.disableBeaconSync;
                    _timeoutWrapper = config.timeWrapper;
                    _addNoResponse = !!config.addNoResponse;
                    _disableFetchKeepAlive = !!config.disableFetchKeepAlive;
    
                    _fallbackInst = { sendPOST: _xhrSender} as IXHROverride;
                    if (!_isOneDs) {
                        _sendCredentials = false; // for appInsights, set it to false always
                    }
    
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

            _self.getSenderInst = (transports: TransportType[], sync?: boolean): IXHROverride => {
                if (transports && transports.length) {
                    return _getSenderInterface(transports, sync);

                }
                return null;
            }

            _self.getFallbackInst = (): IXHROverride => {
                return _fallbackInst;
            }
        
            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _initDefaults();
            };

            _self.preparePayload = (callback: (processedPayload: IPayloadData) => void, zipPayload: boolean, payload: IPayloadData, isSync: boolean) => {
                if (!zipPayload || isSync || !payload.data) {
                    // If the request is synchronous, the body is null or undefined or Compression is not supported, we don't need to compress it
                    callback(payload);
                    return;
                }
                
                try{
                    let csStream: any = getInst("CompressionStream");
                    if (!isFunction(csStream)) {
                        callback(payload);
                        return;
                    }

                    // Create a readable stream from the uint8 data
                    let body = new ReadableStream<Uint8Array>({
                        start(controller) {
                            controller.enqueue(isString(payload.data) ? new TextEncoder().encode(payload.data) : payload.data);
                            controller.close();
                        }
                    });
        
                    const compressedStream = body.pipeThrough(new csStream("gzip"));
                    const reader = (compressedStream.getReader() as ReadableStreamDefaultReader<Uint8Array>);
                    const chunks: Uint8Array[] = [];
                    let totalLength = 0;
                    let callbackCalled = false;
                    
                    // Process each chunk from the compressed stream reader
                    doAwaitResponse(reader.read(), function processChunk(response: AwaitResponse<ReadableStreamReadResult<Uint8Array>>): undefined | IPromise<ReadableStreamReadResult<Uint8Array>> {
                        if (!callbackCalled && !response.rejected) {
                            // Process the chunk and continue reading
                            const result = response.value;
                            if (!result.done) {
                                // Add current chunk and continue reading
                                chunks.push(result.value);
                                totalLength += result.value.length;
                                return doAwaitResponse(reader.read(), processChunk) as any;
                            }

                            // We are complete so combine all chunks
                            const combined = new Uint8Array(totalLength);
                            let offset = 0;
                            for (const chunk of chunks) {
                                combined.set(chunk, offset);
                                offset += chunk.length;
                            }
                            
                            // Update payload with compressed data
                            payload.data = combined;
                            payload.headers["Content-Encoding"] = "gzip";
                            (payload as any)._chunkCount = chunks.length;
                        }

                        if (!callbackCalled) {
                            // Send the processed payload to the callback, if not already called
                            // If the response was rejected, we will call the callback with the original payload
                            // As it only gets "replaced" if the compression was successful
                            callbackCalled = true;
                            callback(payload);
                        }

                        // We don't need to return anything as this will cause the calling chain to be resolved and closed
                    });

                    // returning the reader to allow the caller to cancel the stream if needed
                    // This is not a requirement but allows for better control over the stream, like if we detect that we are unloading
                    // we could use reader.cancel() to stop the stream and avoid sending the request, but this may still be an asynchronous operation
                    // and may not be possible to cancel the stream in time
                    return reader;
                } catch (error) {
                    // CompressionStream is not available at all
                    callback(payload);
                    return;
                }
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
        

            function _getSenderInterface(transports: TransportType[] | number[], syncSupport: boolean): _IInternalXhrOverride {
                let transportType: TransportType = TransportType.NotSet;
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
                    } else if (transportType === TransportType.Fetch && isFetchSupported(syncSupport) && (!syncSupport || !_disableFetchKeepAlive)) {
                        sendPostFunc = _doFetchSender;
                    } else if (transportType === TransportType.Beacon && isBeaconsSupported() && (syncSupport? !_disableBeaconSync : !_disableBeacon)) {
                        sendPostFunc = _beaconSender;
                    }

                    lp++;
                }

                if (sendPostFunc) {
                    return {
                        _transport: transportType,
                        _isSync: syncSupport,
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
                let url = payload.urlString;
                if (!url) {
                    _onNoPayloadUrl(oncomplete);
                    // return true here, because we don't want to retry it with fallback sender
                    return true;
                }
                url = payload.urlString + (_addNoResponse ? _noResponseQs : STR_EMPTY);
                let data = payload.data;
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
            
                // Chrome only allows CORS-safelisted values for the sendBeacon data argument
                // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
                const plainTextBatch = _isOneDs? data : new Blob([data], { type: "text/plain;charset=UTF-8" });
        
                // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                const queued = nav.sendBeacon(url, plainTextBatch);

                return queued;
            }

            /**
             * Send Beacon API request
             * @param payload - The data payload to be sent.
             * @param sync - not used
             * Note: Beacon API does not support custom headers and we are not able to get
             * appId from the backend for the correct correlation.
             */
            function _beaconSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) {
                let data = payload.data
                try {
                    if (data) {
                        // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
                        if (!_doBeaconSend(payload, oncomplete)) {
                            let onRetry= _onCompleteFuncs && _onCompleteFuncs.beaconOnRetry;
                            if (onRetry && isFunction(onRetry)) {
                                onRetry(payload, oncomplete, _doBeaconSend);
                            } else {
                                _fallbackInst && _fallbackInst.sendPOST(payload, oncomplete, true);
                                _throwInternal(_diagLog, eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with normal sender.");
                            }
                            
                        } else {
                            // if can send
                            _onSuccess(STR_EMPTY, oncomplete); // if success, onComplete is called with status code 200
                        }
                    }

                } catch(e) {
                    _isOneDs && _warnToConsole(_diagLog, "Failed to send telemetry using sendBeacon API. Ex:" + dumpObj(e));
                    _doOnComplete(oncomplete, _isOneDs? 0 : 400, {}, STR_EMPTY);
                }
                
                return;
            }
        
            /**
             * Send XMLHttpRequest
             * @param payload - The data payload to be sent.
             * @param sync - Indicates if the request should be sent synchronously
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

                if (_isOneDs && sync && payload.disableXhrSync) {
                    sync = false;
                }

                //const xhr = new XMLHttpRequest();
                const endPointUrl = payload.urlString;
                if (!endPointUrl) {
                    _onNoPayloadUrl(oncomplete);
                    resolveFunc && resolveFunc(false);
                    return;
                }

                let xhr = openXhr(STR_POST_METHOD, endPointUrl, _sendCredentials, true, sync, payload.timeout);
                if (!_isOneDs) {
                    // application/json should NOT add to 1ds post by default
                    xhr.setRequestHeader("Content-type", "application/json");
                }

    
                arrForEach(objKeys(headers), (headerName) => {
                    xhr.setRequestHeader(headerName, headers[headerName]);
                });
        
                xhr.onreadystatechange = () => {
                    if (!_isOneDs) {
                        _doOnReadyFunc(xhr);
                        if (xhr.readyState === 4 ) {
                            resolveFunc && resolveFunc(true);
                        }
                    }
                };

                xhr.onload = () => {
                    if (_isOneDs) {
                        _doOnReadyFunc(xhr);
                    }
                };

                function _doOnReadyFunc(xhr: XMLHttpRequest) {
                    let onReadyFunc = _onCompleteFuncs && _onCompleteFuncs.xhrOnComplete;
                    let onReadyFuncExist = onReadyFunc && isFunction(onReadyFunc);
                
                    if (onReadyFuncExist) {
                        onReadyFunc(xhr, oncomplete, payload);
                    } else {
                        let response = getResponseText(xhr);
                        _doOnComplete(oncomplete, xhr.status, _getAllResponseHeaders(xhr, _isOneDs), response);
                    }
                }

                xhr.onerror = (event: ErrorEvent|any) => {
                    _doOnComplete(oncomplete, _isOneDs? xhr.status : 400, _getAllResponseHeaders(xhr, _isOneDs), _isOneDs? STR_EMPTY : formatErrorMessageXhr(xhr));
                    rejectFunc && rejectFunc(event);
                };

                xhr.ontimeout = () => {
                    _doOnComplete(oncomplete,  _isOneDs? xhr.status : 500, _getAllResponseHeaders(xhr, _isOneDs), _isOneDs? STR_EMPTY : formatErrorMessageXhr(xhr));
                    resolveFunc && resolveFunc(false);
                };
        
                xhr.send(payload.data);

                return thePromise;
            }


            /**
             * Send fetch API request
             * @param payload - The data payload to be sent.
             * @param sync - For fetch this identifies whether we are "unloading" (false) or a normal request
             */
            function _doFetchSender(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean): void | IPromise<boolean> {
                let endPointUrl = payload.urlString;
                const batch = payload.data;
                const plainTextBatch = _isOneDs? batch : new Blob([batch], { type: "application/json" });
                let thePromise: void | IPromise<boolean>;
                let resolveFunc: (sendComplete: boolean) => void;
                let rejectFunc: (reason?: any) => void;
                let requestHeaders = new Headers();
                let batchLength = batch.length;
                let ignoreResponse = false;
                let responseHandled = false;
                let headers = payload.headers || {};
                //TODO: handle time out for 1ds
                
               

                const init: RequestInit = {
                    method: STR_POST_METHOD,
                    body: plainTextBatch,
                    [DisabledPropertyName]: true            // Mark so we don't attempt to track this request
                };

                // Only add headers if there are headers to add, due to issue with some polyfills
                if (payload.headers && objKeys(payload.headers).length > 0) {
                    arrForEach(objKeys(headers), (headerName) => {
                        requestHeaders.append(headerName, headers[headerName]);
                    });
                    init.headers = requestHeaders;
                }


                if (_fetchCredentials) {  // if user passed in this value via post channel (1ds), then use it
                    init.credentials = _fetchCredentials;
                } else if (_sendCredentials && _isOneDs) {
                    // for 1ds, Don't send credentials when URL is file://
                    init.credentials = "include";
                }

                if (sync) {
                    init.keepalive = true;
                   
                    _syncFetchPayload += batchLength;
                    if (_isOneDs) {
                        if (payload["_sendReason"] === SendRequestReason.Unload) {
                            // As a sync request (during unload), it is unlikely that we will get a chance to process the response so
                            // just like beacon send assume that the events have been accepted and processed
                            ignoreResponse = true;
                            if (_addNoResponse) {
                                endPointUrl += _noResponseQs;
                            }
                        }
                    } else {
                        // for appinsights, set to true for all sync request
                        ignoreResponse = true;
                    }
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

                
                function _handleError(res?: string, statusCode?: number) {
                    // In case there is an error in the request. Set the status to 0 for 1ds and 400 for appInsights
                    // so that the events can be retried later.
                    if (statusCode) {
                        _doOnComplete(oncomplete, _isOneDs? 0 : statusCode, {}, _isOneDs? STR_EMPTY: res);
                    } else {
                        _doOnComplete(oncomplete, _isOneDs? 0 : 400, {}, _isOneDs? STR_EMPTY: res);
                    }
                }

                function _onFetchComplete(response: Response, payload?: IPayloadData, value?: string) {
                    let status = response.status;
                    let onCompleteFunc = _onCompleteFuncs.fetchOnComplete;
                    if (onCompleteFunc && isFunction(onCompleteFunc)) {
                        onCompleteFunc(response, oncomplete, value || STR_EMPTY, payload);
                    } else {
                        _doOnComplete(oncomplete, status, {}, value || STR_EMPTY);
                    }

                }

                try {
                    doAwaitResponse(fetch(_isOneDs? endPointUrl: request, _isOneDs? init: null), (result) => {
                        if (sync) {
                            _syncFetchPayload -= batchLength;
                            batchLength = 0;
                        }

                        if (!responseHandled) {
                            responseHandled = true;

                            if (!result.rejected) {
                                let response = result.value;
                                try {
                                    /**
                                     * The Promise returned from fetch() won’t reject on HTTP error status even if the response is an HTTP 404 or 500.
                                     * Instead, it will resolve normally (with ok status set to false), and it will only reject on network failure
                                     * or if anything prevented the request from completing.
                                     */
                                    if (!_isOneDs && !response.ok) {
                                        // this is for appInsights only
                                        if (response.status){
                                            _handleError(response.statusText, response.status);
                                        } else {
                                            _handleError(response.statusText, 499);
                                        }
                                        resolveFunc && resolveFunc(false);
                                    } else {
                                        if (_isOneDs && !response.body) {
                                            _onFetchComplete(response, null, STR_EMPTY);
                                            resolveFunc && resolveFunc(true);
                                        } else {
                                            doAwaitResponse(response.text(), (resp) => {
                                                _onFetchComplete(response, payload, resp.value)
                                                resolveFunc && resolveFunc(true);
                                            });
                                        }
                                        
                                    }

                                } catch (e) {
                                    if (response && response.status){
                                        _handleError(dumpObj(e), response.status);
                                    } else {
                                        _handleError(dumpObj(e), 499);
                                    }
                                    rejectFunc && rejectFunc(e);
                                }
                                
                            } else {
                                _handleError(result.reason && result.reason.message, 499);
                                rejectFunc && rejectFunc(result.reason);
                            }
                        }
                    });
                } catch (e) {
                    if (!responseHandled) {
                        _handleError(dumpObj(e), 499);
                        rejectFunc && rejectFunc(e);
                    }
                }

                if (ignoreResponse && !responseHandled) {
                    // Assume success during unload processing as we most likely won't get the response
                    responseHandled = true;
                    _doOnComplete(oncomplete, 200, {});
                    resolveFunc && resolveFunc(true);
                }

                if (_isOneDs && !responseHandled && payload.timeout > 0) {
                    // Simulate timeout
                    _timeoutWrapper && _timeoutWrapper.set(() => {
                        if (!responseHandled) {
                            // Assume a 500 response (which will cause a retry)
                            responseHandled = true;
                            _doOnComplete(oncomplete, 500, {});
                            resolveFunc && resolveFunc(true);
                            
                        }
                    }, payload.timeout);
                }

                return thePromise;
            }

        
            /**
             * Send XDomainRequest
             * @param payload - The data payload to be sent.
             * @param sync - Indicates if the request should be sent synchronously
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
                        onloadFunc(xdr, oncomplete, payload);
                    } else {
                        _doOnComplete(oncomplete, 200, {}, response);

                    }
                    
                };
              
                xdr.onerror = () => {
                    _doOnComplete(oncomplete, 400, {}, _isOneDs? STR_EMPTY: formatErrorMessageXdr(xdr));
                };

                xdr.ontimeout = () => {
                    _doOnComplete(oncomplete, 500, {});
                };

                
                xdr.onprogress = () => { };
        
                // XDomainRequest requires the same protocol as the hosting page.
                // If the protocol doesn't match, we can't send the telemetry :(.
                const hostingProtocol = _window && _window.location && _window.location.protocol || STR_EMPTY;
                let endpoint = payload.urlString;
                if (!endpoint) {
                    _onNoPayloadUrl(oncomplete);
                    return;
                }
                if (!_isOneDs && endpoint.lastIndexOf(hostingProtocol, 0) !== 0) {
                    let msg = "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.";
                    _throwInternal(_diagLog,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.TransmissionFailed, ". " + msg);
                    _onError(msg, oncomplete);
        
                    return;
                }
        
                const endpointUrl = _isOneDs? endpoint : endpoint.replace(/^(https?:)/, STR_EMPTY);
                xdr.open(STR_POST_METHOD, endpointUrl);
                if (payload.timeout) {
                    xdr.timeout = payload.timeout;
                }

        
                xdr.send(data as any);
                
                if (_isOneDs && sync) {
                    _timeoutWrapper && _timeoutWrapper.set(() => {
                        xdr.send(data as any);
                    }, 0);

                } else {
                    xdr.send(data as any);
                }
              
            }
        
            function _initDefaults() {
                _syncFetchPayload = 0;
                _isInitialized = false;
                _enableSendPromise = false;
                _diagLog = null;
                _isOneDs = null;
                _onCompleteFuncs = null;
                _disableCredentials = null;
                _fetchCredentials = null;
                _fallbackInst = null;
                _disableXhr = false;
                _disableBeacon = false;
                _disableBeaconSync = false;
                _disableFetchKeepAlive = false;
                _addNoResponse = false;
                _timeoutWrapper = null;
            }
        });
    }



    public initialize(config: _ISendPostMgrConfig, diagLog: IDiagnosticLogger): void {
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
    public SetConfig(config: _ISendPostMgrConfig): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get current xhr instance
     */
    public getSenderInst(transports: TransportType[], sync?: boolean): IXHROverride {
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

    public _doTeardown (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public preparePayload(callback: (processedPayload: IPayloadData) => void, zipPayload: boolean, payload: IPayloadData, isSync: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }


}
