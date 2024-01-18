
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IDiagnosticLogger, IPayloadData, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ITelemetryUnloadState, IUnloadHookContainer,
    IXHROverride, isNullOrUndefined, isObject
} from "@microsoft/applicationinsights-core-js";
import { AwaitResponse, IPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
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
                //try {
                let provider = _provider;
                if(!!sync) {
                    provider = _unloadProvider;
                }
                return createPromise((resolve, reject) => {
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
                return createPromise((resolve, reject) => {
                    let provider = _provider;
                    try {
                        if ( _unloadProvider.getNextBatch()) {
                            // always try to send ones from local storage
                            provider = _unloadProvider;
                        }

                    } catch(e) {
                        // eslint-disable-next-line no-empty
                    }
                    // change name: getNextOne
                    return doAwaitResponse(provider.getNextBatch(), (response: AwaitResponse<IStorageTelemetryItem[]>) => {
                        try {
                            if(!response || response.rejected) {
                                let res = {state: eBatchSendStatus.Failure, data: null};
                                cb && cb(res);
                                resolve(res);
                                return;
                            }
                            let evts = response.value || [];
                            //_evts = evts.length;
                            if (evts.length) {
                                // make sure doawait has resolve
                                return doAwaitResponse(provider.removeEvents(evts), (res) => {
                                    
                                    if(!res.rejected && res.value) {
                                        let deletedItems = res.value;
                                        for (let lp = 0; lp <  deletedItems.length; lp++) {
                                            try {
                                                let evt = evts[lp];
                                                if (xhrOverride && xhrOverride.sendPOST) {
                                                    evt.attempCnt++;
                                                    let sender = xhrOverride.sendPOST; // use transports
                                                    let onCompleteCallback = (status: number, headers: {
                                                        [headerName: string]: string;
                                                    }, res?: string) => {
                                                        if (status == 200) { // status code (e.g: invalid key) drop payload
                                                            // TODO: minify
                                                            cb && cb({state: eBatchSendStatus.Complete, data: evt});
                                                            resolve({state: eBatchSendStatus.Complete, data: evt});
                                                            
                                                        } else {
                                                            let isRetriable = _isRetriable(evt, status);
                                                            if (isRetriable) {
                                                                // TODO: minify
                                                                cb && cb({state: eBatchSendStatus.Retry, data: evt});
                                                                resolve({state: eBatchSendStatus.Retry, data: evt});
                                                                _unloadProvider.addEvent(evt.id, evt, _itemCtx);

                                                            } else {
                                                                // TODO: minify
                                                                cb && cb({state: eBatchSendStatus.Drop, data: evt});
                                                                resolve({state: eBatchSendStatus.Drop, data: evt});
                                                            }
                                                        }
                                                        
                                                    };
                                                    return sender(evt, onCompleteCallback, sync);
                                                    // resolve here
                                                    
                                                    
                                                }
                                                // call resolve
                                                resolve({state: eBatchSendStatus.Drop, data: evt});
                                                
                                            } catch (e) {
                                                reject(e)
                                            }
                                        }
                                        // this case should never happen because this function is called after we confirm that evt is available
                                        // add resolve here in case
                                        resolve({state: eBatchSendStatus.Complete, data: null})

                                    }
                                    // if can not delete first, resolve
                                    resolve({state: eBatchSendStatus.Failure, data: null});
                                
                                });
                            }
                            // don't have any evts returned by getNext, resolve
                            resolve({state: eBatchSendStatus.Complete, data: null})
                            

                        } catch(e) {
                            reject(e);
                        }
                    });
                });

               
            }

            _self.hasStoredBatch = (cb?: (hasBatches: boolean) => void) => {
                return createPromise((resolve, reject) => {
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
                
                   
                return createPromise((resolve, reject) => {
                    // note: doawaitresponse currently returns undefined
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

    public teardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    };
}
