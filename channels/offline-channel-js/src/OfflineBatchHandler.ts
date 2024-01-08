
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, IPayloadData, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IUnloadHookContainer,
    IXHROverride, OnCompleteCallback, isNullOrUndefined, isObject
} from "@microsoft/applicationinsights-core-js";
import {
    AwaitResponse, IPromise, createAsyncRejectedPromise, createPromise,
    doAwaitResponse
} from "@nevware21/ts-async";
import {
    IOfflineBatchCleanResponse, IOfflineBatchResponse, IOfflineBatchStoreResponse, OfflineBatchCallback, OfflineBatchStoreCallback,
    eBatchSendStatus, eBatchStoreStatus
} from "./Interfaces/IOfflineBatch";
import { ILocalStorageProviderContext, IOfflineProvider, IStorageTelemetryItem, eStorageProviders } from "./Interfaces/IOfflineProvider";
import { IndexedDbProvider } from "./Providers/IndexDbProvider";
import { WebStorageProvider } from "./Providers/WebStorageProvider";
import { IOfflineBatchHandler } from "./applicationinsights-offlinechannel-js";


const MaxStorageProviderConfig = 2;

export class OfflineBatchHandler implements IOfflineBatchHandler {
    constructor(logger?: IDiagnosticLogger, unloadHookContainer?: IUnloadHookContainer) {
        dynamicProto(OfflineBatchHandler, this, (_self) => {
            let _isInitialized: boolean;
            let _logger: IDiagnosticLogger;
            let _provider: IOfflineProvider;
            let _unloadProvider: IOfflineProvider;
            let _itemCtx: IProcessTelemetryContext;
            let _evts: number;
            let _maxRetryCnt: number;
            let _retryCodes: number[];
            let _consecutiveErrors: number;
     


            _initDefaults();

            _self.initialize = (providerContext: ILocalStorageProviderContext) => {
                // TODO: handle provider change
                try {
                    if (!_isInitialized) {
                        _logger = logger || providerContext.itemCtx.diagLog();
                        _itemCtx = providerContext.itemCtx;
                        _provider = _initProvider(providerContext);
                        let storeCfg = providerContext.storageConfig || {};
                        _maxRetryCnt = storeCfg.maxRetry || 2;
                        _retryCodes = (storeCfg.senderCfg || {}).retryCodes;
                        if (_provider) {
                            _isInitialized = true;
                        }
                    }
                   
                } catch(e) {
                    _isInitialized = false;
                    
                }
                return _isInitialized;
                
            }

            _self["_getDbgPlgTargets"] = () => {
                return [_provider, _isInitialized, _unloadProvider];
            };
            

            _self.storeBatch = (batch: IPayloadData, cb?: OfflineBatchStoreCallback, sync?: boolean) => {
              
                try {
                    let provider = _provider;
                    if(!!sync) {
                        provider = _unloadProvider;
                    }
                    return createPromise((resolve) => {
                        let evt = _getOfflineEvt(batch);
                        return doAwaitResponse(provider.addEvent(evt.id as any, evt as any, _itemCtx), (response: AwaitResponse<any>) => {
                            try {
                                let evt = response.value || response.reason || [];
                                let state = eBatchStoreStatus.Failure;
                                if (!response.rejected) {
                                    state = eBatchStoreStatus.Success;
                                    _evts = evt || 0;
                                }
                                let res = {state: state, item: evt};
                                cb && cb(res);
                                resolve(res);
                            } catch(e) {
                                
                                // TODO: log & report error
                                //resolve({state: eBatchStoreStatus.Failure});
                                //cb({state: eBatchStoreStatus.Failure})
                                createAsyncRejectedPromise(e);
                            }
                        });
                    });
                    

                } catch(e) {
                    // TODO: log & report error
                    
                }
            
                return null;

            }

            _self.sendNextBatch = (cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride, cnt: number = 1) => {
                try {
                    return createPromise((resolve) => {
                        let provider = _provider;
                        try {
                            if (_unloadProvider.getAllEvents()) {
                                // always try to send ones from local storage
                                provider = _unloadProvider;
                            }

                        } catch(e) {
                            // eslint-disable-next-line no-empty
                        }
                       
                        return doAwaitResponse(provider.getAllEvents(cnt), (response: AwaitResponse<any[]>) => {
                            try {
                                if(!response || response.rejected) {
                                    
                                    cb && cb({state: eBatchSendStatus.Failure,data: null});
                                    resolve({state: eBatchSendStatus.Failure,data: null});
                                    return;
                                }
                                let evts = response.value || [];
                                _evts = evts.length;
                                if (evts.length) {
                                    return doAwaitResponse(provider.removeEvents(evts), (res) => {
                                        
                                        if(!res.rejected && res.value) {
                                            let deletedItems = res.value;
                                            for (let lp = 0; lp <  deletedItems.length; lp++) {
                                                try {
                                                    let evt = evts[lp];
                                                    if (!_shouldSend(evt)) {
                                                        cb && cb({state: eBatchSendStatus.Drop, data: evt});
                                                        resolve({state: eBatchSendStatus.Drop, data: evt});
                                                    } else if (xhrOverride && xhrOverride.sendPOST) {
                                                        evt.attempCnt++
                                                        let sender = xhrOverride.sendPOST; // use transports
                                                        let onCompleteCallback = (status: number, headers: {
                                                            [headerName: string]: string;
                                                        }, res?: string) => {
                                                            if (status == 200) { // status code (e.g: invalid key) drop payload
                                                                // TODO: minify
                                                                cb && cb({state: eBatchSendStatus.Complete, data: evt});
                                                                resolve({state: eBatchSendStatus.Complete, data: evt});
                                                                _consecutiveErrors = 0;
                                                                
                                                            } else {
                                                                _consecutiveErrors ++;
                                                                let isRetriable = _isRetriable(status);
                                                                if (isRetriable) {
                                                                    // TODO: minify
                                                                    cb && cb({state: eBatchSendStatus.Retry, data: evt});
                                                                    resolve({state: eBatchSendStatus.Retry, data: evt});
                                                                    _unloadProvider.addEvent(evt.id as any, evt, _itemCtx);

                                                                } else {
                                                                    // TODO: minify
                                                                    cb && cb({state: eBatchSendStatus.Drop, data: evt});
                                                                    resolve({state: eBatchSendStatus.Drop, data: evt});
                                                                }
                                                            }
                                                            
                                                            // TODO: handle status map
                                                        };
                                                        return sender(evt, onCompleteCallback, sync);
                                                       
                                                    }
                                                    return;
                                                   
                                                } catch (e) {
                                                    // Add some sort of diagnostic logging
                                                }
                                            }
                                            return;

                                        }
                                        return;
                                    
                                    });
                                }
                                return;
                               

                            } catch(e) {
                                // TODO: log & report error
                                return createAsyncRejectedPromise(e);
                            }
                        });
                    });

                } catch(e) {
                    // TODO: log & report error
                    //return createAsyncRejectedPromise(e);
                }
            
                return null;
            }

            _self.hasStoredBatch = (cb?: (hasBatches: boolean) => void) => {
                try {
                    return createPromise((resolve) => {
                        return doAwaitResponse(_provider.getAllEvents(1), (response: AwaitResponse<any | any[]>) => {
                            try {
                                let evts = response.value || [];
                                let hasEvts = evts.length > 0;
                                cb && cb(hasEvts);
                                resolve(hasEvts);
                            } catch(e) {
                                // TODO: log & report error
                                resolve(null);
                            }
                        });

                    });
                    
                } catch (e) {
                    // TODO: log & report error
                    //return createAsyncRejectedPromise(e);
                }
                return null;
                
            }

            _self.cleanStorage = (cb?:(res: IOfflineBatchCleanResponse) => void) => {
                try {
                   
                    return createPromise((resolve) => {
                        // note: doawaitresponse currently returns undefined
                        return doAwaitResponse(_provider.clear(), (response: AwaitResponse<any[]>) => {
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
                                // TODO: log & report error
                                return createAsyncRejectedPromise(e);
                            }
                        });
                    });
                    
                    
                } catch (e) {
                    // TODO: log & report error
                    //return createAsyncRejectedPromise(e);

                }
                return null;
            }

            _self.teardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _provider && _provider.teardown();
                _initDefaults();
            };

            function _initDefaults() {
                _provider = null;
                _unloadProvider = null;
                _isInitialized = false;
                _evts = null;
                _maxRetryCnt = null;
                _retryCodes = null;
                _consecutiveErrors = 0;
            }


          

            function _tryGetIndexedDbProvider(providerContext: ILocalStorageProviderContext): IOfflineProvider {
                let newProvider = new IndexedDbProvider(undefined, unloadHookContainer);
                if (!newProvider.initialize(providerContext)) {
                    // Failed to initialize the provider
                    newProvider = null;
                }

                return newProvider as any;
              
            }

            function _tryGetWebStorageProvider(storageType: string, providerContext: ILocalStorageProviderContext): IOfflineProvider {
                let newProvider = new WebStorageProvider(storageType, undefined, unloadHookContainer);
                if (!newProvider.initialize(providerContext)) {
                    // Failed to initialize the provider
                    newProvider = null;
                }

                return newProvider as any;
            }

            function _initProvider(providerContext: ILocalStorageProviderContext): IOfflineProvider {
                let providers = providerContext.storageConfig.providers;
                let newProvider: IOfflineProvider = null;
                let lp: number = 0;
                while (!newProvider && lp < providers.length && lp < MaxStorageProviderConfig) {
                    switch (providers[lp++]) {
                    case eStorageProviders.LocalStorage:
                        newProvider = _tryGetWebStorageProvider("localStorage", providerContext);
                        _unloadProvider = newProvider;
                        break;
                    case eStorageProviders.SessionStorage:
                        newProvider = _tryGetWebStorageProvider("sessionStorage", providerContext);
                        _unloadProvider = newProvider;
                        break;
                    case eStorageProviders.IndexedDb:
                        newProvider = _tryGetIndexedDbProvider(providerContext);
                        _unloadProvider = _tryGetWebStorageProvider("localStorage", providerContext);
                    }
                }

                return newProvider;
            }


            function _getOfflineEvt(batch: IPayloadData) {
                let item = batch as IStorageTelemetryItem;
                // TODO: add details
                let data = item.data;
                if (data) {
                    let isArr = isObject(data);
                    item.isArr = isArr;
                }
                return item;
            }

            /**
             * Checks if the SDK should resend the payload after receiving this status code from the backend.
             * @param statusCode
            */
            function _isRetriable(statusCode: number): boolean {
                // retryCodes = [] means should not retry
                if (!isNullOrUndefined(_retryCodes)) {
                    return _retryCodes.length && _retryCodes.indexOf(statusCode) > -1;

                }
                return statusCode === 401 // Unauthorized
                    || statusCode === 403 // Forbidden
                    || statusCode === 408 // Timeout
                    || statusCode === 429 // Too many requests.
                    || statusCode === 500 // Internal server error.
                    || statusCode === 502 // Bad Gateway.
                    || statusCode === 503 // Service unavailable.
                    || statusCode === 504; // Gateway timeout.
            }

            function _shouldSend(item: IStorageTelemetryItem): boolean {
                if (item && item.data) {
                    item.attempCnt =  item.attempCnt || 0;
                    return item.attempCnt <= _maxRetryCnt;
                }
                return false;
            }

            function _handleResponsStatus(status: number, onComplete: OnCompleteCallback) {
                if (_isRetriable(status)) {
                    //retry
                }
                
            }


        });
    }

    /**
     * Initializes the provider using the config
     * @returns True if the provider is initialized and available for use otherwise false
     */
    public initialize(providerContext: ILocalStorageProviderContext) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

  
    public storeBatch(batch: IPayloadData, cb?: OfflineBatchStoreCallback, sync?: boolean): undefined | boolean | IPromise<IOfflineBatchStoreResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public sendNextBatch(cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride, cnt?: number): undefined | boolean | IPromise<IOfflineBatchResponse> {
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
