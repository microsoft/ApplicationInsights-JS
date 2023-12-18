
import { IProcessTelemetryContext, IUnloadHookContainer, eLoggingSeverity, isNumber, newGuid, onConfigChange } from "@microsoft/applicationinsights-core-js";
import dynamicProto from "@microsoft/dynamicproto-js";
import { IPromise, createAsyncAllPromise, createAsyncPromise, doAwait, doAwaitResponse } from "@nevware21/ts-async";
import { ILocalStorageConfiguration, ILocalStorageProviderContext, IOfflineProvider, IStorageTelemetryItem, eEventPersistenceValue } from "../Interfaces/IOfflineProvider";
import { CursorProcessResult, IIndexedDbOpenDbContext, IIndexedDbStoreActionContext, IProcessCursorState, IndexedDbHelper } from "../Interfaces/IOfflineIndexDb";
import { getEndpointDomian } from "../Helpers/Utils";


const EventsToDropAtOneTime = 10;                   // If we fail to add a new event this is the max number of events we will attempt to remove to make space
const StoreVersion = 1;                             // The Current version for the stored items, this will be used in the future for versioning
const AccessThresholdInMs = 600000;                 // 10 mins
const OrhpanedEventThresholdInMs = 10080000;        // 7 days
const MaxSizeLimit = 5000000;                       // 5Mb
const UnknowniKey = "Unknown";
const DefaultMaxStorageItems = -1;
const ErrorMessageUnableToAddEvent = "DBError: Unable to add event";
const ErrorMessageUnableToUpdateiKey = "DBError: Unable to update iKey";
const DbNamePrefix = "AppInsightsOffline";

export const DefaultDbName = "AppInsightEvents.1";  // Db Name including the version number on the end so that if we ever have to upgrade old and new code can co-exist
export const DbVersion = 1;                         // The Current version of the database (Used to trigger upgrades)
export const EventObjectStoreName = "Evts";
export const IKeyObjectStoreName = "iKey";


/**
* Checks if the value is a valid EventPersistence.
* @param {enum} value - The value that needs to be checked.
* @return {boolean} True if the value is in EventPersistence, false otherwise.
*/
export function isValidPersistenceLevel(value: eEventPersistenceValue | number): boolean {
    return (isNumber(value) && value >= eLoggingSeverity.DISABLED && value <= eEventPersistenceValue.Critical);
}


// Internal methods that are not exposed as class and/or do not use internal instance methods
let _isValidPersistenceLevel = isValidPersistenceLevel;

/**
 * The format of the data stored in the iKey objectStore
 */
export interface IIkeyData {
    iKey: string;               // The ikey
    tm: number;                 // The last time this iKey was used
}

/**
 * The format of the data stored in the Evts objectStore
 */
export interface IIndexedDbItem {
    key: string;                // The actual key for the event
    id: string;                 // The stored key of the event (This MUST be the id of the event)
    evt: IStorageTelemetryItem;  // The actual store
    tm: number;                 // Identifies when this event was added to the store
    v: number;                   // Identifies the version type of this entry
}

/**
 * The open database context created by the _openDb() function and passed to the processFunc() delegate to perform operations
 * on the opened db, this is used to pass around the current db context.
 */
interface IProviderDbContext {
    iKey: string;               // The current iKey for the events
    storageId: string;           // The current storage instance (think browser instance / tab)
    iKeyPrefix: () => string;   // Returns the prefix applied to all events of the current iKey
    evtKeyPrefix: () => string; // Returns the current prefix to apply to events
}

function _getTime() {
    return new Date().getTime();
}


/**
 * Helper method to map an Event rejection to a reject with a message, this is mainly for terminal errors where the
 * IndexedDb API returns an event which we are going to ignore
 * @param rejectMessage
 * @param rejectFunc
 */
function _eventReject(rejectMessage: string, rejectFunc: (reason?: any) => void) {
    return function(evt: Event) {
        return rejectFunc(new Error(rejectMessage));
    };
}

function _createDb(db: IDBDatabase) {
    // data in the same db must have same endpoint url
    if (!db.objectStoreNames.contains(EventObjectStoreName)) {
        let evtStore = db.createObjectStore(EventObjectStoreName, { keyPath: "time" }); // since we have in Memory timer, so time for each Ipayload data should be different.
        evtStore.createIndex("level", "level", {unique: false });
    }
}

// function _updateiKey(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>): IPromise<string> {
//     return dbCtx.openStore(IKeyObjectStoreName, (storeCtx) => {
//         return createAsyncPromise<string>((storeResolve, storeReject) => {
//             let iKeyData: IIkeyData = {
//                 iKey: dbCtx.ctx.iKey,
//                 tm: _getTime()
//             };

//             let getRequest = storeCtx.store.put(iKeyData);
//             getRequest.onsuccess = (evt: Event) => {
//                 storeResolve(getRequest.result.toString());
//             };
//             getRequest.onerror = (evt: Event) => {
//                 storeReject(new Error(ErrorMessageUnableToAddEvent));
//             };

//             getRequest.onerror = _eventReject(ErrorMessageUnableToUpdateiKey, storeReject);
//         });
//     });
// }

function _orderEventsByPriority(values: IIndexedDbItem[]): IStorageTelemetryItem[] {
    let orderedEvents: IStorageTelemetryItem[] = [];

    // Get the events is priority order with Critical first
    for (let persistenceToProcess = eEventPersistenceValue.Critical; persistenceToProcess >= eEventPersistenceValue.Normal; persistenceToProcess--) {
        for (let lp = 0; lp < values.length; lp++) {
            let item = values[lp];
            if (item && item.evt.persistence === persistenceToProcess) {
                orderedEvents.push(item.evt);
            }
        }
    }

    return orderedEvents;
}

function _addEventByTime(values: IIndexedDbItem[], newValue: IIndexedDbItem): IIndexedDbItem[] {
    for (let idx = 0; idx < values.length; idx++) {
        if (newValue.tm < values[idx].tm) {
            values.splice(idx, 0, newValue);
            return;
        }
    }

    values.push(newValue);
}

function _getKeyIndex(key: string, values: IStorageTelemetryItem[]|IIndexedDbItem[]) {
    let len = values.length;
    for (let lp = 0; lp < len; lp++) {
        if (key === values[lp].id) {
            return lp;
        }
    }

    return -1;
}

function _isOldItem(item: IIndexedDbItem, accessThresholdInMs: number) {
    let lastAccessTime = item.tm;
    if (_getTime() - lastAccessTime > accessThresholdInMs) {
        // Looks like an old abandoned item, so move the events to the current store
        return true;
    }

    return false;
}

function _cursorContinueEvent(cursorState: IProcessCursorState<IProviderDbContext>, value?: IIndexedDbItem) {
    return (evt: any) => {
        if (value) {
            // add to local storage
        }
        return cursorState.continue();
    };
}

function _cursorDeleteAndContinue(cursorState: IProcessCursorState<IProviderDbContext>, value?: IIndexedDbItem) {
    let deleteRequest = cursorState.cursor.delete();
    deleteRequest.onerror = _cursorContinueEvent(cursorState);
    deleteRequest.onsuccess = _cursorContinueEvent(cursorState);

    return CursorProcessResult.Waiting;
}

function _getAllEventsForiKey(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>, cursorQuery: string): IPromise<IIndexedDbItem[]> {
    // Open the Db store returning the embedded promise for handling resolving and rejecting the request chain
    return dbCtx.openCursor<IIndexedDbItem>(
        EventObjectStoreName,
        cursorQuery,
        (cursorState, value, values) => {
            values.push(value);
            return CursorProcessResult.Continue;
        });
}

function _deleteEvents(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>, eventPrefixQuery: string, shouldDelete: (value: IIndexedDbItem) => boolean): IPromise<IIndexedDbItem[]> {
    // Open the Event object store
    return dbCtx.openCursor<IIndexedDbItem>(
        EventObjectStoreName,
        eventPrefixQuery,
        (deleteCursorState, value: IIndexedDbItem, values: IIndexedDbItem[]) => {
            if (shouldDelete(value)) {
                values.push(value);
                return _cursorDeleteAndContinue(deleteCursorState, value);
            }

            return CursorProcessResult.Continue;
        });
}

function _deleteOrphanedEvents(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>): IPromise<IIkeyData[]> {
    return createAsyncPromise<IIkeyData[]>((deleteEvtsResolve, deleteEvtsReject) => {
        // Note: We CANT have multiple transactions (openStore() active at the same time as transactions are auto closed
        // when not used and are designed to be very short lived. So we need to perform the clean in multiple steps...

        let oldKeyDetected = false;

        // To try and minimize performance impact, by looking for OLD ikeys first and only try and cleanup
        // if we detect at least one
        dbCtx.openCursor<IIkeyData>(
            IKeyObjectStoreName,
            null,       // Return all ikeys
            (iKeyCursorState, value, values) => {
                let lastAccessTime = value.tm;
                if (_getTime() - lastAccessTime < OrhpanedEventThresholdInMs) {
                    return CursorProcessResult.Continue;
                }

                oldKeyDetected = true;
                return CursorProcessResult.Complete;
            }
        ).then(() => {
            if (!oldKeyDetected) {
                // Shortcut as no old keys were detected
                deleteEvtsResolve([]);
                return;
            }

            let usediKeys = {};

            // So we try and delete the old orphaned events BEFORE we remove any iKeys
            _deleteEvents(dbCtx, null, (value) => {
                if (!value || !value.evt || !value.evt.iKey) {
                    // Just delete events that look wrong
                    return true;
                }

                // Just go and delete really OLD (Orphaned) events
                let lastAccessTime = value.tm;
                if (_getTime() - lastAccessTime > OrhpanedEventThresholdInMs) {
                    return true;
                }

                // Add the iKey as used
                usediKeys[value.evt.iKey] = 1;

                return false;
            }).then(() => {
                let deletediKeys: IIkeyData[] = [];

                // Now go and cleanup the unused and OLD iKeys
                dbCtx.openCursor<IIkeyData>(
                    IKeyObjectStoreName,
                    null,       // Return all ikeys
                    (iKeyCursorState, value, values) => {
                        let lastAccessTime = value.tm;
                        if (_getTime() - lastAccessTime < OrhpanedEventThresholdInMs) {
                            return CursorProcessResult.Continue;
                        }

                        if (usediKeys[value.iKey]) {
                            // Don't delete iKeys with events
                            return CursorProcessResult.Continue;
                        }

                        deletediKeys.push(value);
                        return _cursorDeleteAndContinue(iKeyCursorState);
                    }).then(() => {
                    deleteEvtsResolve(deletediKeys);
                }, deleteEvtsReject);
            }, deleteEvtsReject);
        }, deleteEvtsReject);
    });
}

function _moveOldEventsToCurrentStore(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) {
    // Open the Db store returning the embedded promise for handling resolving and rejecting the request chain
    return dbCtx.openCursor<IIndexedDbItem>(
        EventObjectStoreName,
        "#key=" + dbCtx.ctx.iKeyPrefix(),
        (cursorState, value) => {
            let evtKey = value.key;
            // Check that this key is related to the current iKey, but not the current session
            if (evtKey.indexOf(dbCtx.ctx.iKeyPrefix()) === 0 &&
                    evtKey.indexOf(dbCtx.ctx.evtKeyPrefix()) === -1 &&
                    _isOldItem(value, AccessThresholdInMs)) {

                // Reassign the event to current store
                value.key = dbCtx.ctx.evtKeyPrefix() + value.id;

                // We need to add the value as a new entry because cursor.update() can't update the key
                // Note: DONT Call _addDbItem as this will cause the transaction associated with the cursorState
                // to be closed and then the cursor.delete() will fail!
                let addRequest = cursorState.store.store.put(value);
                addRequest.onerror = _cursorContinueEvent(cursorState);
                addRequest.onsuccess = (evt) => {
                    try {
                        _cursorDeleteAndContinue(cursorState);
                    } catch (e) {
                        cursorState.continue();
                    }
                };

                return CursorProcessResult.Waiting;
            }

            // Just move onto the next event
            return CursorProcessResult.Continue;
        });
}

// This will check for idle events which where created by different tabs or sessions and scheduled them for delivery
function _checkVersionAndMoveEventsToCurrentStorage(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>): IPromise<IIndexedDbItem[]> {
    return createAsyncPromise<IIndexedDbItem[]>((cleanupResolve, cleanupReject) => {
        // Attempting to delete any orphaned iKeys first to free up possible space
        _deleteOrphanedEvents(dbCtx).then(
            () => {
                _moveOldEventsToCurrentStore(dbCtx).then(cleanupResolve, cleanupResolve);
            },
            cleanupReject);
    });
}

function _dropEventsUpToPersistence(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>, priority: number): IPromise<number> {
    return createAsyncPromise<number>((dropEventsResolve, dropEventsReject) => {
        let droppedEvents = 0;
        let keyPrefix = dbCtx.ctx.evtKeyPrefix();

        function _resolveWithDroppedEvents() {
            dropEventsResolve(droppedEvents);
        }

        function _dropEvent(deleteStoreCtx: IIndexedDbStoreActionContext<IProviderDbContext>, dropItem: IIndexedDbItem): IPromise<void> {
            return createAsyncPromise<void>((deleteResolve) => {
                let deleteRequest = deleteStoreCtx.store.delete(dropItem.key);
                deleteRequest.onsuccess = (evt) => {
                    droppedEvents++;
                    deleteResolve();
                };
                deleteRequest.onerror = (evt) => {
                    deleteResolve();
                };
            });
        }

        function _processCandidates(dropCandidates: IIndexedDbItem[]) {
            if (dropCandidates.length === 0) {
                _resolveWithDroppedEvents();
                return;
            }

            dbCtx.openStore(EventObjectStoreName, (deleteStoreCtx) => {
                let deleteEvts: Array<IPromise<void>> = [];
                for (let lp = 0; lp < dropCandidates.length; lp++) {
                    deleteEvts.push(_dropEvent(deleteStoreCtx, dropCandidates[lp]));
                }

                return createAsyncAllPromise(deleteEvts).then(_resolveWithDroppedEvents, _resolveWithDroppedEvents);
            });
        }

        // Get all of the candidates that we may delete
        var cursorPromise = dbCtx.openCursor<IIndexedDbItem>(
            EventObjectStoreName,
            "#key=" + keyPrefix,
            (cursorState, value: IIndexedDbItem, values: IIndexedDbItem[]) => {
                //if (value.evt.persistence <= priority && value.key.indexOf(keyPrefix) === 0) {
                if (value.key.indexOf(keyPrefix) === 0) {
                    _addEventByTime(values, value);
                    if (values.length > EventsToDropAtOneTime) {
                        // remove last one
                        values.splice(values.length - 1, 1);
                    }
                }

                return CursorProcessResult.Continue;
            });

        cursorPromise.then(_processCandidates, () => {
            dropEventsResolve(0);
        });
    });
}

/**
 * Class that implements storing of events using the WebStorage Api ((window||globalThis||self).localstorage, (window||globalThis||self).sessionStorage).
 */
export class IndexedDbProvider implements IOfflineProvider {
    public id: string;

    /**
     * Creates a WebStorageProvider using the provider storageType
     */
    constructor(id?: string, unloadHookContainer?: IUnloadHookContainer) {
        dynamicProto(IndexedDbProvider, this, (_this) => {
            let _indexedDb: IndexedDbHelper<IProviderDbContext> = null;
            let _dbName: string = null;
            let _iKey: string = UnknowniKey;
            let _storageId: string = null;              // Used as a unique id so that when active on multiple tabs (threads) the apps don't corrupts each other
            let _activeiKeyPrefix: string = null;
            let _activeEventPrefix: string = null;
            let _maxStorageItems: number = DefaultMaxStorageItems;
            let _numStoredItems = 0;
            let _autoClean = null;
            let _maxSentSize = MaxSizeLimit;

            _this.id = id;

            _this.initialize = (providerContext: ILocalStorageProviderContext) => {
                let diagLog = providerContext.itemCtx.diagLog();
                _indexedDb = new IndexedDbHelper<IProviderDbContext>(diagLog);
                if (!_indexedDb.isAvailable()) {
                    // Not needed so clear it out
                    _indexedDb = null;
                    return false;
                }
                let coreConfig = providerContext.itemCtx.getCfg();

                let storageConfig: ILocalStorageConfiguration = providerContext.storageConfig;
                _iKey = coreConfig.instrumentationKey || _iKey;
                _storageId = _this.id || providerContext.id || newGuid();
                _activeiKeyPrefix = _iKey + "::";
                _activeEventPrefix = _activeiKeyPrefix + _storageId + "::";
               

                let unloadHook = onConfigChange(storageConfig, () => {
                    _maxStorageItems = storageConfig.maxStorageItems;
                    _autoClean = !!storageConfig.AutoClean;
                    _maxSentSize = storageConfig.maxSentInBytes || _maxSentSize; // if user set to 0?
                    let domain = getEndpointDomian(coreConfig.endpointUrl);
                    let dbName = `${DbNamePrefix}-${storageConfig.indexedDbName}-${domain};`
                    if (dbName !== _dbName) {
                        if (_dbName) {
                            doAwaitResponse(_this.clear(!_autoClean), (response) => {
                                _dbName = dbName;
                                _openDb(
                                    (dbCtx) => {
                                        if (dbCtx.isNew) {
                                            // We just created the DB, so no need to check for old items
                                            return [];
                                        }
                
                                        return _checkVersionAndMoveEventsToCurrentStorage(dbCtx);
                                    }).then(
                                    (value) => {
                                        // All done, but as initialize isn't waiting just ignore
                                    },
                                    (reason) => {
                                        // We failed for some reason so lets clear and stop using indexedDb
                                        diagLog.warnToConsole("IndexedDbProvider failed to initialize - " + (reason || "<unknown>"));
                                        _indexedDb = null;
                                    });
                            });
                        }
                    }
                    _dbName = dbName;
                    
                });
                unloadHookContainer && unloadHookContainer.add(unloadHook);

                return true;
            };

            _this["_getDbgPlgTargets"] = () => {
                return [_dbName];
            };

            /**
              * Identifies whether this storage provider support synchronious requests
             */
            _this.supportsSyncRequests = () => {
                return false;
            };

            /**
             * Get all of the currently cached events from the storage mechanism
             */
            _this.getAllEvents = () => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return [];
                }

                // Start an asynchronous set of events to access the Db, this first one will wait until all current outstanding
                // events are completed or rejected
                return _openDb<IStorageTelemetryItem[]>((dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) => {
                    return createAsyncPromise<IStorageTelemetryItem[]>((allEventsResolve, allEventsReject) => {
                        _getAllEventsForiKey(dbCtx, "#key=" + dbCtx.ctx.evtKeyPrefix()).then(
                            (values: IIndexedDbItem[]) => {
                                _numStoredItems = values.length;
                                allEventsResolve(_orderEventsByPriority(values));
                            },
                            allEventsReject);
                    });
                });
            };

            /**
             * Stores the value into the storage using the specified key.
             * @param key - The key value to use for the value
             * @param value - The actual value of the request
             */
            _this.addEvent = (key: string, item: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext): IStorageTelemetryItem | IPromise<IStorageTelemetryItem> => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return item;
                }

                // Check persistence and create storage id
                item.id = item.id || newGuid();
                // if (!_isValidPersistenceLevel(item.persistence)) {
                //     item.persistence = EventPersistenceValue.Normal;
                // }

                return _openDb<IStorageTelemetryItem>(
                    (dbCtx) => {
                        let eventKey = key || item.id;
                        let dbItem: IIndexedDbItem = {
                            key: dbCtx.ctx.evtKeyPrefix() + eventKey,
                            id: eventKey,
                            evt: item,
                            tm: _getTime(),
                            v: StoreVersion
                        };
                        return _addDbEvent(dbCtx, dbItem, true);
                    });
            };

            /**
             * Removes the value associated with the provided key
             * @param evts
             */
            _this.removeEvents = (evts: IStorageTelemetryItem[]): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return [];
                }

                let removedEvents: IStorageTelemetryItem[] = [];
                return createAsyncPromise<IStorageTelemetryItem[]>((removeEventsResolve, removeEventsReject) => {
                    // Open the Db store, this will handling resolving and rejecting this promise via the passed resolve/reject functions
                    _openDb<IIndexedDbItem[]>((dbCtx) => {
                        return dbCtx.openCursor<IIndexedDbItem>(
                            EventObjectStoreName,
                            "#key=" + dbCtx.ctx.iKey,
                            (cursorState, value: IIndexedDbItem, values: IIndexedDbItem[]) => {
                                if (_getKeyIndex(value.id, evts) !== -1) {
                                    let deleteRequest = cursorState.cursor.delete();
                                    deleteRequest.onerror = _cursorContinueEvent(cursorState);
                                    deleteRequest.onsuccess = () => {
                                        removedEvents.push(value.evt);
                                        cursorState.continue();
                                    };

                                    return CursorProcessResult.Waiting;
                                }

                                return CursorProcessResult.Continue;
                            });
                    }).then((values: IIndexedDbItem[]) => {
                        _numStoredItems -= removedEvents.length;
                        removeEventsResolve(removedEvents);                         // Resolve the RemoveEvents call promise
                    },
                    (evt: Event) => {
                        _numStoredItems -= removedEvents.length;
                        removeEventsResolve(removedEvents);                         // Resolve the RemoveEvents call promise
                    });
                });
            };

            /**
             * Removes all entries from the storage provider and returns them as part of the response, if there are any.
             */
            _this.clear = (disable?: boolean): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> => {
                if (_indexedDb == null || !_indexedDb.isAvailable() || !!disable) {
                    return [];
                }

                return createAsyncPromise<IStorageTelemetryItem[]>((clearResolve, clearReject) => {
                    _openDb<IIndexedDbItem[]>((dbCtx) => {
                        //delete all evts
                        // TODO: add query
                        return _deleteEvents(dbCtx, null, (value) => {
                            return true; // TODO: add conditions
                        });
                    }).then(
                        (values: IIndexedDbItem[]) => {
                            _numStoredItems = 0;
                            clearResolve(_orderEventsByPriority(values));
                        },
                        clearReject);
                });
            };

            /**
             * Shuts-down the telemetry plugin. This is usually called when telemetry is shut down.
             * This attempts to update the lastAccessTime for any storedDb
             */
            _this.teardown = (): void => {
                if (_indexedDb) {
                    _indexedDb.closeDb(_dbName);
                }
            };

            /**
             * Schedules the opening of the database if not already open
             */
            function _openDb<T>(processFunc: (dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) => T | IPromise<T>): IPromise<T> {
                function _handleDbUpgrade(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) {
                    return createAsyncPromise<void>((createResolve, createReject) => {
                        _createDb(dbCtx.db);
                        createResolve();
                    });
                }

                function _handleDbOpen(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) {
                    return createAsyncPromise<T>((openResolve, openReject) => {
                        let providerCtx: IProviderDbContext = {
                            iKey: _iKey,
                            storageId: _storageId,
                            iKeyPrefix: () => _activeiKeyPrefix,
                            evtKeyPrefix: () => _activeEventPrefix
                        };

                        dbCtx.ctx = providerCtx;

                        // update the iKey last used time
                        doAwait(processFunc(dbCtx), openResolve, openReject);
                        
                       
                    });
                }
                return _indexedDb.openDb<T>(
                    _dbName,
                    DbVersion,
                    _handleDbOpen,
                    _handleDbUpgrade);
            }

            function _addDbEvent(
                dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>,
                dbItem: IIndexedDbItem,
                doRetry: boolean): IPromise<IStorageTelemetryItem> {

                return createAsyncPromise<IStorageTelemetryItem>((addEventResolve, addEventReject) => {
                    function dropEvents(priority: number, droppedFunc: (droppedCount: number) => void) {
                        // Try and clear space by dropping the Normal level events, note dropEvents promise never rejects
                        _dropEventsUpToPersistence(dbCtx, priority).then(
                            (droppedCount) => {
                                if (droppedCount > 0) {
                                    // We dropped some events so lets try adding the item again
                                    _numStoredItems -= droppedCount;
                                }

                                droppedFunc(droppedCount);
                            }, (reason) => {
                                droppedFunc(0);
                            });
                    }

                    function resolveAddEvent(value: Event|string) {
                        addEventResolve(dbItem.evt);
                    }

                    function _insertNewEvent() {
                        dbCtx.openStore(EventObjectStoreName, (storeCtx) => {
                            let request = storeCtx.store.put(dbItem);
                            request.onsuccess = (evt) => {
                                // Update the timestamp for the iKey for later processing
                                if (doRetry) {
                                    // ****************************************************************************************************
                                    // TODO: update the iKey time?
                                    //_updateiKey(dbCtx).then(resolveAddEvent, resolveAddEvent);
                                }
                                _numStoredItems++;
                                addEventResolve(dbItem.evt);
                            };
                            request.onerror = (evt: Event) => {
                                if (!doRetry) {
                                    addEventReject(new Error(ErrorMessageUnableToAddEvent));                // Reject the calling promise
                                    return;
                                }

                                function _retryAddEvent(dropCount: number) {
                                    if (dropCount === 0) {
                                        // We failed to free up space so just reject
                                        addEventReject(new Error(ErrorMessageUnableToAddEvent));             // Reject the calling promise
                                    }

                                    // Retry sending the event
                                    _addDbEvent(dbCtx, dbItem, false).then(
                                        (theItem) => {
                                            addEventResolve(dbItem.evt);                                     // Resolve the calling add Event promise
                                        }, () => {
                                            addEventReject(new Error(ErrorMessageUnableToAddEvent));         // Reject the calling promise
                                        });
                                }

                                dropEvents(eEventPersistenceValue.Normal, (droppedCount: number) => {
                                    if (droppedCount > 0) {
                                        // We dropped some events so lets try adding the item again
                                        _retryAddEvent(droppedCount);
                                    } else if (dbItem.evt.persistence >= eEventPersistenceValue.Critical) {
                                        // Nothing dropped for Normal priority if the new event is a critical lets try dropping older events
                                        dropEvents(eEventPersistenceValue.Critical, (dropCount) => {
                                            _retryAddEvent(dropCount);
                                        });
                                    } else {
                                        // We have already tried to remove all we can
                                        addEventReject(new Error(ErrorMessageUnableToAddEvent));         // Reject the calling promise
                                    }
                                });
                            };
                        });
                    }

                    // Check if we need to drop any events before inserting, otherwise we might end up deleting the item we just added.
                    if (_maxStorageItems > 0 && _numStoredItems >= _maxStorageItems) {
                        dropEvents(eEventPersistenceValue.Normal, (droppedEvents) => {
                            if (droppedEvents === 0) {
                                // If this new event is a critical one then try and remove some more events
                                if (dbItem.evt.persistence >= eEventPersistenceValue.Critical) {
                                    // Nothing dropped for Normal priority if the new event is a critical lets try dropping older events
                                    dropEvents(eEventPersistenceValue.Critical, (droppedCount) => {
                                        _insertNewEvent();
                                    });
                                } else {
                                    // Unable to drop any events so don't even try to add the new one
                                    addEventReject(new Error(ErrorMessageUnableToAddEvent));
                                }
                            } else {
                                _insertNewEvent();
                            }
                        });
                    } else {
                        _insertNewEvent();
                    }
                });
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
        return
    }

    /**
     * Removes all entries from the storage provider, if there are any.
     */
    public clear(disable?: boolean): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> {
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
