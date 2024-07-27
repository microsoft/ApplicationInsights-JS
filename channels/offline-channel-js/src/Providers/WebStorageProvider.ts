// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    INotificationManager, IProcessTelemetryContext, IUnloadHookContainer, eBatchDiscardedReason, getGlobal, getJSON, isNotNullOrUndefined,
    onConfigChange
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createAsyncRejectedPromise } from "@nevware21/ts-async";
import { batchDropNotification, forEachMap, getEndpointDomain, getTimeFromId, getTimeId } from "../Helpers/Utils";
import {
    ILocalStorageProviderContext, IOfflineChannelConfiguration, IOfflineProvider, IStorageJSON, IStorageTelemetryItem
} from "../Interfaces/IOfflineProvider";
import { PayloadHelper } from "../PayloadHelper";

//TODO: move all const to one file
const EventsToDropAtOneTime = 10;
const Version = "1";
const DefaultStorageKey = "AIOffline";
const DefaultMaxStorageSizeInBytes = 5000000;
const MaxCriticalEvtsDropCnt = 2;
const DefaultMaxInStorageTime = 604800000; //7*24*60*60*1000 7days
// [Optional for version 1]: TODO: order event by time

interface IJsonStoreDetails {
    key: string;
    db: IStorageJSON;
}

// Private helper methods that are not exposed as class methods
function _isQuotaExceeded(storage: Storage, e) {
    let result = false;
    if (e instanceof DOMException) {
        // test name field too, because code might not be present
        if (e.code === 22 || e.name === "QuotaExceededError" ||            // everything except Firefox
            e.code === 1014 || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {   // Firefox
            if (storage && storage.length !== 0) {
                // acknowledge QuotaExceededError only if there's something already stored
                result = true;
            }
        }
    }

    return result;
}

/**
* Check and return that the storage type exists and has space to use
*/
function _getAvailableStorage(type: string): Storage {
    let global = getGlobal() || ({} as Window);
    let storage: Storage = null;
    try {
        storage = ((global[type]) as Storage);
        if (storage) {
            let x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
        }
    } catch (e) {
        if (!_isQuotaExceeded(storage, e)) {
            // If not Quota exception then assume not available
            storage = null;
        }
    }

    return storage;
}


// will drop batches with no critical evts first
function _dropEventsUpToPersistence(
    maxCnt: number,
    events: { [id: string]: IStorageTelemetryItem },
    eventsToDropAtOneTime: number): number {
    let dropKeys = [];
    let persistenceCnt = 0;
    let droppedEvents = 0;
    while (persistenceCnt <= maxCnt && droppedEvents < eventsToDropAtOneTime) {
        forEachMap<IStorageTelemetryItem>(events, (evt, key) => {
            if (evt.criticalCnt === persistenceCnt) {
                dropKeys.push(key);
                droppedEvents++;
            }
            return (droppedEvents < eventsToDropAtOneTime);
        });
        if (droppedEvents > 0) {
            for (let lp = 0; lp < dropKeys.length; lp++) {
                delete events[dropKeys[lp]];
            }
            return droppedEvents;
        }

        persistenceCnt++;
    }

    return droppedEvents;
}

function _dropMaxTimeEvents(
    maxStorageTime: number,
    events: { [id: string]: IStorageTelemetryItem },
    eventsToDropAtOneTime: number,
    mgr?: INotificationManager): boolean {
    let dropKeys = [];
    let droppedEvents = 0;
    let currentTime = (new Date()).getTime() + 1; // handle appended random float number
    let minStartTime = (currentTime - maxStorageTime);
    try {
        forEachMap<IStorageTelemetryItem>(events, (evt, key) => {
            let id = getTimeFromId(key);
            if (id <= minStartTime) {
                dropKeys.push(key);
                droppedEvents++;
            }
            return (droppedEvents < eventsToDropAtOneTime);
        });
    
        if (droppedEvents > 0) {
            for (let lp = 0; lp < dropKeys.length; lp++) {
                delete events[dropKeys[lp]];
            }
            if (mgr) {
                batchDropNotification(mgr, droppedEvents, eBatchDiscardedReason.MaxInStorageTimeExceeded);
            }
           
            return true;
        }

    } catch (e) {
        // catch drop events error
    }

    return droppedEvents > 0;
}



/**
 * Class that implements storing of events using the WebStorage Api ((window||globalThis||self).localstorage, (window||globalThis||self).sessionStorage).
 */
export class WebStorageProvider implements IOfflineProvider {
    public id: string;

    /**
     * Creates a WebStorageProvider using the provider storageType
     * @param storageType The type of Storage provider, normal values are "localStorage" or "sessionStorage"
     */
    constructor(storageType: string, id?: string, unloadHookContainer?: IUnloadHookContainer) {
        dynamicProto(WebStorageProvider, this, (_this) => {
            let _storage: Storage = null;
            let _storageKeyPrefix: string = DefaultStorageKey;
            let _maxStorageSizeInBytes: number = DefaultMaxStorageSizeInBytes;
            let _payloadHelper: PayloadHelper = null;
            let _storageKey: string = null;
            let _endpoint: string = null;
            let _maxStorageTime: number = null;
            let _eventDropPerTime: number = null;
            let _maxCriticalCnt: number = null;
            let _notificationManager: INotificationManager = null;

            _this.id = id;

            _storage = _getAvailableStorage(storageType) || null;

            _this["_getDbgPlgTargets"] = () => {
                return [_storageKey, _maxStorageSizeInBytes, _maxStorageTime];
            };

            _this.initialize = (providerContext: ILocalStorageProviderContext, endpointUrl?: string) => {
                if (!_storage) {
                    return false;
                }
               
                let storageConfig: IOfflineChannelConfiguration = providerContext.storageConfig;
                let itemCtx = providerContext.itemCtx;
                _payloadHelper = new PayloadHelper(itemCtx.diagLog());
                _endpoint = getEndpointDomain(endpointUrl || providerContext.endpoint);
                let autoClean = !!storageConfig.autoClean;
                _notificationManager = providerContext.notificationMgr;

                let unloadHook = onConfigChange(storageConfig, () => {
                    _maxStorageSizeInBytes = storageConfig.maxStorageSizeInBytes || DefaultMaxStorageSizeInBytes; // value checks and defaults should be applied during core config
                    _maxStorageTime = storageConfig.inStorageMaxTime || DefaultMaxInStorageTime; // TODO: handle 0
                    let dropNum = storageConfig.EventsToDropPerTime;
                    _eventDropPerTime = isNotNullOrUndefined(dropNum)? dropNum : EventsToDropAtOneTime;
                    _maxCriticalCnt = storageConfig.maxCriticalEvtsDropCnt || MaxCriticalEvtsDropCnt;
                  
                });
                unloadHookContainer && unloadHookContainer.add(unloadHook);

                // currently, won't handle endpoint change here
                // new endpoint will open a new db
                // endpoint change will be handled at offline batch level
                // namePrefix should not contain any "_"
                _storageKeyPrefix = storageConfig.storageKeyPrefix || DefaultStorageKey;
                _storageKey = _storageKeyPrefix + "_" + Version + "_" + _endpoint;

                if (autoClean) {
                    // won't wait response here
                    _this.clean();
                }

                
                // TODO: handle versoin Upgrade
                //_checkVersion();
             

                return true;
            };

            /**
              * Identifies whether this storage provider support synchronous requests
             */
            _this.supportsSyncRequests = () => {
                return true;
            };

            /**
             * Get all of the currently cached events from the storage mechanism
             */
            _this.getAllEvents = (cnt?: number) => {
                try {
                    if (!_storage) {
                        // if not init, return null
                        return;
                    }
                    return _getEvts(cnt);
                    
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            };

            
            /**
             * Get Next cached event from the storage mechanism
             */
            _this.getNextBatch = () => {
                try {
                    if (!_storage) {
                        // if not init, return null
                        return;
                    }
                    // set ordered to true, to make sure to get earliest events first
                    return _getEvts(1, true);
                    
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            };

            function _getEvts(cnt?: number, ordered?: boolean) {
                let allItems: IStorageTelemetryItem[] = [];
                let theStore = _fetchStoredDb(_storageKey).db;
                if (theStore) {
                    let events = theStore.evts;
                    forEachMap(events, (evt) => {
                        if (evt) {
                            if (evt.isArr) {
                                evt = _payloadHelper.base64ToArr(evt);
                            }
                            allItems.push(evt);
                        }
                        if(cnt && allItems && allItems.length == cnt) {
                            return false;
                        }
                        return true;
                    }, ordered);
                }
                return  allItems;
                    
            }


            /**
             * Stores the value into the storage using the specified key.
             * @param key - The key value to use for the value
             * @param value - The actual value of the request
             */
            _this.addEvent = (key: string, evt: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext)  => {
                try {
                    let theStore = _fetchStoredDb(_storageKey);
                    evt.id = evt.id || getTimeId();
                    evt.criticalCnt = evt.criticalCnt || 0;
                    let events = theStore.db.evts;
                    let id = evt.id;
                    if (evt && evt.isArr) {
                        evt = _payloadHelper.base64ToStr(evt);
                    }
                    let preDroppedCnt = 0;

                    // eslint-disable-next-line no-constant-condition
                    while (true && evt) {
                        events[id] = evt;
                        if (_updateStoredDb(theStore)) {
                            // Database successfully updated
                            if (preDroppedCnt && _notificationManager) {
                                // only send notification when batches are updated successfully in storage
                                batchDropNotification(_notificationManager, preDroppedCnt, eBatchDiscardedReason.CleanStorage);
                            }
                            return evt;
                        }

                        // Could not not add events to storage assuming its full, so drop events to make space
                        // or max size exceeded
                        delete events[id];
                        let droppedCnt = _dropEventsUpToPersistence(_maxCriticalCnt, events, _eventDropPerTime);
                        preDroppedCnt += droppedCnt;
                        if (!droppedCnt) {
                            // Can't free any space for event
                            return createAsyncRejectedPromise(new Error("Unable to free up event space"));
                        }
                    }
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            };

            /**
             * Removes the value associated with the provided key
             * @param evts - The events to be removed
             */
            _this.removeEvents = (evts: IStorageTelemetryItem[]) => {
                try {
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let currentDb = theStore.db;
                    if (currentDb) {
                        let events = currentDb.evts;
                        try {
                            for (let i = 0; i < evts.length; ++i) {
                                let evt = evts[i];
                                delete events[evt.id];
                            }

                            // Update takes care of removing the DB if it's completely empty now
                            if (_updateStoredDb(theStore)) {
                                return evts;
                            }
                        } catch (e) {
                            // Storage corrupted
                        }

                        // failure here so try and remove db to unblock following events
                        evts = _clearDatabase(theStore.key);
                        
                    }

                    return evts;
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            };

            /**
             * Removes all entries from the storage provider for the current endpoint and returns them as part of the response, if there are any.
             */
            _this.clear = () => {
                try {
                    let removedItems: IStorageTelemetryItem[] = [];
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let storedDb = theStore.db;
                    if (storedDb) {
                        let events = storedDb.evts;
                        forEachMap(events, (evt) => {
                            if (evt) {
                                delete events[evt.id]
                                removedItems.push(evt);
                            }

                            return true;
                        });

                        _updateStoredDb(theStore);
                    }

                    return removedItems;
                } catch (e) {
                    // Unable to clear the database
                    return createAsyncRejectedPromise(e);
                }
            };

            _this.clean = () => {
                let storeDetails = _fetchStoredDb(_storageKey, false);
                let currentDb = storeDetails.db;
                if (currentDb) {
                    let events = currentDb.evts;
                    try {
                        let isDropped = _dropMaxTimeEvents(_maxStorageTime, events, _eventDropPerTime, _notificationManager);
                        if (isDropped) {
                            return _updateStoredDb(storeDetails);
                        }
                        return true;
                        
                    } catch (e) {
                        // should not throw errors here
                        // because we don't want to block following process
                    }
                    return false;
                }

            };

            /**
             * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
             * This attempts to update the lastAccessTime for any storedDb
             */
            _this.teardown = (): void => {
                try {
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let storedDb = theStore.db;
                    if (storedDb) {
                        // reset the last access time
                        storedDb.lastAccessTime = 0;
                        _updateStoredDb(theStore, false);
                    }
                } catch (e) {
                    // Add diagnostic logging
                }
            };

            /**
             * @ignore
             * Creates a new json store with the StorageJSON (may be null), a null db value indicates that the store
             * associated with the key is empty and should be removed.
             * @param dbKey
             * @param forceRemove
             */
            function _newStore(dbKey: string, db: IStorageJSON): IJsonStoreDetails {
                return {
                    key: dbKey,
                    db: db
                };
            }

            function _fetchStoredDb(dbKey: string, returnDefault = true): IJsonStoreDetails {
                let dbToStore: IStorageJSON = null;
                if (_storage) {
                    let previousDb = _storage.getItem(dbKey);
                 
                    if (previousDb) {
                        try {
                            dbToStore = getJSON().parse(previousDb);
                        } catch (e) {
                            // storage corrupted
                            _storage.removeItem(dbKey);
                        }
                    }

                    if (returnDefault && !dbToStore) {
                        // Create and return a default empty database
                        dbToStore = {
                            evts: {},
                            lastAccessTime: 0
                        };
                    }
                }

                return _newStore(dbKey, dbToStore);
            }

            function _updateStoredDb(jsonStore: IJsonStoreDetails, updateLastAccessTime = true): boolean {
                //let removeDb = true;
                let dbToStore = jsonStore.db;
                if (dbToStore) {
                    if (updateLastAccessTime) {
                        // Update the last access time
                        dbToStore.lastAccessTime = (new Date()).getTime();
                    }
                }

                try {

                    let jsonString = getJSON().stringify(dbToStore);
                    if (jsonString.length > _maxStorageSizeInBytes) {
                        // We can't store the database as it would exceed the configured max size
                        return false;
                    }

                    _storage && _storage.setItem(jsonStore.key, jsonString);
                    //}
                } catch (e) {
                    // catch exception due to trying to store or clear JSON
                    // We could not store the database
                    return false;
                }

                return true;
            }

            function _clearDatabase(dbKey: string): IStorageTelemetryItem[] {
                let removedItems: IStorageTelemetryItem[] = [];
                let storeDetails = _fetchStoredDb(dbKey, false);
                let currentDb = storeDetails.db;
                if (currentDb) {
                    let events = currentDb.evts;
                    try {
                        forEachMap(events, (evt) => {
                            if (evt) {
                                removedItems.push(evt);
                            }

                            return true;
                        });
                        
                    } catch (e) {
                        // catch exception due to trying to store or clear JSON
                    }

                    // Remove the entire stored database
                    _storage && _storage.removeItem(storeDetails.key);
                }

                return removedItems;
            }

        });
    }

    /**
     * Initializes the provider using the config
     * @param providerContext The provider context that should be used to initialize the provider
     * @returns True if the provider is initialized and available for use otherwise false
     */
    public initialize(providerContext: ILocalStorageProviderContext): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Identifies whether this storage provider support synchronous requests
    */
    public supportsSyncRequests(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Get all of the currently cached events from the storage mechanism
     */
    public getAllEvents(cnt?: number): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get the Next one cached batch from the storage mechanism
     */
    public getNextBatch(): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }


    /**
     * Stores the value into the storage using the specified key.
     * @param key - The key value to use for the value
     * @param evt - The actual event of the request
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    public addEvent(key: string, evt: any, itemCtx: IProcessTelemetryContext): IStorageTelemetryItem | IPromise<IStorageTelemetryItem> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Removes the value associated with the provided key
     * @param evts - The events to be removed
     */
    public removeEvents(evts: any[]): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Removes all entries from the storage provider, if there are any.
     */
    public clear(): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Removes all entries with stroage time longer than inStorageMaxTime from the storage provider
     */
    public clean(): boolean | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
     */
    public teardown(): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }
}
