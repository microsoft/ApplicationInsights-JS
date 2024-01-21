
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, IPayloadData, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IUnloadHookContainer,
    IXHROverride, isNullOrUndefined, isObject
} from "@microsoft/applicationinsights-core-js";
import { AwaitResponse, IPromise, createAsyncPromise, doAwaitResponse } from "@nevware21/ts-async";
import {
    IOfflineBatchCleanResponse, IOfflineBatchHandler, IOfflineBatchResponse, IOfflineBatchStoreResponse, OfflineBatchCallback,
    OfflineBatchStoreCallback, eBatchSendStatus, eBatchStoreStatus
} from "./Interfaces/IOfflineBatch";
import { ILocalStorageProviderContext, IOfflineProvider, IStorageTelemetryItem, eStorageProviders } from "./Interfaces/IOfflineProvider";
import { IndexedDbProvider } from "./Providers/IndexDbProvider";
import { WebStorageProvider } from "./Providers/WebStorageProvider";

const MaxStorageProviderConfig = 2;
const NoProviderErrMsg = "No provider is available";

export class OfflineBatchHandler implements IOfflineBatchHandler {
    constructor(logger?: IDiagnosticLogger, unloadHookContainer?: IUnloadHookContainer) {
        dynamicProto(OfflineBatchHandler, this, (_self) => {
            let _isInitialized: boolean;
            let _logger: IDiagnosticLogger;
            let _provider: IOfflineProvider;
            let _unloadProvider: IOfflineProvider;
            let _itemCtx: IProcessTelemetryContext;
            let _maxRetryCnt: number;
            let _retryCodes: number[];


            _initDefaults();

            _self.initialize = (providerContext: ILocalStorageProviderContext) => {
                // TODO: handle provider change
                try {
                    if (!_isInitialized) {
                        _logger = logger || providerContext.itemCtx.diagLog();
                        _itemCtx = providerContext.itemCtx;
                        _provider = _initProvider(providerContext);
                        let storeCfg = providerContext.storageConfig || {};
                        let retry = storeCfg.maxRetry;
                        _maxRetryCnt = !isNullOrUndefined(retry)? retry : 2;
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
                
                let provider = _provider;
                if(!!sync) {
                    provider = _unloadProvider;
                }
                return createAsyncPromise((resolve, reject) => {
                    if (!provider) {
                        reject(new Error(NoProviderErrMsg))
                    }
                    let evt = _getOfflineEvt(batch);
                    return doAwaitResponse(provider.addEvent(evt.id, evt, _itemCtx), (response: AwaitResponse<IStorageTelemetryItem>) => {
                        try {
                            let evt = response.value || response.reason || [];
                            let state = eBatchStoreStatus.Failure;
                            if (!response.rejected) {
                                state = eBatchStoreStatus.Success;
                            }
                            let res = {state: state, item: evt};
                            cb && cb(res);
                            resolve(res);
                        } catch(e) {
                            reject(e);
                        }
                    });
                });

            }

            _self.sendNextBatch = (cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride, cnt: number = 1) => {
                return createAsyncPromise((resolve, reject) => {
                    let provider = _provider;
                    try {
                       
                        if (_unloadProvider) {
                            doAwaitResponse(_unloadProvider.getNextBatch(), (res) => {
                                if (res && !res.rejected) {
                                    let unloadEvts = res.value;
                                    if (unloadEvts && unloadEvts.length) {
                                        // always try to send ones from local storage
                                        provider = _unloadProvider;
                                    }
    
                                }
                            });

                        }
                       
                    } catch(e) {
                        // eslint-disable-next-line no-empty
                    }
                    if (!provider) {
                        reject(new Error(NoProviderErrMsg));
                    }

                    return doAwaitResponse(provider.getNextBatch(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                        try {
                            if(!response || response.rejected) {
                                let res = {state: eBatchSendStatus.Failure, data: response.reason};
                                storeResolve(res);
                                return;
                            }
                            let evts = response.value || [];
                            let result = {state: eBatchSendStatus.Complete, data: null} as IOfflineBatchResponse;
                            //_evts = evts.length;
                            if (evts.length) {
                                // make sure doawait has resolve
                                return doAwaitResponse(provider.removeEvents(evts), (res) => {
                                    if(res && !res.rejected && res.value) {
                                        let deletedItems = res.value;
                                        for (let lp = 0; lp < deletedItems.length; lp++) {
                                            try {
                                                
                                                let evt = evts[lp];
                                                result.data = evt; // add data
                                                if (xhrOverride && xhrOverride.sendPOST) {
                                                    evt.attempCnt++;
                                                    let sender = xhrOverride.sendPOST; // use transports
                                                    let onCompleteCallback = (status: number, headers: {
                                                        [headerName: string]: string;
                                                    }, res?: string) => {
                                                     
                                                        if (status == 200) { // status code (e.g: invalid key) drop payload
                                                            result.state = eBatchSendStatus.Complete;
                                                            
                                                        } else {
                                                            let isRetriable = _isRetriable(evt, status);
                                                            if (isRetriable) {
                                                                result.state = eBatchSendStatus.Retry;
                                                                _unloadProvider && _unloadProvider.addEvent(evt.id, evt, _itemCtx);

                                                            } else {
                                                                result.state = eBatchSendStatus.Drop;
                                                            }
                                                        }
                                                        storeResolve(result);
                                                        
                                                    };
                                                    return doAwaitResponse(sender(evt, onCompleteCallback, sync) as any, (res) => {
                                                        // do nothing, because it should be resolved in callback
                                                    });
                                                }
                                                // call resolve
                                                result.state = eBatchSendStatus.Drop;
                                                storeResolve(result);
                                                
                                            } catch (e) {
                                                reject(e)
                                            }
                                        }
                                        // this case should never happen because this function is called after we confirm that evt is available
                                        // add resolve here in case
                                        result.state = eBatchSendStatus.Complete;
                                        storeResolve(result);

                                    }
                                    // if can not delete first, resolve
                                    result.state = eBatchSendStatus.Failure;
                                    result.data = res.reason;
                                    storeResolve(result)
                                
                                });
                            }
                            // don't have any evts returned by getNext, resolve
                            storeResolve(result);
                            
                        } catch(e) {
                            reject(e);
                        }
                    });
                    function storeResolve(result) {
                        cb && cb(result);
                        resolve(result);
                    }
                });
            }

            _self.hasStoredBatch = (cb?: (hasBatches: boolean) => void) => {
                return createAsyncPromise((resolve, reject) => {
                    if (!_provider) {
                        reject(new Error(NoProviderErrMsg))
                    }
                    return doAwaitResponse(_provider.getNextBatch(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                        try {
                            let evts = response.value || [];
                            let hasEvts = evts.length > 0;
                            cb && cb(hasEvts);
                            resolve(hasEvts);
                        } catch(e) {
                           
                            reject(e);
                        }
                    });

                });
            }

            _self.cleanStorage = (cb?:(res: IOfflineBatchCleanResponse) => void) => {
                
                return createAsyncPromise((resolve, reject) => {
                    // note: doawaitresponse currently returns undefined
                    if (!_provider) {
                        reject(new Error(NoProviderErrMsg))
                    }
                    return doAwaitResponse(_provider.clear(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                        try {
                            let cnt = 0;
                            if (!response.rejected) {
                                let evts = response.value || [];
                                cnt = evts.length;
                            }
                            let res = {batchCnt: cnt} as IOfflineBatchCleanResponse;
                            cb && cb(res); // get value. make sure to use callback
                            resolve(res); // won't get val

                        } catch(e) {
                            reject(e);
                        }
                    });
                });
                    
                
            }

            _self.teardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                _provider && _provider.teardown();
                _initDefaults();
            };

            function _initDefaults() {
                _provider = null;
                _unloadProvider = null;
                _isInitialized = false;
                _maxRetryCnt = null;
                _retryCodes = null;
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
            function _isRetriable(item: IStorageTelemetryItem, statusCode: number): boolean {
                if (!_shouldSend(item)) {
                    return false;
                }
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

  
    public storeBatch(batch: IPayloadData, cb?: OfflineBatchStoreCallback, sync?: boolean): undefined | IOfflineBatchStoreResponse | IPromise<IOfflineBatchStoreResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public sendNextBatch(cb?: OfflineBatchCallback, sync?: boolean, xhrOverride?: IXHROverride, cnt?: number): undefined | IOfflineBatchResponse | IPromise<IOfflineBatchResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;

    }
    public hasStoredBatch(callback?: (hasBatches: boolean) => void): undefined | boolean | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }
    
    public cleanStorage(cb?:(res: IOfflineBatchCleanResponse) => void ): undefined | IOfflineBatchCleanResponse | IPromise<IOfflineBatchCleanResponse> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    public teardown (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }
}
