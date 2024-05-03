/**
* HttpManager.ts
* @author Abhilash Panwar (abpanwar); Hector Hernandez (hectorh); Nev Wylie (newylie)
* @copyright Microsoft 2018-2020
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    EventSendType, FullVersionString, IAppInsightsCore, ICookieMgr, IDiagnosticLogger, IExtendedConfiguration, IPayloadData, IPerfEvent,
    ITelemetryItem, IUnloadHook, IXDomainRequest, IXHROverride, OnCompleteCallback, SendRequestReason, SenderPostManager, TransportType,
    _IInternalXhrOverride, _ISendPostMgrConfig, _ISenderOnComplete, _eExtendedInternalMessageId, _eInternalMessageId, _getAllResponseHeaders,
    _throwInternal, _warnToConsole, arrForEach, dateNow, doPerf, dumpObj, eLoggingSeverity, extend, getCommonSchemaMetaData, getNavigator,
    getResponseText, getTime, hasOwnProperty, isBeaconsSupported, isFetchSupported, isNullOrUndefined, isReactNative, isUndefined,
    isValueAssigned, objForEachKey, objKeys, onConfigChange, optimizeObject, prependTransports, strUndefined
} from "@microsoft/1ds-core-js";
import { arrAppend } from "@nevware21/ts-utils";
import { BatchNotificationAction, BatchNotificationActions } from "./BatchNotificationActions";
import { ClockSkewManager } from "./ClockSkewManager";
import {
    EventBatchNotificationReason, IChannelConfiguration, ICollectorResult, IPostChannel, IPostTransmissionTelemetryItem,
    PayloadListenerFunction, PayloadPreprocessorFunction
} from "./DataModels";
import { EventBatch } from "./EventBatch";
import {
    DEFAULT_CACHE_CONTROL, DEFAULT_CONTENT_TYPE, STR_API_KEY, STR_AUTH_XTOKEN, STR_CACHE_CONTROL, STR_CLIENT_ID, STR_CLIENT_VERSION,
    STR_CONTENT_TYPE_HEADER, STR_DROPPED, STR_EMPTY, STR_KILL_DURATION_HEADER, STR_KILL_TOKENS_HEADER, STR_MSA_DEVICE_TICKET, STR_MSFPC,
    STR_NO_RESPONSE_BODY, STR_OTHER, STR_REQUEUE, STR_RESPONSE_FAIL, STR_SENDING, STR_TIME_DELTA_HEADER, STR_TIME_DELTA_TO_APPLY,
    STR_UPLOAD_TIME
} from "./InternalConstants";
import { KillSwitch } from "./KillSwitch";
import { retryPolicyGetMillisToBackoffForRetry, retryPolicyShouldRetryForStatus } from "./RetryPolicy";
import { ISerializedPayload, Serializer } from "./Serializer";
import { ITimeoutOverrideWrapper, createTimeoutWrapper } from "./TimeoutOverrideWrapper";

const strSendAttempt = "sendAttempt";

const _noResponseQs =  "&" + STR_NO_RESPONSE_BODY + "=true";
const UrlQueryString = "?cors=true&" + STR_CONTENT_TYPE_HEADER.toLowerCase() + "=" + DEFAULT_CONTENT_TYPE;

interface IRequestUrlDetails {
    url: string,
    hdrs: { [key: string]: string },
    useHdrs: boolean
}

/**
 * Identifies the default notification reason to the action names
 */
const _eventActionMap: any = {
    [EventBatchNotificationReason.Paused]: STR_REQUEUE,
    [EventBatchNotificationReason.RequeueEvents]: STR_REQUEUE,
    [EventBatchNotificationReason.Complete]: "sent",
    [EventBatchNotificationReason.KillSwitch]: STR_DROPPED,
    [EventBatchNotificationReason.SizeLimitExceeded]: STR_DROPPED
};

const _collectorQsHeaders = { };
const _collectorHeaderToQs = { };

function _addCollectorHeaderQsMapping(qsName: string, headerName: string, allowQs?: boolean) {
    _collectorQsHeaders[qsName] = headerName;
    if (allowQs !== false) {
        _collectorHeaderToQs[headerName] = qsName;
    }
}

_addCollectorHeaderQsMapping(STR_MSA_DEVICE_TICKET, STR_MSA_DEVICE_TICKET, false);
_addCollectorHeaderQsMapping(STR_CLIENT_VERSION, STR_CLIENT_VERSION);
_addCollectorHeaderQsMapping(STR_CLIENT_ID, "Client-Id");
_addCollectorHeaderQsMapping(STR_API_KEY, STR_API_KEY);
_addCollectorHeaderQsMapping(STR_TIME_DELTA_TO_APPLY, STR_TIME_DELTA_TO_APPLY);
_addCollectorHeaderQsMapping(STR_UPLOAD_TIME, STR_UPLOAD_TIME);
_addCollectorHeaderQsMapping(STR_AUTH_XTOKEN, STR_AUTH_XTOKEN);

interface IInternalPayloadData extends IPayloadData {
    _thePayload: ISerializedPayload;
    _sendReason: SendRequestReason;
}

function _hasHeader(headers: any, header: string) {
    let hasHeader = false;
    if (headers && header) {
        const keys = objKeys(headers);
        if (keys && keys.length > 0) {
            const lowerHeader = header.toLowerCase();
            for (let lp = 0; lp < keys.length; lp++) {
                const value = keys[lp];
                if (value && hasOwnProperty(header, value) &&
                        value.toLowerCase() === lowerHeader) {
                    hasHeader = true;
                    break;
                }
            }
        }
    }

    return hasHeader;
}

function _addRequestDetails(details: IRequestUrlDetails, name: string, value: string, useHeaders: boolean) {
    if (name && value && value.length > 0) {
        if (useHeaders && _collectorQsHeaders[name]) {
            details.hdrs[_collectorQsHeaders[name]] = value;
            details.useHdrs = true;
        } else {
            details.url += "&" + name + "=" + value;
        }
    }
}

interface IQueryStringParams {
    name: string,
    value: string
}

function _addQueryStringParameter(qsParams: IQueryStringParams[], name: string, value: string) {
    for (let i = 0; i < qsParams.length; i++) {
        if (qsParams[i].name === name) {
            qsParams[i].value = value;
            return;
        }
    }
    qsParams.push({ name: name, value: value });
}

function _removeQueryStringParameter(qsParams: IQueryStringParams[], name: string) {
    for (let i = 0; i < qsParams.length; i++) {
        if (qsParams[i].name === name) {
            qsParams.splice(i, 1);
            return;
        }
    }
}


/**
 * Class managing the sending of requests.
 */
export class HttpManager {

    /**
     * @constructor
     * @param requestQueue   - The queue that contains the requests to be sent.
     */
    constructor(maxEventsPerBatch: number, maxConnections: number, maxRequestRetriesBeforeBackoff: number, actions: BatchNotificationActions) {
        // ------------------------------------------------------------------------------------------------------------------------
        // Only set "Default" values in the _initDefaults() method, unless value are not "reset" during unloading
        // ------------------------------------------------------------------------------------------------------------------------
        let _urlString: string;
        let _killSwitch: KillSwitch;
        let _paused: boolean;
        let _clockSkewManager: ClockSkewManager;
        let _useBeacons = false;
        let _outstandingRequests: number;           // Holds the number of outstanding async requests that have not returned a response yet
        let _postManager: IPostChannel;
        let _logger: IDiagnosticLogger;
        let _sendInterfaces: { [key: number]: _IInternalXhrOverride };
        let _core: IAppInsightsCore;
        let _customHttpInterface: boolean;
        let _queryStringParameters: IQueryStringParams[];
        let _headers: { [name: string]: string };
        let _batchQueue: EventBatch[];
        let _serializer: Serializer;
        let _enableEventTimings: boolean;
        let _cookieMgr: ICookieMgr;
        let _isUnloading: boolean;
        let _useHeaders: boolean;
        let _xhrTimeout: number;
        let _disableXhrSync: boolean;
        let _disableFetchKeepAlive: boolean;
        let _canHaveReducedPayload: boolean;
        let _addNoResponse: boolean;
        let _unloadHooks: IUnloadHook[];
        let _sendHook: PayloadPreprocessorFunction | undefined;
        let _sendListener: PayloadListenerFunction | undefined;
        let _responseHandlers: Array<(responseText: string) => void>;
        let _isInitialized: boolean;
        let _timeoutWrapper: ITimeoutOverrideWrapper;
        let _excludeCsMetaData: boolean;
        let _sendPostMgr: SenderPostManager;

        dynamicProto(HttpManager, this, (_self) => {
            _initDefaults();

            let _sendCredentials = true;

            _self.initialize = (theConfig: IExtendedConfiguration, core: IAppInsightsCore, postChannel: IPostChannel) => {
                if (!_isInitialized) {
                    _core = core;
                    _cookieMgr = core.getCookieMgr();
                    _postManager = postChannel;
                    _logger = _postManager.diagLog();
    
                    arrAppend(_unloadHooks, onConfigChange(theConfig, (details) => {
                        let coreConfig = details.cfg;
                        let channelConfig: IChannelConfiguration = details.cfg.extensionConfig[postChannel.identifier];
    
                        _timeoutWrapper = createTimeoutWrapper(channelConfig.setTimeoutOverride, channelConfig.clearTimeoutOverride);

                        if (isValueAssigned(coreConfig.anonCookieName)) {
                            _addQueryStringParameter(_queryStringParameters, "anoncknm", coreConfig.anonCookieName);
                        } else {
                            _removeQueryStringParameter(_queryStringParameters, "anoncknm");
                        }
    
                        _sendHook = channelConfig.payloadPreprocessor;
                        _sendListener = channelConfig.payloadListener;
    
                        let httpInterface = channelConfig.httpXHROverride;
    
                        // Override endpointUrl if provided in Post config
                        let endpointUrl = channelConfig.overrideEndpointUrl ? channelConfig.overrideEndpointUrl : coreConfig.endpointUrl;
                        _urlString = endpointUrl + UrlQueryString;
                        _useHeaders = !isUndefined(channelConfig.avoidOptions) ? !channelConfig.avoidOptions : true;
                        _enableEventTimings = !channelConfig.disableEventTimings;
    
                        let valueSanitizer = channelConfig.valueSanitizer;
                        let stringifyObjects = channelConfig.stringifyObjects;
                        let enableCompoundKey = !!coreConfig.enableCompoundKey;
                        if (!isUndefined(channelConfig.enableCompoundKey)) {
                            enableCompoundKey = !!channelConfig.enableCompoundKey;
                        }
    
                        _xhrTimeout = channelConfig.xhrTimeout;
                        _disableXhrSync = !!channelConfig.disableXhrSync;
                        _disableFetchKeepAlive = !!channelConfig.disableFetchKeepAlive;
                        _addNoResponse = channelConfig.addNoResponse !== false;
                        _excludeCsMetaData = !!channelConfig.excludeCsMetaData;

                        
                        if (!!core.getPlugin("LocalStorage")) {
                            // Always disable fetch keep alive when persisten storage is available
                            _disableFetchKeepAlive = true;
                        }
            
                        _useBeacons = !isReactNative(); // Only use beacons if not running in React Native
                        _serializer = new Serializer(_core, valueSanitizer, stringifyObjects, enableCompoundKey, getCommonSchemaMetaData, _excludeCsMetaData);
        
                        if (!isNullOrUndefined(channelConfig.useSendBeacon)) {
                            _useBeacons = !!channelConfig.useSendBeacon;
                        }

                        let sendPostConfig = _getSendPostMgrConfig();
                        // only init it once
                        if (!_sendPostMgr) {
                            _sendPostMgr = new SenderPostManager();
                            _sendPostMgr.initialize(sendPostConfig, _logger);
                        } else {
                            _sendPostMgr.SetConfig(sendPostConfig);
                        }
    
                        let syncHttpInterface = httpInterface;
                        let beaconHttpInterface: IXHROverride = channelConfig.alwaysUseXhrOverride ? httpInterface : null;
                        let fetchSyncHttpInterface: IXHROverride = channelConfig.alwaysUseXhrOverride ? httpInterface : null;
                        let beaconUnloadTransports: TransportType[] = [TransportType.Beacon, TransportType.Fetch];
        
                        if (!httpInterface) {
                            _customHttpInterface = false;
        
                            // this is handled in SendPostManager now
                            // let location = getLocation();
                            // if (location && location.protocol && location.protocol.toLowerCase() === "file:") {
                            //     // Special case where a local html file fails with a CORS error on Chromium browsers
                            //     _sendCredentials = false;
                            // }
        
                            let theTransports: TransportType[] = [];
                            if (isReactNative()) {
                                // Use Fetch or XDR/XHR
                                theTransports = [TransportType.Fetch, TransportType.Xhr];
                                beaconUnloadTransports = [TransportType.Fetch, TransportType.Xhr, TransportType.Beacon];
                            } else {
                                // Use XDR/XHR, Fetch or beacons
                                theTransports = [TransportType.Xhr, TransportType.Fetch, TransportType.Beacon];
                            }
        
                            // Prefix any user requested transport(s) values
                            theTransports = prependTransports(theTransports, channelConfig.transports);
        
                            httpInterface = _getSenderInterface(theTransports, false);
                            if (!httpInterface) {
                                _warnToConsole(_logger, "No available transport to send events");
                            }
        
                            syncHttpInterface = _getSenderInterface(theTransports, true);
                        }
    
                        if (!beaconHttpInterface) {
                            // Allow overriding the usage of sendBeacon
                            beaconUnloadTransports = prependTransports(beaconUnloadTransports, channelConfig.unloadTransports);
                            beaconHttpInterface = _getSenderInterface(beaconUnloadTransports, true);
                        }
    
                        _canHaveReducedPayload = !_customHttpInterface && ((_useBeacons && isBeaconsSupported()) || (!_disableFetchKeepAlive && isFetchSupported(true)));
    
                        _sendInterfaces = {
                            [EventSendType.Batched]: httpInterface,
                            [EventSendType.Synchronous]: syncHttpInterface || _getSenderInterface([TransportType.Xhr, TransportType.Fetch, TransportType.Beacon], true),
                            [EventSendType.SendBeacon]: beaconHttpInterface || syncHttpInterface || _getSenderInterface([TransportType.Xhr], true),
                            [EventSendType.SyncFetch]: fetchSyncHttpInterface || _getSenderInterface([TransportType.Fetch, TransportType.Beacon], true) || syncHttpInterface || _getSenderInterface([TransportType.Xhr], true)
                        };
                    }));

                    _isInitialized = true;
                }
            };

            _self.addResponseHandler = (responseHandler: (responseText: string) => void): IUnloadHook => {
                _responseHandlers.push(responseHandler);
                return {
                    rm: () => {
                        let index = _responseHandlers.indexOf(responseHandler);
                        if (index >= 0){
                            _responseHandlers.splice(index,1);
                        }
                    }
                }
            };

            _self.serializeOfflineEvt = (evt) => {
                try {
                    if (_serializer) {
                        return _serializer.getEventBlob(evt);
                    }
                      
                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return STR_EMPTY;
                
            }

            _self.getOfflineRequestDetails = () => {
                return null;
            }

            _self.createOneDSPayload = (evts: ITelemetryItem[], optimize?: boolean) => {
                try {
                    // TODO: optimize
                    let theBatches: EventBatch[] = [];
                    // create a eventBatch for each event
                    arrForEach(evts, (evt) => {
                        if (optimize) {
                            evt = optimizeObject(evt)
                        }
                        let batch = EventBatch.create(evt.iKey, [evt]);
                        theBatches.push(batch);
                    })
          
                    let thePayload: ISerializedPayload = null;

                    while (theBatches && theBatches.length && _serializer) {
                        let theBatch = theBatches.shift();
                        if (theBatch && theBatch.count() > 0) {
                            thePayload = thePayload || _serializer.createPayload(0, false, false, false, SendRequestReason.NormalSchedule, EventSendType.Batched);
                            _serializer.appendPayload(thePayload, theBatch, maxEventsPerBatch)
                        }
                    }

                    let requestDetails = _buildRequestDetails(thePayload, _useHeaders);

                    let payloadData: IPayloadData = {
                        data: thePayload.payloadBlob,
                        urlString: requestDetails.url,
                        headers: requestDetails.hdrs,
                        timeout: _xhrTimeout,
                        disableXhrSync: _disableXhrSync,
                        disableFetchKeepAlive: _disableFetchKeepAlive
                    };

                    // Only automatically add the following headers if already sending headers and we are not attempting to avoid an options call
                    if (_useHeaders) {
                        if (!_hasHeader(payloadData.headers, STR_CACHE_CONTROL)) {
                            payloadData.headers[STR_CACHE_CONTROL] = DEFAULT_CACHE_CONTROL;
                        }

                        if (!_hasHeader(payloadData.headers, STR_CONTENT_TYPE_HEADER)) {
                            payloadData.headers[STR_CONTENT_TYPE_HEADER] = DEFAULT_CONTENT_TYPE;
                        }
                    }

                    return payloadData;

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return null;
            }

            

            // Special internal method to allow the DebugPlugin to hook embedded objects
            function _getSenderInterface(transports: TransportType[], syncSupport: boolean): _IInternalXhrOverride {
                try {
                    return _sendPostMgr && _sendPostMgr.getSenderInst(transports, syncSupport);
                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return null;
            }

            _self["_getDbgPlgTargets"] = () => {
                return [_sendInterfaces[EventSendType.Batched], _killSwitch, _serializer, _sendInterfaces];
            };

            function _getSendPostMgrConfig(): _ISendPostMgrConfig {
                try {
                    let onCompleteFuncs = {
                        xdrOnComplete: _xdrOncomplete,
                        fetchOnComplete: _fetchOnComplete,
                        xhrOnComplete: _xhrOnComplete,
                        beaconOnRetry: _onBeaconRetry
                    } as _ISenderOnComplete;
                    let config = {
                        enableSendPromise: false,
                        isOneDs: true,
                        disableCredentials: !_sendCredentials,
                        disableXhr: false,
                        disableBeacon: !_useBeacons,
                        disableBeaconSync: !_useBeacons,
                        disableFetchKeepAlive: _disableFetchKeepAlive,
                        timeWrapper: _timeoutWrapper,
                        addNoResponse: _addNoResponse,
                        senderOnCompleteCallBack: onCompleteFuncs
                    } as _ISendPostMgrConfig;
                    return config;
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
            }


            function _xdrOncomplete(xdr: IXDomainRequest, oncomplete: OnCompleteCallback, payload?: IPayloadData) {
                let response = getResponseText(xdr);
                _doOnComplete(oncomplete, 200, {}, response);
                _handleCollectorResponse(response);
               
            }

            function _initDefaults() {
                let undefValue: undefined;
                _urlString = null
                _killSwitch = new KillSwitch();
                _paused = false;
                _clockSkewManager = new ClockSkewManager();
                _useBeacons = false;
                _outstandingRequests = 0;           // Holds the number of outstanding async requests that have not returned a response yet
                _postManager = null
                _logger = null
                _sendInterfaces = null
                _core = null
                _customHttpInterface = true;
                _queryStringParameters = [];
                _headers = {};
                _batchQueue = [];
                _serializer = null;
                _enableEventTimings = false;
                _cookieMgr = null;
                _isUnloading = false;
                _useHeaders = false;
                _xhrTimeout = undefValue;
                _disableXhrSync = undefValue;
                _disableFetchKeepAlive = undefValue;
                _canHaveReducedPayload = undefValue;
                _addNoResponse = undefValue;
                _unloadHooks = [];
                _sendHook = undefValue;
                _sendListener = undefValue;
                _responseHandlers = [];
                _isInitialized = false;
                _timeoutWrapper = createTimeoutWrapper();
                _excludeCsMetaData = false;
                _sendPostMgr = null;
            }

            function _fetchOnComplete(response: Response, onComplete: OnCompleteCallback, resValue?: string, payload?: IPayloadData) {
                const handleResponse = (status: number, headerMap: { [x: string]: string; }, responseText: string) => {
                    _doOnComplete(onComplete, status, headerMap, responseText);
                    _handleCollectorResponse(responseText);
                };
                let headerMap = {};
                var headers = response.headers;
                if (headers) {
                    headers["forEach"]((value: string, name: string) => {
                        headerMap[name] = value;
                    });
                }
                handleResponse(response.status, headerMap, resValue || STR_EMPTY);
            }
            

            function _xhrOnComplete (request: XMLHttpRequest, oncomplete: OnCompleteCallback, payload?: IPayloadData) {
                let response = getResponseText(request);
                _doOnComplete(oncomplete, request.status, _getAllResponseHeaders(request, true), response);
                _handleCollectorResponse(response);
            }

            function _doOnComplete(oncomplete: OnCompleteCallback, status: number, headers: { [headerName: string]: string }, response?: string) {
                try {
                    oncomplete(status, headers, response);
                } catch (e) {
                    _throwInternal(_logger,
                        eLoggingSeverity.WARNING,
                        _eExtendedInternalMessageId.SendPostOnCompleteFailure, dumpObj(e));
                }
            }

            function _onBeaconRetry(payload: IPayloadData, onComplete: OnCompleteCallback, canSend:(payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => boolean) {
                // Custom headers not supported in sendBeacon payload.headers would be ignored
                let internalPayloadData = payload as IInternalPayloadData;
                let status = 200;
                let thePayload = internalPayloadData._thePayload;
                let theUrl = payload.urlString + (_addNoResponse ? _noResponseQs : STR_EMPTY);

                try {
                    let nav = getNavigator();
                 
                    if (thePayload) {
                        let persistStorage = !!_core.getPlugin("LocalStorage");
                        // Failed to send entire payload so try and split data and try to send as much events as possible
                        let droppedBatches: EventBatch[] = [];
                        let sentBatches: EventBatch[] = [];
                        arrForEach(thePayload.batches, (theBatch) => {
                            if (droppedBatches && theBatch && theBatch.count() > 0) {
                                let theEvents = theBatch.events();
                                for (let lp = 0; lp < theEvents.length; lp++) {
                                    if (!nav.sendBeacon(theUrl, _serializer.getEventBlob(theEvents[lp]))) {
                                        // Can't send anymore, so split the batch and drop the rest
                                        droppedBatches.push(theBatch.split(lp));
                                        break;
                                    } else {
                                        sentBatches.push(theBatch[lp]);
                                    }
                                }
                            } else {
                                // Remove all of the events from the existing batch in the payload as the copy includes the original
                                droppedBatches.push(theBatch.split(0));
                            }
                        });

                        if (sentBatches.length > 0) {
                            // Update the payload with the sent batches
                            thePayload.sentEvts = sentBatches;
                        }
                        
                        if (!persistStorage) {
                            _sendBatchesNotification(droppedBatches, EventBatchNotificationReason.SizeLimitExceeded, thePayload.sendType, true);
                        }
                    } else {
                        status = 0;
                    }
                  

                } catch (ex) {
                    _warnToConsole(_logger, "Failed to send telemetry using sendBeacon API. Ex:" + dumpObj(ex));
                    status = 0;
                } finally {
                    _doOnComplete(onComplete, status, {}, STR_EMPTY);
                }

            }


            function _isBeaconPayload(sendType: EventSendType) {
                // Sync Fetch has the same payload limitation as sendBeacon -- 64kb limit, so treat both as a beacon send
                return sendType === EventSendType.SendBeacon || sendType === EventSendType.SyncFetch;
            }

            function _adjustSendType(sendType: EventSendType) {
                if (_isUnloading && _isBeaconPayload(sendType)) {
                    sendType = EventSendType.SendBeacon;
                }

                return sendType;
            }

            _self.addHeader = (name: string, value: string) => {
                _headers[name] = value;
            };

            _self.removeHeader = (name: string) => {
                delete _headers[name];
            };

            _self.canSendRequest = () => {
                return _hasIdleConnection() && _clockSkewManager.allowRequestSending();
            };

            _self.sendQueuedRequests = (sendType?: EventSendType, sendReason?: SendRequestReason) => {
                if (isUndefined(sendType)) {
                    sendType = EventSendType.Batched;
                }

                if (_isUnloading) {
                    sendType = _adjustSendType(sendType);
                    sendReason = SendRequestReason.Unload;
                }

                if (_canSendPayload(_batchQueue, sendType, 0)) {
                    _sendBatches(_clearQueue(), 0, false, sendType, sendReason || SendRequestReason.Undefined);
                }
            };

            _self.isCompletelyIdle = (): boolean => {
                return !_paused && _outstandingRequests === 0 && _batchQueue.length === 0;
            };

            _self.setUnloading = (value: boolean): void => {
                _isUnloading = value;
            };

            _self.addBatch = (theBatch: EventBatch) => {
                if (theBatch && theBatch.count() > 0) {
                    // Try and kill the event faster
                    if (_killSwitch.isTenantKilled(theBatch.iKey())) {
                        return false;
                    }

                    _batchQueue.push(theBatch);
                }

                return true;
            };

            /**
             * Queue all the remaining requests to be sent. The requests will be
             * sent using HTML5 Beacons if they are available.
             */
            _self.teardown = () => {
                if (_batchQueue.length > 0) {
                    _sendBatches(_clearQueue(), 0, true, EventSendType.SendBeacon, SendRequestReason.Unload);
                }

                arrForEach(_unloadHooks, (hook) => {
                    hook && hook.rm && hook.rm();
                });
                _unloadHooks = [];
            };

            /**
             * Pause the sending of requests. No new requests will be sent.
             */
            _self.pause = () => {
                _paused = true;
            };

            /**
             * Resume the sending of requests.
             */
            _self.resume = () => {
                _paused = false;
                _self.sendQueuedRequests(EventSendType.Batched, SendRequestReason.Resumed);
            };

            /**
             * Sends a request synchronously to the Aria collector. This api is used to send
             * a request containing a single immediate event.
             *
             * @param batch - The request to be sent.
             * @param sendReason   - The token used to send the request.
             */
            _self.sendSynchronousBatch = (batch: EventBatch, sendType?: EventSendType, sendReason?: SendRequestReason) => {
                // This will not take into account the max connections restriction. Since this is sync, we can
                // only send one of this request at a time and thus should not worry about multiple connections
                // being used to send synchronous events.
                // Increment active connection since we are still going to use a connection to send the request.
                if (batch && batch.count() > 0) {
                    if (isNullOrUndefined(sendType)) {
                        sendType = EventSendType.Synchronous;
                    }

                    if (_isUnloading) {
                        sendType = _adjustSendType(sendType);
                        sendReason = SendRequestReason.Unload;
                    }

                    // For sync requests we will not wait for the clock skew.
                    _sendBatches([batch], 0, false, sendType, sendReason || SendRequestReason.Undefined);
                }
            };

            function _hasIdleConnection(): boolean {
                return !_paused && _outstandingRequests < maxConnections;
            }

            function _clearQueue() {
                let theQueue = _batchQueue;
                _batchQueue = [];
                return theQueue;
            }

            function _canSendPayload(theBatches: EventBatch[], sendType: EventSendType, retryCnt: number) {
                let result = false;
                if (theBatches && theBatches.length > 0 && !_paused && _sendInterfaces[sendType] && _serializer) {
                    // Always attempt to send synchronous events don't wait for idle or clockSkew
                    // and don't block retry requests if clockSkew is not yet set
                    result = (sendType !== EventSendType.Batched) || (_hasIdleConnection() && (retryCnt > 0 || _clockSkewManager.allowRequestSending()));
                }

                return result;
            }

            function _createDebugBatches(theBatches: EventBatch[]) {
                let values = {};

                if (theBatches) {
                    arrForEach(theBatches, (theBatch, idx) => {
                        values[idx] = {
                            iKey: theBatch.iKey(),
                            evts: theBatch.events()
                        };
                    });
                }

                return values;
            }

            function _sendBatches(theBatches: EventBatch[], retryCount: number, isTeardown: boolean, sendType: EventSendType, sendReason: SendRequestReason) {
                if (!theBatches || theBatches.length === 0) {
                    // Nothing to do
                    return;
                }

                if (_paused) {
                    _sendBatchesNotification(theBatches, EventBatchNotificationReason.Paused, sendType);
                    return;
                }

                // Make sure that if we are unloading the sendType is a supported version
                sendType = _adjustSendType(sendType);

                try {
                    let orgBatches = theBatches;
                    let isSynchronous = sendType !== EventSendType.Batched;
                    doPerf(_core, () => "HttpManager:_sendBatches", (perfEvt?: IPerfEvent) => {
                        if (perfEvt) {
                            // Perf Monitoring is enabled, so create a "Quick" copy of the original batches so we still report
                            // the original values as part of the perfEvent. This is because theBatches uses .shift() to remove each
                            // batch as they are processed - removing from the original array, so by the time the _createDebugBatches()
                            // function is called the passed in value has changed and therefore the reported value for the perfEvent is incorrect
                            theBatches = theBatches.slice(0);
                        }

                        let droppedBatches: EventBatch[] = [];
                        let thePayload: ISerializedPayload = null;
                        let serializationStart = getTime();
                        let sendInterface = _sendInterfaces[sendType] || (isSynchronous ? _sendInterfaces[EventSendType.Synchronous] : _sendInterfaces[EventSendType.Batched]);
                        let sendTransport = sendInterface && sendInterface._transport;

                        // Sync Fetch has the same payload limitation as sendBeacon -- 64kb limit
                        let isReducedPayload = _canHaveReducedPayload && (_isUnloading || _isBeaconPayload(sendType) || (sendTransport === TransportType.Beacon || (sendInterface._isSync && sendTransport === TransportType.Fetch)));

                        while (_canSendPayload(theBatches, sendType, retryCount)) {
                            let theBatch = theBatches.shift();
                            if (theBatch && theBatch.count() > 0) {
                                if (!_killSwitch.isTenantKilled(theBatch.iKey())) {

                                    // Make sure we have a payload object
                                    thePayload = thePayload || _serializer.createPayload(retryCount, isTeardown, isSynchronous, isReducedPayload, sendReason, sendType);

                                    // Add the batch to the current payload
                                    if (!_serializer.appendPayload(thePayload, theBatch, maxEventsPerBatch)) {
                                        // Entire batch was not added so send the payload and retry adding this batch
                                        _doPayloadSend(thePayload, serializationStart, getTime(), sendReason);
                                        serializationStart = getTime();
                                        theBatches = [theBatch].concat(theBatches);
                                        thePayload = null;
                                    } else if (thePayload.overflow !== null) {
                                        // Total Payload size was exceeded so send the payload and add the unsent as the next batch to send
                                        theBatches = [thePayload.overflow].concat(theBatches);
                                        thePayload.overflow = null;
                                        _doPayloadSend(thePayload, serializationStart, getTime(), sendReason);
                                        serializationStart = getTime();
                                        thePayload = null;
                                    }
                                } else {
                                    droppedBatches.push(theBatch);
                                }
                            }
                        }

                        // Make sure to flush any remaining payload
                        if (thePayload) {
                            _doPayloadSend(thePayload, serializationStart, getTime(), sendReason);
                        }

                        if (theBatches.length > 0) {
                            // Add any unsent batches back to the head of the queue
                            _batchQueue = theBatches.concat(_batchQueue);
                        }

                        // Now send notification about any dropped events
                        _sendBatchesNotification(droppedBatches, EventBatchNotificationReason.KillSwitch, sendType);
                    }, () => ({ batches: _createDebugBatches(orgBatches), retryCount, isTeardown, isSynchronous, sendReason, useSendBeacon: _isBeaconPayload(sendType), sendType }), !isSynchronous);
                } catch (ex) {
                    _throwInternal(_logger,
                        eLoggingSeverity.WARNING,
                        _eInternalMessageId.CannotSerializeObject, "Unexpected Exception sending batch: " + dumpObj(ex));
                }
            }

            function _buildRequestDetails(thePayload: ISerializedPayload, useHeaders: boolean): IRequestUrlDetails {
                let requestDetails: IRequestUrlDetails = {
                    url: _urlString,
                    hdrs: {},
                    useHdrs: false          // Assume no headers
                };

                if (!useHeaders) {
                    // Attempt to map headers to a query string if possible
                    objForEachKey(_headers, (name, value) => {
                        if (_collectorHeaderToQs[name]) {
                            _addRequestDetails(requestDetails, _collectorHeaderToQs[name], value, false);
                        } else {
                            // No mapping, so just include in the headers anyway (may not get sent if using sendBeacon())
                            requestDetails.hdrs[name] = value;
                            requestDetails.useHdrs = true;
                        }
                    });
                } else {
                    // Copy the pre-defined headers into the payload headers
                    requestDetails.hdrs = extend(requestDetails.hdrs, _headers);
                    requestDetails.useHdrs = (objKeys(requestDetails.hdrs).length > 0);
                }

                _addRequestDetails(requestDetails, STR_CLIENT_ID, "NO_AUTH", useHeaders);
                _addRequestDetails(requestDetails, STR_CLIENT_VERSION, FullVersionString, useHeaders);

                let apiQsKeys = STR_EMPTY;
                arrForEach(thePayload.apiKeys, (apiKey) => {
                    if (apiQsKeys.length > 0) {
                        apiQsKeys += ",";
                    }

                    apiQsKeys += apiKey;
                });

                _addRequestDetails(requestDetails, STR_API_KEY, apiQsKeys, useHeaders);
                _addRequestDetails(requestDetails, STR_UPLOAD_TIME, dateNow().toString(), useHeaders);

                let msfpc = _getMsfpc(thePayload);
                if (isValueAssigned(msfpc)) {
                    requestDetails.url += "&ext.intweb.msfpc=" + msfpc;
                }

                if (_clockSkewManager.shouldAddClockSkewHeaders()) {
                    _addRequestDetails(requestDetails, STR_TIME_DELTA_TO_APPLY, _clockSkewManager.getClockSkewHeaderValue(), useHeaders);
                }

                if (_core.getWParam) {
                    let wParam = _core.getWParam();
                    if (wParam >= 0) {
                        requestDetails.url += "&w=" + wParam;
                    }
                }

                for (let i = 0; i < _queryStringParameters.length; i++) {
                    requestDetails.url += "&" + _queryStringParameters[i].name + "=" + _queryStringParameters[i].value;
                }

                return requestDetails;
            }

            function _setTimingValue(timings: any, name: string, value: number) {
                timings[name] = timings[name] || {};
                timings[name][_postManager.identifier] = value;
            }

            function _doPayloadSend(thePayload: ISerializedPayload, serializationStart: number, serializationCompleted: number, sendReason: SendRequestReason) {

                if (thePayload && thePayload.payloadBlob && thePayload.payloadBlob.length > 0) {
                    let useSendHook = !!_sendHook;
                    let sendInterface = _sendInterfaces[thePayload.sendType];

                    // Send all data using a beacon style transport if closing mode is on or channel was teared down
                    if (!_isBeaconPayload(thePayload.sendType) && thePayload.isBeacon && thePayload.sendReason === SendRequestReason.Unload) {
                        sendInterface = _sendInterfaces[EventSendType.SendBeacon] || _sendInterfaces[EventSendType.SyncFetch] || sendInterface;
                    }

                    let useHeaders = _useHeaders;

                    // Disable header usage if we know we are using sendBeacon as additional headers are not supported
                    if (thePayload.isBeacon || sendInterface._transport === TransportType.Beacon) {
                        useHeaders = false;
                    }

                    let requestDetails = _buildRequestDetails(thePayload, useHeaders);
                    useHeaders = useHeaders || requestDetails.useHdrs;

                    let sendEventStart = getTime();

                    doPerf(_core, () => "HttpManager:_doPayloadSend", () => {
                        // Increment the send attempt count and add timings after packaging (So it's not serialized in the 1st attempt)
                        for (let batchLp = 0; batchLp < thePayload.batches.length; batchLp++) {
                            let theBatch = thePayload.batches[batchLp];
                            let theEvents: IPostTransmissionTelemetryItem[] = theBatch.events();
                            for (let evtLp = 0; evtLp < theEvents.length; evtLp++) {
                                let telemetryItem: IPostTransmissionTelemetryItem = theEvents[evtLp];
                                if (_enableEventTimings) {
                                    let timings = telemetryItem.timings = telemetryItem.timings || {};
                                    _setTimingValue(timings, "sendEventStart", sendEventStart);
                                    _setTimingValue(timings, "serializationStart", serializationStart);
                                    _setTimingValue(timings, "serializationCompleted", serializationCompleted);
                                }

                                telemetryItem[strSendAttempt] > 0 ? telemetryItem[strSendAttempt]++ : telemetryItem[strSendAttempt] = 1;
                            }
                        }

                        // Note: always sending this notification in a synchronous manner.
                        _sendBatchesNotification(
                            thePayload.batches,
                            (EventBatchNotificationReason.SendingUndefined + (sendReason || SendRequestReason.Undefined)),
                            thePayload.sendType,
                            true);

                        // Disabling the use of const because of Issue:
                        // - Task 9227844: [1DS] Some environments and packagers automatically "freeze" objects which are defined as const which causes any mutations to throw
                        // eslint-disable-next-line prefer-const
                        let orgPayloadData: IInternalPayloadData = {
                            data: thePayload.payloadBlob,
                            urlString: requestDetails.url,
                            headers: requestDetails.hdrs,
                            _thePayload: thePayload,
                            _sendReason: sendReason,
                            timeout: _xhrTimeout,
                            disableXhrSync: _disableXhrSync,
                            disableFetchKeepAlive: _disableFetchKeepAlive
                        };

                        // Only automatically add the following headers if already sending headers and we are not attempting to avoid an options call
                        if (useHeaders) {
                            if (!_hasHeader(orgPayloadData.headers, STR_CACHE_CONTROL)) {
                                orgPayloadData.headers[STR_CACHE_CONTROL] = DEFAULT_CACHE_CONTROL;
                            }
    
                            if (!_hasHeader(orgPayloadData.headers, STR_CONTENT_TYPE_HEADER)) {
                                orgPayloadData.headers[STR_CONTENT_TYPE_HEADER] = DEFAULT_CONTENT_TYPE;
                            }
                        }

                        let sender: (payload: IPayloadData) => void = null;

                        if (sendInterface) {
                            // Send sync requests if the request is immediate or we are tearing down telemetry.
                            sender = (payload: IPayloadData) => {
                                // Notify the clock skew manager that we are sending the first request (Potentially blocking all further requests)
                                _clockSkewManager.firstRequestSent();

                                let onComplete = (status, headers) => {
                                    _retryRequestIfNeeded(status, headers, thePayload, sendReason);
                                };

                                let isSync = thePayload.isTeardown || thePayload.isSync;
                                try {
                                    sendInterface.sendPOST(payload, onComplete, isSync);
                                    if (_sendListener) {
                                        // Send the original payload to the listener
                                        _sendListener(orgPayloadData, payload, isSync, thePayload.isBeacon);
                                    }
                                } catch (ex) {
                                    _warnToConsole(_logger, "Unexpected exception sending payload. Ex:" + dumpObj(ex));

                                    _doOnComplete(onComplete, 0, {});
                                }
                            };
                        }

                        doPerf(_core, () => "HttpManager:_doPayloadSend.sender", () => {
                            if (sender) {
                                if (thePayload.sendType === EventSendType.Batched) {
                                    _outstandingRequests ++;
                                }

                                // Only call the hook if it's defined and we are not using sendBeacon as additional headers are not supported
                                if (useSendHook && !thePayload.isBeacon && sendInterface._transport !== TransportType.Beacon) {
                                    // Create a new IPayloadData that is sent into the hook method, so that the hook method
                                    // can't change the object references to the orgPayloadData (it can still change the content -- mainly the headers)

                                    // Disabling the use of const because of Issue:
                                    // - Task 9227844: [1DS] Some environments and packagers automatically "freeze" objects which are defined as const which causes any mutations to throw
                                    // eslint-disable-next-line prefer-const
                                    let hookData: IPayloadData = {
                                        data: orgPayloadData.data,
                                        urlString: orgPayloadData.urlString,
                                        headers: extend({}, orgPayloadData.headers),
                                        timeout: orgPayloadData.timeout,
                                        disableXhrSync: orgPayloadData.disableXhrSync,
                                        disableFetchKeepAlive: orgPayloadData.disableFetchKeepAlive
                                    };

                                    let senderCalled = false;
                                    doPerf(_core, () => "HttpManager:_doPayloadSend.sendHook", () => {
                                        try {
                                            _sendHook(
                                                hookData,
                                                (payload: IInternalPayloadData) => {
                                                    senderCalled = true;
                                                    // Add back the internal properties
                                                    if (!_customHttpInterface && !payload._thePayload) {
                                                        payload._thePayload = payload._thePayload || orgPayloadData._thePayload;
                                                        payload._sendReason = payload._sendReason || orgPayloadData._sendReason;
                                                    }

                                                    sender(payload);
                                                },
                                                thePayload.isSync || thePayload.isTeardown);
                                        } catch (ex) {
                                            if (!senderCalled) {
                                                // The hook never called the sender -- assume that it never will
                                                sender(orgPayloadData);
                                            }
                                        }
                                    });
                                } else {
                                    sender(orgPayloadData);
                                }
                            }
                        });

                    }, () => ({ thePayload, serializationStart, serializationCompleted, sendReason }), thePayload.isSync);
                }

                if (thePayload.sizeExceed && thePayload.sizeExceed.length > 0) {
                    // Ensure that we send any discard events for oversize events even when there was no payload to send
                    _sendBatchesNotification(thePayload.sizeExceed, EventBatchNotificationReason.SizeLimitExceeded, thePayload.sendType);
                }

                if (thePayload.failedEvts && thePayload.failedEvts.length > 0) {
                    // Ensure that we send any discard events for events that could not be serialized even when there was no payload to send
                    _sendBatchesNotification(thePayload.failedEvts, EventBatchNotificationReason.InvalidEvent, thePayload.sendType);
                }
            }

            function _addEventCompletedTimings(theEvents: IPostTransmissionTelemetryItem[], sendEventCompleted: number) {
                if (_enableEventTimings) {
                    arrForEach(theEvents, (theEvent) => {
                        let timings = theEvent.timings = theEvent.timings || {};
                        _setTimingValue(timings, "sendEventCompleted", sendEventCompleted);
                    });
                }
            }

            function _retryRequestIfNeeded(status: number, headers: { [headerName: string]: string }, thePayload: ISerializedPayload, sendReason: SendRequestReason) {
                let reason: EventBatchNotificationReason = EventBatchNotificationReason.ResponseFailure;
                let droppedBatches: EventBatch[] = null;
                let isRetrying = false;
                let backOffTrans = false;

                try {
                    let shouldRetry = true;

                    if (typeof status !== strUndefined) {
                        if (headers) {
                            _clockSkewManager.setClockSkew(headers[STR_TIME_DELTA_HEADER]);
                            let killDuration = headers[STR_KILL_DURATION_HEADER] || headers["kill-duration-seconds"];
                            arrForEach(_killSwitch.setKillSwitchTenants(headers[STR_KILL_TOKENS_HEADER], killDuration), (killToken) => {
                                arrForEach(thePayload.batches, (theBatch) => {
                                    if (theBatch.iKey() === killToken) {
                                        // Make sure we have initialized the array
                                        droppedBatches = droppedBatches || [];

                                        // Create a copy of the batch with all of the events (and more importantly the action functions)
                                        let removedEvents = theBatch.split(0);
                                        // And then remove the events for the payload batch and reduce the actual number of processed
                                        thePayload.numEvents -= removedEvents.count();
                                        droppedBatches.push(removedEvents);
                                    }
                                });
                            });
                        }

                        // Disabling triple-equals rule to avoid httpOverrides from failing because they are returning a string value
                        // tslint:disable-next-line:triple-equals
                        if (status == 200 || status == 204) {
                            // Response was successfully sent
                            reason = EventBatchNotificationReason.Complete;
                            return;
                        }

                        if (!retryPolicyShouldRetryForStatus(status) || thePayload.numEvents <= 0) {
                            // Only retry for specific response codes and if there is still events after kill switch processing
                            shouldRetry = false;
                        }

                        // Derive the notification response from the HttpStatus Code
                        reason = EventBatchNotificationReason.ResponseFailure + (status % 1000);
                    }

                    if (shouldRetry) {
                        // The events should be retried -- so change notification to requeue them
                        reason = EventBatchNotificationReason.RequeueEvents;
                        let retryCount = thePayload.retryCnt;
                        if (thePayload.sendType === EventSendType.Batched) {
                            // attempt to resend the entire batch
                            if (retryCount < maxRequestRetriesBeforeBackoff) {
                                isRetrying = true;
                                _doAction(() => {
                                    // try to resend the same batches
                                    if (thePayload.sendType === EventSendType.Batched) {
                                        // Reduce the outstanding request count (if this was an async request) as we didn't reduce the count
                                        // previously and we are about to reschedule our retry attempt and we want an attempt to send
                                        // to occur, it's also required to ensure that a follow up handleRequestFinished() call occurs
                                        _outstandingRequests--;
                                    }

                                    _sendBatches(thePayload.batches, retryCount + 1, thePayload.isTeardown, _isUnloading ? EventSendType.SendBeacon : thePayload.sendType, SendRequestReason.Retry);
                                }, _isUnloading, retryPolicyGetMillisToBackoffForRetry(retryCount));
                            } else {
                                backOffTrans = true;
                                if (_isUnloading) {
                                    // we are unloading so don't try and requeue the events otherwise let the events get requeued and resent during the backoff sending
                                    // This will also cause the events to be purged based on the priority (if necessary)
                                    reason = EventBatchNotificationReason.NonRetryableStatus;
                                }
                            }
                        }
                    }

                } finally {
                    if (!isRetrying) {
                        // Make sure the clockSkewManager doesn't blocking further sending of requests once we have a proper response
                        // This won't override any previously sent clock Skew value
                        _clockSkewManager.setClockSkew();

                        _handleRequestFinished(thePayload, reason, sendReason, backOffTrans);
                    }

                    _sendBatchesNotification(droppedBatches, EventBatchNotificationReason.KillSwitch, thePayload.sendType);
                }
            }

            function _handleRequestFinished(
                thePayload: ISerializedPayload,
                batchReason: EventBatchNotificationReason,
                sendReason: SendRequestReason,
                backOffTrans: boolean) {

                try {
                    if (backOffTrans) {
                        // Slow down the transmission requests
                        _postManager._backOffTransmission();
                    }

                    let theBatches = thePayload.batches;
                    if (batchReason === EventBatchNotificationReason.Complete) {
                        theBatches = thePayload.sentEvts || thePayload.batches;
                        if (!backOffTrans && !thePayload.isSync) {
                            // We have a successful async response, so the lets open the floodgates
                            // The reason for checking isSync is to avoid unblocking if beacon send occurred as it
                            // doesn't wait for a response.
                            _postManager._clearBackOff();
                        }

                        _addCompleteTimings(theBatches);
                    }

                    // Send the notifications synchronously
                    _sendBatchesNotification(theBatches, batchReason, thePayload.sendType, true);

                } finally {
                    if (thePayload.sendType === EventSendType.Batched) {
                        // we always need to decrement this value otherwise the httpmanager locks up and won't send any more events
                        _outstandingRequests--;

                        // Don't try to send additional queued events if this is a retry operation as the retried
                        // response will eventually call _handleRequestFinished for the retried event
                        if (sendReason !== SendRequestReason.Retry) {
                            // Try and send any other queued batched events
                            _self.sendQueuedRequests(thePayload.sendType, sendReason);
                        }
                    }
                }
            }

            function _addCompleteTimings(theBatches: EventBatch[]) {
                if (_enableEventTimings) {
                    let sendEventCompleted = getTime();
                    arrForEach(theBatches, (theBatch) => {
                        if (theBatch && theBatch.count() > 0) {
                            _addEventCompletedTimings(theBatch.events(), sendEventCompleted);
                        }
                    });
                }
            }

            function _doAction(cb: VoidFunction, isSync: boolean, interval: number) {
                if (isSync) {
                    cb();
                } else {
                    _timeoutWrapper.set(cb, interval);
                }
            }


            function _getMsfpc(thePayload: ISerializedPayload): string {
                for (let lp = 0; lp < thePayload.batches.length; lp++) {
                    let msfpc = thePayload.batches[lp].Msfpc();
                    if (msfpc) {
                        return encodeURIComponent(msfpc);
                    }
                }

                return STR_EMPTY;
            }

            function _handleCollectorResponse(responseText: string): void {
                let responseHandlers = _responseHandlers;
                try {
                    for (let i = 0; i < responseHandlers.length; i++) {
                        try {
                            responseHandlers[i](responseText);
                        } catch (e) {
                            _throwInternal(_logger,
                                eLoggingSeverity.CRITICAL,
                                _eExtendedInternalMessageId.PostResponseHandler,
                                "Response handler failed: " + e);
                        }
                    }
                    if (responseText) {
                        let response = JSON.parse(responseText) as ICollectorResult;
                        if (isValueAssigned(response.webResult) && isValueAssigned(response.webResult[STR_MSFPC])) {
                            // Set cookie
                            _cookieMgr.set("MSFPC", response.webResult[STR_MSFPC], 365 * 86400);
                        }
                    }
                } catch (ex) {
                    // Doing nothing
                }
            }

            function _sendBatchesNotification(theBatches: EventBatch[], batchReason: EventBatchNotificationReason, sendType: EventSendType, sendSync?: boolean) {
                if (theBatches && theBatches.length > 0 && actions) {
                    let theAction: BatchNotificationAction = actions[_getNotificationAction(batchReason)];
                    if (theAction) {
                        let isSyncRequest = sendType !== EventSendType.Batched;

                        doPerf(_core, () => "HttpManager:_sendBatchesNotification", () => {
                            _doAction(() => {
                                try {
                                    theAction.call(actions, theBatches, batchReason, isSyncRequest, sendType);
                                } catch (e) {
                                    _throwInternal(_logger,
                                        eLoggingSeverity.CRITICAL,
                                        _eInternalMessageId.NotificationException,
                                        "send request notification failed: " + e);
                                }
                            }, sendSync || isSyncRequest, 0);
                        }, () => ({ batches: _createDebugBatches(theBatches), reason: batchReason, isSync: isSyncRequest, sendSync: sendSync, sendType: sendType }), !isSyncRequest);
                    }
                }
            }

            function _getNotificationAction(reason: EventBatchNotificationReason): string {
                let action = _eventActionMap[reason];
                if (!isValueAssigned(action)) {
                    action = STR_OTHER;
                    if (reason >= EventBatchNotificationReason.ResponseFailure && reason <= EventBatchNotificationReason.ResponseFailureMax) {
                        action = STR_RESPONSE_FAIL;
                    } else if (reason >= EventBatchNotificationReason.EventsDropped && reason <= EventBatchNotificationReason.EventsDroppedMax) {
                        action = STR_DROPPED;
                    } else if (reason >= EventBatchNotificationReason.SendingUndefined && reason <= EventBatchNotificationReason.SendingEventMax) {
                        action = STR_SENDING;
                    }
                }

                return action;
            }
        });
    }

    /**
     * @constructor
     * @param requestQueue   - The queue that contains the requests to be sent.
     * @param postManager   - The post manager that we should add requests back to if needed.
     */
    public initialize(coreConfig: IExtendedConfiguration, core: IAppInsightsCore, postChannel: IPostChannel) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add header to request
     * @param name   - Header name.
     * @param value  - Header value.
     */
    public addHeader(name: string, value: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
         * Remove header to request
         * @param name   - Header name.
         * @param value  - Header value.
         */
    public removeHeader(name: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }
    
    /**
    * Add handler to be executed with request response text.
    */
    public addResponseHandler(responseHandler: (responseText: string) => void) : IUnloadHook {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add the batch of events to the queue for sending
     * @param batch The batch with the events to send
     * @returns True if the http manager has accepted the batch (including if the batch is empty) otherwise false
     */
    public addBatch(batch: EventBatch): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Check if there is an idle connection and we can send a request.
     * @returns True if there is an idle connection, false otherwise.
     */
    public canSendRequest(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Send requests in the request queue up if there is an idle connection, sending is
     * not pause and clock skew manager allows sending request.
     * @param sendType - Identifies how the batched events should be send, defaults to Batched
     * @param sendReason   - The reason the batch is being sent
     */
    public sendQueuedRequests(sendType?: EventSendType, sendReason?: SendRequestReason) {
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
     * Inform the HttpManager that a page unload event was received
     */
    public setUnloading(value: boolean): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Queue all the remaining requests to be sent. The requests will be
     * sent using HTML5 Beacons if they are available.
     */
    public teardown() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Pause the sending of requests. No new requests will be sent.
     */
    public pause() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resume the sending of requests.
     */
    public resume() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Sends the batches synchronously to the collector. This api is used to send a batches immediate event.
     *
     * @param batch - The batch of events to be sent.
     * @param sendReason   - The reason the batch is being sent
     * @param sendType - Identifies the sending type to use when sending the batch
     */
    public sendSynchronousBatch(batch: EventBatch, sendType?: EventSendType, sendReason?: SendRequestReason) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    
    /**
     * Get Offline Serializer support
     * @returns internal Offline Serializer object
     */
    public serializeOfflineEvt(evt: ITelemetryItem | IPostTransmissionTelemetryItem): string {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get Offline request details
     * @returnsrequest details
     */
    public getOfflineRequestDetails(): IRequestUrlDetails {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Create payload data
     * @param evts telemetry events
     * @returns payload
     */
    public createOneDSPayload(evts?: ITelemetryItem[], optimize?: boolean): IPayloadData {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }
}
