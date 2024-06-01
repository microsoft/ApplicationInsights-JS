// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BreezeChannelIdentifier, EventPersistence, IConfig, IOfflineListener, createOfflineListener
} from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, EventsDiscardedReason, IAppInsightsCore, IChannelControls, IConfigDefaults, IConfiguration, IDiagnosticLogger,
    IInternalOfflineSupport, INotificationListener, INotificationManager, IPayloadData, IPlugin, IProcessTelemetryContext,
    IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState, IXHROverride, SendRequestReason,
    _eInternalMessageId, _throwInternal, arrForEach, createProcessTelemetryContext, createUniqueNamespace, dateNow, eBatchDiscardedReason,
    eLoggingSeverity, mergeEvtNamespace, onConfigChange, runTargetUnload
} from "@microsoft/applicationinsights-core-js";
import { IPromise, ITaskScheduler, createAsyncPromise, createTaskScheduler } from "@nevware21/ts-async";
import { ITimerHandler, isFunction, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
import {
    EVT_DISCARD_STR, EVT_SENT_STR, EVT_STORE_STR, batchDropNotification, callNotification, isGreaterThanZero
} from "./Helpers/Utils";
import { InMemoryBatch } from "./InMemoryBatch";
import { IPostTransmissionTelemetryItem } from "./Interfaces/IInMemoryBatch";
import {
    IOfflineBatchHandler, OfflineBatchCallback, OfflineBatchStoreCallback, eBatchSendStatus, eBatchStoreStatus
} from "./Interfaces/IOfflineBatch";
import {
    ILocalStorageProviderContext, IOfflineChannelConfiguration, IOfflineSenderConfig, IStorageTelemetryItem, eStorageProviders
} from "./Interfaces/IOfflineProvider";
import { OfflineBatchHandler } from "./OfflineBatchHandler";
import { isValidPersistenceLevel } from "./Providers/IndexDbProvider";
import { Sender } from "./Sender";

const version = "#version#";
const DefaultOfflineIdentifier = "OfflineChannel";
const DefaultBatchInterval = 15000;
const DefaultInMemoMaxTime = 15000;
const PostChannelIdentifier = "PostChannel";


interface IUrlLocalStorageConfig {
    iKey?: string;
    url: string;
    coreRootCtx: IProcessTelemetryContext;
    providerContext: ILocalStorageProviderContext;
    batchHandler: IOfflineBatchHandler; // simply use the current one, do not need to re-init
    minPersistenceCacheLevel: number;
    preListener?: INotificationListener;
}

let undefValue = undefined;

const DefaultBatchSizeLimitBytes = 63000; // approx 64kb (the current Edge, Firefox and Chrome max limit)

const defaultOfflineChannelConfig: IConfigDefaults<IOfflineChannelConfiguration> = objDeepFreeze({
    maxStorageSizeInBytes: { isVal: isGreaterThanZero, v: 5000000 },
    storageKey: undefValue,
    minPersistenceLevel: { isVal: isValidPersistenceLevel, v: EventPersistence.Normal },
    providers: [eStorageProviders.LocalStorage, eStorageProviders.IndexedDb],
    indexedDbName: undefValue,
    maxStorageItems: { isVal: isGreaterThanZero, v: undefValue},
    inMemoMaxTime: { isVal: isGreaterThanZero, v: DefaultInMemoMaxTime},
    maxRetry: {isVal: isGreaterThanZero, v: 1}, // 0 means no retry
    maxBatchsize:{ isVal: isGreaterThanZero, v: DefaultBatchSizeLimitBytes},
    maxSentBatchInterval: { isVal: isGreaterThanZero, v: DefaultBatchInterval},
    primaryOnlineChannelId: [BreezeChannelIdentifier, PostChannelIdentifier],
    overrideInstrumentationKey: undefValue,
    senderCfg: {} as IOfflineSenderConfig
});

//TODO: add tests for sharedAnanlytics


export class OfflineChannel extends BaseTelemetryPlugin implements IChannelControls {
    public identifier = DefaultOfflineIdentifier;
    public priority = 1000; // before channel (post = 1011 and sender = 1001, teechannel = 999, localstorage:  1009)
    public version = version;
    public id: string;

    constructor() {
        super();
        dynamicProto(OfflineChannel, this, (_self, _base) => {
            // Internal properties used for tracking the current state, these are "true" internal/private properties for this instance
            let _hasInitialized;
            let _paused;
            let _inMemoBatch: InMemoryBatch;
            let _sender: Sender;
            let _urlCfg: IUrlLocalStorageConfig;
            let _offlineListener: IOfflineListener;
            let _inMemoFlushTimer: ITimerHandler;
            let _inMemoTimerOut: number;
            let _diagLogger:IDiagnosticLogger;
            let _endpoint: string;
            let _maxBatchSize: number;
            let _sendNextBatchTimer: ITimerHandler;
            let _convertUndefined: any;
            let _retryAt: number;
            let _maxBatchInterval: number;
            let _consecutiveErrors: number;
            let _senderInst: IXHROverride;
            let _taskScheduler: ITaskScheduler;
            let _offineSupport: IInternalOfflineSupport;
            let _primaryChannelId: string;
            let _overrideIkey: string;
            let _evtsLimitInMemo: number;
            let _notificationManager: INotificationManager | undefined;
            let _isLazyInit: boolean;
            let _dependencyPlugin: IChannelControls;


            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
             
                if (!_hasInitialized && !_isLazyInit) {

                    _base.initialize(coreConfig, core, extensions);

                    //_hasInitialized = true;
                    _isLazyInit = true; // to be able to re-initialized

                    _diagLogger = _self.diagLog();
                    let evtNamespace = mergeEvtNamespace(createUniqueNamespace("OfflineSender"), core.evtNamespace && core.evtNamespace());
                    _offlineListener = createOfflineListener(evtNamespace); // TODO: add config to be passed
                    _taskScheduler = createTaskScheduler(createAsyncPromise, "offline channel");
                    _notificationManager = core.getNotifyMgr();
                }
                try {
                    let _dependencyPlugin = _getDependencyPlugin(coreConfig, core);
                    if (!_hasInitialized && _dependencyPlugin && !!_dependencyPlugin.isInitialized()) {
                        _hasInitialized = true;
                        _createUrlConfig(coreConfig, core, extensions, pluginChain);
                        let ctx = _getCoreItemCtx(coreConfig, core, extensions, pluginChain);
                        _sender.initialize(coreConfig, core, ctx, _diagLogger, _primaryChannelId, _self._unloadHooks);
                        if (_sender) {
                            _senderInst = _sender.getXhrInst();
                            _offlineListener.addListener((val)=> {
                                if (!val.isOnline) {
                                    _sendNextBatchTimer && _sendNextBatchTimer.cancel();
                                } else {
                                    _setSendNextTimer();
                                }
        
                            });
                       
                            // need it for first time to confirm if there are any events
                            _setSendNextTimer();

                        }

                    }

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
               
            };

            _self.processTelemetry = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                try {
                    let onlineStatus = _offlineListener.isOnline();
                    itemCtx =  itemCtx || _self._getTelCtx(itemCtx);


                    if (!!onlineStatus || !_offineSupport || !_endpoint) {
                        // if we can't get url from online sender or core config, process next
                        _self.processNext(evt, itemCtx);
                        return;
                    }

                    if (_hasInitialized && !_paused ) {
                        let shouldProcess = true;
                        if (isFunction(_offineSupport.shouldProcess)) {
                            shouldProcess = _offineSupport.shouldProcess(evt);
                        }
                        if (!shouldProcess) {
                            _self.processNext(evt, itemCtx);
                            return;
                        }

                        let item = evt as IPostTransmissionTelemetryItem;
                      
                        //TODO: add function to better get level
                        item.persistence = item.persistence  || (item.baseData && item.baseData.persistence) || EventPersistence.Normal; // in case the level is in baseData
                        if (_shouldCacheEvent(_urlCfg, item) && _inMemoBatch) {
                            if (_overrideIkey) {
                                item.iKey = _overrideIkey;
                            }
                            let added = _inMemoBatch.addEvent(evt);
                            // inMemo is full
                            if (!added) {
                                _flushInMemoItems();
                                let retry = _inMemoBatch.addEvent(evt);
                                if (!retry) {
                                    _evtDropNotification([evt], EventsDiscardedReason.QueueFull);
                                    _throwInternal(_diagLogger,
                                        eLoggingSeverity.WARNING,
                                        _eInternalMessageId.InMemoryStorageBufferFull,
                                        "Maximum offline in-memory buffer size reached",
                                        true);
                                }
                                
                            }
                            // start timer when the first should-cache event added
                            _setupInMemoTimer();
                            
                        } else {
                            // if should not cache,send event drop notification
                            _evtDropNotification([item], EventsDiscardedReason.InvalidEvent);
                        }
                       
                       
                        return;
                    }
        
                } catch (e) {
                    // eslint-disable-next-line no-empty
                
                }
        
                // hand off the telemetry item to the next plugin
                _self.processNext(evt, itemCtx);
                
            };

            _self.pause = () => {
                _paused = true;
                _clearScheduledTimer();
                _consecutiveErrors = 0;
                _retryAt = null;
               
            };

            _self.resume = () => {
                _paused = false;
                _clearScheduledTimer();
                _setupInMemoTimer();
                _setSendNextTimer();
            };

            
            _self.onunloadFlush = () => {
                if (!_paused) {
                    while (_inMemoBatch && _inMemoBatch.count()) {
                        _flushInMemoItems(true);
                    }
                    // TODO: unloadprovider might send events out of order
                }
            };

            _self.flush = (sync: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean> => {
                // TODO: should we implement normal flush
                return _self.onunloadFlush();
            };

            _self.getOfflineListener = () => {
                return _offlineListener;

            };

            _self.sendNextBatch = () => {
                // TODO: add callback function
                return _setSendNextTimer();
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _self.onunloadFlush();
                _offlineListener && runTargetUnload(_offlineListener, false);
                let handler = _urlCfg.batchHandler;
                handler && handler.teardown();
                _clearScheduledTimer();
                _initDefaults();
            };


            _self["_getDbgPlgTargets"] = () => {
                return [_urlCfg, _inMemoBatch, _senderInst, _inMemoFlushTimer, _sendNextBatchTimer];
            };
            

            function _initDefaults() {
                _hasInitialized = false;
                _paused = false;
                _sender = new Sender();
                _urlCfg = null;
                _offlineListener = null;
                _diagLogger = null;
                _endpoint = null;
                _inMemoBatch = null;
                _convertUndefined = undefValue;
                _maxBatchSize = null;
                _sendNextBatchTimer = null;
                _consecutiveErrors = null;
                _retryAt = null;
                _maxBatchInterval = null;
                _senderInst = null;
                _offineSupport = null;
                _primaryChannelId = null;
                _overrideIkey = null;
                _evtsLimitInMemo = null;
                _isLazyInit = false;
                _dependencyPlugin = null;
            }


            function _shouldCacheEvent(urlConfig: IUrlLocalStorageConfig, item: IPostTransmissionTelemetryItem) {
                if ((item.persistence) < urlConfig.minPersistenceCacheLevel) {
                    return false;
                }

                return true;
            }


            function _setupInMemoTimer() {
                if (!_inMemoFlushTimer) {
                    _inMemoFlushTimer = scheduleTimeout(() => {
                        _flushInMemoItems();
                        if (_inMemoBatch && _inMemoBatch.count() && _inMemoFlushTimer) {
                            _inMemoFlushTimer.refresh();
                        }
                        _setSendNextTimer();

                    }, _inMemoTimerOut);
                    _inMemoFlushTimer.unref();
                } else {
                    // Restart the timer if not already running https://nevware21.github.io/ts-utils/typedoc/interfaces/ITimerHandler.html#enabled
                    _inMemoFlushTimer.enabled = true;
                }
            }

            //flush only flush max batch size event, may still have events lefts
            function _flushInMemoItems(unload?: boolean) {
                try {
                    // TODO: add while loop to flush everything
                    let inMemo = _inMemoBatch;
                    let evts = inMemo && inMemo.getItems();
                    if (!evts || !evts.length) {
                        return;
                    }
                    let payloadArr:string[] = [];
                    let size = 0;
                    let idx = -1;
                    let criticalCnt = 0;
                    arrForEach(evts, (evt, index) => {
                        let curEvt = evt as IPostTransmissionTelemetryItem
                        idx = index;
                        let payload = _getPayload(curEvt);
                        size += payload.length;
                        if (size > _maxBatchSize) {
                            return;
                        }
                        if(curEvt.persistence == EventPersistence.Critical) {
                            criticalCnt ++;
                        }
                        idx = index;
                        payloadArr.push(payload);

                    });
                    if (!payloadArr.length) {
                        return;
                    }
                    
                    let sentItems = evts.slice(0, idx + 1);
                 
                    _inMemoBatch = _inMemoBatch.createNew(_endpoint, inMemo.getItems().slice(idx + 1), _evtsLimitInMemo);

                    let payloadData: IStorageTelemetryItem = null;
                    if (_offineSupport && _offineSupport.createOneDSPayload) {
                        payloadData = _offineSupport.createOneDSPayload(sentItems);
                        if (payloadData) {
                            payloadData.criticalCnt = criticalCnt;
                        }
                        
                    } else {
                        payloadData = _constructPayloadData(payloadArr, criticalCnt);
                    }
                   
               
                    let callback: OfflineBatchStoreCallback = (res) => {
                        if (!res || !res.state) {
                            return null;
                        }
                        let state = res.state;

                        if (state == eBatchStoreStatus.Failure) {
                            if (!unload) {
                                // for unload, just try to add each batch once
                                arrForEach(sentItems, (item) => {
                                    _inMemoBatch.addEvent(item);
                                });
                                _setupInMemoTimer();

                            } else {
                                // unload, drop events
                                _evtDropNotification(sentItems, EventsDiscardedReason.NonRetryableStatus);
                            }
                          
                        } else {
                            // if eBatchStoreStatus is success
                            _storeNotification(sentItems);
                        }
                    };
                    if (payloadData) {
                        let promise = _urlCfg.batchHandler.storeBatch(payloadData, callback, unload);
                        _queueStorageEvent("storeBatch", promise);
                    }

                    if (!_inMemoBatch.count()) {
                        _inMemoFlushTimer && _inMemoFlushTimer.cancel();
                    }

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return null;

            }

            function _setSendNextTimer() {
                let isOnline = _offlineListener && _offlineListener.isOnline();
           
                if(!_sendNextBatchTimer) {
                    let retryInterval = _retryAt ? Math.max(0, _retryAt - dateNow()) : 0;
                    let timerValue = Math.max(_maxBatchInterval, retryInterval);
                    _sendNextBatchTimer = scheduleTimeout(() => {
                        if (isOnline) {
                            // is no isCompletelyIdle function is available, assume we can send
                            if(isFunction(_sender.isCompletelyIdle) && !_sender.isCompletelyIdle()) {
                                _sendNextBatchTimer && _sendNextBatchTimer.refresh();

                            } else {
                                let callback:  OfflineBatchCallback = (res) => {
                                    let state = res && res.state;
                                    if (state !== eBatchSendStatus.Complete) {
                                        _consecutiveErrors ++;
                                    }
                                    let data = res && res.data;
                                    if (state === eBatchSendStatus.Complete && data) {
                                        // if status is complete and data is null, means no data
                                        _sentNotification(data as IPayloadData);
                                        _sendNextBatchTimer && _sendNextBatchTimer.refresh();
                                    }

                                    if (state === eBatchSendStatus.Drop) {
                                        batchDropNotification(_notificationManager, 1, eBatchDiscardedReason.NonRetryableStatus);
                                    }
                                   
                                }
                                let promise = _urlCfg.batchHandler.sendNextBatch(callback, false, _senderInst);
                                _queueStorageEvent("sendNextBatch", promise);
                            }
                           
                        } else {
                            _sendNextBatchTimer && _sendNextBatchTimer.cancel();
                        }
                        // if offline, do nothing;

                    },timerValue);

                    _sendNextBatchTimer.unref();

                } else {
                    // only restart it when online
                    if (isOnline) {
                        _sendNextBatchTimer.enabled = true;
                        _sendNextBatchTimer.refresh();
                    }
                    // if offline, do noting
                    
                }
            }

            function _clearScheduledTimer() {
                _inMemoFlushTimer && _inMemoFlushTimer.cancel();
                _sendNextBatchTimer && _sendNextBatchTimer.cancel();
                _inMemoFlushTimer = null;
                _sendNextBatchTimer = null;
            }

            function _queueStorageEvent<T>(taskName: string, task: T | IPromise<T>) {
                if (_taskScheduler) {
                    _taskScheduler.queue(() => {
                        return task;
                    }, taskName).catch((reason) => {
                        // Just handling any rejection to avoid an unhandled rejection event
                    });
                }
                
            }

            function _setRetryTime(linearFactor: number = 1) {
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
                let retryAfterTimeSpan = dateNow() + (delayInSeconds * 1000);
        
                // TODO: Log the retry at time like the C# version does.
                _retryAt = retryAfterTimeSpan;
            }

            function _getCoreItemCtx(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
                if (coreConfig) {
                    // Make sure the extensionConfig exists
                    coreConfig.extensionConfig = coreConfig.extensionConfig || {};
                }

                if (!pluginChain && core) {
                    // Get the first plugin from the core
                    pluginChain = core.getProcessTelContext().getNext();
                }

                let nextPlugin: IPlugin = null;
                let rootNext = _self._getTelCtx().getNext();
                if (rootNext) {
                    nextPlugin = rootNext.getPlugin();
                }

                return createProcessTelemetryContext(pluginChain, coreConfig, core, nextPlugin);
            }


            function _getPayload(evt: IPostTransmissionTelemetryItem | ITelemetryItem) {
                try {

                    if (evt) {
                        return _offineSupport && _offineSupport.serialize(evt, _convertUndefined);
                    }
                    
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
                
            }

            function _constructPayloadData(payloadArr: string[], criticalCnt?: number) {

                try {
                    if (!_offineSupport) {
                        return null;
                    }
                    let cnt = criticalCnt || 0;
                    let payload = _offineSupport.batch(payloadArr);
                    let payloadData = _offineSupport.createPayload && _offineSupport.createPayload(payload) as IStorageTelemetryItem;
                    if (payloadData) {
                        payloadData.criticalCnt = cnt;
                        return payloadData;
                    }
                   

                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
            }

            function _createUrlConfig(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {

                _self._addHook(onConfigChange(coreConfig, (details) => {
                    let storageConfig: IOfflineChannelConfiguration = null;
                    let theConfig = details.cfg;

                    let ctx = createProcessTelemetryContext(null, theConfig, core);
                    storageConfig = ctx.getExtCfg<IOfflineChannelConfiguration>(_self.identifier, defaultOfflineChannelConfig);
                    // let channelIds = storageConfig.primaryOnlineChannelId;
                    let onlineUrl = null;
                    let channel = _getDependencyPlugin(coreConfig, core);
                    if (!!channel.isInitialized() && isFunction(channel.getOfflineSupport)) {
                        _offineSupport = channel.getOfflineSupport();
                        onlineUrl = isFunction(_offineSupport && _offineSupport.getUrl) && _offineSupport.getUrl();
                    } else {
                        return;
                    }
                    
                    // if (channelIds && channelIds.length) {
                    //     arrForEach(channelIds, (id) => {
                    //         let plugin = core.getPlugin<IChannelControls>(id);
                    //         let channel = plugin && plugin.plugin;
                    //         if (channel && !!channel.isInitialized()) {
                    //             _primaryChannelId = id;
                    //             if (!!channel.isInitialized() && isFunction(channel.getOfflineSupport)) {
                    //                 _offineSupport = channel.getOfflineSupport();
                    //                 onlineUrl = isFunction(_offineSupport && _offineSupport.getUrl) && _offineSupport.getUrl();
                    //             }
                    //             return;
                    //         }
                            
                    //     });
                    // }
                    _overrideIkey = storageConfig.overrideInstrumentationKey;

                    let urlConfig: IUrlLocalStorageConfig = _urlCfg;
                    let curUrl = onlineUrl || coreConfig.endpointUrl || _endpoint;
                    // NOTE: should add default endpoint value to core as well

                    if (curUrl !== _endpoint) {
                       
                        let coreRootCtx = _getCoreItemCtx(coreConfig, core, extensions, pluginChain);
                        let providerContext: ILocalStorageProviderContext = {
                            itemCtx: coreRootCtx,
                            storageConfig: storageConfig,
                            id: _self.id,
                            endpoint: curUrl,
                            notificationMgr: _notificationManager
                        };
                        let oriHandler = _urlCfg && _urlCfg.batchHandler;

                        try {
                            oriHandler && oriHandler.teardown();
                        } catch(e) {
                            // eslint-disable-next-line no-empty

                        }

                        let handler = new OfflineBatchHandler(_self.diagLog(), _self._unloadHooks);
                   
                        handler.initialize(providerContext);
                        urlConfig = {
                            iKey: coreConfig.instrumentationKey,
                            url: curUrl,
                            minPersistenceCacheLevel: storageConfig.minPersistenceLevel,
                            coreRootCtx: coreRootCtx,
                            providerContext: providerContext,
                            batchHandler: handler
                        };
                        _evtsLimitInMemo = storageConfig.eventsLimitInMem;
                        // transfer previous events to new buffer
                        let evts = null;
                        let curEvts = _inMemoBatch && _inMemoBatch.getItems();
                        if (curEvts && curEvts.length) {
                            evts = curEvts.slice(0);
                            _inMemoBatch.clear();
                        }
                        _inMemoBatch = new InMemoryBatch(_self.diagLog(), curUrl, evts, _evtsLimitInMemo);
                        _inMemoTimerOut = storageConfig.inMemoMaxTime;
                        let onlineConfig = ctx.getExtCfg<any>(_primaryChannelId, {}) || {};
                        _convertUndefined = onlineConfig.convertUndefined;
                        _endpoint = curUrl;
                        _setRetryTime();
                        _maxBatchInterval = storageConfig.maxSentBatchInterval;
                        _maxBatchSize = storageConfig.maxBatchsize;
                    }
                    _urlCfg = urlConfig;
                    _endpoint = curUrl;
                    
                }));
            }

            function _getDependencyPlugin(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore) {
                if (!_dependencyPlugin) {
                    let ctx = createProcessTelemetryContext(null, coreConfig, core);
                    let storageConfig = ctx.getExtCfg<IOfflineChannelConfiguration>(_self.identifier, defaultOfflineChannelConfig);
                    let channelIds = storageConfig.primaryOnlineChannelId;
                    if (channelIds && channelIds.length) {
                        arrForEach(channelIds, (id) => {
                            let plugin = core.getPlugin<IChannelControls>(id);
                            let channel = plugin && plugin.plugin;
                            if (channel) {
                                _dependencyPlugin = channel;
                                return;
                            }
                                
                            
                        });
                    }
                }
               
                return _dependencyPlugin;
            }

            
            function _callNotification(evtName: string, theArgs: any[]) {
                callNotification(_notificationManager, evtName, theArgs);
            }

            function _evtDropNotification(events: ITelemetryItem[] | IPostTransmissionTelemetryItem[], reason: number | EventsDiscardedReason ) {
                if (events && events.length) {
                    _callNotification(EVT_DISCARD_STR, [events, reason]);

                }
                return;
            }

            function _sentNotification(batch: IPayloadData) {
                if (batch && batch.data) {
                    _callNotification(EVT_SENT_STR, [batch]);
                }
                return;
            }

            function _storeNotification(events: ITelemetryItem[] | IPostTransmissionTelemetryItem[]) {
                if (events && events.length) {
                    _callNotification(EVT_STORE_STR, [events]);
                }
                return;
            }

        });
    }

    /* ================================================================================================================
     * DO NOT add any code to these empty implementations as any code defined here will be removed, as
     * this class is using @dynamicProto which will implement the methods during the execution of the
     * dynamicProto() in the constructor.
     *
     * The final generated files will also have these implementations removed as part of the packaging process.
     *
     * These empty definitions exists only to keep the generated TypeScript definition files aligned with the
     * actual resulting implementation, this is so that TS is still happy to create extension classes from the
     * resulting definitions.
     *
     * This also keeps the generated *.d.ts files and documentation the same as they where prior to using dynamicProto()
     */

    /**
     * The function does the initial set up. It adds a notification listener to determine which events to remove.
     * @param coreConfig - The core configuration.
     * @param core       - The AppInsights core.
     * @param extensions - An array of all the plugins being used.
     */
    public initialize(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Process an event to add it to the local storage and then pass it to the next plugin.
     * @param event - The event that needs to be stored.
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    public processTelemetry(evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    // ================================================================================================================

    /**
     * Pauses the adding of new events to the plugin. Also calls pause on the next
     * plugin.
     */
    public pause(): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resumes the adding of new events to the plugin. Also calls resume on
     * the next plugin. Adds all events in storage to the next plugin.
     */
    public resume(): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get offline listener
     * @returns offline listener
     */
    public getOfflineListener() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     *No op
     */
    public flush(sync: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Flush the batched events synchronously (if possible -- based on configuration).
     * Will not flush if the Send has been paused.
     */
    public onunloadFlush() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Flush the next stored event batch
     */
    public sendNextBatch() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

}
