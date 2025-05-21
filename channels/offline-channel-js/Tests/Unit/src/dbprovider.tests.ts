import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { IndexedDbProvider } from "../../../src/Providers/IndexDbProvider";
import { createAsyncPromise, createAsyncRejectedPromise, doAwait } from "@nevware21/ts-async";
import { arrForEach, strSubstr } from "@nevware21/ts-utils";
import { TestChannel } from "./TestHelper";
import { AppInsightsCore, IConfiguration, createDynamicConfig, generateW3CId, newGuid } from "@microsoft/applicationinsights-core-js";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { IStorageTelemetryItem } from "../../../src/Interfaces/IOfflineProvider";

export class OfflineDbProviderTests extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
    private ctx: any;
    private preEvts: IStorageTelemetryItem[] = [];
    private batchDrop: any;
 
    public testInitialize() {
        super.testInitialize();
        let channel = new TestChannel();
        this.coreConfig = {
            instrumentationKey: "testIkey",
            endpointUrl: "https://testurl.com"
        };
        this.core = new AppInsightsCore();
        this.core.initialize(this.coreConfig, [channel]);
        this.ctx = {};
        this.batchDrop = [];
    }

    public testCleanup() {
        super.testCleanup();
        this.onDone(() => {
            this.core.unload();
        });
        this.core = null as any;
        this.coreConfig = null as any;
        this.batchDrop = [];
    }

    public registerTests() {

        this.testCase({
            name: "IndexedDbProvider: init with auto clean set to false",
            test: () => {
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");
                let ctx = provider["_getDbgPlgTargets"]();
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com";
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");
                Assert.equal(ctx[1], "dc.services.visualstudio.com", "default endpoint is set");
                let expectedMaxStorageTime = 604800000;
                Assert.equal(ctx[2], expectedMaxStorageTime, "default Max time is set");
                Assert.ok(!provider.supportsSyncRequests(), "support sync should be set to false");
                // this test will run database creation/dbupgrade as well

                provider.teardown();
            }
        });

        this.testCase({
            name: "IndexedDbProvider: init with auto clean set to true",
            pollDelay: 1000,
            test: ()=>{
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                this.ctx.isInit = provider.initialize(providerCxt);
                this.ctx.provider = provider;

                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isInit = this.ctx.isInit;
                    if (isInit) {
                        doAwait(provider.teardown(), () => {
                            this.ctx.isclosed = true;
                        })
                        return true;
                    }
                    return false;
                }, "Wait for init response" + new Date().toISOString(), 200, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
                
            }
        });

        this.testCase({
            name: "IndexedDbProvider: addEvent with no previous stored events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                let evt = TestHelper.mockEvent(endpoint, 3, false);

                return this._asyncQueue().add(() =>{
                    doAwait(provider.initialize(providerCxt), (val) => {
                        this.ctx.isInit = val;
                    }, (reason)=> {
                        this.ctx.initErr = reason;
                        Assert.ok(false, "error for init");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                        this.ctx.evt = item;
                        Assert.deepEqual(item, evt, "should add expected item");
                        Assert.ok(evt.id, "should add id to the item");
                        this.preEvts.push(evt);
                    }, (reason) => {
                        this.ctx.addEventErr = reason;
                        Assert.ok(false, "error for addEvt");
                    });
                }).add(() => {
                    doAwait(provider.getNextBatch(), (item) => {
                        this.ctx.getEvt = item;
                        Assert.equal(item && item.length, 1, "should have one item");
                        Assert.deepEqual((item as any)[0], evt, "should add expected item");
                    }, (reason) => {
                        this.ctx.getEvtErr = reason;
                        Assert.ok(false, "error for get event");
                    });
                }).add(() => {
                    doAwait(provider.teardown(), () => {
                        this.ctx.isclosed = true;
                        Assert.ok(true, "should teardown provider");
                    });
                }).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000));
            }
        });

        this.testCase({
            name: "IndexedDbProvider: addEvent with previous stored events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };

                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);

                return this._asyncQueue().add(() =>{
                    doAwait(provider.initialize(providerCxt), (val) => {
                        this.ctx.isInit = val;
                    }, (reason)=> {
                        this.ctx.initErr = reason;
                        Assert.ok(false, "error for init");
                    });

                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        this.ctx.preEvts = val;
                        Assert.equal(val && val.length, 1 , "should have the event from the previous test");
                        Assert.ok((val as any)[0].id, "should have id");
                        Assert.equal((val as any)[0].id, this.preEvts[0].id, "should get back expected previous events");
                    }, (reason)=> {
                        this.ctx.preEvtsErr = reason;
                        Assert.ok(false, "get previous events error");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                        this.ctx.evt = item;
                        Assert.equal(item, evt, "should have one event");
                    }, (reason)=> {
                        this.ctx.preEvtsErr = reason;
                        Assert.ok(false, "get previous events error");
                    });
                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        this.ctx.allEvts = val;
                        Assert.equal(val && val.length, 2 , "should have the two events");
                        Assert.deepEqual((val as any)[1], evt, "should get back expected added events");
                    }, (reason) => {
                        this.ctx.addEventErr = reason;
                        Assert.ok(false, "add event error");
                    });
                }).add(() => {
                    doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                        this.ctx.evt1 = item;
                        Assert.deepEqual(item, evt1, "should have expected event1");
                    }, (reason) => {
                        this.ctx.addEvent1Err = reason;
                        Assert.ok(false, "add event1 error");
                    });
                }).add(() => {
                    doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                        this.ctx.evt2 = item;
                        Assert.deepEqual(item, evt2, "should have expected event2");
                    }, (reason) => {
                        this.ctx.addEvent2Err = reason;
                        Assert.ok(false, "add event2 error");
                    });
                    
                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        this.ctx.allEvts1 = val;
                        Assert.equal(val && (val as any).length, 4, "should have four events");
                    }, (reason)=> {
                        this.ctx.oneEvtsErr = reason;
                        Assert.ok(false, "get all events1 error");
                    });
                   
                }).add(() => {
                    doAwait(provider.getNextBatch(), (val) => {
                        this.ctx.nextBatch = val;
                        Assert.equal(val && (val as any).length, 1, "should return one event");
                        Assert.deepEqual((val as any)[0], this.preEvts[0], "should have return the earliest event");
                    }, (reason)=> {
                        this.ctx.nextBatchErr = reason;
                        Assert.ok(false, "get next batch error");
                    });
                }).add(() => {
                    doAwait(provider.getAllEvents(2), (val) => {
                        this.ctx.twoEvts = val;
                        Assert.equal(val && (val as any).length, 2, "should return two events");
                        Assert.deepEqual((val as any)[0], this.preEvts[0], "should have return the earliest event1");
                    }, (reason)=> {
                        this.ctx.twoEvtsErr = reason;
                        Assert.ok(false, "get two events error");
                    });
                }).add(() => {
                    doAwait(provider.clear(), (val) => {
                        this.ctx.clear = val;
                        Assert.equal(val && (val as any).length, 4, "should clear all events");
                    }, (reason)=> {
                        this.ctx.twoEvtsErr = reason;
                        Assert.ok(false, "get two events error");
                    });
                }).add(() => {
                    doAwait(provider.teardown(), () => {
                        this.ctx.isclosed = true;
                    });
                }).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        this.preEvts = []
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
            }
        });


        this.testCase({
            name: "IndexedDbProvider: getAllEvents should handle cursor errors",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                let evt = TestHelper.mockEvent(endpoint, 3, false);

                return this._asyncQueue().add(() =>{
                    doAwait(provider.initialize(providerCxt), (val) => {
                        this.ctx.isInit = val;
                    }, (reason)=> {
                        this.ctx.initErr = reason;
                        Assert.ok(false, "error for init");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                        this.ctx.evt = item;
                    }, (reason) => {
                        this.ctx.addEventErr = reason;
                        Assert.ok(false, "add evt error");
                        doAwait(provider.teardown(), () => {
                            this.ctx.isclosed = true;
                        });
                    })

                }).add(() => {
                    let ctx = provider["_getDbgPlgTargets"]();
                    let db = ctx[3];
                    this.sandbox.stub(db as any, "openDb").callsFake((name, ver, func, change?) => {
                        return createAsyncPromise((resolve, reject)=> {
                            try {
                                let openDbCtx = {
                                    openCursor: (var1, var2, var3?) => {
                                        return createAsyncRejectedPromise(new Error("open cursor mock error"));
                                    }
                                }
                                // Database has been opened
                                doAwait(func(openDbCtx), resolve, reject);
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                    doAwait(provider.getNextBatch(), (val) => {
                        this.ctx.nextBatch = val;
                        Assert.ok(false, "should handle errors");
                    }, (reason)=> {
                        this.ctx.nextBatchErr = reason;
                    });

                }).add(() => {
                    doAwait(provider.teardown(), () => {
                        this.ctx.isclosed = true;
                    });
                }).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isInit = this.ctx.isInit;
                    if (isInit) {
                        return true;
                    }
                    return false;
                }, "Wait for Init response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.evt;
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for add Event response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.nextBatchErr;
                    if (item) {
                        Assert.equal(item.message, "open cursor mock error");
                        return true;
                    }
                
                    return false;
                }, "Wait for handle error response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
            }
        });


        this.testCase({
            name: "IndexedDbProvider: removeEvents should delete expected events",
            test: () => {
                this.core.addNotificationListener({
                    offlineBatchDrop: (cnt, reason)=> {
                        this.batchDrop.push({cnt: cnt, reason: reason});
                    }
                });
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true, inStorageMaxTime:1}).cfg; // this should clean all previous events
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint,
                    notificationMgr: this.core.getNotifyMgr()
                };
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                let evt4 = TestHelper.mockEvent(endpoint, 4, false);
                
                return this._asyncQueue().add(() => {
                    doAwait(provider.initialize(providerCxt), (val) => {
                        this.ctx.isInit = val;
                    }, (reason)=> {
                        this.ctx.initErr = reason;
                        Assert.ok(false, "error for init");
                    });

                }).add(() => {
                    doAwait(provider.removeEvents([evt]), (item) => {
                        this.ctx.removeEvts = item;
                        Assert.deepEqual(item && item.length, 0,"should not delete any events");
                    }, (reason) => {
                        this.ctx.removeEvtsErr = reason;
                        Assert.ok(false, "error for remove events");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                        this.ctx.evt = item;
                        Assert.deepEqual(item, evt, "should add exepcted evt");
                    }, (reason) => {
                        this.ctx.addEventErr = reason;
                        Assert.ok(false, "error for add events");
                    });
                }).add(() => {
                    doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                        this.ctx.evt1 = item;
                        Assert.deepEqual(item, evt1, "should add exepcted evt1");
                    }, (reason) => {
                        this.ctx.addEvent1Err = reason;
                        Assert.ok(false, "error for add event 1");
                    });
                }).add(() => {
                    doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                        this.ctx.evt2 = item;
                        Assert.deepEqual(item, evt2, "should add exepcted evt2");
                    }, (reason) => {
                        this.ctx.addEvent2Err = reason;
                        Assert.ok(false, "error for add event 2");
                    });

                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        this.ctx.allEvts = val;
                        Assert.deepEqual(val && val.length, 3, "should have all expected 3 events");
                    }, (reason)=> {
                        this.ctx.allEvtsErr = reason;
                        Assert.ok(false, "error for get all events");
                        
                    });

                }).add(() => {
                    doAwait(provider.removeEvents([evt4]), (item) => {
                        this.ctx.removeEvts1 = item;
                        Assert.deepEqual(item && item.length, 0, "should not delete event1");
                    }, (reason) => {
                        this.ctx.removeEvts1Err = reason;
                        Assert.ok(false, "error for remove events1");
                    });

                }).add(()=> {
                    doAwait(provider.removeEvents([evt, evt1]), (item) => {
                        this.ctx.removeEvts2 = item;
                        Assert.deepEqual(item && item.length, 2, "should delete all expected events");
                        let item1 = (item as any)[0];
                        let item2 = (item as any)[1];
                        if (item1.id == evt1.id) {
                            Assert.deepEqual(item1, evt1, "should have deleted all event");
                            Assert.deepEqual(item2, evt, "should have deleted all event1");
                        } else {
                            Assert.deepEqual(item1, evt, "should have deleted all event");
                            Assert.deepEqual(item2, evt1, "should have deleted all event1");
                        }
                    }, (reason) => {
                        this.ctx.removeEvts2Err = reason;
                        Assert.ok(false, "error for remove events2");
                    });

                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        this.ctx.allEvts1 = val;
                        Assert.deepEqual(val && val.length, 1, "should have one event remaining");
                        Assert.deepEqual((val as any)[0], evt2, "should have evt2");
                    }, (reason)=> {
                        this.ctx.allEvts1Err = reason;
                        Assert.ok(false, "error for get all evts1");
                    });
                }).add(() => {
                    doAwait(provider.teardown(), () => {
                        this.ctx.isclosed = true;
                    });

                }).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isInit = this.ctx.isInit;
                    if (isInit) {
                        return true;
                    }
                    return false;
                }, "Wait for Init response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items = this.ctx.removeEvts;

                    if (items) {
                        return true;
                    }
                
                    return false;
                }, "Wait for remove evt response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items = this.ctx.allEvts;

                    if (items) {
                        return true;
                    }
                
                    return false;
                }, "Wait for get Events response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item1 = this.ctx.removeEvts1;
                    if (item1) {
                        return true;
                    }
                
                    return false;
                }, "Wait for remove Event1 response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items2 = this.ctx.removeEvts2;

                    if (items2) {
                        return true;
                    }
                
                    return false;
                }, "Wait for remove event2 response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items = this.ctx.allEvts1;
                
                    if (items ) {
                        return true;
                    }
                
                    return false;
                }, "Wait for get Events1 response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        Assert.equal(this.batchDrop.length, 1, "notification should be called once"); // sent in clean process during initialization
                        Assert.equal(this.batchDrop[0].reason, 3, "notification should be called with expected reason time exceeded");
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
            }
        });


        this.testCase({
            name: "IndexedDbProvider: clear should delete all events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                
                return this._asyncQueue().add(() => {
                    doAwait(provider.initialize(providerCxt), (val) => {
                        this.ctx.isInit = val;
                    }, (reason)=> {
                        this.ctx.initErr = reason;
                        Assert.ok(false, "error for init");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                        this.ctx.evt = item;
                        Assert.deepEqual(item, evt, "should add evt");
                    }, (reason) => {
                        this.ctx.addEventErr = reason;
                        Assert.ok(false, "error for add evt");
                    });
                }).add(() => {
                    doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                        this.ctx.evt1 = item;
                        Assert.deepEqual(item, evt1, "should add evt1");
                    }, (reason) => {
                        this.ctx.addEvent1Err = reason;
                        Assert.ok(false, "error for add evt1");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                        this.ctx.evt2 = item;
                        Assert.deepEqual(item, evt2, "should add evt2");
                    }, (reason) => {
                        this.ctx.addEvent2Err = reason;
                        Assert.ok(false, "error for add evt2");
                    });

                }).add(() => {
                    doAwait(provider.clear(), (val)=> {
                        this.ctx.clearEvts = val;
                        Assert.ok(val && val.length >= 3, "should clear events"); // may have the events from previous test
                    }, (reason)=> {
                        this.ctx.clearEvtsErr = reason;
                        Assert.ok(false, "error for clear");

                    });

                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        this.ctx.allEvts1 = val;
                        Assert.equal(val && val.length, 0, "should not have any events" );
                    }, (reason)=> {
                        this.ctx.allEvts1Err = reason;
                        Assert.ok(false, "get events error");
                    });
                }).add(() => {
                    doAwait(provider.teardown(), () => {
                        this.ctx.isclosed = true;
                    });

                }).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isInit = this.ctx.isInit;
                    if (isInit) {
                        return true;
                    }
                    return false;
                }, "Wait for Init response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.evt;
                    let item1 = this.ctx.evt1;
                    let item2 = this.ctx.evt2;
                    if (item && item1 && item2) {
                        return true;
                    }
                
                    return false;
                }, "Wait for get Events response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items = this.ctx.allEvts1;
                
                    if (items && items.length == 0) {
                        return true;
                    }
                
                    return false;
                }, "Wait for get Events1 response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
            }
        });

        this.testCase({
            name: "IndexedDbProvider: clean should delete all events that exist longer than max storage time",
            pollDelay: 100,
            useFakeTimers: true,
            test: () => {
                this.core.addNotificationListener({
                    offlineBatchDrop: (cnt, reason)=> {
                        this.batchDrop.push({cnt: cnt, reason: reason});
                    }
                });
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({inStorageMaxTime: 30000}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint,
                    notificationMgr: this.core.getNotifyMgr()
                };

                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "error for init");
                });

   
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
               
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                    Assert.deepEqual(item, evt, "should add event");
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                    Assert.ok(false, "error for add event");
                });
                doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                    this.ctx.evt1 = item;
                    Assert.deepEqual(item, evt1, "should add event1");
                }, (reason) => {
                    this.ctx.addEvent1Err = reason;
                    Assert.ok(false, "error for add event1");
                });
                this.clock.tick(25000);


                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                    this.ctx.evt2 = item;
                    Assert.deepEqual(item, evt2, "should add event2");
                }, (reason) => {
                    this.ctx.addEvent2Err = reason;
                    Assert.ok(false, "error for add event2");
                });
                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts = val;
                    Assert.equal(val && val.length, 3, "should have three events");
                }, (reason)=> {
                    this.ctx.allEvtsErr = reason;
                    Assert.ok(false, "error for get events");
                });
                doAwait(provider.clean(), (val) => {
                    this.ctx.cleanEvts = val;
                    Assert.equal(val, true, "should clean events");
                }, (reason)=> {
                    this.ctx.cleanEvtsErr = reason;
                    Assert.ok(false, "error for clean");
                });


                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts1 = val;
                    Assert.equal(val && val.length, 1, "should only have one event");
                }, (reason)=> {
                    this.ctx.allEvts1Err = reason;
                    Assert.ok(false, "get all events error")
                });

                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isInit = this.ctx.isInit;
                    if (isInit) {
                        return true;
                    }
                    return false;
                }, "Wait for Init response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items = this.ctx.allEvts;
                    let cnt = 0;
                    if (items && items.length == 3) {
                        arrForEach(items, (item) => {
                            cnt += item.criticalCnt;
                        })
                        Assert.equal(cnt, 6, "should get expected three events");
                        return true;
                    }
                
                    return false;
                }, "Wait for get Events response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.cleanEvts;
                
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for clean Events response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let items = this.ctx.allEvts1;
                
                    if (items) {
                        doAwait(provider.teardown(), () => {
                            this.ctx.isclosed = true;
                        });
                        return true;
                    }
                
                    return false;
                }, "Wait for get Events1 response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        Assert.equal(this.batchDrop.length, 1, "notification should be called once");
                        Assert.equal(this.batchDrop[0].cnt, 2, "notification should be called with 2 count");
                        Assert.equal(this.batchDrop[0].reason, 3, "notification should be called with expected reason clean time exceeded");
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
            }
        });

        this.testCase({
            name: "IndexedDbProvider: Error handle should handle open errors",
            useFakeTimers: true,
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                let evt = TestHelper.mockEvent(endpoint, 3, false);

                return this._asyncQueue().add(() => {
                    doAwait(provider.initialize(providerCxt), (val) => {
                        this.ctx.isInit = val;
                        let ctx = provider["_getDbgPlgTargets"]();
                        let db = ctx[3];
                        this.sandbox.stub(db as any, "openDb").callsFake((name, ver, func, change?) => {
                            return createAsyncPromise((resolve, reject)=> {
                                try {
                                    let openDbCtx = {
                                        openCursor: (var1, var2, var3?) => {
                                            return createAsyncRejectedPromise(new Error("open cursor mock error"));
                                        },
                                        openStore: (var1, var2, var3) => {
                                            return createAsyncRejectedPromise(new Error("open store mock error"));
                                        }
                                    }
                                    // Database has been opened
                                    doAwait(func(openDbCtx), resolve, reject);
                                } catch (e) {
                                    reject(e);
                                }

                            });
                        });
                    }, (reason)=> {
                        this.ctx.initErr = reason;
                        Assert.ok(false, "error for init");
                    });

                }).add(() => {
                    doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                        this.ctx.evt = item;
                        Assert.ok(false, "should handle add event error");
                    }, (reason) => {
                        this.ctx.addEvent = reason;
                        Assert.equal(reason.message, "open store mock error", "add event message");
                    });

                }).add(() => {
                    doAwait(provider.getNextBatch(), (val) => {
                        Assert.ok(false, "should handle get next batch error")
                    }, (reason)=> {
                        this.ctx.nextBatch = reason;
                        Assert.equal(reason.message, "open cursor mock error", "get next batch message");
                    });

                }).add(() => {
                    doAwait(provider.getAllEvents(), (val) => {
                        Assert.ok(false, "should handle get all events error")
                    }, (reason)=> {
                        this.ctx.allEvts = reason;
                        Assert.equal(reason.message, "open cursor mock error", "get all events message")
                    });

                }).add(() => {
                    doAwait(provider.removeEvents([evt]), (val) => {
                        this.ctx.removeEvts = val;
                        Assert.deepEqual([], val, "should handle remove events error")
                    }, (reason)=> {
                        this.ctx.removeEvtsErr = reason;
                        Assert.ok(false, "error for get next batch");
                    });

                }).add(() => {
                    doAwait(provider.clear(), (val) => {
                        this.ctx.clear = val;
                        Assert.deepEqual([], val, "should handle clear error")
                    }, (reason)=> {
                        this.ctx.clearErr = reason;
                        Assert.ok(false, "error for clear");
                    });

                }).add(() => {
                    doAwait(provider.clean(), (val) => {
                        this.ctx.clean = val;
                        Assert.ok(!val, "should handle clean error")
                    }, (reason)=> {
                        this.ctx.cleanErr = reason;
                        Assert.ok(false, "error for clean");
                    });

                }).add(() => {
                    doAwait(provider.teardown(), () => {
                        this.ctx.isclosed = true;
                    });

                }).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isInit = this.ctx.isInit;
                    if (isInit) {
                        return true;
                    }
                    return false;
                }, "Wait for Init response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.addEvent;
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for add Event response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.nextBatch;
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for next batch response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.allEvts;
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for all events response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.removeEvts;
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for remove events response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.clear;
                    if (item) {
                        return true;
                    }
                
                    return false;
                }, "Wait for clear response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.clean;
                    if (item !== null) {
                        return true;
                    }
                
                    return false;
                }, "Wait for clean response" + new Date().toISOString(), 30, 1000)).concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let isclosed = this.ctx.isclosed;
                    if (isclosed) {
                        return true;
                    }
                    return false;
                }, "Wait for close response" + new Date().toISOString(), 30, 1000))
            }
        });

    }
}


class TestHelper {
    private static _idCount = 0;

    static reset(key: string) {
        this._idCount = 0;
        AITestClass.orgLocalStorage.removeItem(key);
    }

    static mockEvent(endPointUrl: string, criticalCnt: number, setId = true): IStorageTelemetryItem {
        this._idCount++;
        let time = new Date().getTime();
        let random = strSubstr(generateW3CId(), 0, 8);
        let payload = {
            urlString: endPointUrl,
            data: '[{"name":"test1","prop":{"prop1":"prop1"}},{"name":"test1","prop":{"prop1":"prop1"}}]',
            headers: {
                "header1": "header1val",
                "header2": "header2val"
            },
            disableXhrSync: false,
            disableFetchKeepAlive: false,
            sendReason: 1,
            id: setId? random : "",
            iKey: "testIKey123",
            criticalCnt: criticalCnt
        }
        return payload;
    }
 
}
