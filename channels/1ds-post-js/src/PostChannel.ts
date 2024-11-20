/**
* PostManager.ts
* @author Abhilash Panwar (abpanwar); Hector Hernandez (hectorh); Nev Wylie (newylie)
* @copyright Microsoft 2018-2020
*/
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, EventLatencyValue, EventSendType, EventsDiscardedReason, IAppInsightsCore, IChannelControls, IConfigDefaults,
    IExtendedConfiguration, IInternalOfflineSupport, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryItem,
    ITelemetryUnloadState, IUnloadHook, NotificationManager, SendRequestReason, _eInternalMessageId, _throwInternal,
    addPageHideEventListener, addPageShowEventListener, addPageUnloadEventListener, arrForEach, createProcessTelemetryContext,
    createUniqueNamespace, doPerf, eLoggingSeverity, getWindow, isChromium, isGreaterThanZero, isNumber, mergeEvtNamespace, objForEachKey,
    onConfigChange, optimizeObject, proxyFunctions, removePageHideEventListener, removePageShowEventListener, removePageUnloadEventListener,
    setProcessTelemetryTimings
} from "@microsoft/1ds-core-js";
import { IPromise, createPromise } from "@nevware21/ts-async";
import { ITimerHandler, isPromiseLike, objDeepFreeze } from "@nevware21/ts-utils";
import {
    BE_PROFILE, EventBatchNotificationReason, IChannelConfiguration, IPostChannel, IPostTransmissionTelemetryItem, NRT_PROFILE, RT_PROFILE
} from "./DataModels";
import { EventBatch } from "./EventBatch";
import { HttpManager } from "./HttpManager";
import { STR_AUTH_WEB_TOKEN, STR_MSA_DEVICE_TICKET, STR_TRACE, STR_USER } from "./InternalConstants";
import { retryPolicyGetMillisToBackoffForRetry } from "./RetryPolicy";
import { ITimeoutOverrideWrapper, createTimeoutWrapper } from "./TimeoutOverrideWrapper";

const FlushCheckTimer = 0.250;          // This needs to be in seconds, so this is 250ms
const MaxNumberEventPerBatch = 500;
const EventsDroppedAtOneTime = 20;
const MaxSendAttempts = 6;
const MaxSyncUnloadSendAttempts = 2;        // Assuming 2 based on beforeunload and unload
const MaxBackoffCount = 4;
const MaxConnections = 2;
const MaxRequestRetriesBeforeBackoff = 1;
const MaxEventsLimitInMem = 10000;

const strEventsDiscarded = "eventsDiscarded";
const EMPTY_STR = "";

let undefValue = undefined;

interface IPostChannelBatchQueue {
    /**
     * This is the actual queue of event batches
     */
    batches: EventBatch[];

    /**
     * This is just a lookup map using the iKey to link to the batch in the batches queue
     */
    iKeyMap: { [iKey: string]: EventBatch };
}

/**
 * The default settings for the config.
 * WE MUST include all defaults here to ensure that the config is created with all of the properties
 * defined as dynamic.
 */
const defaultPostChannelConfig: IConfigDefaults<IChannelConfiguration> = objDeepFreeze({
    eventsLimitInMem: { isVal: isGreaterThanZero, v: MaxEventsLimitInMem },
    immediateEventLimit: { isVal: isGreaterThanZero, v: 500 },
    autoFlushEventsLimit: { isVal: isGreaterThanZero, v: 0 },
    disableAutoBatchFlushLimit: false,
    httpXHROverride: { isVal: isOverrideFn, v: undefValue },
    overrideInstrumentationKey: undefValue,
    overrideEndpointUrl: undefValue,
    disableTelemetry: false,
    ignoreMc1Ms0CookieProcessing: false,
    setTimeoutOverride: undefValue,
    clearTimeoutOverride: undefValue,
    payloadPreprocessor: undefValue,
    payloadListener: undefValue,
    disableEventTimings: undefValue,
    valueSanitizer: undefValue,
    stringifyObjects: undefValue,
    enableCompoundKey: undefValue,
    disableOptimizeObj: false,
    fetchCredentials: undefValue,
    // disableCacheHeader: undefValue, // See Task #7178858 - Collector requires a change to support this
    transports: undefValue,
    unloadTransports: undefValue,
    useSendBeacon: undefValue,
    disableFetchKeepAlive: undefValue,
    avoidOptions: false,
    xhrTimeout: undefValue,
    disableXhrSync: undefValue,
    alwaysUseXhrOverride: false,
    maxEventRetryAttempts: { isVal: isNumber, v: MaxSendAttempts },
    maxUnloadEventRetryAttempts: { isVal: isNumber, v: MaxSyncUnloadSendAttempts},
    addNoResponse: undefValue,
    excludeCsMetaData: undefValue
});

function isOverrideFn(httpXHROverride: any) {
    return httpXHROverride && httpXHROverride.sendPOST;
}

/**
 * Class that manages adding events to inbound queues and batching of events
 * into requests.
 * @group Classes
 * @group Entrypoint
 */
export class PostChannel extends BaseTelemetryPlugin implements IChannelControls, IPostChannel {

    public identifier = "PostChannel";
    public priority = 1011;
    public version = "#version#";

    constructor() {
        super();

        let _postConfig: IChannelConfiguration;
        let _isTeardownCalled = false;
        let _flushCallbackQueue: Array<() => void> = [];
        let _flushCallbackTimer: ITimerHandler;
        let _paused = false;
        let _immediateQueueSize = 0;
        let _immediateQueueSizeLimit: number;
        let _queueSize = 0;
        let _queueSizeLimit: number;
        let _profiles: { [profileName: string]: number[] } = {};
        let _currentProfile = RT_PROFILE;
        let _scheduledTimer: ITimerHandler;
        let _immediateTimer: ITimerHandler;
        let _currentBackoffCount;
        let _timerCount;
        let _httpManager: HttpManager;
        let _batchQueues: { [eventLatency: number]: IPostChannelBatchQueue };
        let _autoFlushEventsLimit: number | undefined;
        // either MaxBatchSize * (1+ Max Connections) or _queueLimit / 6 (where 3 latency Queues [normal, realtime, cost deferred] * 2 [allow half full -- allow for retry])
        let _autoFlushBatchLimit: number;
        let _delayedBatchSendLatency: number;
        let _delayedBatchReason: SendRequestReason;
        let _optimizeObject: boolean;
        let _isPageUnloadTriggered: boolean;
        let _maxEventSendAttempts: number;
        let _maxUnloadEventSendAttempts: number;
        let _evtNamespace: string | string[];
        let _timeoutWrapper: ITimeoutOverrideWrapper;
        let _ignoreMc1Ms0CookieProcessing: boolean;
        let _disableAutoBatchFlushLimit: boolean;
        let _notificationManager: NotificationManager | undefined;
        let _unloadHandlersAdded: boolean;
        let _overrideInstrumentationKey: string;
        let _disableTelemetry: boolean;

        dynamicProto(PostChannel, this, (_self, _base) => {
            _initDefaults();

            // Special internal method to allow the DebugPlugin to hook embedded objects
            _self["_getDbgPlgTargets"] = () => {
                return [_httpManager, _postConfig];
            };

            _self.initialize = (theConfig: IExtendedConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => {
                doPerf(core, () => "PostChannel:initialize", () => {
                    _base.initialize(theConfig, core, extensions);
                    _notificationManager = core.getNotifyMgr();

                    try {
                        _evtNamespace = mergeEvtNamespace(createUniqueNamespace(_self.identifier), core.evtNamespace && core.evtNamespace());
    
                        _self._addHook(onConfigChange(theConfig, (details) => {
                            let coreConfig = details.cfg;

                            let ctx = createProcessTelemetryContext(null, coreConfig, core);
                            _postConfig = ctx.getExtCfg<IChannelConfiguration>(_self.identifier, defaultPostChannelConfig);
                            _timeoutWrapper = createTimeoutWrapper(_postConfig.setTimeoutOverride, _postConfig.clearTimeoutOverride);
        
                            // Only try and use the optimizeObject() if this appears to be a chromium based browser and it has not been explicitly disabled
                            _optimizeObject = !_postConfig.disableOptimizeObj && isChromium();
                            _ignoreMc1Ms0CookieProcessing = _postConfig.ignoreMc1Ms0CookieProcessing;
                            _hookWParam(core); // _hookWParam uses _ignoreMc1Ms0CookieProcessing

                            _queueSizeLimit = _postConfig.eventsLimitInMem;
                            _immediateQueueSizeLimit = _postConfig.immediateEventLimit;
                            _autoFlushEventsLimit = _postConfig.autoFlushEventsLimit;
                            _maxEventSendAttempts = _postConfig.maxEventRetryAttempts;
                            _maxUnloadEventSendAttempts = _postConfig.maxUnloadEventRetryAttempts;
                            _disableAutoBatchFlushLimit = _postConfig.disableAutoBatchFlushLimit;

                            if (isPromiseLike(coreConfig.endpointUrl)) {
                                _self.pause();
                            } else if (!!_paused) {
                                // if previous url is promise, resume
                                _self.resume();
                            }

                            _setAutoLimits();
 
                            // Override iKey if provided in Post config if provided for during initialization
                            _overrideInstrumentationKey = _postConfig.overrideInstrumentationKey;

                            // DisableTelemetry was defined in the config provided during initialization
                            _disableTelemetry = !!_postConfig.disableTelemetry;
                     
                            if (_unloadHandlersAdded) {
                                _removeUnloadHandlers();
                            }

                            let excludePageUnloadEvents = coreConfig.disablePageUnloadEvents || [];
    
                            // When running in Web browsers try to send all telemetry if page is unloaded
                            _unloadHandlersAdded = addPageUnloadEventListener(_handleUnloadEvents, excludePageUnloadEvents, _evtNamespace);
                            _unloadHandlersAdded = addPageHideEventListener(_handleUnloadEvents, excludePageUnloadEvents, _evtNamespace) || _unloadHandlersAdded;
                            _unloadHandlersAdded = addPageShowEventListener(_handleShowEvents, coreConfig.disablePageShowEvents, _evtNamespace) || _unloadHandlersAdded;
                        }));

                        // only initialize the manager once
                        _httpManager.initialize(theConfig, _self.core, _self);
                    } catch (e) {
                        // resetting the initialized state because of failure
                        _self.setInitialized(false);
                        throw e;
                    }
                }, () => ({ theConfig, core, extensions }));
            };

            _self.processTelemetry = (ev: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void => {
                setProcessTelemetryTimings(ev, _self.identifier);
                itemCtx = itemCtx || _self._getTelCtx(itemCtx);

                var event = ev as IPostTransmissionTelemetryItem;
                if (!_disableTelemetry && !_isTeardownCalled) {
                    // Override iKey if provided in Post config if provided for during initialization
                    if (_overrideInstrumentationKey) {
                        event.iKey = _overrideInstrumentationKey;
                    }

                    _addEventToQueues(event, true);

                    if (_isPageUnloadTriggered) {
                        // Unload event has been received so we need to try and flush new events
                        _releaseAllQueues(EventSendType.SendBeacon, SendRequestReason.Unload);
                    } else {
                        _scheduleTimer();
                    }
                }

                _self.processNext(event, itemCtx);
            };

            _self.getOfflineSupport = () => {
                try {
                    let details = _httpManager && _httpManager.getOfflineRequestDetails();
                    if (_httpManager) {
                        return {
                            getUrl: () => {
                                if (details) {
                                    return details.url

                                }
                                return null;
                            },
                            serialize: _serialize,
                            batch: _batch,
                            shouldProcess: (evt) => {
                                return !_disableTelemetry;
                            },
                            createPayload: (evt) => {
                                return null;
                            },
                            createOneDSPayload: (evts: ITelemetryItem[]) => {
                                if (_httpManager.createOneDSPayload) {
                                    return _httpManager.createOneDSPayload(evts, _optimizeObject);
                                }
                                
                            }
                        } as IInternalOfflineSupport;

                    }
                    
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
               
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _releaseAllQueues(EventSendType.SendBeacon, SendRequestReason.Unload);
                _isTeardownCalled = true;
                _httpManager.teardown();

                _removeUnloadHandlers();

                // Just register to remove all events associated with this namespace
                _initDefaults();
            };

            function _removeUnloadHandlers() {
                removePageUnloadEventListener(null, _evtNamespace);
                removePageHideEventListener(null, _evtNamespace);
                removePageShowEventListener(null, _evtNamespace);
            }
                        
            function _hookWParam(core: IAppInsightsCore) {
                var existingGetWParamMethod = core.getWParam;
                core.getWParam = () => {
                    var wparam = 0;
                    if (_ignoreMc1Ms0CookieProcessing) {
                        wparam = wparam | 2;
                    }
                    return wparam | existingGetWParamMethod.call(core);
                };
            }

            function _batch(arr: string[]) {
                let rlt = EMPTY_STR;
                
                if (arr && arr.length) {
                    arrForEach(arr, (item) => {
                        if (rlt) {
                            rlt += "\n";
                        }
                        rlt += item;

                    });
                }
                return rlt;

            }

            function _serialize(event: ITelemetryItem) {

                let rlt = EMPTY_STR;
                try {
                    _cleanEvent(event);
                    rlt = _httpManager.serializeOfflineEvt(event);

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return rlt;
               
            }

            // Moving event handlers out from the initialize closure so that any local variables can be garbage collected
            function _handleUnloadEvents(evt: any) {
                let theEvt = evt || getWindow().event; // IE 8 does not pass the event
                if (theEvt.type !== "beforeunload") {
                    // Only set the unload trigger if not beforeunload event as beforeunload can be cancelled while the other events can't
                    _isPageUnloadTriggered = true;
                    _httpManager.setUnloading(_isPageUnloadTriggered);
                }

                _releaseAllQueues(EventSendType.SendBeacon, SendRequestReason.Unload);
            }

            function _handleShowEvents(evt: any) {
                // Handle the page becoming visible again
                _isPageUnloadTriggered = false;
                _httpManager.setUnloading(_isPageUnloadTriggered);
            }

            function _cleanEvent(event: ITelemetryItem | IPostTransmissionTelemetryItem) {
                if (event.ext && event.ext[STR_TRACE]) {
                    delete (event.ext[STR_TRACE]);
                }
                if (event.ext && event.ext[STR_USER] && event.ext[STR_USER]["id"]) {
                    delete (event.ext[STR_USER]["id"]);
                }

                // v8 performance optimization for iterating over the keys
                if (_optimizeObject) {
                    event.ext = optimizeObject(event.ext);
                    if (event.baseData) {
                        event.baseData = optimizeObject(event.baseData);
                    }
                    if (event.data) {
                        event.data = optimizeObject(event.data);
                    }
                }

            }

            function _addEventToQueues(event: IPostTransmissionTelemetryItem, append: boolean) {
                // If send attempt field is undefined we should set it to 0.
                if (!event.sendAttempt) {
                    event.sendAttempt = 0;
                }
                // Add default latency
                if (!event.latency) {
                    event.latency = EventLatencyValue.Normal;
                }
                _cleanEvent(event);


                if (event.sync) {
                    // If the transmission is backed off then do not send synchronous events.
                    // We will convert these events to Real time latency instead.
                    if (_currentBackoffCount || _paused) {
                        event.latency = EventLatencyValue.RealTime;
                        event.sync = false;
                    } else {
                        // Log the event synchronously
                        if (_httpManager) {
                            // v8 performance optimization for iterating over the keys
                            if (_optimizeObject) {
                                event = optimizeObject(event);
                            }

                            _httpManager.sendSynchronousBatch(
                                EventBatch.create(event.iKey, [event]),
                                event.sync === true ? EventSendType.Synchronous : event.sync as EventSendType,
                                SendRequestReason.SyncEvent);
                            return;
                        }
                    }
                }

                let evtLatency = event.latency;
                let queueSize = _queueSize;
                let queueLimit = _queueSizeLimit;
                if (evtLatency === EventLatencyValue.Immediate) {
                    queueSize = _immediateQueueSize;
                    queueLimit = _immediateQueueSizeLimit;
                }

                let eventDropped = false;
                // Only add the event if the queue isn't full or it's a direct event (which don't add to the queue sizes)
                if (queueSize < queueLimit) {
                    eventDropped = !_addEventToProperQueue(event, append);
                } else {
                    let dropLatency = EventLatencyValue.Normal;
                    let dropNumber = EventsDroppedAtOneTime;
                    if (evtLatency === EventLatencyValue.Immediate) {
                        // Only drop other immediate events as they are not technically sharing the general queue
                        dropLatency = EventLatencyValue.Immediate;
                        dropNumber = 1;
                    }

                    // Drop old event from lower or equal latency
                    eventDropped = true;
                    if (_dropEventWithLatencyOrLess(event.iKey, event.latency, dropLatency, dropNumber)) {
                        eventDropped = !_addEventToProperQueue(event, append);
                    }
                }

                if (eventDropped) {
                    // Can't drop events from current queues because the all the slots are taken by queues that are being flushed.
                    _notifyEvents(strEventsDiscarded, [event], EventsDiscardedReason.QueueFull);
                }
            }

            _self.setEventQueueLimits = (eventLimit: number, autoFlushLimit?: number) => {
                _postConfig.eventsLimitInMem = _queueSizeLimit = isGreaterThanZero(eventLimit) ? eventLimit : MaxEventsLimitInMem;
                _postConfig.autoFlushEventsLimit = _autoFlushEventsLimit = isGreaterThanZero(autoFlushLimit) ? autoFlushLimit : 0;

                _setAutoLimits();

                // We only do this check here as during normal event addition if the queue is > then events start getting dropped
                let doFlush = _queueSize > eventLimit;

                if (!doFlush && _autoFlushBatchLimit > 0) {
                    // Check the auto flush max batch size
                    for (let latency = EventLatencyValue.Normal; !doFlush && latency <= EventLatencyValue.RealTime; latency++) {
                        let batchQueue: IPostChannelBatchQueue = _batchQueues[latency];
                        if (batchQueue && batchQueue.batches) {
                            arrForEach(batchQueue.batches, (theBatch) => {
                                if (theBatch && theBatch.count() >= _autoFlushBatchLimit) {
                                    // If any 1 batch is > than the limit then trigger an auto flush
                                    doFlush = true;
                                }
                            });
                        }
                    }
                }

                _performAutoFlush(true, doFlush);
            };

            _self.pause = () => {
                _clearScheduledTimer();
                _paused = true;
                _httpManager && _httpManager.pause();
            };

            _self.resume = () => {
                _paused = false;
                _httpManager && _httpManager.resume();
                _scheduleTimer();
            };

            _self._loadTransmitProfiles = (profiles: { [profileName: string]: number[] }) => {
                _resetTransmitProfiles();
                objForEachKey(profiles, (profileName, profileValue) => {
                    let profLen = profileValue.length;
                    if (profLen >= 2) {
                        let directValue = (profLen > 2 ? profileValue[2] : 0);
                        profileValue.splice(0, profLen - 2);
                        // Make sure if a higher latency is set to not send then don't send lower latency
                        if (profileValue[1] < 0) {
                            profileValue[0] = -1;
                        }

                        // Make sure each latency is multiple of the latency higher then it. If not a multiple
                        // we round up so that it becomes a multiple.
                        if (profileValue[1] > 0 && profileValue[0] > 0) {
                            let timerMultiplier = profileValue[0] / profileValue[1];
                            profileValue[0] = Math.ceil(timerMultiplier) * profileValue[1];
                        }

                        // Add back the direct profile timeout
                        if (directValue >= 0 && profileValue[1] >= 0 && directValue > profileValue[1]) {
                            // Make sure if it's not disabled (< 0) then make sure it's not larger than RealTime
                            directValue = profileValue[1];
                        }
                        profileValue.push(directValue);
                        _profiles[profileName] = profileValue;
                    }
                });
            };

            
            _self.flush = (async: boolean = true, callback?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean> => {
                let result: IPromise<boolean>;

                if (!_paused) {

                    sendReason = sendReason || SendRequestReason.ManualFlush;

                    if (async) {

                        if (!callback) {
                            result = createPromise<boolean>((resolve) => {
                                // Set the callback to the promise resolve callback
                                callback = resolve;
                            });
                        }

                        if (_flushCallbackTimer == null) {
                            // Clear the normal schedule timer as we are going to try and flush ASAP
                            _clearScheduledTimer();

                            // Move all queued events to the HttpManager so that we don't discard new events (Auto flush scenario)
                            _queueBatches(EventLatencyValue.Normal, EventSendType.Batched, sendReason);
                            
                            _flushCallbackTimer = _createTimer(() => {
                                _flushCallbackTimer = null;
                                _flushImpl(callback, sendReason);
                            }, 0);
                        } else {
                            // Even if null (no callback) this will ensure after the flushImpl finishes waiting
                            // for a completely idle connection it will attempt to re-flush any queued events on the next cycle
                            _flushCallbackQueue.push(callback);
                        }
                    } else {
                        // Clear the normal schedule timer as we are going to try and flush ASAP
                        let cleared = _clearScheduledTimer();

                        // Now cause all queued events to be sent synchronously
                        _sendEventsForLatencyAndAbove(EventLatencyValue.Normal, EventSendType.Synchronous, sendReason);
                        callback && callback();

                        if (cleared) {
                            // restart the normal event timer if it was cleared
                            _scheduleTimer();
                        }
                    }
                }

                return result;
            };

            _self.setMsaAuthTicket = (ticket: string) => {
                _httpManager.addHeader(STR_MSA_DEVICE_TICKET, ticket);
            };

            _self.setAuthPluginHeader = (token: string) => {
                _httpManager.addHeader(STR_AUTH_WEB_TOKEN, token);
            };

            _self.removeAuthPluginHeader = () => {
                _httpManager.removeHeader(STR_AUTH_WEB_TOKEN);
            };

            _self.hasEvents = _hasEvents;

            _self._setTransmitProfile = (profileName: string) => {
                if (_currentProfile !== profileName && _profiles[profileName] !== undefined) {
                    _clearScheduledTimer();
                    _currentProfile = profileName;
                    _scheduleTimer();
                }
            };

            proxyFunctions(_self, () => _httpManager, [ "addResponseHandler" ]);


            /**
             * Batch and send events currently in the queue for the given latency.
             * @param latency - Latency for which to send events.
             */
            function _sendEventsForLatencyAndAbove(latency: number, sendType: EventSendType, sendReason: SendRequestReason): boolean {
                let queued = _queueBatches(latency, sendType, sendReason);

                // Always trigger the request as while the post channel may not have queued additional events, the httpManager may already have waiting events
                _httpManager.sendQueuedRequests(sendType, sendReason);

                return queued;
            }

            function _hasEvents(): boolean {
                return _queueSize > 0;
            }

            /**
             * Try to schedule the timer after which events will be sent. If there are
             * no events to be sent, or there is already a timer scheduled, or the
             * http manager doesn't have any idle connections this method is no-op.
             */
            function _scheduleTimer() {
                // If we had previously attempted to send requests, but the http manager didn't have any idle connections then the requests where delayed
                // so try and requeue then again now
                if (_delayedBatchSendLatency >= 0 && _queueBatches(_delayedBatchSendLatency, EventSendType.Batched, _delayedBatchReason)) {
                    _httpManager.sendQueuedRequests(EventSendType.Batched, _delayedBatchReason);
                }

                if (_immediateQueueSize > 0 && !_immediateTimer && !_paused) {
                    // During initialization _profiles enforce that the direct [2] is less than real time [1] timer value
                    // If the immediateTimeout is disabled the immediate events will be sent with Real Time events
                    let immediateTimeOut = _profiles[_currentProfile][2];
                    if (immediateTimeOut >= 0) {
                        _immediateTimer = _createTimer(() => {
                            _immediateTimer = null;
                            // Only try to send direct events
                            _sendEventsForLatencyAndAbove(EventLatencyValue.Immediate, EventSendType.Batched, SendRequestReason.NormalSchedule);
                            _scheduleTimer();
                        }, immediateTimeOut);
                    }
                }

                // During initialization the _profiles enforce that the normal [0] is a multiple of the real time [1] timer value
                let timeOut = _profiles[_currentProfile][1];
                if (!_scheduledTimer && !_flushCallbackTimer && timeOut >= 0 && !_paused) {
                    if (_hasEvents()) {
                        _scheduledTimer = _createTimer(() => {
                            _scheduledTimer = null;
                            _sendEventsForLatencyAndAbove(_timerCount === 0 ? EventLatencyValue.RealTime : EventLatencyValue.Normal, EventSendType.Batched, SendRequestReason.NormalSchedule);

                            // Increment the count for next cycle
                            _timerCount++;
                            _timerCount %= 2;

                            _scheduleTimer();
                        }, timeOut);
                    } else {
                        _timerCount = 0;
                    }
                }
            }

            _self._backOffTransmission = () => {
                if (_currentBackoffCount < MaxBackoffCount) {
                    _currentBackoffCount++;
                    _clearScheduledTimer();
                    _scheduleTimer();
                }
            };

            _self._clearBackOff = () => {
                if (_currentBackoffCount) {
                    _currentBackoffCount = 0;
                    _clearScheduledTimer();
                    _scheduleTimer();
                }
            };

            function _initDefaults() {
                _postConfig = null;
                _isTeardownCalled = false;
                _flushCallbackQueue = [];
                _flushCallbackTimer = null;
                _paused = false;
                _immediateQueueSize = 0;
                _immediateQueueSizeLimit = 500;
                _queueSize = 0;
                _queueSizeLimit = MaxEventsLimitInMem;
                _profiles = {};
                _currentProfile = RT_PROFILE;
                _scheduledTimer = null;
                _immediateTimer = null;
                _currentBackoffCount = 0;
                _timerCount = 0;
                _batchQueues = {};
                _autoFlushEventsLimit = 0;
                _unloadHandlersAdded = false;
                
                // either MaxBatchSize * (1+ Max Connections) or _queueLimit / 6 (where 3 latency Queues [normal, realtime, cost deferred] * 2 [allow half full -- allow for retry])
                _autoFlushBatchLimit = 0;
                _delayedBatchSendLatency = -1;
                _delayedBatchReason = null;
                _optimizeObject = true;
                _isPageUnloadTriggered = false;
                _maxEventSendAttempts = MaxSendAttempts;
                _maxUnloadEventSendAttempts = MaxSyncUnloadSendAttempts;
                _evtNamespace = null;
                _overrideInstrumentationKey = null;
                _disableTelemetry = false;
                _timeoutWrapper = createTimeoutWrapper();
                _httpManager = new HttpManager(MaxNumberEventPerBatch, MaxConnections, MaxRequestRetriesBeforeBackoff, {
                    requeue: _requeueEvents,
                    send: _sendingEvent,
                    sent: _eventsSentEvent,
                    drop: _eventsDropped,
                    rspFail: _eventsResponseFail,
                    oth: _otherEvent
                });

                _initializeProfiles();
                _clearQueues();
                _setAutoLimits();
            }

            function _createTimer(theTimerFunc: () => void, timeOut: number): ITimerHandler {
                // If the transmission is backed off make the timer at least 1 sec to allow for back off.
                if (timeOut === 0 && _currentBackoffCount) {
                    timeOut = 1;
                }

                let timerMultiplier = 1000;
                if (_currentBackoffCount) {
                    timerMultiplier = retryPolicyGetMillisToBackoffForRetry(_currentBackoffCount - 1);
                }

                return _timeoutWrapper.set(theTimerFunc, timeOut * timerMultiplier);
            }

            function _clearScheduledTimer() {
                if (_scheduledTimer !== null) {
                    _scheduledTimer.cancel();
                    _scheduledTimer = null;
                    _timerCount = 0;
                    return true;
                }

                return false;
            }

            // Try to send all queued events using beacons if available
            function _releaseAllQueues(sendType: EventSendType, sendReason: SendRequestReason) {
                _clearScheduledTimer();

                // Cancel all flush callbacks
                if (_flushCallbackTimer) {
                    _flushCallbackTimer.cancel();
                    _flushCallbackTimer = null;
                }

                if (!_paused) {
                    // Queue all the remaining requests to be sent. The requests will be sent using HTML5 Beacons if they are available.
                    _sendEventsForLatencyAndAbove(EventLatencyValue.Normal, sendType, sendReason);
                }
            }

            /**
             * Add empty queues for all latencies in the inbound queues map. This is called
             * when Transmission Manager is being flushed. This ensures that new events added
             * after flush are stored separately till we flush the current events.
             */
            function _clearQueues() {
                _batchQueues[EventLatencyValue.Immediate] = {
                    batches: [],
                    iKeyMap: {}
                };
                _batchQueues[EventLatencyValue.RealTime] = {
                    batches: [],
                    iKeyMap: {}
                };
                _batchQueues[EventLatencyValue.CostDeferred] = {
                    batches: [],
                    iKeyMap: {}
                };
                _batchQueues[EventLatencyValue.Normal] = {
                    batches: [],
                    iKeyMap: {}
                };
            }

            function _getEventBatch(iKey: string, latency: number, create: boolean) {
                let batchQueue: IPostChannelBatchQueue = _batchQueues[latency];
                if (!batchQueue) {
                    latency = EventLatencyValue.Normal;
                    batchQueue = _batchQueues[latency];
                }

                let eventBatch = batchQueue.iKeyMap[iKey];
                if (!eventBatch && create) {
                    eventBatch = EventBatch.create(iKey);
                    batchQueue.batches.push(eventBatch);
                    batchQueue.iKeyMap[iKey] = eventBatch;
                }

                return eventBatch;
            }

            function _performAutoFlush(isAsync: boolean, doFlush?: boolean) {
                // Only perform the auto flush check if the httpManager has an idle connection and we are not in a backoff situation
                if (_httpManager.canSendRequest() && !_currentBackoffCount) {
                    if (_autoFlushEventsLimit > 0 && _queueSize > _autoFlushEventsLimit) {
                        // Force flushing
                        doFlush = true;
                    }

                    if (doFlush && _flushCallbackTimer == null) {
                        // Auto flush the queue, adding a callback to avoid the creation of a promise
                        _self.flush(isAsync, () => {}, SendRequestReason.MaxQueuedEvents);
                    }
                }
            }

            function _addEventToProperQueue(event: IPostTransmissionTelemetryItem, append: boolean): boolean {
                // v8 performance optimization for iterating over the keys
                if (_optimizeObject) {
                    event = optimizeObject(event);
                }

                const latency = event.latency;
                let eventBatch = _getEventBatch(event.iKey, latency, true);
                if (eventBatch.addEvent(event)) {
                    if (latency !== EventLatencyValue.Immediate) {
                        _queueSize++;

                        // Check for auto flushing based on total events in the queue, but not for requeued or retry events
                        if (append && event.sendAttempt === 0) {
                            // Force the flushing of the batch if the batch (specific iKey / latency combination) reaches it's auto flush limit
                            _performAutoFlush(!event.sync, _autoFlushBatchLimit > 0 && eventBatch.count() >= _autoFlushBatchLimit);
                        }
                    } else {
                        // Direct events don't need auto flushing as they are scheduled (by default) for immediate delivery
                        _immediateQueueSize++;
                    }

                    return true;
                }

                return false;
            }

            function _dropEventWithLatencyOrLess(iKey: string, latency: number, currentLatency: number, dropNumber: number): boolean {
                while (currentLatency <= latency) {
                    let eventBatch = _getEventBatch(iKey, latency, true);
                    if (eventBatch && eventBatch.count() > 0) {
                        // Dropped oldest events from lowest possible latency
                        let droppedEvents = eventBatch.split(0, dropNumber);
                        let droppedCount = droppedEvents.count();
                        if (droppedCount > 0) {
                            if (currentLatency === EventLatencyValue.Immediate) {
                                _immediateQueueSize -= droppedCount;
                            } else {
                                _queueSize -= droppedCount;
                            }

                            _notifyBatchEvents(strEventsDiscarded, [droppedEvents], EventsDiscardedReason.QueueFull);
                            return true;
                        }
                    }

                    currentLatency++;
                }

                // Unable to drop any events -- lets just make sure the queue counts are correct to avoid exhaustion
                _resetQueueCounts();

                return false;
            }

            /**
             * Internal helper to reset the queue counts, used as a backstop to avoid future queue exhaustion errors
             * that might occur because of counting issues.
             */
            function _resetQueueCounts() {
                let immediateQueue = 0;
                let normalQueue = 0;
                for (let latency = EventLatencyValue.Normal; latency <= EventLatencyValue.Immediate; latency++) {
                    let batchQueue: IPostChannelBatchQueue = _batchQueues[latency];
                    if (batchQueue && batchQueue.batches) {
                        arrForEach(batchQueue.batches, (theBatch) => {
                            if (latency === EventLatencyValue.Immediate) {
                                immediateQueue += theBatch.count();
                            } else {
                                normalQueue += theBatch.count();
                            }
                        });
                    }
                }

                _queueSize = normalQueue;
                _immediateQueueSize = immediateQueue;
            }

            function _queueBatches(latency: number, sendType: EventSendType, sendReason: SendRequestReason): boolean {
                let eventsQueued = false;
                let isAsync = sendType === EventSendType.Batched;

                // Only queue batches (to the HttpManager) if this is a sync request or the httpManager has an idle connection
                // Thus keeping the events within the PostChannel until the HttpManager has a connection available
                // This is so we can drop "old" events if the queue is getting full because we can't successfully send events
                if (!isAsync || _httpManager.canSendRequest()) {
                    doPerf(_self.core, () => "PostChannel._queueBatches", () => {
                        let droppedEvents = [];
                        let latencyToProcess = EventLatencyValue.Immediate;
                        while (latencyToProcess >= latency) {
                            let batchQueue: IPostChannelBatchQueue = _batchQueues[latencyToProcess];
                            if (batchQueue && batchQueue.batches && batchQueue.batches.length > 0) {
                                arrForEach(batchQueue.batches, (theBatch) => {
                                    // Add the batch to the http manager to send the requests
                                    if (!_httpManager.addBatch(theBatch)) {
                                        // The events from this iKey are being dropped (killed)
                                        droppedEvents = droppedEvents.concat(theBatch.events());
                                    } else {
                                        eventsQueued = eventsQueued || (theBatch && theBatch.count() > 0);
                                    }

                                    if (latencyToProcess === EventLatencyValue.Immediate) {
                                        _immediateQueueSize -= theBatch.count();
                                    } else {
                                        _queueSize -= theBatch.count();
                                    }
                                });

                                // Remove all batches from this Queue
                                batchQueue.batches = [];
                                batchQueue.iKeyMap = {};
                            }

                            latencyToProcess--;
                        }

                        if (droppedEvents.length > 0) {
                            _notifyEvents(strEventsDiscarded, droppedEvents, EventsDiscardedReason.KillSwitch);
                        }

                        if (eventsQueued && _delayedBatchSendLatency >= latency) {
                            // We have queued events at the same level as the delayed values so clear the setting
                            _delayedBatchSendLatency = -1;
                            _delayedBatchReason = SendRequestReason.Undefined;
                        }
                    }, () => ({ latency, sendType, sendReason }), !isAsync);
                } else {
                    // remember the min latency so that we can re-trigger later
                    _delayedBatchSendLatency = _delayedBatchSendLatency >= 0 ? Math.min(_delayedBatchSendLatency, latency) : latency;
                    _delayedBatchReason = Math.max(_delayedBatchReason, sendReason);
                }

                return eventsQueued;
            }

            /**
             * This is the callback method is called as part of the manual flushing process.
             */
            function _flushImpl(callback: () => void, sendReason: SendRequestReason) {
                // Add any additional queued events and cause all queued events to be sent asynchronously
                _sendEventsForLatencyAndAbove(EventLatencyValue.Normal, EventSendType.Batched, sendReason);

                // All events (should) have been queue -- lets just make sure the queue counts are correct to avoid queue exhaustion (previous bug #9685112)
                _resetQueueCounts();

                _waitForIdleManager(() => {
                    // Only called AFTER the httpManager does not have any outstanding requests
                    if (callback) {
                        callback();
                    }

                    if (_flushCallbackQueue.length > 0) {
                        _flushCallbackTimer = _createTimer(() => {
                            _flushCallbackTimer = null;
                            _flushImpl(_flushCallbackQueue.shift(), sendReason);
                        }, 0);
                    } else {
                        // No more flush requests
                        _flushCallbackTimer = null;

                        // Restart the normal timer schedule
                        _scheduleTimer();
                    }
                });
            }

            function _waitForIdleManager(callback: () => void) {
                if (_httpManager.isCompletelyIdle()) {
                    callback();
                } else {
                    _flushCallbackTimer = _createTimer(() => {
                        _flushCallbackTimer = null;
                        _waitForIdleManager(callback);
                    }, FlushCheckTimer);
                }
            }

            /**
             * Resets the transmit profiles to the default profiles of Real Time, Near Real Time
             * and Best Effort. This removes all the custom profiles that were loaded.
             */
            function _resetTransmitProfiles() {
                _clearScheduledTimer();
                _initializeProfiles();
                _currentProfile = RT_PROFILE;
                _scheduleTimer();
            }

            function _initializeProfiles() {
                _profiles = {};
                _profiles[RT_PROFILE] = [2, 1, 0];
                _profiles[NRT_PROFILE] = [6, 3, 0];
                _profiles[BE_PROFILE] = [18, 9, 0];
            }

            /**
             * The notification handler for requeue events
             * @ignore
             */
            function _requeueEvents(batches: EventBatch[], reason?: number) {
                let droppedEvents: IPostTransmissionTelemetryItem[] = [];
                let maxSendAttempts = _maxEventSendAttempts;
                if (_isPageUnloadTriggered) {
                    // If a page unlaod has been triggered reduce the number of times we try to "retry"
                    maxSendAttempts = _maxUnloadEventSendAttempts;
                }

                arrForEach(batches, (theBatch) => {
                    if (theBatch && theBatch.count() > 0) {

                        arrForEach(theBatch.events(), (theEvent: IPostTransmissionTelemetryItem) => {
                            if (theEvent) {
                                // Check if the request being added back is for a sync event in which case mark it no longer a sync event
                                if (theEvent.sync) {
                                    theEvent.latency = EventLatencyValue.Immediate;
                                    theEvent.sync = false;
                                }

                                if (theEvent.sendAttempt < maxSendAttempts) {
                                    // Reset the event timings
                                    setProcessTelemetryTimings(theEvent, _self.identifier);
                                    _addEventToQueues(theEvent, false);
                                } else {
                                    droppedEvents.push(theEvent);
                                }
                            }
                        });
                    }
                });

                if (droppedEvents.length > 0) {
                    _notifyEvents(strEventsDiscarded, droppedEvents, EventsDiscardedReason.NonRetryableStatus);
                }

                if (_isPageUnloadTriggered) {
                    // Unload event has been received so we need to try and flush new events
                    _releaseAllQueues(EventSendType.SendBeacon, SendRequestReason.Unload);
                }
            }

            function _callNotification(evtName: string, theArgs: any[]) {
                let manager = (_notificationManager || ({} as NotificationManager));
                let notifyFunc = manager[evtName];
                if (notifyFunc) {
                    try {
                        notifyFunc.apply(manager, theArgs);
                    } catch (e) {
                        _throwInternal(_self.diagLog(),
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.NotificationException,
                            evtName + " notification failed: " + e);
                    }
                }
            }

            function _notifyEvents(evtName: string, theEvents: IPostTransmissionTelemetryItem[], ...extraArgs) {
                if (theEvents && theEvents.length > 0) {
                    _callNotification(evtName, [theEvents].concat(extraArgs));
                }
            }

            function _notifyBatchEvents(evtName: string, batches: EventBatch[], ...extraArgs) {
                if (batches && batches.length > 0) {
                    arrForEach(batches, (theBatch) => {
                        if (theBatch && theBatch.count() > 0) {
                            _callNotification(evtName, [theBatch.events()].concat(extraArgs));
                        }
                    });
                }
            }

            /**
             * The notification handler for when batches are about to be sent
             * @ignore
             */
            function _sendingEvent(batches: EventBatch[], reason?: number, isSyncRequest?: boolean) {
                if (batches && batches.length > 0) {
                    _callNotification(
                        "eventsSendRequest",
                        [(reason >= EventBatchNotificationReason.SendingUndefined && reason <= EventBatchNotificationReason.SendingEventMax ?
                            reason - EventBatchNotificationReason.SendingUndefined :
                            SendRequestReason.Undefined), isSyncRequest !== true]);
                }
            }

            /**
             * This event represents that a batch of events have been successfully sent and a response received
             * @param batches - The notification handler for when the batches have been successfully sent
             * @param reason - For this event the reason will always be EventBatchNotificationReason.Complete
             */
            function _eventsSentEvent(batches: EventBatch[], reason?: number) {
                _notifyBatchEvents("eventsSent", batches, reason);

                // Try and schedule the processing timer if we have events
                _scheduleTimer();
            }

            function _eventsDropped(batches: EventBatch[], reason?: number) {
                _notifyBatchEvents(
                    strEventsDiscarded,
                    batches,
                    (reason >= EventBatchNotificationReason.EventsDropped && reason <= EventBatchNotificationReason.EventsDroppedMax ?
                        reason - EventBatchNotificationReason.EventsDropped :
                        EventsDiscardedReason.Unknown));
            }

            function _eventsResponseFail(batches: EventBatch[]) {
                _notifyBatchEvents(strEventsDiscarded, batches, EventsDiscardedReason.NonRetryableStatus);

                // Try and schedule the processing timer if we have events
                _scheduleTimer();
            }

            function _otherEvent(batches: EventBatch[], reason?: number) {
                _notifyBatchEvents(strEventsDiscarded, batches, EventsDiscardedReason.Unknown);

                // Try and schedule the processing timer if we have events
                _scheduleTimer();
            }

            function _setAutoLimits() {
                if (!_disableAutoBatchFlushLimit) {
                    _autoFlushBatchLimit = Math.max(MaxNumberEventPerBatch * (MaxConnections + 1), _queueSizeLimit / 6);
                } else {
                    _autoFlushBatchLimit = 0;
                }
            }
        });
    }

    /**
     * Start the queue manager to batch and send events via post.
     * @param config - The core configuration.
     */
    public initialize(coreConfig: IExtendedConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add an event to the appropriate inbound queue based on its latency.
     * @param ev - The event to be added to the queue.
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    public processTelemetry(ev: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Sets the event queue limits at runtime (after initialization), if the number of queued events is greater than the
     * eventLimit or autoFlushLimit then a flush() operation will be scheduled.
     * @param eventLimit - The number of events that can be kept in memory before the SDK starts to drop events. If the value passed is less than or
     * equal to zero the value will be reset to the default (10,000).
     * @param autoFlushLimit - When defined, once this number of events has been queued the system perform a flush() to send the queued events
     * without waiting for the normal schedule timers. Passing undefined, null or a value less than or equal to zero will disable the auto flush.
     */
    public setEventQueueLimits(eventLimit: number, autoFlushLimit?: number) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Pause the transmission of any requests
     */
    public pause() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resumes transmission of events.
     */
    public resume() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
    * Add handler to be executed with request response text.
    */
    public addResponseHandler(responseHanlder: (responseText: string) => void): IUnloadHook {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
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
    public flush(async: boolean = true, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Set AuthMsaDeviceTicket header
     * @param ticket - Ticket value.
     */
    public setMsaAuthTicket(ticket: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Set setAuthPluginHeader header
     * @param token - token value.
     */
    public setAuthPluginHeader(token: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * remove AuthPlugin Header
     * @param token - token value.
     */
    public removeAuthPluginHeader(token: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }


    /**
     * Check if there are any events waiting to be scheduled for sending.
     * @returns True if there are events, false otherwise.
     */
    public hasEvents(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Load custom transmission profiles. Each profile should have timers for real time, and normal and can
     * optionally specify the immediate latency time in ms (defaults to 0 when not defined). Each profile should
     * make sure that a each normal latency timer is a multiple of the real-time latency and the immediate
     * is smaller than the real-time.
     * Setting the timer value to -1 means that the events for that latency will not be scheduled to be sent.
     * Note that once a latency has been set to not send, all latencies below it will also not be sent. The
     * timers should be in the form of [normal, high, [immediate]].
     * e.g Custom:
     * [10,5] - Sets the normal latency time to 10 seconds and real-time to 5 seconds; Immediate will default to 0ms
     * [10,5,1] - Sets the normal latency time to 10 seconds and real-time to 5 seconds; Immediate will default to 1ms
     * [10,5,0] - Sets the normal latency time to 10 seconds and real-time to 5 seconds; Immediate will default to 0ms
     * [10,5,-1] - Sets the normal latency time to 10 seconds and real-time to 5 seconds; Immediate events will not be
     * scheduled on their own and but they will be included with real-time or normal events as the first events in a batch.
     * This also removes any previously loaded custom profiles.
     * @param profiles - A dictionary containing the transmit profiles.
     */
    public _loadTransmitProfiles(profiles: { [profileName: string]: number[] }) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Set the transmit profile to be used. This will change the transmission timers
     * based on the transmit profile.
     * @param profileName - The name of the transmit profile to be used.
     */
    public _setTransmitProfile(profileName: string) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Backs off transmission. This exponentially increases all the timers.
     */
    public _backOffTransmission() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Clears backoff for transmission.
     */
    public _clearBackOff() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get Offline support
     * @returns internal Offline support interface IInternalOfflineSupport
     */
    public getOfflineSupport(): IInternalOfflineSupport {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }
}
