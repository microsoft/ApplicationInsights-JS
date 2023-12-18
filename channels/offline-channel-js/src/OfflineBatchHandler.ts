

import { IAppInsightsCore, IConfiguration, IDiagnosticLogger, IPayloadData, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryPluginChain, ITelemetryUnloadState, IUnloadHookContainer, IXHROverride, isNotNullOrUndefined } from "@microsoft/applicationinsights-core-js";
import { IOfflineBatchHandler } from "./applicationinsights-offlinechannel-js";
import { IOfflineBatchCleanResponse, IOfflineBatchResponse, IOfflineBatchStoreResponse, OfflineBatchCallback, OfflineBatchStoreCallback, eBatchSendStatus, eBatchStoreStatus } from "./Interfaces/IOfflineBatch";
import { IPromise, createAsyncPromise, createPromise, ITaskScheduler, createTaskScheduler, doAwaitResponse, AwaitResponse } from "@nevware21/ts-async";
import { IConfig, ITelemetryContext } from "@microsoft/applicationinsights-common";
import dynamicProto from "@microsoft/dynamicproto-js";
import { ILocalStorageConfiguration, ILocalStorageProviderContext, IOfflineProvider, IStorageTelemetryItem, eStorageProviders } from "./Interfaces/IOfflineProvider";
import { IndexedDbProvider } from "./Providers/IndexDbProvider";
import { WebStorageProvider } from "./Providers/WebStorageProvider";
import { IInMemoryBatch } from "./Interfaces/IInMemoryBatch";
import { InMemoryBatch } from "./InMemoryBatch";
import { ITimerHandler } from "@nevware21/ts-utils";

const MaxStorageProviderConfig = 2;
const InMemoTimer = 0.500;          // This needs to be in seconds, so this is 500ms
const OfflineSch = "OfflineStorage";

export class OfflineBatchHandler implements IOfflineBatchHandler {
    constructor(config: ILocalStorageConfiguration, core: IAppInsightsCore, logger: IDiagnosticLogger, unloadHookContainer?: IUnloadHookContainer) {
        dynamicProto(OfflineBatchHandler, this, (_self) => {
            let _inMemoBuffer: InMemoryBatch;
            let _isInitialized: boolean;
            let _logger: IDiagnosticLogger;
            let _provider: IOfflineProvider;
            let _storageScheduler: ITaskScheduler;
            let _itemCtx: IProcessTelemetryContext;
            let _evts: number;


            _initDefaults();

            _self.initialize = (providerContext: ILocalStorageProviderContext) => {
                // TODO: handle dynamic changes here
                if (!_isInitialized) {
                    _logger = logger || core.logger;
                    _itemCtx = providerContext.itemCtx;
                    //_inMemoBuffer = new InMemoryBatch(_logger, config);
                    // Get the current logger instance
                    _storageScheduler = createTaskScheduler(createAsyncPromise, OfflineSch);
                    _provider = _initProvider(providerContext);
                }
                _isInitialized = true;
            }
            

            _self.storeBatch = (batch: IPayloadData, cb?: OfflineBatchStoreCallback, sync?: boolean) => {
              
                try {
                    _queueStorageEvent("storeBatch", (evtName) => {
                        return createPromise((resolve) => {
                            let evt = _getOfflineEvt(batch);
                            return doAwaitResponse(_provider.addEvent(evt.id, evt, _itemCtx), (response: AwaitResponse<IStorageTelemetryItem>) => {
                                try {
                                    let evt = response.value || response.reason || [];
                                    let state = eBatchStoreStatus.Failure;
                                    if (!response.rejected) {
                                        state = eBatchStoreStatus.Success;
                                        _evts = evt || 0;
                                        _evts ++;
                                    }
                                    let res = {state: state, item: evt}
                                    // *********************************************************************************************************
                                    // TODO: handle status map
                                    cb && cb(res);
                                    resolve(res);
                                } catch(e) {
                                    // *********************************************************************************************************
                                    // TODO: log & report error
                                    //should add reject?
                                    resolve(false);
                                }
                            });
                        });
                        
                    });

                } catch(e) {
                    // *********************************************************************************************************
                    // TODO: log & report error
                    
                }
            
                return null;

            }

            _self.sendNextBatch = (cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride) => {
                try {
                    _queueStorageEvent("sendNextBatch", (evtName) => {
                        return createPromise((resolve) => {
                            return doAwaitResponse(_provider.getAllEvents(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                                try {
                                    let evts = response.value || [];
                                    _evts = evts.length;
                                    for (let lp = 0; lp < evts.length; lp++) {
                                        try {
                                            let evt = evts[lp].pd;
                                            if (xhrOverride && xhrOverride.sendPOST) {
                                                let sender = xhrOverride.sendPOST; // use transports
                                                let onCompleteCallback = (status: number, headers: {
                                                    [headerName: string]: string;
                                                }, res?: string) => {
                                                    if (status == 200) { // status code (e.g: invalid key) drop payload
                                                        _evts -= _evts;
                                                        
                                                    } else {
                                                        // add back to storage
                                                        // CHECK INVLAID RES FROM SERVER< DROP THEM!!!!!

                                                    }
                                                    cb && cb({state: eBatchSendStatus.Complete, data: evt});
                                                    resolve(evt)
                                                    // *********************************************************************************************************
                                                    // TODO: handle status map
                                                };
                                                return sender(evt, onCompleteCallback, sync)
                                            }
                                        } catch (e) {
                                            // Add some sort of diagnostic logging
                                        }
                                    }
    
                                } catch(e) {
                                    // *********************************************************************************************************
                                    // TODO: log & report error
                                }
                            });
                        });
                       
                    });

                } catch(e) {
                    // *********************************************************************************************************
                    // TODO: log & report error
                }
            
                return null;
            }

            _self.hasStoredBatch = (cb?: (hasBatches: boolean) => void) => {
                try {
                    _queueStorageEvent("sendNextBatch", (evtName) => {
                        return createPromise((resolve) => {
                            try {
                                // if (isNotNullOrUndefined(_evts)) {
                                //     let hasEvts = _evts > 0;
                                //     cb(hasEvts);
                                //     resolve(hasEvts);
                                // }
                                return doAwaitResponse(_provider.getAllEvents(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                                    try {
                                        let evts = response.value || [];
                                        _evts = evts.length;
                                        let hasEvts = _evts > 0;
                                        cb && cb(hasEvts);
                                        resolve(hasEvts);
                                    } catch(e) {
                                        // *********************************************************************************************************
                                        // TODO: log & report error
                                    }
                                });
                            } catch (e) {
                                // *********************************************************************************************************
                                // TODO: log & report error
                            }
                        })
                        

                    });
                    
                } catch (e) {
                    // *********************************************************************************************************
                    // TODO: log & report error

                }
                return null;
            }

            _self.cleanStorage = (cb?:(res: IOfflineBatchCleanResponse) => void) => {
                try {
                    _queueStorageEvent("cleanStorage", (evtName) => {
                        return createPromise((resolve) => {
                            // note: doawaitres currently returns undefined
                            return doAwaitResponse(_provider.clear(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                            
                                try {
                                    let cnt = 0;
                                    if (!response.rejected) {
                                        let evts = response.value || [];
                                        cnt = evts.length;
                                        _evts -= cnt;
                                    }
                                    let res = {batchCnt: cnt} as IOfflineBatchCleanResponse;
                                    cb && cb(res); // get value. make sure to use callback
                                    resolve(res); // won't get val
        
                                } catch(e) {
                                    // *********************************************************************************************************
                                    // TODO: log & report error
                                }
                            });
                        });
                    });
                    
                } catch (e) {
                    // *********************************************************************************************************
                    // TODO: log & report error

                }
                return null;
            }

            _self.teardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _provider && _provider.teardown();
                _initDefaults();
            };

            function _initDefaults() {
                _inMemoBuffer = null;
                _provider = null;
                _isInitialized = false;
                _storageScheduler = null;
                _evts = null;
            }


          

            function _tryGetIndexedDbProvider(providerContext: ILocalStorageProviderContext): IOfflineProvider {
                let newProvider = new IndexedDbProvider(undefined, unloadHookContainer);
                if (!newProvider.initialize(providerContext)) {
                    // Failed to initialize the provider
                    newProvider = null;
                }

                return newProvider;
            }

            function _tryGetWebStorageProvider(storageType: string, providerContext: ILocalStorageProviderContext): IOfflineProvider {
                let newProvider = new WebStorageProvider(storageType, undefined, unloadHookContainer);
                if (!newProvider.initialize(providerContext)) {
                    // Failed to initialize the provider
                    newProvider = null;
                }

                return newProvider;
            }

            function _initProvider(providerContext: ILocalStorageProviderContext): IOfflineProvider {
                let providers = providerContext.storageConfig.providers;
                let newProvider: IOfflineProvider = null;
                let lp: number = 0;
                while (!newProvider && lp < providers.length && lp < MaxStorageProviderConfig) {
                    switch (providers[lp++]) {
                    case eStorageProviders.LocalStorage:
                        newProvider = _tryGetWebStorageProvider("localStorage", providerContext);
                        break;
                    case eStorageProviders.SessionStorage:
                        newProvider = _tryGetWebStorageProvider("sessionStorage", providerContext);
                        break;
                    case eStorageProviders.IndexedDb:
                        newProvider = _tryGetIndexedDbProvider(providerContext);
                        break;
                    }
                }

                return newProvider;
            }

            
            function _queueStorageEvent<T>(eventName: string, callback: (evtName?: string) => T | IPromise<T>) {
                if (!_storageScheduler) {
                    _storageScheduler = createTaskScheduler(createAsyncPromise, OfflineSch);
                }

                _storageScheduler.queue((evtName) => {
                    return callback(evtName);
                }, eventName).catch((reason) => {
                    // Just handling any rejection to avoid an unhandled rejection event
                });
            }

            function _getOfflineEvt(batch: IPayloadData) {
                // *********************************************************************************************************
                // TODO: add details
                return {
                    id: batch.urlString,
                    pd: batch
                } as IStorageTelemetryItem
            }

        });
    }

    /**
     * Initializes the provider using the config
     * @returns True if the provider is initialized and available for use otherwise false
     */
    public initialize(providerContext: ILocalStorageProviderContext) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

  
    public storeBatch(batch: IPayloadData, cb?: OfflineBatchStoreCallback, sync?: boolean): undefined | boolean | IPromise<IOfflineBatchStoreResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public sendNextBatch(cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride): undefined | boolean | IPromise<IOfflineBatchResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;

    }
    public hasStoredBatch(callback?: (hasBatches: boolean) => void): undefined | boolean | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }
    
    public cleanStorage(cb?:(res: IOfflineBatchCleanResponse) => void ): undefined | boolean | IPromise<IOfflineBatchCleanResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public teardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    };
}

