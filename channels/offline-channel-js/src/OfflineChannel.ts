
import dynamicProto from "@microsoft/dynamicproto-js";
import { BreezeChannelIdentifier, IConfig, IEnvelope, IOfflineListener, ISample, ProcessLegacy, SampleRate, createOfflineListener } from "@microsoft/applicationinsights-common";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IConfigDefaults, IConfiguration, IDiagnosticLogger, INotificationListener, IPayloadData, IPlugin,
    IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryItem, ITelemetryPluginChain, ITelemetryUnloadState,
    SendRequestReason, _eInternalMessageId, _throwInternal, _warnToConsole, arrForEach, createProcessTelemetryContext, dateNow, doPerf, eLoggingSeverity,
    getExceptionName,
    onConfigChange,
    runTargetUnload
} from "@microsoft/applicationinsights-core-js";
import { AwaitResponse, IPromise, ITaskScheduler, createAsyncPromise, createTaskScheduler, doAwaitResponse } from "@nevware21/ts-async";
import { ITimerHandler, dumpObj, isArray, isNullOrUndefined, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
import { isGreaterThanZero } from "./Helpers/Utils";
import { InMemoryBatch } from "./InMemoryBatch";
import { IPostTransmissionTelemetryItem } from "./Interfaces/IInMemoryBatch";
import {
    IOfflineBatchCleanResponse, IOfflineBatchResponse, IOfflineBatchStoreResponse, OfflineBatchCallback, OfflineBatchStoreCallback, eBatchSendStatus, eBatchStoreStatus
} from "./Interfaces/IOfflineBatch";
import {
    ILocalStorageConfiguration, ILocalStorageProviderContext, IStorageTelemetryItem, eEventPersistenceValue, eStorageProviders
} from "./Interfaces/IOfflineProvider";
import { OfflineBatchHandler } from "./OfflineBatchHandler";
import { isValidPersistenceLevel } from "./Providers/IndexDbProvider";
import { Sender } from "./Sender";
import { Serializer } from "./Serializer";
import { IOfflineBatchHandler } from "./applicationinsights-offlinechannel-js";


// *****************************************************************************
// TODO: max retry


const version = "#version#";
const DefaultOfflineIdentifier = "OflineChannel";
const emptyStr = "";
const DefaultBatchInterval = 15000;
const WaitIdleIdleInterval = 10000;

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

const DefaultBatchSizeLimitBytes = 63000; // approx 64kb (the current Edge, Firefox and Chrome max limit)

const defaultLocalStorageConfig: IConfigDefaults<ILocalStorageConfiguration> = objDeepFreeze({
    maxStorageSizeInBytes: { isVal: isGreaterThanZero, v: 5000000 },
    storageKey: undefValue,
    minPersistenceLevel: { isVal: isValidPersistenceLevel, v: eEventPersistenceValue.Normal },
    providers: [eStorageProviders.LocalStorage, eStorageProviders.IndexedDb],
    indexedDbName: undefValue,
    maxStorageItems: { isVal: isGreaterThanZero, v: undefValue},
    inMemoMaxTime: 2000,
    maxRetry: 1,
    maxBatchsize:{ isVal: isGreaterThanZero, v: DefaultBatchSizeLimitBytes},
    maxSentBatchInterval: { isVal: isGreaterThanZero, v: DefaultBatchInterval},
    senderCfg: undefValue
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
            //let _inMemoBatches: {[endpoint: string]: InMemoryBatch}; // arr, not map
            let _inMemoBatch: InMemoryBatch;
            let _sender: Sender;
            let _urlCfg: IUrlLocalStorageConfig;
            let _offlineListener: IOfflineListener;
            let _inMemoFlushTimer: ITimerHandler;
            let _inMemoTimerOut: number;
            let _maxRetry: number;
            let _ikey: string;
            let _serializer: Serializer;
            let _handler:  IOfflineBatchHandler; // TODO: use the current
            let _disableTelemetry: boolean;
            let _diagLogger:IDiagnosticLogger;
            let _endpoint: string;
            let _sample: ISample;
            let _maxBatchSize: number;
            let _sendNextBatchTimer: ITimerHandler;
            let _headers: { [name: string]: string };
            let _convertUndefined: any;
            let _retryAt: number;
            let _maxBatchInterval: number;
            let _consecutiveErrors: number;
    

            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => {
                doPerf(core, () => "LocalStorageChannel.initialize", () => {
                    if (!_hasInitialized) {

                        _base.initialize(coreConfig, core, extensions);

                     
                        _base.setInitialized(false);
                        _hasInitialized = true;

                        _storageScheduler = createTaskScheduler(createAsyncPromise, "OfflineChannel");
                        _diagLogger = _self.diagLog();
                    
                        let ctx = _getCoreItemCtx(coreConfig, core, extensions, pluginChain);
                        _sender.initialize(coreConfig, core, ctx,  _diagLogger);
                        _offlineListener = createOfflineListener(); // or to be passed
                        _serializer = new Serializer(_self.diagLog());
                    }

                    _createUrlConfig(coreConfig, core, extensions, pluginChain);
                    _setSendNextTimer();
                }, () => ({coreConfig, core, extensions, pluginChain}));
            };

            _self.processTelemetry = (evt: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                try {
                    if (_disableTelemetry) {
                        // Do not send/save data
                        _self.processNext(evt, itemCtx);
                        return;
                    }

                    if (_hasInitialized && !_paused ) {
                        let shouldProcess = _shouldProcess(evt);
                        if(!shouldProcess) {
                            _self.processNext(evt, itemCtx);
                            return;
                        }
                 
                        itemCtx = _self._getTelCtx(itemCtx);
                        let onlineStatus = _offlineListener.isOnline();
                        if (!!onlineStatus) {
                            _self.processNext(evt, itemCtx);
                        } else {
                            let item = evt as IPostTransmissionTelemetryItem;
                            item.persistence = item.persistence || eEventPersistenceValue.Normal;
                            if (_shouldCacheEvent(_urlCfg, item) && _inMemoBatch) {
                                _inMemoBatch.addEvent(evt);
                            }
                        }
                        _setupInMemoTimer();
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
                    let shouldContinue = true;
                    while (_inMemoBatch.count() && shouldContinue) {
                        shouldContinue = _flushInMemoItems(true);
                    }
                    
                }
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

            _self.getOfflineListener = () => {
                return _offlineListener;

            }

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _self.onunloadFlush();
                runTargetUnload(_offlineListener, false);
                let handler = _urlCfg.batchHandler;
                handler && handler.teardown();
                _initDefaults();
            };


            _self["_getDbgPlgTargets"] = () => {
                return [_initializedUrls];
            };
            

            function _initDefaults() {
                _hasInitialized = false;
                _paused = false;
                _storageScheduler = null;
                _initializedUrls = [];
                //_inMemoBatches= null;
                _sender = new Sender();
                _urlCfg = null;
                _offlineListener = null;
                _maxRetry = null;
                _ikey = null;
                _serializer = null;
                _disableTelemetry = false;
                _diagLogger = null;
                _endpoint = null;
                _inMemoBatch = null;
                _sample = null;
                _convertUndefined = undefValue;
                _maxBatchSize = null;
                _sendNextBatchTimer = null;
                _consecutiveErrors = null;
                _retryAt = null;
                _maxBatchInterval = null;
                _headers = {};
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

            function _shouldProcess(evt: ITelemetryItem) {
                if (!evt ||  (evt.baseData && !evt.baseType) ) {
                    return false;
                }
    
                if (!evt.baseType) {
                    // Default
                    evt.baseType = "EventData";
                }

                // check if this item should be sampled in, else add sampleRate tag
                // TODO: should we process it here?
                if (!_isSampledIn(evt)) {
                    // Item is sampled out, do not send it
                    _throwInternal(_diagLogger, eLoggingSeverity.WARNING, _eInternalMessageId.TelemetrySampledAndNotSent,
                        "Telemetry item was sampled out and not sent", { SampleRate: _sample.sampleRate });
                    return false;
                } else {
                    evt[SampleRate] = _sample.sampleRate;
                }

                return true;

            }

            function _isSampledIn(envelope: ITelemetryItem): boolean {
                return _sample.isSampledIn(envelope);
            }


            function _shouldCacheEvent(urlConfig: IUrlLocalStorageConfig, item: IPostTransmissionTelemetryItem) {
                if (item.persistence < urlConfig.minPersistenceCacheLevel) {
                    return false;
                }

                return true;
            }


            function _setupInMemoTimer() {
                if (!_inMemoFlushTimer) {
                    _inMemoFlushTimer = scheduleTimeout(() => {
                        _inMemoFlushTimer = null;
                        _flushInMemoItems();
                        _setupInMemoTimer();
                        
                    }, _inMemoTimerOut);
                    _inMemoFlushTimer.unref();
                }
            }

            function _flushInMemoItems(sync?: boolean) {
                try {
                    let inMemo = _inMemoBatch;
                    let evts = inMemo.getItems();
                    let payloadArr:string[] = [];
                    let size = 0;
                    let cnt = 0;
                    let criticalCnt = 0;
                    arrForEach(evts, (evt, index) => {
                        let curEvt = evt as IPostTransmissionTelemetryItem
                        cnt = index;
                        let payload = _getPayload(curEvt);
                        size += payload.length;
                        if (size > _maxBatchSize) {
                            return;
                        }
                        if(curEvt.persistence == eEventPersistenceValue.Critical) {
                            criticalCnt ++;
                        }
                        payloadArr.push(payload);

                    });
                    let sentItems = evts.slice(0, cnt);
                    if (cnt < evts.length - 1) {
                        _inMemoBatch = _inMemoBatch.createNew(_endpoint, evts.slice(cnt));
                    }
                    let payloadData = _constructPayloadData(payloadArr, criticalCnt);
                    let callback: OfflineBatchStoreCallback = (res) => {
                        if (res.state == eBatchStoreStatus.Failure ) {
                            arrForEach(sentItems, (item) => {
                                _inMemoBatch.addEvent(item)
                            })
                        }
                    }
                    if (payloadData) {
                        _queueStorageEvent("storeOfflineEvents", (evtName) => {
                            return _urlCfg.batchHandler.storeBatch(payloadData, callback, sync) as any;
                        });
                    }

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
                return null;

            }

            function _setSendNextTimer() {
           
                if(!_sendNextBatchTimer) {
                    _sendNextBatchTimer = null;
                    let retryInterval = _retryAt ? Math.max(0, _retryAt - dateNow()) : 0;
                    let timerValue = Math.max(_maxBatchInterval, retryInterval);
                    _sendNextBatchTimer = scheduleTimeout(() => {
                        if (_offlineListener.isOnline()) {
                            if(!_sender.isCompletelyIdle()) {
                                timerValue = WaitIdleIdleInterval;

                            } else {
                                let callback:  OfflineBatchCallback = (res) => {
                                    if (res.state == eBatchSendStatus.Failure) {
                                        _consecutiveErrors ++;
                                    }
                                }
                                _queueStorageEvent("sendNextBatch", (evtName) => {
                                    return _urlCfg.batchHandler.sendNextBatch(callback) as any;
                                });

                            }
                           
                        }
                        // if offline, do nothing;
                        _setSendNextTimer();

                    },timerValue);
                    _sendNextBatchTimer.unref();
                }
            }

            function _clearScheduledTimer() {
                _inMemoFlushTimer && _inMemoFlushTimer.cancel();
                _sendNextBatchTimer && _sendNextBatchTimer.cancel();
                _inMemoFlushTimer = null;
                _sendNextBatchTimer = null;
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
                        let defaultEnvelopeIkey = evt.iKey || _urlCfg.iKey;
                        let aiEnvelope = Sender.constructEnvelope(evt, defaultEnvelopeIkey, _diagLogger, _convertUndefined);
                        if (!aiEnvelope) {
                            _throwInternal(_diagLogger, eLoggingSeverity.CRITICAL, _eInternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                            return emptyStr;
                        }
            
                        let doNotSendItem = false;
                        // this is for running in legacy mode, where customer may already have a custom initializer present
                        if (evt.tags && evt.tags[ProcessLegacy]) {
                            arrForEach(evt.tags[ProcessLegacy], (callBack: (env: IEnvelope) => boolean | void) => {
                                try {
                                    if (callBack && callBack(aiEnvelope) === false) {
                                        doNotSendItem = true;
                                        _warnToConsole(_diagLogger, "Telemetry processor check returns false");
                                    }
                                } catch (e) {
                                    // log error but dont stop executing rest of the telemetry initializers
                                    // doNotSendItem = true;
                                    _throwInternal(_diagLogger,
                                        eLoggingSeverity.CRITICAL, _eInternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + getExceptionName(e),
                                        { exception: dumpObj(e) }, true);
                                }
                            });
            
                            delete evt.tags[ProcessLegacy];
                        }
                        if (doNotSendItem) {
                            return emptyStr; // do not send, no need to execute next plugin
                        }
        
                        let payload: string = _serializer.serialize(aiEnvelope);
                        return payload;
                    }
                    
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
                
            }

            function _constructPayloadData(payloads: string[], criticalCnt?: number) {
                // TODO: hanlde more fields
                try {
                    let cnt = criticalCnt || 0;
                    let payloadArr:string[] = [];
                    let payload = "[" + payloadArr.join(",") + "]";
                    let payloadData: IPayloadData = {
                        urlString: _urlCfg.url,
                        data: payload,
                        headers: _headers,
                        criticalCnt: cnt
                    } as IStorageTelemetryItem;
                    return payloadData;

                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return null;
            }

            function _setHeaders(headers: [{header: string, value: string}]) {
                try {
                    if (!headers || !isArray(headers) || headers.length) {
                        return;
                    }
                    let map = {};
                    arrForEach(headers, (item) => {
                        map[item.header] = item.value
                    });
                    _headers = map;

                } catch (e) {
                    // eslint-disable-next-line no-empty

                }
            }

            function _createUrlConfig(coreConfig: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) {

                _self._addHook(onConfigChange(coreConfig, (details) => {
                    let storageConfig: ILocalStorageConfiguration = null;
                    let theConfig = details.cfg;

                    let ctx = createProcessTelemetryContext(null, theConfig, core);
                    storageConfig = ctx.getExtCfg<ILocalStorageConfiguration>(_self.identifier, defaultLocalStorageConfig);

                    let urlConfig: IUrlLocalStorageConfig = null;
                    let curUrl = coreConfig.endpointUrl;

                    if (curUrl !== _endpoint) {
                        // if (_inMemoBatch && _inMemoBatch.count()) {
                        // }
                        let coreRootCtx = _getCoreItemCtx(coreConfig, core, extensions, pluginChain);
                        let providerContext: ILocalStorageProviderContext = {
                            itemCtx: coreRootCtx,
                            storageConfig: storageConfig,
                            id: _self.id
                        };
                        let handler = new OfflineBatchHandler(_self.diagLog(), _self._unloadHooks);
                        handler.initialize(providerContext);
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
                        _inMemoBatch = inMemoBatch;
                        
                        //_inMemoBatches[curUrl] = inMemoBatch;
                        _initializedUrls.push(urlConfig);
                        _inMemoTimerOut = storageConfig.inMemoMaxTime;
                        _maxRetry = storageConfig.maxRetry;
                        _ikey = coreConfig.instrumentationKey;
                        let onlineConfig = ctx.getExtCfg<any>(BreezeChannelIdentifier, {});
                        let offlineSenderCfg = storageConfig.senderCfg;
                        let disable = offlineSenderCfg.disableTelemetry;
                        let disableTelemetry = !isNullOrUndefined(disable)? disable : onlineConfig.disableTelemetry;
                        _disableTelemetry = !!disableTelemetry;
                        _convertUndefined = offlineSenderCfg.convertUndefined || onlineConfig.convertUndefined;
                        let headers = offlineSenderCfg.customHeaders || onlineConfig.ustomHeaders;
                        _setHeaders(headers);
                        _endpoint = curUrl;
                        _setRetryTime();
                        _maxBatchInterval = storageConfig.maxSentBatchInterval;
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

    
    public getOfflineListener() {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
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

    /**
     * Flush the batched events synchronously (if possible -- based on configuration).
     * Will not flush if the Send has been paused.
     */
    public onunloadFlush() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
