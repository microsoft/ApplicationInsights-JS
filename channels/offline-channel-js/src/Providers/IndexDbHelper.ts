// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import { IDiagnosticLogger, getGlobalInst } from "@microsoft/applicationinsights-core-js";
import {
    IPromise, StartQueuedTaskFn, createAsyncPromise, createAsyncRejectedPromise, createAsyncResolvedPromise, createTaskScheduler, doAwait,
    doAwaitResponse
} from "@nevware21/ts-async";
import { getGlobal, isFunction, isPromiseLike, isString } from "@nevware21/ts-utils";
import {
    CursorProcessResult, IDbContext, IIndexedDbDetails, IIndexedDbOpenDbContext, IIndexedDbSimpleQuery, IIndexedDbStoreActionContext,
    IProcessCursorState
} from "../Interfaces/IOfflineIndexDb";

//TODO: move all const to one file
//TODO: handle db names
const IndexedDBNames: string[] = ["indexedDB"/*, 'mozIndexedDB', 'webkitIndexedDB', 'msIndexedDb'*/];
const DbReadWrite = "readwrite";
const Result = "result";
const ErrorMessageUnableToOpenDb = "DBError: Unable to open database";
const ErrorMessageDbUpgradeRequired = "DBError: Database upgrade required";
const ErrorMessageDbNotOpen = "Database is not open";
const ErrorMessageDbDoesNotExist = "DBError: Database does not exist";
const ErrorMessageFailedToDeleteDatabase = "DBError: Failed to delete the database";
const ErrorMessageDbNotSupported = "DBError: Feature not supported";
const ErrorMessageFailedToOpenCursor = "DBError: Failed to Open Cursor";

//window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
//window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

// By placing this variable here it becomes a global hidden static

/**
 * This is used to enforce sequential access to the IndexedDb, so that all operations don't interfere
 * with each other, this is REALLY useful to ensure that any previous operation has completed before
 * subsequent operations are completed -- especially for testing using different IndexedDbHelper instances.
 */
let _dbContext: IDbContext[] = [];
/**
 * Constructs the IDbContext instance
 * @param dbName - The current database name

 * @param diagLog - The diagnostics logger to use
 */
function _getDbContext(dbName: string, diagLog?: IDiagnosticLogger): IDbContext {
    let dbCtx: IDbContext = null;
    for (let lp = 0; lp < _dbContext.length; lp++) {
        dbCtx = _dbContext[lp];
        if (dbCtx.name === dbName) {
            return dbCtx;
        }
    }

    // Create the global handle for the database
    dbCtx = {
        name: dbName,
        sch: createTaskScheduler(createAsyncPromise, "IndexedDbHelper[" + dbName + "]"),
        dbHdl: [],
        add: (db: IDBDatabase) => {
            dbCtx.dbHdl.push(db);
            _debugLog(dbName, "- dbOpened (add) -- hdls [" + dbCtx.dbHdl.length + "]");
        },
        remove: (db: IDBDatabase) => {
            let hdls = dbCtx.dbHdl;
            for (let lp = 0; lp < hdls.length; lp++) {
                if (hdls[lp] === db) {
                    hdls.splice(lp, 1);
                    break;
                }
            }

            _debugLog(dbName, "- dbClosed (remove) -- hdls [" + dbCtx.dbHdl.length + "]");
        },
        isOpen: (): boolean => {
            return dbCtx.dbHdl.length > 0;
        },
        openHdl: (): IDBDatabase => {
            if (dbCtx.dbHdl.length > 0) {
                return dbCtx.dbHdl[0];
            }
            return null;
        }
    };
    _dbContext.push(dbCtx);

    return dbCtx;
}

/**
 * Schedule an event that will execute the startEvent after all outstanding events are resolved or if any event rejects the optional
 * rejectEvent will be executed. This is used to ensure that we don't attempt to execute events out of order such as attempting to removed
 * an event from the indexedDb before the insertion of the event has completed. Only one of the startEvent or unableToStateEvent callbacks
 * functions will be called.
 * @param startEvent - The event to execute after all outstanding events are complete, may be called synchronously or asynchronously.
 * @param actionName - The name of the action being performed
 */
function _scheduleEvent<T>(dbName: string, actionName: string, startEvent: StartQueuedTaskFn<T>, evtTimeOut?: number): IPromise<T> {
    // Create or fetch the current scheduler for this dbName
    let dbCtx = _getDbContext(dbName);
    return dbCtx.sch.queue(startEvent, actionName, evtTimeOut);
}


// TODO: move to common to be able to used by lds
export function getDbFactory(): IDBFactory {
    let global = getGlobal() || ({} as Window);
    let dbFactory: IDBFactory = null;
    if (global) {
        try {
            for (let lp = 0; lp < IndexedDBNames.length; lp++) {
                dbFactory = (global[IndexedDBNames[lp]] as IDBFactory);
                if (dbFactory && isFunction(dbFactory.open)) {
                    return dbFactory;
                }
            }
        } catch (e) {
            dbFactory = null;
        }
    }

    return dbFactory;
}

function _debugLog(dbName: string, message: string) {
    // Only log if running within test harness
    if (getGlobalInst("QUnit")) {
        // tslint:disable-next-line:no-console
        console && console.log("IndexedDbHelper [" + dbName + "] " + message);
    }
}

/**
 * Helper method to map an Event rejection to a reject with a message, this is mainly for terminal errors where the
 * IndexedDb API returns an event which we are going to ignore
 * @param rejectMessage
 * @param rejectFunc
 */
function _eventReject(dbName: string, rejectMessage: string, rejectFunc: (reason?: any) => void, evtName: string) {
    return function(evt: Event) {
        rejectFunc(new Error(rejectMessage));
        _debugLog(dbName, "[" + evtName + "] event rejected");
    };
}


// This helper is designed to allow multiple database implementation
// The IndexedDB provider will be using only one database with different stores.
// for each transaction, will open a new connection
export class IndexedDbHelper<C> {
    
    constructor(diagLog?: IDiagnosticLogger) {
        let _dbFactory = getDbFactory() || null;

        dynamicProto(IndexedDbHelper, this, (_this) => {

            _this.isAvailable = (): boolean => {
                return !!_dbFactory;
            };
            
            /**
             * Schedules the opening of the database if not already open
             */
            _this.openDb = <T>(
                dbName: string,
                dbVersion: number,
                processFunc: (dbContext: IIndexedDbOpenDbContext<C>) => T | IPromise<T>,
                versionChangeFunc?: (dbContext: IIndexedDbOpenDbContext<C>) => IPromise<void>): IPromise<T> => {

                // Schedule the database to be opened
                return _scheduleEvent<T>(dbName, "openDb", (evtName) => {
                    return createAsyncPromise<T>((openResolve, openReject) => {
                        let createdNewDb = false;
                        function _createDbCtx(dbContext: IDbContext, db: IDBDatabase, dbOpenRequest: IDBOpenDBRequest, isNew: boolean, isUpgrade?: boolean): IIndexedDbOpenDbContext<C> {
                            let crDbCtx: IIndexedDbOpenDbContext<C> = {
                                db: db,
                                dbName: dbName,
                                dbVersion: dbVersion,
                                ctx: null,
                                isNew: isNew,
                                txn: dbOpenRequest ? dbOpenRequest.transaction : null // Special case see the versionChangeFunc usage below
                            };
                        

                            if (!isUpgrade) {
                                crDbCtx.openStore = <R>(eventTable: string, doAction: (store: IIndexedDbStoreActionContext<C>) => IPromise<R>|R|void): IPromise<R> => {
                                    return _openStore<R>(crDbCtx, eventTable, doAction);
                                };
                                crDbCtx.openCursor = <R>(eventTable: string, query: string|IIndexedDbSimpleQuery, cursorFunc?: (state: IProcessCursorState<C>, value: R, values: R[]) => CursorProcessResult): IPromise<R[]> => {
                                    return _openCursor(crDbCtx, eventTable, query, cursorFunc);
                                };
                            }

                            return crDbCtx;
                        }
                        // TODO: add function to handle version change
                        function _databaseUpgrade(db: IDBDatabase, dbOpenRequest: IDBOpenDBRequest, ev?: Event) {
                            _debugLog(dbName, "db upgrade called")
                            let upgDbCtx = _createDbCtx(null, db, dbOpenRequest, true, true);

                            if (!versionChangeFunc) {
                                try {
                                    dbOpenRequest.transaction && dbOpenRequest.transaction.abort();
                                    dbOpenRequest.result && dbOpenRequest.result.close(); // close database to unblock others
                                } finally {
                                    openReject(new Error(ErrorMessageDbUpgradeRequired));
                                }
                                return;
                            }

                            createdNewDb = true;
                            doAwaitResponse(versionChangeFunc(upgDbCtx), (response) => {
                                if (!response.rejected) {
                                    // Special case handling, when a DB is first created calling createObjectStore() will
                                    // automatically start a version change transaction which will block all other transactions
                                    // from getting created, so we save the auto opened on here for reuse as part of opening the store
                                    _debugLog(upgDbCtx.dbName, "on version change success")
                                    if (!upgDbCtx.txn) {
                                        upgDbCtx.txn = dbOpenRequest.transaction;
                                        _debugLog(upgDbCtx.dbName, "added open request")
                                    }
                                    
                                } else {
                                    // Abort the upgrade event
                                    try {
                                        dbOpenRequest.transaction && dbOpenRequest.transaction.abort();
                                    } finally {
                                        openReject(response.reason);
                                    }
                                }
                            });
                        }

                        function _databaseOpen(db: IDBDatabase, dbOpenRequest: IDBOpenDBRequest) {
                            // Save the IDBDatabase handle to the global reference (so we can make sure we can close/delete the Db)
                            // Also used to track the number of times the DB has been opened
                            let opDbCtx = _getDbContext(dbName);
                            opDbCtx.add(db);

                            db.onabort = (evt: Event) => {
                                _debugLog(dbName, "onabort -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            db.onerror = (evt: Event) => {
                                _debugLog(dbName, "onerror -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            
                            (db as any).onclose = (evt: Event) => {
                                _debugLog(dbName, "onclose -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            db.onversionchange = (evt: Event) => {
                                _debugLog(dbName, "onversionchange -- force closing the Db");
                                db.close();
                                opDbCtx.remove(db);
                            };

                            let openDbCtx: IIndexedDbOpenDbContext<C> = null;
                            let dbHdl: IDBDatabase = null;
                            if (opDbCtx.dbHdl.length > 0) {
                                dbHdl = opDbCtx.dbHdl[0];
                            }

                            openDbCtx = _createDbCtx(opDbCtx, dbHdl, dbOpenRequest, createdNewDb);

                            try {
                                // Database has been opened
                                doAwait(processFunc(openDbCtx), openResolve, openReject);
                            } catch (e) {
                                openReject(e);
                            }
                        }

                        let dbCtx = _getDbContext(dbName);

                        if (_dbFactory == null) {
                            openReject(new Error("No available storage factory"));
                        } else if (dbCtx.isOpen()) {
                            // Database is already open
                            let openDbCtx = _createDbCtx(dbCtx, dbCtx.openHdl(), null, false);
                            doAwait(processFunc(openDbCtx), openResolve, openReject);
                        } else {
                            let dbOpenRequest = _dbFactory.open(dbName, dbVersion);
                            if (!dbOpenRequest) {
                                throw new Error("missing API"); // in case, some corners case (such as private mode for certain browsers) does not support open db
                            }

                            // We can't open the database, possible issues are
                            // - We are attempting to open the db as a different version but it's already open
                            dbOpenRequest.onblocked = (evt: Event) => {
                                _debugLog(dbName, "Db Open Blocked event [" + evtName + "] - " + (dbOpenRequest.error || ""))
                                openReject(new Error(ErrorMessageUnableToOpenDb));
                            };
                            dbOpenRequest.onerror = (evt: Event) => {
                                _debugLog( dbName,"Db Open Error event [" + evtName + "] - " + (dbOpenRequest.error || ""))
                                openReject(new Error(ErrorMessageUnableToOpenDb));
                            };
                            dbOpenRequest.onupgradeneeded = (evt: Event) => {
                                _debugLog(dbName, "Db Open Create/Upgrade needed event [" + evtName + "]");
                                try {
                                    let db = evt.target[Result] || dbOpenRequest.result;
                                   
                                    if (!db) {
                                        _debugLog(dbName, "no db");
                                        openReject(new Error(ErrorMessageUnableToOpenDb));
                                        return;
                                    }

                                    _databaseUpgrade(db, dbOpenRequest, evt);
                                } catch (e) {
                                    _eventReject(dbName, ErrorMessageUnableToOpenDb, openReject, evtName)(e);
                                }
                            };

                            dbOpenRequest.onsuccess = (evt) => {
                                _debugLog(dbName, "Db Open sucess [" + evtName + "]");
                                let db = evt.target[Result];
                                if (!db) {
                                    openReject(new Error(ErrorMessageUnableToOpenDb));
                                    return;
                                }
                                _databaseOpen(db, dbOpenRequest);
                            };
                        }
                    });
                });
            };

            _this.closeDb = (dbName: string): void => {
                // Schedule the close so we don't interrupt an previous scheduled operations
                _debugLog(dbName, "close db");
                _scheduleEvent(dbName, "closeDb", (evtName) => {
                    let dbCtx = _getDbContext(dbName);
                    let dbHdls = dbCtx.dbHdl;
                    let len = dbHdls.length;
                    if (len > 0) {
                        for (let lp = 0; lp < len; lp++) {
                            // Just call close the db.onclose() event should take care of decrementing and removing the references
                            dbHdls[lp].close();
                        }
                        dbCtx.dbHdl = [];
                    }

                    return 1;
                }).catch((reason) => {
                    // Handle promise rejection to avoid an unhandled rejection event
                });
            };

            _this.deleteDb = (dbName: string): boolean | IPromise<boolean> => {
                if (_dbFactory == null) {
                    return false;
                }

                return _scheduleEvent<boolean>(dbName, "deleteDb", (evtName) => {
                    // Implicitly close any open db first as this WILL block the deleting
                    let dbCtx = _getDbContext(dbName);
                    let dbHdls = dbCtx.dbHdl;
                    let len = dbHdls.length;
                    if (len > 0) {
                        _debugLog(dbName, "Db is open [" + len + "] force closing");
                        for (let lp = 0; lp < len; lp++) {
                            // Just call close the db.onclose() event should take care of decrementing and removing the references
                            dbHdls[lp].close();
                        }

                        // Clear all of the existing handles as we have forced closed them and for compatibility we can't
                        // rely on the db onclose event
                        dbCtx.dbHdl = [];
                    }

                    return createAsyncPromise<boolean>((deleteResolve, deleteReject) => {
                        // Attempting to delete the Db, only after we wait so that any outstanding operations can finish
                        setTimeout(() => {
                            try {
                                _debugLog(dbName, "[" + evtName + "] starting");

                                let dbRequest = _dbFactory.deleteDatabase(dbName);
                                dbRequest.onerror = (evt: Event) => {
                                    deleteReject(new Error(ErrorMessageFailedToDeleteDatabase));
                                };
                                dbRequest.onblocked = (evt: Event) => {
                                    deleteReject(new Error(ErrorMessageFailedToDeleteDatabase));
                                };
                                dbRequest.onupgradeneeded = (evt: Event) => {
                                    deleteReject(new Error(ErrorMessageFailedToDeleteDatabase));
                                };
                                dbRequest.onsuccess = (evt: Event) => {
                                    _debugLog(dbName, "[" + evtName + "] complete");
                                    deleteResolve(true);
                                };
                                _debugLog(dbName, "[" + evtName + "] started");
                            } catch (e) {
                                deleteReject(new Error(ErrorMessageFailedToDeleteDatabase + " - " + e));
                            }
                        }, 0);
                    });
                });
            };

            _this.getDbDetails = (dbName: string): IPromise<IIndexedDbDetails> => {
                return _scheduleEvent<IIndexedDbDetails>(dbName, "getDbDetails", (evtName) => {
                    if (_dbFactory == null || !(_dbFactory as any).databases) {
                        // Either IndexedDb is not supported or databases is not supported
                        return createAsyncRejectedPromise<IIndexedDbDetails>(new Error(ErrorMessageDbNotSupported));
                    }

                    return createAsyncPromise<IIndexedDbDetails>((databasesResolve, databasesReject) => {
                        // databases() is still experimental, so it's not fully available
                        // The promise will reject if there is a JS error
                        let dbPromise = (_dbFactory as any).databases();
                        dbPromise.then((databases) => {
                            for (let lp = 0; lp < databases.length; lp++) {
                                if (databases[lp].name === dbName) {
                                    databasesResolve(databases[lp]);
                                    return;
                                }
                            }
                            databasesReject(new Error(ErrorMessageDbDoesNotExist));
                        }, databasesReject);
                    });
                }, 2000);
            };

            function _createStoreContext(openDbCtx: IIndexedDbOpenDbContext<C>, eventTable: string): IIndexedDbStoreActionContext<C> {
                // Save the current handle so we close the correct one during the transaction events
                let dbHdl: IDBDatabase = openDbCtx.db || null;

                // Check if the openDb event created a transaction that we should reuse
                let tx: IDBTransaction = dbHdl && dbHdl.transaction(eventTable, DbReadWrite);
                if (tx) {
                    // The transaction was aborted and therefore the adding of the event failed
                    tx.onabort = () => {
                        // add log
                    };
                    tx.onerror = () => {
                        // add log
                    };

                    // Note we don't listen for the transaction onComplete event as we don't have any value
                    // to resolve the promise with, we are relying on the doAction() to resolve and the exception
                    // handling below to ensure we don't deadlock.
                    tx.oncomplete = () => {
                        // We need to capture the transaction close event as not all browsers are triggering the db onclose event
                        _debugLog(openDbCtx.dbName, "txn.oncomplete");
                    };

                    // Ok, so now we have the transaction handling setup lets try and store the event
                    return  {
                        db: openDbCtx,
                        store: tx.objectStore(eventTable),
                        tx: tx,
                        tbl: eventTable,
                        openCursor: <T>(
                            query: string|IIndexedDbSimpleQuery,
                            processFunc?: (state: IProcessCursorState<C>, value: T, values: T[]) => CursorProcessResult): IPromise<T[]> => {
                            return _openCursor(openDbCtx, eventTable, query, processFunc);
                        },
                        newTransaction: <T>(doAction: (store: IIndexedDbStoreActionContext<C>) => IPromise<T>): IPromise<T> => {
                            return _openStore<T>(openDbCtx, eventTable, doAction);
                        }
                    };
                    
                }
                return null;
            }

            /**
             * Opens the specific store for the database
             * @param openDbCtx
             * @param eventTable
             * @param doAction
             */
            function _openStore<T>(openDbCtx: IIndexedDbOpenDbContext<C>, eventTable: string, doAction: (store: IIndexedDbStoreActionContext<C>) => IPromise<T>|T|void): IPromise<T> {
                // While the open DB promise may have been resolved we still might not have opened the DB (This is to ensure that
                // non-critical failures don't cause event execution out of order)
                if (!openDbCtx || !openDbCtx.db) {
                    // Database is not open so pass the only option is to resolve the event so it's passed onto the next on the event to the next chain
                    return createAsyncRejectedPromise<T>(new Error(ErrorMessageDbNotOpen));
                }

                try {
                    // Perform the transaction action
                    let result = doAction(_createStoreContext(openDbCtx, eventTable));
                    if (isPromiseLike(result)) {
                        return result;
                    }

                    return createAsyncResolvedPromise<T>(result as T);
                } catch (e) {
                    return createAsyncRejectedPromise(e);
                }
            }

            function _openCursor<T>(
                openDbCtx: IIndexedDbOpenDbContext<C>,
                eventTable: string,
                query: string | IIndexedDbSimpleQuery,
                processFunc?: (state: IProcessCursorState<C>, value: T, values: T[]) => CursorProcessResult): IPromise<T[]> {

                // While the open DB promise may have been resolved we still might not have opened the DB (This is to ensure that
                // non-critical failures don't cause event execution out of order)
                if (!openDbCtx || !openDbCtx.db) {
                    // Database is not open so pass the only option is to resolve the event so it's passed onto the next on the event to the next chain
                    return createAsyncRejectedPromise<T[]>(new Error(ErrorMessageDbNotOpen));
                }

                let simpleQuery: IIndexedDbSimpleQuery = null;
                if (query && isString(query)) {
                    simpleQuery = new SimpleQuery(query as string);
                } else if (query && (query as any).isMatch) {          // simple check to make sure this is a IIndexedDbSimpleQuery
                    simpleQuery = (query as IIndexedDbSimpleQuery);
                }

                return createAsyncPromise<T[]>((openCursorResolve, openCursorReject) => {
                    let values: T[] = [];
                    let cursorRequest: IDBRequest = null;
                    let queryKeyRange = null;
                    if (simpleQuery && simpleQuery.keyRange) {
                        queryKeyRange = simpleQuery.keyRange();
                    }

                    let storeCtx = _createStoreContext(openDbCtx, eventTable);

                    if (queryKeyRange) {
                        cursorRequest = storeCtx.store.openCursor(queryKeyRange);
                    } else {
                        cursorRequest = storeCtx.store.openCursor();
                    }
                    cursorRequest.onerror = _eventReject(storeCtx.db.dbName, ErrorMessageFailedToOpenCursor, openCursorReject, "openCursor");
                    cursorRequest.onsuccess = (evt: Event) => {
                        // Cursor was open/next iteration
                        let cursor: IDBCursorWithValue = evt.target[Result];
                        if (!cursor) {
                            // This occurs when we get to the end of the cursor iteration
                            openCursorResolve(values);
                            return;
                        }

                        let processCursorState: IProcessCursorState<C> = {
                            store: storeCtx,
                            cursor: cursor,
                            continue: () => {
                                cursor.continue();
                            },        // Moves to the next matching item
                            done: () => {
                                openCursorResolve(values);
                            }     // Stops the cursor processing
                        };

                        var value = cursor.value;
                        if (simpleQuery && !simpleQuery.isMatch(value)) {
                            processCursorState.continue();
                            return;
                        }

                        if (processFunc) {
                            try {
                                switch (processFunc(processCursorState, value, values)) {
                                case CursorProcessResult.Complete:
                                    openCursorResolve(values);
                                    break;
                                case CursorProcessResult.Waiting:
                                    // The process method now controls whether th
                                    break;
                                case CursorProcessResult.Continue:
                                default:
                                    processCursorState.continue();
                                    break;
                                }
                            } catch (ex) {
                                // Make sure the reject the promise if the processFunc callback throws unexpectable
                                openCursorReject(ex);
                            }
                        } else {
                            values.push(value);
                            processCursorState.continue();
                        }
                    };
                });
            }
            
        });

        
    }
    
    /**
     * Identifies whether an IndexedDb api is available
     */
    public isAvailable(): boolean {
    // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    public openDb<T>(
        dbName: string,
        dbVersion: number,
        processFunc: (dbContext: IIndexedDbOpenDbContext<C>) => T | IPromise<T>,
        versionChangeFunc?: (dbContext: IIndexedDbOpenDbContext<C>) => IPromise<void>): IPromise<T> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }


    /**
     * Request that any open database handles for the named database be closed.
     * This method will return immediately, however, the scheduled event to close the open Db handles will not occur until all outstanding database operations
     * (openDb, deleteDb, getDbDetails) started by IndexedDbHelper for the named db have completed. This will NOT affect or wait for any open database handles
     * which have been directly opened by the IndexedDB Api.
     * @param dbName - The name of the database to close, no error will be returned if the database does not exist or was not opened.
     */
    public closeDb(dbName: string): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Request that the named database should be deleted, this implicitly closes any previously opened database that was opened via IndexedDBHelper.
     * It will also wait for all Promise objects from previous openDb, closeDb, getDbDetails to complete (resolve or reject) before attempting to
     * perform the delete operation. This operation may block or fail if the database is opened outstide of the IndexedDbHelper
     * The returned promise will be resolved or rejected depending on the outcome of the delete operation.
     * @param dbName - The name of the database to delete
     */
    public deleteDb(dbName: string): boolean | IPromise<boolean> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }

    /**
     * Attempt to return the details (version) of the named database if possible.
     * This method requires that the underlying browser support draft specification for IDBFactory.databases, if this is not supported then the returned
     * Promise will be rejected with an error message stating that the feature is not supported.
     * The returned Promise will be resolved with the details if available or rejected on error.
     * @param dbName - The name of the database to request the details for
     */
    public getDbDetails(dbName: string): IPromise<IIndexedDbDetails> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }
}




/**
 * Internal value used by the SimpleQuery to identify the type of search being performed
 */
const enum ValueQueryType {
    StartsWith = 0,
    Contains = 1
}

/**
 * Internal Interface used by the SimpleQuery class to define the cursor search definition
 */
interface IValueQuery {
    name: string;
    value: string;
    type: ValueQueryType;
}

/**
 * A simple query interface to provide a simple cursor query (IDBKeyRange) key range and matching.
 * Used by the openCursor() method.
 */
class SimpleQuery implements IIndexedDbSimpleQuery {

    constructor(theQuery?: string) {
        let _queryCols: IValueQuery[] = [];
        let _keyRange: IDBKeyRange = null;

        dynamicProto(SimpleQuery, this, (_this) => {
            _this.keyRange = () => {
                return _keyRange;
            };

            _this.parseQuery = (query: string) => {
                _queryCols = [];

                if (query) {
                    let items = query.split(";");
                    for (let lp = 0; lp < items.length; lp++) {
                        let item = items[lp];
                        let idx = item.indexOf("=");
                        if (idx !== -1) {
                            let key = item.substring(0, idx);
                            let value = item.substring(idx + 1);
                            if (key.indexOf("#") === 0) {
                                key = key.substring(1);
                                if (!_keyRange) {
                                    _keyRange = IDBKeyRange.bound(value, value + "\uffff");
                                }
                            }

                            _this.startsWith(key, value);
                        }
                    }
                }
            };

            _this.startsWith = (columnName: string, value: string) => {
                _queryCols.push({
                    name: columnName,
                    value: value,
                    type: ValueQueryType.StartsWith
                });
            };

            _this.contains = (columnName: string, value: string) => {
                _queryCols.push({
                    name: columnName,
                    value: value,
                    type: ValueQueryType.Contains
                });
            };

            _this.isMatch = (value: any) => {
                // No query restriction so everything matches
                if (!_queryCols || _queryCols.length === 0) {
                    return true;
                }

                if (!value) {
                    return false;
                }

                for (let lp = 0; lp < _queryCols.length; lp++) {
                    let query = _queryCols[lp];
                    let chkValue = value[query.name];
                    if (chkValue) {
                        if (query.type === ValueQueryType.StartsWith) {
                            if (chkValue.indexOf(query.value) !== 0) {
                                return false;
                            }
                        } else if (query.type === ValueQueryType.Contains) {
                            if (chkValue.indexOf(query.value) === -1) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            };

            if (theQuery) {
                _this.parseQuery(theQuery);
            }
        });
    }

    /**
     * [Optional] Returns and optional IndexedDB IDBKeyRange instance that will be passed to the IndexedDB Api openCursor() method.
     * Value returned May be null.
     */
    public keyRange?(): IDBKeyRange;

    /**
     * Processes the provided string and attempts to create a simple query from the values, this can be a ';' seperated list of values where each value represents a
     * <key>=<value> set with <key> being the property name to match and <value> being the value. If the <key> is prefixed with a '#' character then this will be used to as
     * the query "key" and will populate the keyRange() returned by the keyRange() method.
     * @param query - */
    public parseQuery?(query: string): void;

    /**
     * Creates a simple "startsWith" check. This is same as passing "<columnName>=<value>" to the parseQuery() method.
     * @param columnName - The property of the returned object
     * @param value - The value of the property from the returned object to perform a startsWith() match against
     */
    public startsWith?(columnName: string, value: string): void;

    /**
     * Creates a simple "contains" check. This will create a search query that will return true whenever the <columnName> value contains <value>
     * anywhere in the resulting string (i.e. it performs an xxxx.indexOf(<value>) != -1)
     * @param columnName - The property of the returned object
     * @param value - The value of the property from the returned object to perform a startsWith() match against
     */
    public contains?(columnName: string, value: string): void;

    /**
     * [Optional] Callback method used to provide additional validation on whether the returned value from the IndexedDB Api cursor iteration, this method
     * must return true for the processFunc() of the openCursor() is called or the value is just added to the identified items.
     * @param value - The value returned by the IndexedDB IDBCursorWithValue cursor event.
     * @returns true if the value matches otherwise false
     */
    public isMatch?(value: any): boolean;
}
