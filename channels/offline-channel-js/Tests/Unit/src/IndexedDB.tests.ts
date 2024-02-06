import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { IndexedDbHelper } from "../../../src/Providers/IndexDbHelper";
import { IIndexedDbOpenDbContext } from "../../../src/Interfaces/IOfflineIndexDb";
import { createAsyncPromise } from "@nevware21/ts-async";
import { arrForEach } from "@nevware21/ts-utils";

interface IProviderDbContext {
    iKey: string;               // The current iKey for the events
    storageId: string;           // The current storage instance (think browser instance / tab)
    iKeyPrefix?: () => string;   // Returns the prefix applied to all events of the current iKey
    evtKeyPrefix?: () => string; // Returns the current prefix to apply to events
}




export class OfflineIndexedDBTests extends AITestClass {
    private dbHelper: any;
    private ctx: any;
 
    public testInitialize() {
        super.testInitialize();
        this.dbHelper = new IndexedDbHelper<IProviderDbContext>();
        this.ctx = {};
    }

    public testCleanup() {
        super.testCleanup();
        this.dbHelper = null;
        this.ctx = null
    }

    public registerTests() {

        this.testCaseAsync({
            name: "IndexedDBHelper: Open one new db once and then close it",
            stepDelay: 100,
            steps: [() => {
                let dbName = "testDB";
                let isAvailable = this.dbHelper.isAvailable();
                Assert.ok(isAvailable, "db should be available");
                let ctxKeys = Object.keys(this.ctx);
                Assert.equal(ctxKeys.length, 0, "db should not have ctx");

                let processFunc = (dbContext: IIndexedDbOpenDbContext<IProviderDbContext>) => {
                    return createAsyncPromise<IIndexedDbOpenDbContext<IProviderDbContext>>((resolve, reject) => {
                        if (dbContext) {
                            this.ctx.processFunc = dbContext;
                            resolve(dbContext);
                        }
                        reject(new Error("process function error"));
                    });
                };
                let versionChangeFunc = (dbContext: IIndexedDbOpenDbContext<IProviderDbContext>) =>  {
                    function _createDb(db: IDBDatabase) {
                        // data in the same db must have same endpoint url
                        if (!db.objectStoreNames.contains("Evts")) {
                            // since we have in Memory timer, so time for each Ipayload data should be different.
                            let evtStore = db.createObjectStore("Evts", { keyPath: "time" });
                            evtStore.createIndex("persistence", "persistence", {unique: false });
                        }
                    }
                    return createAsyncPromise<void>((resolve, reject) => {
                        if (dbContext) {
                            let db = dbContext.db;
                            _createDb(db);
                            this.ctx.versionChangeFunc = dbContext;
                            resolve();
                        }
                        reject(new Error("versionChangeFunc function error"));
                    });
                }
                
                this.dbHelper.openDb(dbName, 1, processFunc, versionChangeFunc);
                this.dbHelper.deleteDb(dbName).then((val) => {
                    this.ctx.isClosed = val;
                });

               
            }].concat(PollingAssert.createPollingAssert(() => {
                let processFunc = this.ctx.processFunc;
                let versionChangeFunc = this.ctx.processFunc;
 
                if (processFunc && versionChangeFunc) {
                 
                    Assert.equal(processFunc.dbName, "testDB", "process function should have correct db name");
                    Assert.equal(processFunc.dbVersion, 1, "process function should have correct db version");
                    Assert.ok(processFunc.isNew, "db is new");
      
                    Assert.equal(versionChangeFunc.dbName,"testDB", "versionChange function should have correct db name");
                    Assert.equal(versionChangeFunc.dbVersion,1, "versionChange function should have correct db version");
                    Assert.ok(versionChangeFunc.isNew, "db is new");
                    return true;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isClosed = this.ctx.isClosed;
 
                if (isClosed) {
                    return true;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDBHelper: Open one db mutiple times and close db once",
            stepDelay: 100,
            steps: [() => {
                let dbName = "testDB";
                let isAvailable = this.dbHelper.isAvailable();
                Assert.ok(isAvailable, "db should be available");
                let ctxKeys = Object.keys(this.ctx);
                Assert.equal(ctxKeys.length, 0, "db should not have ctx");
                this.ctx = {
                    process: [],
                    versionChangeFunc: 0
                }

                let processFunc = (dbContext: IIndexedDbOpenDbContext<IProviderDbContext>) => {
                    return createAsyncPromise<IIndexedDbOpenDbContext<IProviderDbContext>>((resolve, reject) => {
                        if (dbContext) {
                            this.ctx.process.push(dbContext)
                            resolve(dbContext);
                        }
                        reject(new Error("process function error"));
                    });
                };

                let versionChangeFunc = (dbContext: IIndexedDbOpenDbContext<IProviderDbContext>) =>  {
                    function _createDb(db: IDBDatabase) {
                        // data in the same db must have same endpoint url
                        if (!db.objectStoreNames.contains("Evts")) {
                            // since we have in Memory timer, so time for each Ipayload data should be different.
                            let evtStore = db.createObjectStore("Evts", { keyPath: "time" });
                            evtStore.createIndex("persistence", "persistence", {unique: false });
                        }
                    }
                    return createAsyncPromise<void>((resolve, reject) => {
                        if (dbContext) {
                            let db = dbContext.db;
                            _createDb(db);
                            this.ctx.versionChangeFunc++;
                            resolve();
                        }
                        reject(new Error("versionChangeFunc function error"));
                    });
                }
                
                this.dbHelper.openDb(dbName, 1, processFunc, versionChangeFunc);
                this.dbHelper.openDb(dbName, 1, processFunc, versionChangeFunc);
                this.dbHelper.openDb(dbName, 1, processFunc, versionChangeFunc);
                this.dbHelper.openDb(dbName, 1, processFunc, versionChangeFunc);
                this.dbHelper.deleteDb(dbName).then((val) => {
                    this.ctx.isClosed = val;
                });

               
            }].concat(PollingAssert.createPollingAssert(() => {
                let process = this.ctx.process;
                let versionChangeFunc = this.ctx.versionChangeFunc;
 
                if (process.length > 3 && versionChangeFunc) {
                    let newOpenRequest = 0;
                    let oldOpenRequest = 0
                    arrForEach(process, (item) => {
                        item.isNew? newOpenRequest++ : oldOpenRequest++;
                    })
                    Assert.equal(newOpenRequest, 1, "should have only one new open request");
                    Assert.equal(oldOpenRequest, 3, "should have three old open request");
                    Assert.equal(versionChangeFunc, 1, "versionChange function should be called 1 times");
                    return true;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isClosed = this.ctx.isClosed;
 
                if (isClosed) {
                    return true;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDBHelper: Open mutiple db and close all opend db",
            stepDelay: 100,
            steps: [() => {
                let dbName = "testDB";
                let dbName1 = "testDB1";
                let dbName2 = "testDB2";
                let isAvailable = this.dbHelper.isAvailable();
                Assert.ok(isAvailable, "db should be available");
                let ctxKeys = Object.keys(this.ctx);
                Assert.equal(ctxKeys.length, 0, "db should not have ctx");
                this.ctx = {
                    process: [],
                    versionChangeFunc: 0,
                    isClosed: 0
                }

                let processFunc = (dbContext: IIndexedDbOpenDbContext<IProviderDbContext>) => {
                    return createAsyncPromise<IIndexedDbOpenDbContext<IProviderDbContext>>((resolve, reject) => {
                        if (dbContext) {
                            this.ctx.process.push(dbContext)
                            resolve(dbContext);
                        }
                        reject(new Error("process function error"));
                    });
                };

                let versionChangeFunc = (dbContext: IIndexedDbOpenDbContext<IProviderDbContext>) =>  {
                    function _createDb(db: IDBDatabase) {
                        // data in the same db must have same endpoint url
                        if (!db.objectStoreNames.contains("Evts")) {
                            // since we have in Memory timer, so time for each Ipayload data should be different.
                            let evtStore = db.createObjectStore("Evts", { keyPath: "time" });
                            evtStore.createIndex("persistence", "persistence", {unique: false });
                        }
                    }
                    return createAsyncPromise<void>((resolve, reject) => {
                        if (dbContext) {
                            let db = dbContext.db;
                            _createDb(db);
                            this.ctx.versionChangeFunc++;
                            resolve();
                        }
                        reject(new Error("versionChangeFunc function error"));
                    });
                }
                
                this.dbHelper.openDb(dbName, 1, processFunc, versionChangeFunc);
                this.dbHelper.openDb(dbName1, 1, processFunc, versionChangeFunc);
                this.dbHelper.openDb(dbName2, 1, processFunc, versionChangeFunc);
                this.dbHelper.deleteDb(dbName).then((val) => {
                    this.ctx.isClosed ++;
                });
                this.dbHelper.deleteDb(dbName1).then((val) => {
                    this.ctx.isClosed ++;
                });
                this.dbHelper.deleteDb(dbName2).then((val) => {
                    this.ctx.isClosed ++;
                });

               
            }].concat(PollingAssert.createPollingAssert(() => {
                let process = this.ctx.process;
                let versionChangeFunc = this.ctx.versionChangeFunc;
 
                if (process.length > 2 && versionChangeFunc) {
                    let newOpenRequest = 0;
                    let oldOpenRequest = 0
                    arrForEach(process, (item) => {
                        item.isNew? newOpenRequest++ : oldOpenRequest++;
                    })
                    Assert.equal(newOpenRequest, 3, "should have three new open request");
                    Assert.equal(oldOpenRequest, 0, "should have no open request");
                    Assert.equal(versionChangeFunc, 3, "versionChange function should be called 3 times");
                    return true;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isClosed = this.ctx.isClosed;
 
                if (isClosed == 3) {
                    return true;
                }
                return false;
            }, "Wait for response" + new Date().toISOString(), 15, 1000) as any)
        });

    }

    
    
}

