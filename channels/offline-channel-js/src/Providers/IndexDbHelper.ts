import { arrForEach, getGlobal, isFunction, isPromiseLike, isString } from "@nevware21/ts-utils";
import { CursorProcessResult, IDbContext, IIndexedDbDetails, IIndexedDbOpenDbContext, IIndexedDbSimpleQuery, IIndexedDbStoreActionContext, IProcessCursorState } from "../Interfaces/IOfflineIndexDb";
import { IInternalDbSchema } from "../Interfaces/IOfflineBatch";
import { createAsyncPromise,ITaskScheduler, createTaskScheduler, IPromise, StartQueuedTaskFn, doAwait, doAwaitResponse, createAsyncRejectedPromise, createAsyncResolvedPromise } from "@nevware21/ts-async";
import dynamicProto from "@microsoft/dynamicproto-js";
import { IDiagnosticLogger, getGlobalInst } from "@microsoft/applicationinsights-core-js";

const IndexedDBNames: string[] = ["indexedDB"/*, 'mozIndexedDB', 'webkitIndexedDB', 'msIndexedDb'*/];
const DbReadWrite = "readwrite";
const Result = "result";
const ErrorMessageUnableToOpenDb = "DBError: Unable to open database";
const ErrorMessageDbUpgradeRequired = "DBError: Database upgrade required";
const ErrorMessageDbNotOpen = "Database is not open";

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
 * @param dbName The current database name
 * @param diagLog The diagnostics logger to use
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
 * @param startEvent The event to execute after all outstanding events are complete, may be called synchronously or asynchronously.
 * @param actionName The name of the action being performed
 */
function _scheduleEvent<T>(dbName: string, actionName: string, startEvent: StartQueuedTaskFn<T>, evtTimeOut?: number): IPromise<T> {
    // Create or fetch the current scheduler for this dbName
    let dbCtx = _getDbContext(dbName);
    return dbCtx.sch.queue(startEvent, actionName, evtTimeOut);
}


// different sotres for different sesssions
// case: ipayload of binary data instead of string[]

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


// This helper is designed to allow multiple database implementation
// The IndexedDB provider will be using only one database with different stores.
// for each transaction, will open a new connection
export class IndexedDbHelper<C> {
    
    constructor(sch: IInternalDbSchema, diagLog?: IDiagnosticLogger) {
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
                            let upgDbCtx = _createDbCtx(null, db, dbOpenRequest, true, true);

                            if (!versionChangeFunc) {
                                try {
                                    dbOpenRequest.onerror = ev.preventDefault || ev.stopPropagation; // prevent on error before txn abort
                                    dbOpenRequest.transaction && dbOpenRequest.transaction.abort();
                                    dbOpenRequest.result && dbOpenRequest.result.close(); // close database to unblock others
                                    // should we delete the database here since it will always use older version of schema
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
                                    if (!upgDbCtx.txn) {
                                        upgDbCtx.txn = dbOpenRequest.transaction;
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
                                //_warnLog(diagLog, dbName, "onabort -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            db.onerror = (evt: Event) => {
                                //_warnLog(diagLog, dbName, "onerror -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            // Need to "cast" to any as the tsc compiler is complaining
                            (db as any).onclose = (evt: Event) => {
                                //_warnLog(diagLog, dbName, "onclose -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            db.onversionchange = (evt: Event) => {

                                //_warnLog(diagLog, dbName, "onversionchange -- force closing the Db");
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
                                //_warnLog(diagLog, dbName, "Db Open Blocked event [" + evtName + "] - " + (dbOpenRequest.error || ""));
                                openReject(new Error(ErrorMessageUnableToOpenDb));
                            };
                            dbOpenRequest.onerror = (evt: Event) => {
                                //_warnLog(diagLog, dbName, "Db Open Error event [" + evtName + "] - " + (dbOpenRequest.error || ""));
                                openReject(new Error(ErrorMessageUnableToOpenDb));
                            };
                            dbOpenRequest.onupgradeneeded = (evt: Event) => {
                                //_debugLog(dbName, "Db Open Create/Upgrade needed event [" + evtName + "]");
                                try {
                                    let db = evt.target[Result] || dbOpenRequest.result;
                                    if (!db) {
                                        openReject(new Error(ErrorMessageUnableToOpenDb));
                                        return;
                                    }

                                    _databaseUpgrade(db, dbOpenRequest, evt);
                                } catch (e) {
                                    //_eventReject(dbName, ErrorMessageUnableToOpenDb, openReject, evtName)(e);
                                }
                            };

                            dbOpenRequest.onsuccess = (evt) => {
                                let db = evt.target[Result];
                                if (!db) {
                                    //openReject(new Error(ErrorMessageUnableToOpenDb));
                                    return;
                                }
                                _databaseOpen(db, dbOpenRequest);
                            };
                        }
                    });
                });
            };

            function _createStoreContext(openDbCtx: IIndexedDbOpenDbContext<C>, eventTable: string): IIndexedDbStoreActionContext<C> {
                // Save the current handle so we close the correct one during the transaction events
                let dbHdl: IDBDatabase = openDbCtx.db || null;

                // Check if the openDb event created a transaction that we should reuse
                let tx: IDBTransaction = dbHdl && dbHdl.transaction(eventTable, DbReadWrite);
                if (tx) {
                    // The transaction was aborted and therefore the adding of the event failed
                    tx.onabort = () => {
                        //_warnLog(diagLog, openDbCtx.dbName, "txn.onabort");
                    };
                    tx.onerror = () => {
                        //_warnLog(diagLog, openDbCtx.dbName, "txn.onerror");
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
                query: string|IIndexedDbSimpleQuery,
                processFunc?: (state: IProcessCursorState<C>, value: T, values: T[]) => CursorProcessResult): IPromise<T[]> {

                // While the open DB promise may have been resolved we still might not have opened the DB (This is to ensure that
                // non-critical failures don't cause event execution out of order)
                if (!openDbCtx || !openDbCtx.db) {
                    // Database is not open so pass the only option is to resolve the event so it's passed onto the next on the event to the next chain
                    //return createAsyncRejectedPromise<T[]>(new Error(ErrorMessageDbNotOpen));
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
                    //cursorRequest.onerror = _eventReject(storeCtx.db.dbName, ErrorMessageFailedToOpenCursor, openCursorReject, "openCursor");
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
}

// should be called during on onupgradeneeded for initialization or version change
export function addDbSchema(db: IDBDatabase, sch: IInternalDbSchema) {
    createAsyncPromise((resolve, reject) => {
        try {
            if (!db) {
                reject("error");
            }
            if (!db.objectStoreNames.contains(sch.name)) {
                let store = db.createObjectStore(sch.st, sch.key);
                
                // for current implementation, index will not be used
            }
            db.onversionchange = (ev) => {
                db.close();
            };

            db.onerror = (ev) => {
                reject("error");
            };
        } catch (e) {
            reject(e);
        }
    });
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
     * @param query
     */
    public parseQuery?(query: string): void;

    /**
     * Creates a simple "startsWith" check. This is same as passing "<columnName>=<value>" to the parseQuery() method.
     * @param columnName The property of the returned object
     * @param value The value of the property from the returned object to perform a startsWith() match against
     */
    public startsWith?(columnName: string, value: string): void;

    /**
     * Creates a simple "contains" check. This will create a search query that will return true whenever the <columnName> value contains <value>
     * anywhere in the resulting string (i.e. it performs an xxxx.indexOf(<value>) != -1)
     * @param columnName The property of the returned object
     * @param value The value of the property from the returned object to perform a startsWith() match against
     */
    public contains?(columnName: string, value: string): void;

    /**
     * [Optional] Callback method used to provide additional validation on whether the returned value from the IndexedDB Api cursor iteration, this method
     * must return true for the processFunc() of the openCursor() is called or the value is just added to the identified items.
     * @param value The value returned by the IndexedDB IDBCursorWithValue cursor event.
     * @returns true if the value matches otherwise false
     */
    public isMatch?(value: any): boolean;
}



