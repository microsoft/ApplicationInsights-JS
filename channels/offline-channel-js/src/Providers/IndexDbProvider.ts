
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IProcessTelemetryContext, IUnloadHookContainer, eLoggingSeverity, isNotNullOrUndefined, isNumber, newGuid, onConfigChange
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createAsyncAllPromise, createAsyncPromise, doAwait, doAwaitResponse } from "@nevware21/ts-async";
import { getEndpointDomian, getTimeId } from "../Helpers/Utils";
import {
    CursorProcessResult, IIndexedDbOpenDbContext, IIndexedDbStoreActionContext, IProcessCursorState
} from "../Interfaces/IOfflineIndexDb";
import {
    ILocalStorageConfiguration, ILocalStorageProviderContext, IOfflineProvider, IStorageTelemetryItem, eEventPersistenceValue
} from "../Interfaces/IOfflineProvider";
import { IndexedDbHelper } from "./IndexDbHelper";

//TODO: move all const to one file
const EventsToDropAtOneTime = 10;                   // If we fail to add a new event this is the max number of events we will attempt to remove to make space
const StoreVersion = 1;                             // The Current version for the stored items, this will be used in the future for versioning
const OrhpanedEventThresholdInMs = 10080000;        // 7 days
const MaxSizeLimit = 5000000;                       // 5Mb
const UnknowniKey = "Unknown";
const ErrorMessageUnableToAddEvent = "DBError: Unable to add event";
const MaxCriticalEvtsDropCnt = 2;

export const DefaultDbName = "AIOffline";  // Db Name including the version number on the end so that if we ever have to upgrade old and new code can co-exist
export const DbVersion = 1;                         // The Current version of the database (Used to trigger upgrades)
export const EventObjectStoreName = "Evts";


/**
* Checks if the value is a valid EventPersistence.
* @param {enum} value - The value that needs to be checked.
* @return {boolean} True if the value is in EventPersistence, false otherwise.
*/
export function isValidPersistenceLevel(value: eEventPersistenceValue | number): boolean {
    return (isNumber(value) && value >= eLoggingSeverity.DISABLED && value <= eEventPersistenceValue.Critical);
}


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
    key?: string;                // The actual key for the event
    id: string | number | undefined | null;                 // The stored key of the event (This MUST be the id of the event)
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
    storageId: string;
    id?: string | number | undefined | null; // The current id/endpoint for the events
    iKeyPrefix?: () => string;   // Returns the prefix applied to all events of the current iKey (used by 1ds)
    evtKeyPrefix?: () => string; // Returns the current prefix to apply to events (used by 1ds)
}

function _getTime() {
    return new Date().getTime();
}


function _createDb(db: IDBDatabase) {
    // data in the same db must have same endpoint url
    if (!db.objectStoreNames.contains(EventObjectStoreName)) {
        let evtStore = db.createObjectStore(EventObjectStoreName, { keyPath: "id" });
        evtStore.createIndex("criticalCnt", "criticalCnt", { unique: false });
    }
}


function _getEvents(values: IIndexedDbItem[]): IStorageTelemetryItem[] {
    let events: IStorageTelemetryItem[] = [];
  
    for (let lp = 0; lp < values.length; lp++) {
        let item = values[lp];
        if (item && item.evt) {
            events.push(item.evt);
        }
    }
    return events;
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


function _getId(key: string | number , values: IStorageTelemetryItem[]|IIndexedDbItem[]) {
    let len = values.length;
    for (let lp = 0; lp < len; lp++) {
        if (key === values[lp].id) {
            return lp;
        }
    }

    return -1;
}

function _cursorContinueEvent(cursorState: IProcessCursorState<IProviderDbContext>, value?: IIndexedDbItem) {
    return (evt: any) => {
        return cursorState.continue();
    };
}

function _cursorDeleteAndContinue(cursorState: IProcessCursorState<IProviderDbContext>, value?: IIndexedDbItem) {
    let deleteRequest = cursorState.cursor.delete();
    deleteRequest.onerror = _cursorContinueEvent(cursorState);
    deleteRequest.onsuccess = _cursorContinueEvent(cursorState);

    return CursorProcessResult.Waiting;
}

function _getAllEvents(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>, cursorQuery: string, cnt?: number): IPromise<IIndexedDbItem[]> {
    // Open the Db store returning the embedded promise for handling resolving and rejecting the request chain
    return dbCtx.openCursor<IIndexedDbItem>(
        EventObjectStoreName,
        cursorQuery,
        (cursorState, value, values) => {
            values.push(value);
            if (cnt && values && values.length == cnt) {
                return CursorProcessResult.Complete;
            }
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


function _dropMaxTimeEvents(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>, maxTime?: number): IPromise<IIndexedDbItem[]> {
    return createAsyncPromise<IIndexedDbItem[]>((deleteEvtsResolve, deleteEvtsReject) => {
        return _deleteEvents(dbCtx, null, (value) => {
            if (!value || !value.evt) {
                return true;
            }

            let addedTime = value.id;
            let minStartTime = _getTime() + 1 - maxTime + "";

            if (addedTime <= minStartTime) {
                return true;
            }

            return false;
        }).then((values) => {
            deleteEvtsResolve(values);

        }, deleteEvtsReject);
      
    });
}


function _dropEventsUpToPersistence(dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>, maxpriorityCnt: number, maxDropCnt: number): IPromise<number> {
    return createAsyncPromise<number>((dropEventsResolve, dropEventsReject) => {
        let droppedEvents = 0;

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
            null,
            (cursorState, value: IIndexedDbItem, values: IIndexedDbItem[]) => {
                if (value.evt.criticalCnt <= maxpriorityCnt) {
                    _addEventByTime(values, value);
                    if (values.length > maxDropCnt) {
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
            let _autoClean: boolean = null;
            let _endpoint: string = null;
            let _storageKeyPrefix: string = null;
            let _maxStorageTime: number = null;
            let _eventDropPerTime: number = null;
            let _maxCriticalCnt: number = null;
            let _maxStorageSizeInBytes: number = null;
        
            _this.id = id;

            _this.initialize = (providerContext: ILocalStorageProviderContext) => {
                let diagLog = providerContext.itemCtx.diagLog();
                _indexedDb = new IndexedDbHelper<IProviderDbContext>(diagLog);
                if (!_indexedDb.isAvailable()) {
                    _indexedDb = null;
                    return false;
                }
                let coreConfig = providerContext.itemCtx.getCfg();
                let itemCtx = providerContext.itemCtx;
                _iKey = itemCtx.getCfg().instrumentationKey || coreConfig.instrumentationKey;

                let storageConfig: ILocalStorageConfiguration = providerContext.storageConfig;
                _storageId = _this.id || providerContext.id || newGuid();

               
                _endpoint = getEndpointDomian(providerContext.endpoint);
                _autoClean = !!storageConfig.autoClean;
                _storageKeyPrefix = storageConfig.storageKeyPrefix || DefaultDbName;
                _dbName = _storageKeyPrefix + "_" + DbVersion + "_" + _endpoint;
                

                // currently, won't handle endpoint change
                // new endpoint will open a new db
                // endpoint change will be handled at offline batch lavel
                // namePrefix should not contain any "_"
              
               

                let unloadHook = onConfigChange(storageConfig, () => {
                    _maxStorageTime = storageConfig.inStorageMaxTime || OrhpanedEventThresholdInMs; // TODO: handle 0
                    _maxStorageSizeInBytes = storageConfig.maxStorageSizeInBytes || MaxSizeLimit; // value checks and defaults should be applied during core config
                    let dropNum = storageConfig.EventsToDropPerTime;
                    _eventDropPerTime = isNotNullOrUndefined(dropNum)? dropNum : EventsToDropAtOneTime;
                    _maxCriticalCnt = storageConfig.maxCriticalEvtsDropCnt || MaxCriticalEvtsDropCnt;

                    
                });
                unloadHookContainer && unloadHookContainer.add(unloadHook);

                if (_dbName) {
                  
                    doAwaitResponse(_this.clean(!_autoClean), (response) => {
                        _openDb(
                            (dbCtx) => {
                                return true;
                            }).then(
                            (value) => {
                                // All done, but as initialize isn't waiting just ignore
                            },
                            (reason) => {
                                // clear and stop using indexedDb
                                diagLog.warnToConsole("IndexedDbProvider failed to initialize - " + (reason || "<unknown>"));
                                _indexedDb = null;
                            });
                    });
                    
                }

                return true;
            };

            _this["_getDbgPlgTargets"] = () => {
                return [_dbName, _maxStorageSizeInBytes, _maxStorageTime, _indexedDb];
            };

            /**
              * Identifies whether this storage provider support synchronious requests
             */
            _this.supportsSyncRequests = () => {
                return false;
            };

            /**
             * Get all of the currently cached events( with given number) from the storage mechanism
             */
            _this.getAllEvents = (cnt?: number) => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return [];
                }

                // Start an asynchronous set of events to access the Db, this first one will wait until all current outstanding
                // events are completed or rejected
                return _openDb<IStorageTelemetryItem[]>((dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) => {
                    return createAsyncPromise<IStorageTelemetryItem[]>((allEventsResolve, allEventsReject) => {
                        _getAllEvents(dbCtx, null, cnt).then(
                            (values: IIndexedDbItem[]) => {
                                //TODO: orderEvents By CriticalCnt
                                allEventsResolve(_getEvents(values));
                            },
                            allEventsReject);
                    });
                });
            };

            /**
             * Get all of the currently cached events( with given number) from the storage mechanism
             */
            _this.getNextBatch = () => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return [];
                }

                // Start an asynchronous set of events to access the Db, this first one will wait until all current outstanding
                // events are completed or rejected
                return _openDb<IStorageTelemetryItem[]>((dbCtx: IIndexedDbOpenDbContext<IProviderDbContext>) => {
                    return createAsyncPromise<IStorageTelemetryItem[]>((allEventsResolve, allEventsReject) => {
                        _getAllEvents(dbCtx, null, 1).then(
                            (values: IIndexedDbItem[]) => {
                                allEventsResolve(_getEvents(values));
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
            _this.addEvent = (key: string, item: IStorageTelemetryItem, itemCtx: IProcessTelemetryContext) => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return item;
                }

                item.id = item.id || getTimeId();
                item.criticalCnt = item.criticalCnt || 0;

                return _openDb<IStorageTelemetryItem>(
                    (dbCtx) => {
                        let eventKey = key || item.id;
                        let dbItem: IIndexedDbItem = {
                            id: eventKey,
                            evt: item,
                            tm: _getTime(),
                            v: StoreVersion
                        };
                        return _addDbEvent(dbCtx, dbItem, true);
                    });
            };

            /**
             * Removes the values
             * @param evts
             */
            _this.removeEvents = (evts: IStorageTelemetryItem[]) => {
                if (_indexedDb == null || !_indexedDb.isAvailable()) {
                    return [];
                }

                let removedEvents: IStorageTelemetryItem[] = [];
                return createAsyncPromise<IStorageTelemetryItem[]>((removeEventsResolve, removeEventsReject) => {
                    // Open the Db store, this will handling resolving and rejecting this promise via the passed resolve/reject functions
                    _openDb<IIndexedDbItem[]>((dbCtx) => {
                        return dbCtx.openCursor<IIndexedDbItem>(
                            EventObjectStoreName,
                            null,
                            (cursorState, value: IIndexedDbItem, values: IIndexedDbItem[]) => {
                                if (_getId(value.id, evts) !== -1) {
                                    
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
                    }).then(() => {
                        removeEventsResolve(removedEvents);                         // Resolve the RemoveEvents call promise
                    },
                    (reason) => {
                        removeEventsResolve(removedEvents);                         // Resolve the RemoveEvents call promise
                    });
                });
            };

            /**
             * Removes all entries from the storage provider and returns them as part of the response, if there are any.
             */
            _this.clear = (disable?: boolean) => {
                if (_indexedDb == null || !_indexedDb.isAvailable() || !!disable) {
                    return [];
                }

                return createAsyncPromise<IStorageTelemetryItem[]>((clearResolve, clearReject) => {
                    _openDb<IIndexedDbItem[]>((dbCtx) => {
                        //delete all evts
                        return _deleteEvents(dbCtx, null, (value) => {
                            return true; // TODO: add conditions
                        });
                    }).then(
                        (values: IIndexedDbItem[]) => {
                            clearResolve(_getEvents(values));
                        }, (reason) => {
                            clearResolve([]);

                        }
                    );
                });
            };

            _this.clean = (disable?: boolean) => {
                if (_indexedDb == null || !_indexedDb.isAvailable() || !!disable) {
                    return false;
                }

                return createAsyncPromise<boolean>((cleanResolve, cleanReject) => {
                    _openDb<IIndexedDbItem[]>((dbCtx) => {
                        if (dbCtx.isNew) {
                            return [];
                        }
                        return _dropMaxTimeEvents(dbCtx, _maxStorageTime);
                    }).then(
                        (value:IIndexedDbItem[]) => {
                            cleanResolve(value && value.length > 0);
                        },(reason) => {
                            cleanResolve(false);
                        }
                    );
                });

            }

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
                            id: _endpoint,
                            storageId: _storageId
                        };

                        dbCtx.ctx = providerCtx;
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
                    function dropEvents(droppedFunc: (droppedCount: number) => void) {
                        // Try and clear space by dropping the Normal level events, note dropEvents promise never rejects
                        _dropEventsUpToPersistence(dbCtx, _maxCriticalCnt, _eventDropPerTime).then(
                            (droppedCount) => {
                                droppedFunc(droppedCount);
                            }, (reason) => {
                                // won't throw errors here, unblock following process
                                droppedFunc(0);
                            });
                    }

         
                    function _insertNewEvent() {
                        dbCtx.openStore(EventObjectStoreName, (storeCtx) => {
                            let request = storeCtx.store.put(dbItem);
                            request.onsuccess = (evt) => {
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

                                dropEvents((droppedCount: number) => {
                                    if (droppedCount > 0) {
                                        // We dropped some events so lets try adding the item again
                                        _retryAddEvent(droppedCount);
                                    } else {
                                        // We have already tried to remove all we can
                                        addEventReject(new Error(ErrorMessageUnableToAddEvent));         // Reject the calling promise
                                    }
                                });
                            };
                        });
                    }
                    _insertNewEvent();
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
    public getNextBatch(): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Get all of the currently cached events from the storage mechanism
     */
    public getAllEvents(cnt?: number): IStorageTelemetryItem[] | IPromise< IStorageTelemetryItem[]> | null {
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
        return
    }

    /**
     * Removes all entries from the storage provider, if there are any.
     */
    public clear(disable?: boolean): IStorageTelemetryItem[] | IPromise<IStorageTelemetryItem[]> | null {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Removes all entries with stroage time longer than inStorageMaxTime from the storage provider
     */
    public clean(disable?: boolean): boolean | IPromise<boolean> {
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
