
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IPlugin,
    IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState,
    SendRequestReason, arrForEach, createProcessTelemetryContext, doPerf, newGuid, IConfigDefaults, onConfigChange, INotificationListener, IConfiguration, _throwInternal, eLoggingSeverity, _eInternalMessageId, IPayloadData
} from "@microsoft/applicationinsights-core-js";
import { AwaitResponse, IPromise, ITaskScheduler, createAsyncPromise, createTaskScheduler, doAwaitResponse } from "@nevware21/ts-async";
import { ITimerHandler, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
import { IConfig, IOfflineListener, createOfflineListener } from "@microsoft/applicationinsights-common";
import { ILocalStorageConfiguration, ILocalStorageProviderContext, IOfflineProvider, IStorageTelemetryItem, eEventPersistenceValue, eStorageProviders } from "./Interfaces/IOfflineProvider";
import { isGreaterThanZero } from "./Helpers/Utils";
import { IndexedDbProvider, isValidPersistenceLevel } from "./Providers/IndexDbProvider";
import { InMemoryBatch } from "./InMemoryBatch";
import { Sender } from "./Sender";
import { WebStorageProvider } from "./Providers/WebStorageProvider";
import { IOfflineBatchHandler } from "./applicationinsights-offlinechannel-js";
import { OfflineBatchHandler } from "./OfflineBatchHandler";
import { IPostTransmissionTelemetryItem } from "./Interfaces/IInMemoryBatch";
import { send } from "process";
import { IOfflineBatchCleanResponse, IOfflineBatchResponse, IOfflineBatchStoreResponse, eBatchSendStatus } from "./Interfaces/IOfflineBatch";
import { Serializer } from "./Serializer";

// *****************************************************************************
// TODO: max retry


const version = "#version#";
const DefaultOfflineIdentifier = "OflineChannel";

// Used to limit the time spent on processing the initial config to ensure we don't process excessive size items
const MaxStorageProviderConfig = 2;

const MaxRetry = 2;

interface IUrlLocalStorageConfig {
    iKey: string;
    url: string;
    coreRootCtx: IProcessTelemetryContext;
    providerContext: ILocalStorageProviderContext;
    batchHandler: IOfflineBatchHandler; // simply use the current one, do not need to re-init
    minPersistenceCacheLevel: number;
    preListener?: INotificationListener;
}

let undefValue = undefined;
const defaultDbName = "AppInsightEvents.1";
const defaultStorageKey = "AWTEvents";

const defaultLocalStorageConfig: IConfigDefaults<ILocalStorageConfiguration> = objDeepFreeze({
    maxStorageSizeInBytes: { isVal: isGreaterThanZero, v: 5000000 },
    storageKey: defaultStorageKey,
    minPersistenceLevel: { isVal: isValidPersistenceLevel, v: eEventPersistenceValue.Normal },
    providers: [eStorageProviders.LocalStorage, eStorageProviders.IndexedDb],
    indexedDbName: defaultDbName,
    maxStorageItems: { isVal: isGreaterThanZero, v: undefValue},
    inMemoMaxTime: 2000,
    maxRetry: 1
});


export class OfflineChannel extends BaseTelemetryPlugin implements IChannelControls {
    public identifier = DefaultOfflineIdentifier;
    public priority = 990; // before channel
    public version = version;
    public id: string;

    /**
     * Creates the LocalStorageChannel instance including populating specific implementations of the public API.
     */
    constructor() {
        super();
        dynamicProto(OfflineChannel, this, (_self, _base) => {
            // Internal properties used for tracking the current state, these are "true" internal/private properties for this instance
            let _hasInitialized;
            let _paused;
            let _storageScheduler: ITaskScheduler;
            let _initializedUrls: IUrlLocalStorageConfig[];
            let _inMemoBatches: {[endpoint: string]: InMemoryBatch}; // arr, not map
            let _sender: Sender;
            let _urlCfg: IUrlLocalStorageConfig;
            let _offlineListener: IOfflineListener;
            let _inMemoFlushTimer: ITimerHandler;
            let _inMemoTimerOut: number;
            let _maxRetry: number;
            let _ikey: string;
            let _serializer: Serializer;
            let _handler:  IOfflineBatchHandler; // TODO: use the current
    

            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
                doPerf(core, () => "LocalStorageChannel.initialize", () => {
                    if (!_hasInitialized) {

                        _base.initialize(coreConfig, core, extensions);

                     
                        _base.setInitialized(false);
                        _hasInitialized = true;

                        _storageScheduler = createTaskScheduler(createAsyncPromise, "LocalStorage");
                        let ctx = _getCoreItemCtx(coreConfig, core, extensions, pluginChain);
                        _sender.initialize(coreConfig, core, ctx, _self.diagLog());
                        _offlineListener = createOfflineListener(); // or to be passed
                        _serializer = new Serializer(_self.diagLog());
                    }

                    _createUrlConfig(coreConfig, core, extensions, pluginChain);
                }, () => ({coreConfig, core, extensions, pluginChain}));
            };

            _self.processTelemetry = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                // Caching the current "paused" state as it may have changed by the time the async operation completes
                let isPaused = _paused;
                let evnt = evt as IStorageTelemetryItem;

                if (_hasInitialized && !isPaused) {
                    itemCtx = _self._getTelCtx(itemCtx);
                    let onlineStatus = _offlineListener.isOnline();
                    if (!!onlineStatus) {
                        _sender.processTelemetry(evt, itemCtx); // should have any reference to sender
                        // processNext
                    } else {
                        let inMemo = _inMemoBatches[_urlCfg.url]
                        
                        if (_shouldCacheEvent(_urlCfg, evnt) && inMemo) {
                            let evt = evnt as IPostTransmissionTelemetryItem;
                            evt.sendAttempt = evt.sendAttempt || 0;
                            if (_shouldRetry(evt)) {
                                inMemo.addEvent(evt);
                            }
                            
                        }
                    }
                    _setupInMemoTimer();
                }
    
                // Always synchronously send the event onto the next plugin even if this channel is paused (which means this channel won't track events)
                _self.processNext(evnt, itemCtx);
            };

            _self.pause = () => {
                _paused = true;
               
            };

            _self.resume = () => {
               
                _paused = false;
                // // Try and send any cache items
                // arrForEach(_initializedUrls, (urlConfig) => {
                //     let handler = urlConfig.batchHandler;
                //     if (handler) {
                //         // Add the events in storage for this Id back to next plugin.
                //         _sendStoredEventsToNextPlugin(urlConfig);
                //     }
                // });
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                arrForEach(_initializedUrls, (iKeyConfig) => {
                    let handler = iKeyConfig.batchHandler;
                    handler && handler.teardown();
                    _clearScheduledTimer();
                });

                _initDefaults();
            };

            _self.flush = (sync: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean> => {
                // No op
            };

            _self["_getDbgPlgTargets"] = () => {
                return [_initializedUrls];
            };
            

            function _initDefaults() {
                _hasInitialized = false;
                _paused = false;
                _storageScheduler = null;
                _initializedUrls = [];
                _inMemoBatches= null;
                _sender = new Sender();
                _urlCfg = null;
                _offlineListener = null;
                _maxRetry = null;
                _ikey = null;
                _serializer = null;
            }

            function _queueStorageEvent<T>(eventName: string, callback: (evtName?: string) => T | IPromise<T>) {
                if (!_storageScheduler) {
                    _storageScheduler = createTaskScheduler(createAsyncPromise, "LocalStorage");
                }

                _storageScheduler.queue((evtName) => {
                    return callback(evtName);
                }, eventName).catch((reason) => {
                    // Just handling any rejection to avoid an unhandled rejection event
                });
            }

            /**
             * Attempt to schedule/send all of the previous cached events to the next plugin
             * @param provider The current provider
             * @param nextPlugin The next plugin
             */
            function _sendStoredEventsToNextPlugin(urlConfig: IUrlLocalStorageConfig) {
                doPerf(_self.core, () => "LocalStorageChannel:_sendStoredEventsToNextPlugin", () => {
                    _queueStorageEvent("sendToNext", (evtName) => {
                        let httpInterface = _sender.getXhrInst();
                        return doAwaitResponse(urlConfig.batchHandler.sendNextBatch(null, null, httpInterface), (response: AwaitResponse<boolean | IOfflineBatchResponse>) => {
                            // TODO: handle response
                            try {
                                if (response && !response.rejected) {
                                    let val = response.value as IOfflineBatchResponse;
                                    if (val && val.state === eBatchSendStatus.Complete) {
                                        // handle delete first?
                                        return _removeEvents();
                                        // what if not cleared?
                                    }
                                }

                            } catch (e) {
                                // add logging

                            }
                            
                        });
                    });
                }, () => ({ urlConfig }));
            }

            function _removeEvents() {
                _queueStorageEvent("removeEvents", (evtName) => {
                    return doAwaitResponse(_urlCfg.batchHandler.cleanStorage(), (response: AwaitResponse<IOfflineBatchCleanResponse | boolean>) => {
                        // TODO: handle response
                        try {
                            if (response && !response.rejected) {
                                let val = response.value as IOfflineBatchCleanResponse;
                                // handle response here
                            }

                        } catch (e) {
                            // todo: add logging
                        }
                    });
                });
            }

            function _shouldCacheEvent(urlConfig: IUrlLocalStorageConfig, item: IStorageTelemetryItem) {
                if (item.sync || item.persistence < urlConfig.minPersistenceCacheLevel) {
                    return false;
                }

                return true;
            }

            function _setupInMemoTimer() {
                if (!_inMemoFlushTimer) {
                    _inMemoFlushTimer = scheduleTimeout(() => {
                        _inMemoFlushTimer = null; // current url
                        // onconfigchange handle inmemo
                        let inMemo = _inMemoBatches[_urlCfg.url];
                        let evts = inMemo.getItems(); // add to persistent storage
                        // let isOnline = !!_offlineListener.isOnline()
                        // if (isOnline) {
                          
                        //     arrForEach(evts, (evt) => {
                        //         _sender.processTelemetry(evt, _urlCfg.coreRootCtx);
                        //         // _self.processNext
                        //     });
                        //     _sendStoredEventsToNextPlugin(_urlCfg);
                        //     // handle isIdle
                        } else {
                            let payloadData = _constructPayloadData(evts);
                            if (payloadData) {
                                inMemo.clear();
                                // todo: add a copy of evnts
                                _queueStorageEvent("TransferEvents", (evtName) => {
                                    return doAwaitResponse(_urlCfg.batchHandler.storeBatch(payloadData), (response: AwaitResponse<IOfflineBatchStoreResponse | boolean>) => {
                                        // TODO: handle response
                                        try {
                                            if (response && !response.rejected) {
                                               
                                            }
                
                                        } catch (e) {
                                            // todo: add logging
                                        }
                                    });
                                });

                            }
                        }
                    }, _inMemoTimerOut);
                    _inMemoFlushTimer.unref();
                }
            }

            function _clearScheduledTimer() {
                _inMemoFlushTimer && _inMemoFlushTimer.cancel();
                _inMemoFlushTimer = null;
            }

            function _shouldRetry(evt: IPostTransmissionTelemetryItem) {
                let attemptNum = evt && evt.sendAttempt || 0;
                return attemptNum <= _maxRetry;
            }


            function _getCoreItemCtx(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {
                if (coreConfig) {
                    // Make sure the extensionConfig exists
                    coreConfig.extensionConfig = coreConfig.extensionConfig || [];
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


            function _getPayload(telemetryItem: IPostTransmissionTelemetryItem | ITelemetryItem) {
             
                // construct an envelope that Application Insights endpoint can understand
                // if ikey of telemetry is provided and not empty, envelope will use this iKey instead of senderConfig iKey
                let diagLogger =  _self.diagLog();
                let defaultEnvelopeIkey = telemetryItem.iKey || _ikey;
                let aiEnvelope = Sender.constructEnvelope(telemetryItem, defaultEnvelopeIkey,diagLogger);
                if (!aiEnvelope) {
                    _throwInternal(diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                    return;
                }
                // check if the incoming payload is too large, truncate if necessary
                let payload: string = _serializer.serialize(aiEnvelope);
                return payload;
            }

            function _constructPayloadData(evts: IPostTransmissionTelemetryItem[] | ITelemetryItem[]) {
                // TODO: hanlde more fields
                try {
                    let payloadArr:string[] = [];
                    arrForEach(evts, (evt) => {
                        let payload = _getPayload(evt)
                        payloadArr.push(payload);
                    });
                    let payload = "[" + payloadArr.join(",") + "]";
                    let payloadData: IPayloadData = {
                        urlString: _urlCfg.url,
                        data: payload
                    }
                    return payloadData;

                } catch(e) {
                    // add logging

                }
                return null;
            }

            function _createUrlConfig(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {

                _self._addHook(onConfigChange(coreConfig, (details) => {
                    let storageConfig: ILocalStorageConfiguration = null;
                    let theConfig = details.cfg;

                    let ctx = createProcessTelemetryContext(null, theConfig, core);
                    storageConfig = ctx.getExtCfg<ILocalStorageConfiguration>(_self.identifier, defaultLocalStorageConfig);

                    let urlFound = false;
                    let urlConfig: IUrlLocalStorageConfig = null;
                    let curUrl = coreConfig.endpointUrl;
                    arrForEach(_initializedUrls, (kConfig) => {
                        if (kConfig.url === curUrl) {
                            urlFound = true;
                            urlConfig = kConfig;
                            return -1;
                        }
                    });
                    // if initialized, do nothing currently!
                    // TODO: Handle changes

                    if (!urlFound) {
                        let coreRootCtx = _getCoreItemCtx(coreConfig, core, extensions, pluginChain);
                        let providerContext: ILocalStorageProviderContext = {
                            itemCtx: coreRootCtx,
                            storageConfig: storageConfig,
                            id: _self.id
                        };
                        let handler = new OfflineBatchHandler(storageConfig, core, _self.diagLog(), _self._unloadHooks)
                        urlConfig = {
                            iKey: coreConfig.instrumentationKey,
                            url: curUrl,
                            minPersistenceCacheLevel: eEventPersistenceValue.Normal,
                            coreRootCtx: coreRootCtx,
                            providerContext: providerContext,
                            batchHandler: handler
                        };
                        let evtsLimit = storageConfig.eventsLimitInMem;
                        let inMemoBatch = new InMemoryBatch(_self.diagLog(),curUrl, null, evtsLimit);
                        _inMemoBatches[curUrl] = inMemoBatch;
                        _initializedUrls.push(urlConfig);
                        _inMemoTimerOut = storageConfig.inMemoMaxTime;
                        _maxRetry = storageConfig.maxRetry;
                        _ikey = coreConfig.instrumentationKey;
                    }
                    _urlCfg = urlConfig;

                }));
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
     * Flush to send data immediately; channel should default to sending data asynchronously. If executing asynchronously and
     * you DO NOT pass a callback function then a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the flush is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param sync - send data synchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @returns - If a callback is provided `true` to indicate that callback will be called after the flush is complete otherwise the caller
     * should assume that any provided callback will never be called, Nothing or if occurring asynchronously a
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) which will be resolved once the unload is complete,
     * the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) will only be returned when no callback is provided
     * and async is true.
     */
    public flush(sync: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): boolean | void | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }
}
