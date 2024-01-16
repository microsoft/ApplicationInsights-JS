
import { IPromise, ITaskScheduler } from "@nevware21/ts-async";

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


export interface IIndexedDbContext {
    name: string;
    ver?: string;

}

// export interface IIndexedDbSchema {
//     name: string; // database name
//     ver?: number; // database scheme version
//     dbKey?: {keyPath?: any, autoIncrement?: boolean };
//     stName?: string; // database store name
//     indexes?: {indexName: string, keyPath?: any, options?: any}[]; // this is for future use to create indexes
// }

// export interface IOpenIndexedDbCxt extends IIndexedDbSchema {
//     db: IDBDatabase; // database
//     txn: IDBTransaction; // Open DB Transaction
//     store?: IDBObjectStore
// }

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
//  * Internal value used by the SimpleQuery to identify the type of search being performed
//  */
// const enum ValueQueryType {
//     StartsWith = 0,
//     Contains = 1
// }

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

