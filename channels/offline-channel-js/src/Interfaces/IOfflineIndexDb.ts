/**
* IndexedDbHelper.ts
* @author Nev Wylie (newylie)
* @copyright Microsoft 2019
*/
"use strict";
import { IDiagnosticLogger, getGlobalInst } from "@microsoft/applicationinsights-core-js";
import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IPromise, ITaskScheduler, StartQueuedTaskFn, createAsyncPromise, createAsyncRejectedPromise, createAsyncResolvedPromise,
    createTaskScheduler, doAwait, doAwaitResponse
} from "@nevware21/ts-async";
import { getGlobal, isFunction, isPromiseLike, isString } from "@nevware21/ts-utils";

const DbReadWrite = "readwrite";
const Result = "result";
const ErrorMessageUnableToOpenDb = "DBError: Unable to open database";
const ErrorMessageDbNotOpen = "Database is not open";
const ErrorMessageFailedToOpenCursor = "DBError: Failed to Open Cursor";
const ErrorMessageFailedToDeleteDatabase = "DBError: Failed to delete the database";
const ErrorMessageDbDoesNotExist = "DBError: Database does not exist";
const ErrorMessageDbUpgradeRequired = "DBError: Database upgrade required";
const ErrorMessageDbNotSupported = "DBError: Feature not supported";

const IndexedDBNames: string[] = ["indexedDB"/*, 'mozIndexedDB', 'webkitIndexedDB', 'msIndexedDb'*/];

// Internal methods that are not exposed as class and/or do not use internal instance methods
let _isFunction = isFunction;
let _isString = isString;

export interface IDbState {
    ver: number;
    table: any;
    db: IDBDatabase;
    active: boolean;
    openErr: any;
    isClosing: any;
}

export interface IDbContext {
    /**
     * The name of the database that has been opened
     */
    name: string;
    /**
     * The specific ITaskScheduler that will be used to schedule events against this opened database
     */
    sch: ITaskScheduler;
    /**
     * The Actual IndexedDB IDBDatabase handles returned and opened by the helper instance.
     */
    dbHdl: IDBDatabase[];
    /**
     * Adds a new handle to the array of open handles
     * @param db
     */
    add(db: IDBDatabase): void;

    /**
     * Removes the given handle from the array of open handles (if present)
     * @param db
     */
    remove(db: IDBDatabase): void;

    /**
     * Returns whether the identified database if considered to be open (i.e. has at least 1 open db handle)
     */
    isOpen(): boolean;

    /**
     * Internal helper to return the first available open db handle
     */
    openHdl(): IDBDatabase;
    state?: IDbState
}


export interface IIndexedDbState {

}

export interface IIndexedDbContext {
    name: string;
    ver?: string;

}

export interface IIndexedDbSchema {
    name: string; // database name
    ver?: number; // database scheme version
    dbKey?: {keyPath?: any, autoIncrement?: boolean };
    stName?: string; // database store name
    indexes?: {indexName: string, keyPath?: any, options?: any}[]; // this is for future use to create indexes
}

export interface IOpenIndexedDbCxt extends IIndexedDbSchema {
    db: IDBDatabase; // database
    txn: IDBTransaction; // Open DB Transaction
    store?: IDBObjectStore
}

/**
 * Result value returned by the processFunc() delegate of the _openCursor() iterating function so that
 * the internal iteration knows whether to stop, continue or wait.
 */
export const enum CursorProcessResult {
    /**
     * Just move onto the next available item for the cursor
     */
    Continue = 0,

    /**
     * The process function is waiting on another async operation and will continue or complete when it's ready
     */
    Waiting = 1,

    /**
     * Stop processing the cursor and resolve the Promise returned from the openCursor() call.
     */
    Complete = 2
}

/**
 * Internal value used by the SimpleQuery to identify the type of search being performed
 */
const enum ValueQueryType {
    StartsWith = 0,
    Contains = 1
}

/**
 * The open database context created by the openDb() method and passed to the processFunc() delegate to perform operations
 * on the opened db, this is used to pass around the current db context.
 */
export interface IIndexedDbOpenDbContext<C> {
    dbName: string;
    dbVersion: number;
    db: IDBDatabase;            // The opened indexedDb object
    ctx: C;                     // User Context
    isNew: boolean;             // Identifies if the Db was newly created during this event
    txn: IDBTransaction;        // Open DB Transaction
    /**
     * Once the database hased been opened by the openDb() method you can use this method to open a specific table (store), once successfully opened
     * the doAction callback will be called.
     * The Promise returned by the openStore() method will not resolve until either the promise returned by the doAction() callback is resolved/rejected
     * or there was an error opening the store (The database was not or is no longer open).
     * Special Note: This method IS optional and will NOT exist for the versionChangeFunc() callback, but will always exist for the processFunc() provided during the openDb() method call.
     * @param eventTable The name of the store (table) to open
     * @param doAction The callback function to execute once the store is opened and will be passed a IIndexedDbStoreActionContext<> context instance, this
     * context can be used to open a cursor and perform operations on the table. If the action does not return an Promise then open store will return a resolved promise with the returned value
     */
    openStore?<T>(
        eventTable: string,
        doAction: (store: IIndexedDbStoreActionContext<C>) => IPromise<T>|T|void): IPromise<T>;
    /**
     * A helper method that opens the store and a cursor on the table previously opened by the openStore() method of the IIndexedDbOpenDbContext<> instance that was provided by the openDb() call.
     * This enables searching (query) and iterating over the request table. The returned Promise will be resolved with an array of the requested items (if successful) and whether
     * the passed processFunc() requests or manually inserts the elements into the array. Or rejected if there was an issue opening the cursor.
     * @param eventTable The name of the store (table) to open
     * @param query Either a string that will be used to construct a SimpleQuery definition or an instance of the IIndexedDbSimpleQuery interface used to open the cursor on the store.
     * May be null to iterate over the entire store.
     * @param processFunc [Optional] The callback method that will be called for every item found matching the query for the store.
     * - If no callback is provided then the returned Promise will include all items matching the provided query (if any are found)
     * - When provided it is the processFunc() responsibility to populate the passed values[] and this array will be the values used to resolve the outer Promise once the cursor has finished iterating.
     * - The result of the processFunc() (A CursorProcessResult value) will be used to determine whether the cursor will just Continue onto the next value (if present), Complete (stop iterating) or
     * Wait for the processFunc() to call the continue() or done() methods of the IProcessCursorState<> instance, when returning "Waiting" it is the responsibility of the processFunc() to call either of
     * these methods, failure to do so will result in the operation to never complete.
     */
    openCursor?<T>(
        eventTable: string,
        query: string|IIndexedDbSimpleQuery,
        processFunc?: (state: IProcessCursorState<C>, value: T, values: T[]) => CursorProcessResult): IPromise<T[]>;
}

/**
 * The context object created by _openStore() function and passed to the doAction() delegate.
 */
export interface IIndexedDbStoreActionContext<C> {
    /**
     * The open database context used and passed to the doAction() method from the openDb() call.
     */
    db: IIndexedDbOpenDbContext<C>; // The Open Db Context used for this requests
    /**
     * The IndexedDB database transaction used for this object store
     */
    tx: IDBTransaction;
    /**
     * Identifies the name of the current object store (Table) that was opened
     */
    tbl: string;
    /**
     * The actual IndexedDB IDBObjectStore instance for the opened store that can by used to perform operations on the table (add, put, etc)
     */
    store: IDBObjectStore;          // The IndexedDb object store interface
    /**
     * A helper method that opens a cursor on the table previously opened by the openStore() method of the IIndexedDbOpenDbContext<> instance that was provided by the openDb() call.
     * This enables searching (query) and iterating over the request table. The returned Promise will be resolved with an array of the requested items (if successful) and whether
     * the passed processFunc() requests or manually inserts the elements into the array. Or rejected if there was an issue opening the cursor.
     * @param query Either a string that will be used to construct a SimpleQuery definition or an instance of the IIndexedDbSimpleQuery interface used to open the cursor on the store.
     * May be null to iterate over the entire store.
     * @param processFunc [Optional] The callback method that will be called for every item found matching the query for the store.
     * - If no callback is provided then the returned Promise will include all items matching the provided query (if any are found)
     * - When provided it is the processFunc() responsibility to populate the passed values[] and this array will be the values used to resolve the outer Promise once the cursor has finished iterating.
     * - The result of the processFunc() (A CursorProcessResult value) will be used to determine whether the cursor will just Continue onto the next value (if present), Complete (stop iterating) or
     * Wait for the processFunc() to call the continue() or done() methods of the IProcessCursorState<> instance, when returning "Waiting" it is the responsibility of the processFunc() to call either of
     * these methods, failure to do so will result in the operation to never complete.
     */
    openCursor<T>(
        query: string|IIndexedDbSimpleQuery,
        processFunc?: (state: IProcessCursorState<C>, value: T, values: T[]) => CursorProcessResult): IPromise<T[]>;
    /**
     * Starts another transaction on the current store, once successfully created the doAction callback will be called.
     * The Promise returned by the newTransaction() method will not resolve until either the promise returned by the doAction() callback is resolved/rejected
     * or there was an error opening the store (The database was not or is no longer open).
     * Special Note: This method IS optional and will NOT exist for the versionChangeFunc() callback, but will always exist for the processFunc() provided during the openDb() method call.
     * @param doAction The callback function to execute once the store is opened and will be passed a IIndexedDbStoreActionContext<> context instance, this
     * context can be used to open a cursor and perform operations on the table.
     */
    newTransaction<T>(
        doAction: (store: IIndexedDbStoreActionContext<C>) => IPromise<T>): IPromise<T>;
}

/**
 * Interface used for passing around internal state when iterating over a table via a cursor
 */
export interface IProcessCursorState<C> {
    /**
     * The context returned and used by the openStore() method returned from the openDb() method.
     */
    store: IIndexedDbStoreActionContext<C>;
    /**
     * The IndexedDB IDBCursorWithValue instance for the cursor operation
     */
    cursor: IDBCursorWithValue;
    /**
     * Helper to continue onto the next available item using the cursor
     */
    continue(): void;
    /**
     * Helper to stop processing/iterating over the cursor, the cursor operation will be stopped and the Promise returned by openCursor() will be
     * resolved with the values[]/
     */
    done(): void;
}

/**
 * Interface defining the object returned by the getDbDetails() function
 */
export interface IIndexedDbDetails {
    name: string;                           // The name of the database
    version?: number;                         // The version of the database
}

/**
 * Interface defining the search query arguments used for the openCursor() function
 */
export interface IIndexedDbSimpleQuery {
    /**
     * [Optional] Returns and optional IndexedDB IDBKeyRange instance that will be passed to the IndexedDB Api openCursor() method.
     * Value returned May be null.
     */
    keyRange?(): IDBKeyRange;

    /**
     * [Optional] Callback method used to provide additional validation on whether the returned value from the IndexedDB Api cursor iteration, this method
     * must return true for the processFunc() of the openCursor() is called or the value is just added to the identified items.
     * @param value The value returned by the IndexedDB IDBCursorWithValue cursor event.
     * @returns true if the value matches otherwise false
     */
    isMatch?(value: any): boolean;
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
 * Looks up and returns any available indexedDb instance
 */
function _getDbFactory(): IDBFactory {
    let global = getGlobal() || ({} as Window);
    let dbFactory: IDBFactory = null;
    if (global) {
        try {
            for (let lp = 0; lp < IndexedDBNames.length; lp++) {
                dbFactory = (global[IndexedDBNames[lp]] as IDBFactory);
                if (dbFactory && _isFunction(dbFactory.open)) {
                    return dbFactory;
                }
            }
        } catch (e) {
            dbFactory = null;
        }
    }

    return dbFactory || null;
}

function _debugLog(dbName: string, message: string) {
    // Only log if running within test harness
    if (getGlobalInst("QUnit")) {
        // tslint:disable-next-line:no-console
        console && console.log("IndexedDbHelper [" + dbName + "] " + message);
    }
}

function _warnLog(diagLog: IDiagnosticLogger, dbName: string, message: string) {
    diagLog && diagLog.warnToConsole("IndexedDbHelper [" + dbName + "] " + message);
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
 * The Helper class used to access an IndexedDb database, this wraps the IndexedDb Api with a Promise to provide
 * a consistent promise async pattern for handling access. This helper also serializes access to each named database
 * to provide support for sequencing different operations that need to be ordered (e.g. add must occur before remove)
 */
export class IndexedDbHelper<C> {

    /**
     * The constructor for the IndexedDb Helper instance, this will create the new instance populating the instance methods before returning.
     * @param diagLog [Optional] A IDiagnosticLogger instance to be used for logging warning messages to the console to aid in debugging.
     */
    constructor(diagLog?: IDiagnosticLogger) {
        dynamicProto(IndexedDbHelper, this, (_this) => {
            let _dbFactory = _getDbFactory() || null;

            _this.isAvailable = (): boolean => {
                // !!null => false
                // !!undefined => false
                // !!indexedDb => true
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
                        function _databaseUpgrade(db: IDBDatabase, dbOpenRequest: IDBOpenDBRequest) {
                            let upgDbCtx = _createDbCtx(null, db, dbOpenRequest, true, true);

                            if (!versionChangeFunc) {
                                try {
                                    dbOpenRequest.transaction && dbOpenRequest.transaction.abort();
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
                                _warnLog(diagLog, dbName, "onabort -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            db.onerror = (evt: Event) => {
                                _warnLog(diagLog, dbName, "onerror -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            // Need to "cast" to any as the tsc compiler is complaining
                            (db as any).onclose = (evt: Event) => {
                                _warnLog(diagLog, dbName, "onclose -- closing the Db");
                                opDbCtx.remove(db);
                            };
                            db.onversionchange = (evt: Event) => {
                                _warnLog(diagLog, dbName, "onversionchange -- force closing the Db");
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

                            // We can't open the database, possible issues are
                            // - We are attempting to open the db as a different version but it's already open
                            dbOpenRequest.onblocked = (evt: Event) => {
                                _warnLog(diagLog, dbName, "Db Open Blocked event [" + evtName + "] - " + (dbOpenRequest.error || ""));
                                openReject(new Error(ErrorMessageUnableToOpenDb));
                            };
                            dbOpenRequest.onerror = (evt: Event) => {
                                _warnLog(diagLog, dbName, "Db Open Error event [" + evtName + "] - " + (dbOpenRequest.error || ""));
                                openReject(new Error(ErrorMessageUnableToOpenDb));
                            };
                            dbOpenRequest.onupgradeneeded = (evt: Event) => {
                                _debugLog(dbName, "Db Open Create/Upgrade needed event [" + evtName + "]");
                                try {
                                    let db = evt.target[Result];
                                    if (!db) {
                                        openReject(new Error(ErrorMessageUnableToOpenDb));
                                        return;
                                    }

                                    _databaseUpgrade(db, dbOpenRequest);
                                } catch (e) {
                                    _eventReject(dbName, ErrorMessageUnableToOpenDb, openReject, evtName)(e);
                                }
                            };

                            dbOpenRequest.onsuccess = (evt) => {
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
                        _warnLog(diagLog, dbName, "Db is open [" + len + "] force closing");
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
                                    _warnLog(diagLog, dbName, "[" + evtName + "] error!!");
                                    deleteReject(new Error(ErrorMessageFailedToDeleteDatabase));
                                };
                                dbRequest.onblocked = (evt: Event) => {
                                    _warnLog(diagLog, dbName, "[" + evtName + "] blocked!!");
                                    deleteReject(new Error(ErrorMessageFailedToDeleteDatabase));
                                };
                                dbRequest.onupgradeneeded = (evt: Event) => {
                                    _warnLog(diagLog, dbName, "[" + evtName + "] upgrade needed!!");
                                    deleteReject(new Error(ErrorMessageFailedToDeleteDatabase));
                                };
                                dbRequest.onsuccess = (evt: Event) => {
                                    _debugLog(dbName, "[" + evtName + "] complete");
                                    deleteResolve(true);
                                };
                                _debugLog(dbName, "[" + evtName + "] started");
                            } catch (e) {
                                _warnLog(diagLog, dbName, "[" + evtName + "] threw - " + e);
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
                let dbHdl: IDBDatabase = openDbCtx.db;

                // Check if the openDb event created a transaction that we should reuse
                let tx: IDBTransaction = dbHdl.transaction(eventTable, DbReadWrite);

                // The transaction was aborted and therefore the adding of the event failed
                tx.onabort = () => {
                    _warnLog(diagLog, openDbCtx.dbName, "txn.onabort");
                };
                tx.onerror = () => {
                    _warnLog(diagLog, openDbCtx.dbName, "txn.onerror");
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
                    return createAsyncRejectedPromise<T[]>(new Error(ErrorMessageDbNotOpen));
                }

                let simpleQuery: IIndexedDbSimpleQuery = null;
                if (query && _isString(query)) {
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
        });
    }

    /**
     * Identifies whether an IndexedDb api is available
     */
    public isAvailable(): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Opens the named database calling the processFunc() callback function when the db has been successfully opened and the versionChangeFunc
     * if the db either doesn't exist or you request a newer version to be opened than currently exists.
     * If an error while opening the database then the returned Promise will be rejected before calling the processFunc() or
     * versionChangeFunc(). Internally, the IndexedDBHelper caches all open requests and therefore may reuse a previously opened db connection.
     * @param dbName The name of the database to open
     * @param dbVersion The version of the database to open/create
     * @param processFunc The callback function to call once the database has been successfully opened, the result of the returned Promise
     * will be propogated to the Promise returned from the openDb call.
     * @param versionChangeFunc The call function to call if the upgradeneeded event is fired for the requested dbName / dbVersion. If the returned Promise
     * is rejected then the processFunc() callback will not be called and the rejected reason will be propagated to the Promise returned from the openDb call. On
     * successfuly resolution of the Promise the processFunc() will be called. NOTE: while you can delay the result of the Promise the underlying indexedDB
     * *may* close the database before you are complete, if a close event is detected then the Promise returned by openDb() will be rejected with the reason
     * before the versionChangeFunc() is complete.
     */
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
     * @param dbName The name of the database to close, no error will be returned if the database does not exist or was not opened.
     */
    public closeDb(dbName: string): void {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
    }

    /**
     * Request that the named database should be deleted, this implicitly closes any previously opened database that was opened via IndexedDBHelper.
     * It will also wait for all Promise objects from previous openDb, closeDb, getDbDetails to complete (resolve or reject) before attempting to
     * perform the delete operation. This operation may block or fail if the database is opened outstide of the IndexedDbHelper
     * The returned promise will be resolved or rejected depending on the outcome of the delete operation.
     * @param dbName The name of the database to delete
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
     * @param dbName The name of the database to request the details for
     */
    public getDbDetails(dbName: string): IPromise<IIndexedDbDetails> {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return;
    }
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
