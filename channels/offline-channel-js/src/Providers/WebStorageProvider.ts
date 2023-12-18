/**
* WebStorageProvider.ts
* @author Abhilash Panwar (abpanwar) Hector Hernandez (hectorh) Nev Wylie (newylie)
* @copyright Microsoft 2019
*/

import dynamicProto from "@microsoft/dynamicproto-js";
import { IProcessTelemetryContext, getGlobal, newGuid, objKeys, IUnloadHookContainer, onConfigChange } from "@microsoft/applicationinsights-core-js";
import { IPromise, createAsyncRejectedPromise, doAwaitResponse } from "@nevware21/ts-async";
import { ILocalStorageConfiguration, ILocalStorageProviderContext, IOfflineProvider, IStorageJSON, IStorageTelemetryItem, eEventPersistenceValue } from "../Interfaces/IOfflineProvider";
import { isValidPersistenceLevel } from "./IndexDbProvider";


const EventsToDropAtOneTime = 10;
const Version = "3";
const VersionKey = "Version";
const AccessThresholdInMs = 600000; // 10 mins
const DefaultStorageKey = "offlineEvents";
const DefaultMaxStorageSizeInBytes = 5000000;

interface IJsonStoreDetails {
    key: string;
    db: IStorageJSON;            // May be null
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

function _forEachMap<T>(map: { [key: string]: T }, callback: (value: T, key: string) => boolean): void {
    if (map) {
        let keys = objKeys(map);
        for (let lp = 0; lp < keys.length; lp++) {
            let key = keys[lp];
            if (!callback(map[key], key)) {
                break;
            }
        }
    }
}

function _isMapEmpty<T>(map: { [key: string]: T }) {
    let result = true;
    _forEachMap(map, (evt, key) => {
        if (evt) {
            result = false;
        }

        return result;
    });

    return result;
}

function _dropEventsUpToPersistence(
    priority: number,
    events: { [priority: string]: { [id: string]: IStorageTelemetryItem } }): boolean {

    let persistenceToProcess = eEventPersistenceValue.Normal;
    let droppedEvents = 0;
    while (persistenceToProcess <= priority && droppedEvents < EventsToDropAtOneTime) {
        let dropKeys = [];
        let theEvents = events[persistenceToProcess];
        _forEachMap<IStorageTelemetryItem>(theEvents, (evt, key) => {
            dropKeys.push(key);
            droppedEvents++;
            return (droppedEvents < EventsToDropAtOneTime);
        });

        if (droppedEvents > 0) {
            // Remove the identified keys to avoid issues with removing while iterating
            for (let lp = 0; lp < dropKeys.length; lp++) {
                delete theEvents[dropKeys[lp]];
            }

            // Only removed events from lower level persistence first
            return true;
        }

        persistenceToProcess++;
    }

    return droppedEvents > 0;
}

/**
* Checks if the value is a valid EventPersistence.
*/
let _isValidPersistenceLevel = isValidPersistenceLevel;

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
            let _storageId: string = null;
            let _version: string = Version;                         // Version -- the current version of the provider
            let _iKey: string = null;
            let _tenantId: string = null;
            let _maxStorageSizeInBytes: number = DefaultMaxStorageSizeInBytes;

            // Cached values for the real storage keys used to lookup the Storage elements
            let _versionKey: string = null;
            let _storageKey: string = null;

            _this.id = id;

            _storage = _getAvailableStorage(storageType) || null;

            _this["_getDbgPlgTargets"] = () => {
                return [_storageKeyPrefix, _maxStorageSizeInBytes];
            };

            _this.initialize = (providerContext: ILocalStorageProviderContext) => {
                if (!_storage) {
                    return false;
                }
                // Fetch and setup the configuration
                let storageConfig: ILocalStorageConfiguration = providerContext.storageConfig;
                _storageId = _this.id || providerContext.id || newGuid();
                _iKey = providerContext.itemCtx.getCfg().instrumentationKey;
                _tenantId = _iKey;

                let unloadHook = onConfigChange(storageConfig, () => {
                    _maxStorageSizeInBytes = storageConfig.maxStorageSizeInBytes; // value checks and defaults should be applied during core config
                    let storageKeyPrefix = storageConfig.storageKey;
                    // if prefix change, all events under previous prefix will be cleared
                    if (_storageKeyPrefix && storageKeyPrefix !== _storageKeyPrefix) {
                        // thoses deleted entries will NOT be added to new db
                        doAwaitResponse(_this.clear(), (response) => {
                            _storageKeyPrefix = storageKeyPrefix;
                            _storageKey =  _storageKeyPrefix + "." + _storageId;
                            _versionKey = _storageKeyPrefix + VersionKey;

                            // Upgrade the storage elements
                            _checkVersionAndMoveEventsToCurrentStorage();
                        })
                    }
                    
                });
                unloadHookContainer && unloadHookContainer.add(unloadHook);

                // need this for initial call
                _storageKeyPrefix = storageConfig.storageKey;
                _storageKey =  _storageKeyPrefix + "." + _storageId;
                _versionKey = _storageKeyPrefix + VersionKey;
                // Upgrade the storage elements
                _checkVersionAndMoveEventsToCurrentStorage();

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
            _this.getAllEvents = () => {
                try {
                    let allItems: IStorageTelemetryItem[] = [];
                    let theStore = _fetchStoredDb(_storageKey, false).db;
                    if (theStore) {
                        let events = theStore.events;
                        // Get the events in priority order with Critical first
                        for (let persistenceToProcess = eEventPersistenceValue.Critical; persistenceToProcess >= eEventPersistenceValue.Normal; persistenceToProcess--) {
                            _forEachMap(events[persistenceToProcess], (evt) => {
                                if (evt) {
                                    let evtTenant = evt.iKey;
                                    if (evtTenant === _tenantId) {
                                        allItems.push(evt);
                                    }
                                }

                                return true;
                            });
                        }
                    }

                    return allItems;
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            };

            /**
             * Stores the value into the storage using the specified key.
             * @param key - The key value to use for the value
             * @param value - The actual value of the request
             */
            _this.addEvent = (key: string, evt: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext): IStorageTelemetryItem | IPromise<IStorageTelemetryItem> => {
                try {
                    let theStore = _fetchStoredDb(_storageKey);

                    // Check persistence and create storage id
                    evt.id = evt.id || newGuid();
                    if (!_isValidPersistenceLevel(evt.persistence)) {
                        evt.persistence = eEventPersistenceValue.Normal;
                    }

                    // Assigning loop invariants to local vars to help with minification
                    let persistence = evt.persistence;
                    let evtId = evt.id;
                    let events = theStore.db.events;

                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        // Add new event to database
                        events[persistence][evtId] = evt;
                        if (_updateStoredDb(theStore)) {
                            // Database successfully updated
                            return evt;
                        }

                        // Could not not add events to storage assuming its full, so drop events to make space
                        // or max size exceeded
                        delete events[persistence][evtId];
                        if (!_dropEventsUpToPersistence(persistence, events)) {
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
            _this.removeEvents = (evts: IStorageTelemetryItem[]): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> => {
                try {
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let currentDb = theStore.db;
                    if (currentDb) {
                        let events = currentDb.events;
                        try {
                            for (let i = 0; i < evts.length; ++i) {
                                let evt = evts[i];
                                delete events[evt.persistence][evt.id];
                            }

                            // Update takes care of removing the DB if it's completely empty now
                            if (_updateStoredDb(theStore)) {
                                return evts;
                            }
                        } catch (e) {
                            // Storage corrupted
                        }

                        // If we get here there was some form of storage failure so try and remove everything to "fix" the db
                        evts = _clearDatabase(theStore.key);
                    }

                    return evts;
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            };

            /**
             * Removes all entries from the storage provider for the configured iKey and returns them as part of the response, if there are any.
             */
            _this.clear = (): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> => {
                try {
                    let removedItems: IStorageTelemetryItem[] = [];
                    let theStore = _fetchStoredDb(_storageKey, false);
                    let storedDb = theStore.db;
                    if (storedDb) {
                        let events = storedDb.events;
                        // Get the events in priority order with Critical first
                        for (let persistenceToProcess = eEventPersistenceValue.Critical; persistenceToProcess >= eEventPersistenceValue.Normal; persistenceToProcess--) {
                            let pLevelEvents = events[persistenceToProcess];
                            _forEachMap(pLevelEvents, (evt) => {
                                if (evt) {
                                    let evtTenant = evt.iKey;
                                    if (evtTenant === _tenantId) {
                                        delete pLevelEvents[evt.id];
                                        removedItems.push(evt);
                                    }
                                }

                                return true;
                            });
                        }

                        _updateStoredDb(theStore);
                    }

                    return removedItems;
                } catch (e) {
                    // Unable to clear the database
                    return createAsyncRejectedPromise(e);
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
                            dbToStore = JSON.parse(previousDb);
                        } catch (e) {
                            // storage corrupted
                            _storage.removeItem(dbKey);
                        }
                    }
                }

                if (returnDefault && !dbToStore) {
                    // Create and return a default empty database
                    dbToStore = {
                        events: {
                            1: {},
                            2: {},
                            3: {}
                        },
                        lastAccessTime: 0
                    };
                }

                return _newStore(dbKey, dbToStore);
            }

            function _updateStoredDb(jsonStore: IJsonStoreDetails, updateLastAccessTime = true): boolean {
                let removeDb = true;
                let dbToStore = jsonStore.db;
                if (dbToStore) {
                    if (updateLastAccessTime) {
                        // Update the last access time
                        dbToStore.lastAccessTime = (new Date()).getTime();
                    }

                    for (let lp = eEventPersistenceValue.Normal; lp <= eEventPersistenceValue.Critical; lp++) {
                        if (!_isMapEmpty(dbToStore.events[lp])) {
                            removeDb = false;
                            break;
                        }
                    }
                }

                try {
                    if (removeDb) {
                        // Database is empty, so lets just remove it
                        _storage && _storage.removeItem(jsonStore.key);
                    } else {
                        let jsonString = JSON.stringify(dbToStore);
                        if (jsonString.length > _maxStorageSizeInBytes) {
                            // We can't store the database as it would exceed the configured max size
                            return false;
                        }

                        _storage && _storage.setItem(jsonStore.key, jsonString);
                    }
                } catch (e) {
                    // catch exception due to trying to store or clear JSON
                    // We could not store the database
                    return false;
                }

                // All good!
                return true;
            }

            function _clearDatabase(dbKey: string): IStorageTelemetryItem[] {
                let removedItems: IStorageTelemetryItem[] = [];
                let storeDetails = _fetchStoredDb(dbKey, false);
                let currentDb = storeDetails.db;
                if (currentDb) {
                    let events = currentDb.events;
                    try {
                        for (let persistenceToProcess = eEventPersistenceValue.Normal; persistenceToProcess <= eEventPersistenceValue.Critical; persistenceToProcess++) {
                            _forEachMap(events[persistenceToProcess], (evt, key) => {
                                if (evt) {
                                    removedItems.push(evt);
                                }

                                return true;
                            });
                        }
                    } catch (e) {
                        // catch exception due to trying to store or clear JSON
                    }

                    // Remove the entire stored database
                    _storage && _storage.removeItem(storeDetails.key);
                }

                return removedItems;
            }

            // It will check for idle DBs created by different tabs or sessions and will try to include it in current DB
            // All previous events stored by Aria or currently not supported will be dropped to avoid duplication and overriding data, DB structure is different in all AWTEvents versions
            function _checkVersionAndMoveEventsToCurrentStorage() {
                if (!_storage) {
                    return;
                }

                let oldVersion: string = _storage.getItem(_versionKey);
                let storesToUpdate: IJsonStoreDetails[] = [];

                // Fetches the current "version" of the Db (this may return an empty DB)
                let newStore = _fetchStoredDb(_storageKey);
                let shouldWriteToStorage = false;
                for (let i = 0; i < _storage.length; i++) {
                    let localStorageKey = _storage.key(i);

                    // Check if this is one of our storage indexes.
                    if (localStorageKey.indexOf(_storageKeyPrefix) === 0 && localStorageKey !== _versionKey) {
                        if (oldVersion !== Version) {
                            // Version of db has changed so just delete old indexes.
                            storesToUpdate.push(_newStore(localStorageKey, null));
                            continue;
                        }

                        // Move events to current db that have been in storage longer than access threshold.
                        let existStore = _fetchStoredDb(localStorageKey, false);
                        let existDb = existStore.db;
                        if (existDb) {
                            if ((new Date()).getTime() - existDb.lastAccessTime > AccessThresholdInMs) {
                                // Move the events to current database
                                let persistenceToProcess = eEventPersistenceValue.Normal;
                                while (persistenceToProcess <= eEventPersistenceValue.Critical) {
                                    let pLevelExistEvents = existDb.events[persistenceToProcess];
                                    let pLevelNewEvents = newStore.db.events[persistenceToProcess];
                                    _forEachMap(pLevelExistEvents, (evt, key) => {
                                        let evtTenant = evt.iKey;
                                        if (evtTenant === _tenantId) {
                                            pLevelNewEvents[key] = evt;     // Add to new
                                            delete pLevelExistEvents[key];  // Remove from old
                                        }
                                        return true;
                                    });

                                    persistenceToProcess++;
                                }

                                shouldWriteToStorage = true;
                                storesToUpdate.push(existStore);
                            }
                        } else {
                            // Storage corrupted
                            storesToUpdate.push(_newStore(localStorageKey, null));
                        }
                    }
                }

                // Removing older items first to ensure the new merged version *should* fit
                for (let i = 0; i < storesToUpdate.length; i++) {
                    // Update or remove the entire previous Db values -- don't change the lastAccessTime
                    _updateStoredDb(storesToUpdate[i], false);
                }

                if (shouldWriteToStorage) {
                    _updateStoredDb(newStore);
                }

                // Update the current storage db version
                _storage.setItem(_versionKey, _version);
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
    public getAllEvents(): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> {
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
    public addEvent(key: string, evt: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext): IStorageTelemetryItem | IPromise<IStorageTelemetryItem> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Removes the value associated with the provided key
     * @param evts - The events to be removed
     */
    public removeEvents(evts: IStorageTelemetryItem[]): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Removes all entries from the storage provider, if there are any.
     */
    public clear(): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> {
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
