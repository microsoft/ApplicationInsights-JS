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
    }

    public testCleanup() {
        super.testCleanup();
        this.onDone(() => {
            this.core.unload();
        });
        this.core = null as any;
        this.coreConfig = null as any;
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
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");
                let ctx = provider["_getDbgPlgTargets"]();
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");
                let expectedMaxStorage = 5000000;
                Assert.equal(ctx[1], expectedMaxStorage, "default MaxStorage is set");
                let expectedMaxStorageTime = 10080000;
                Assert.equal(ctx[2], expectedMaxStorageTime, "default Max time is set");
                Assert.ok(!provider.supportsSyncRequests(), "support sync should be set to false");
                // this test will run database creation/dbupgrade as well

                provider.teardown();
            }
        });

        this.testCaseAsync({
            name: "IndexedDbProvider: init with auto clean set to true",
            stepDelay: 100,
            steps: [() => {
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

                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDbProvider: addEvent with no previous stored events",
            stepDelay: 100,
            steps: [() => {
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
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "error for init");
                });
            
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                    Assert.deepEqual(item, evt, "should add expected item");
                    Assert.ok(evt.id, "should add id to the item");
                    this.preEvts.push(evt);
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                    Assert.ok(false, "error for add event");
                });

                doAwait(provider.getNextBatch(), (item) => {
                    this.ctx.getEvt = item;
                    Assert.equal(item && item.length, 1, "should have one item");
                    Assert.deepEqual((item as any)[0], evt, "should add expected item");
                }, (reason) => {
                    this.ctx.getEvtErr = reason;
                    Assert.ok(false, "error for get event")
                });

                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.evt;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for add Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.getEvt;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for get Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDbProvider: addEvent with previous stored events",
            stepDelay: 100,
            steps: [() => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                // should have the event added by the previous test
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "init error");
                });

                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.preEvts = val;
                    Assert.equal(val && val.length, 1 , "should have the event from the previous test");
                    Assert.equal((val as any)[0].id, this.preEvts[0].id, "should get back expected previous events");
                }, (reason)=> {
                    this.ctx.preEvtsErr = reason;
                    Assert.ok(false, "get previous events error");
                });

            
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                    Assert.equal(item, evt, "should have one event");
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                    Assert.ok(false, "add event error");
                });
                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts = val;
                    Assert.equal(val && val.length, 2 , "should have the two events");
                    Assert.deepEqual((val as any)[1], evt, "should get back expected added events");
                }, (reason)=> {
                    this.ctx.allEvtsErr = reason;
                    Assert.ok(false, "get all events error");
                });


                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                    this.ctx.evt1 = item;
                    Assert.deepEqual(item, evt1, "should have expected event1");
                }, (reason) => {
                    this.ctx.addEvent1Err = reason;
                    Assert.ok(false, "add event1 error");
                });
                doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                    this.ctx.evt2 = item;
                    Assert.deepEqual(item, evt2, "should have expected event2");
                }, (reason) => {
                    this.ctx.addEvent2Err = reason;
                    Assert.ok(false, "add event2 error");
                });

                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts1 = val;
                    Assert.equal(val && (val as any).length, 4, "should have four events");
                }, (reason)=> {
                    this.ctx.oneEvtsErr = reason;
                    Assert.ok(false, "get all events1 error");
                });

                doAwait(provider.getNextBatch(), (val) => {
                    this.ctx.nextBatch = val;
                    Assert.equal(val && (val as any).length, 1, "should return one event");
                    Assert.deepEqual((val as any)[0], this.preEvts[0], "should have return the earliest event");
                }, (reason)=> {
                    this.ctx.nextBatchErr = reason;
                    Assert.ok(false, "get next batch error");
                });

                doAwait(provider.getAllEvents(2), (val) => {
                    this.ctx.twoEvts = val;
                    Assert.equal(val && (val as any).length, 2, "should return two events");
                    Assert.deepEqual((val as any)[0], this.preEvts[0], "should have return the earliest event1");
                }, (reason)=> {
                    this.ctx.twoEvtsErr = reason;
                    Assert.ok(false, "get two events error");
                });
                
                doAwait(provider.clear(), (val) => {
                    this.ctx.clear = val;
                    Assert.equal(val && (val as any).length, 4, "should clear all events");
                    this.preEvts = [];
                }, (reason)=> {
                    this.ctx.clearErr = reason;
                    Assert.ok(false, "clear error");
                });

            
                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.preEvts;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for get previous Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.evt;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for add Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.allEvts;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for get all Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item1 = this.ctx.evt1;
                let item2 = this.ctx.evt2;
                if (item1 && item2) {
                    return true;
                }
             
                return false;
            }, "Wait for add all Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.allEvts1;
                if (items) {
                    return true;
                }
             
                return false;
            }, "Wait for get all Events1 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.nextBatch;
                if (items && items.length == 1) {
                    return true;
                }
             
                return false;
            }, "Wait for get next Batch response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.twoEvts;
                if (items && items.length == 2) {
                    return true;
                }
             
                return false;
            }, "Wait for get two Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.clear;
                if (item) {
                    return true;
                }
                return false;
            }, "Wait for clear response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDbProvider: addEvent should handle open errors",
            stepDelay: 100,
            steps: [() => {
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
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "error for init");
                });
                let ctx = provider["_getDbgPlgTargets"]();
                let db = ctx[3];
                this.sandbox.stub(db as any, "openDb").callsFake((key) => {
                    return createAsyncRejectedPromise(new Error("open db mock error"))
                });
             
            
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                });

                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.addEventErr;
                if (item) {
                    Assert.equal(item.message, "open db mock error");
                    return true;
                }
             
                return false;
            }, "Wait for add Event handle error response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDbProvider: getAllEvents should handle cursor errors",
            stepDelay: 100,
            steps: [() => {
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
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "error for init");
                });
               
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                });

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
                }, (reason)=> {
                    this.ctx.nextBatchErr = reason;
                });

                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.evt;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for add Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.nextBatchErr;
                if (item) {
                    Assert.equal(item.message, "open cursor mock error");
                    return true;
                }
             
                return false;
            }, "Wait for handle error response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });


        this.testCaseAsync({
            name: "IndexedDbProvider: removeEvents should delete expected events",
            stepDelay: 100,
            steps: [() => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({autoClean: true, inStorageMaxTime:1}).cfg; // this should clean all previous events
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "error for init");
                });
   
                doAwait(provider.removeEvents([evt]), (item) => {
                    this.ctx.removeEvts = item;
                    Assert.deepEqual(item && item.length, 0,"should not delete any events");
                }, (reason) => {
                    this.ctx.removeEvtsErr = reason;
                    Assert.ok(false, "error for remove events");
                });

                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                let evt4 = TestHelper.mockEvent(endpoint, 4, false);
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                    Assert.deepEqual(item, evt, "should add exepcted evt");
                    doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                        this.ctx.evt1 = item;
                        Assert.deepEqual(item, evt1, "should add exepcted evt1");
                        doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                            this.ctx.evt2 = item;
                            Assert.deepEqual(item, evt2, "should add exepcted evt2");
                            doAwait(provider.getAllEvents(), (val) => {
                                this.ctx.allEvts = val;
                                Assert.deepEqual(val && val.length, 3, "should have all expected 3 events");
                                doAwait(provider.removeEvents([evt4]), (item) => {
                                    this.ctx.removeEvts1 = item;
                                    Assert.deepEqual(item && item.length, 0, "should not delete event1");
                                    doAwait(provider.removeEvents([evt, evt1]), (item) => {
                                        this.ctx.removeEvts2 = item;
                                        Assert.deepEqual(item && item.length, 2, "should delete all expected events");
                                        Assert.deepEqual((item as any)[0], evt, "should have deleted all event");
                                        Assert.deepEqual((item as any)[1], evt1, "should have deleted all event1");
                                        doAwait(provider.getAllEvents(), (val) => {
                                            this.ctx.allEvts1 = val;
                                            Assert.deepEqual(val && val.length, 1, "should have one event remaining");
                                            Assert.deepEqual((val as any)[0], evt2, "should have evt2");
                                        }, (reason)=> {
                                            this.ctx.allEvts1Err = reason;
                                            Assert.ok(false, "error for get all evts1");
                                        });
                                    }, (reason) => {
                                        this.ctx.removeEvts2Err = reason;
                                        Assert.ok(false, "error for remove events2");
                                    });
                                }, (reason) => {
                                    this.ctx.removeEvts1Err = reason;
                                    Assert.ok(false, "error for remove events1");
                                });
                            }, (reason)=> {
                                this.ctx.allEvtsErr = reason;
                                Assert.ok(false, "error for get all events");
                                
                            });
                        }, (reason) => {
                            this.ctx.addEvent2Err = reason;
                            Assert.ok(false, "error for add event 2");
                        });
                    }, (reason) => {
                        this.ctx.addEvent1Err = reason;
                        Assert.ok(false, "error for add event 1");
                    });
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                    Assert.ok(false, "error for add events");
                });

            
                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.removeEvts;

                if (items) {
                    return true;
                }
             
                return false;
            }, "Wait for remove evt response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.allEvts;

                if (items) {
                    return true;
                }
             
                return false;
            }, "Wait for get Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item1 = this.ctx.removeEvts1;
                if (item1) {
                    return true;
                }
             
                return false;
            }, "Wait for remove Event1 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items2 = this.ctx.removeEvts2;

                if (items2) {
                    return true;
                }
             
                return false;
            }, "Wait for remove event2 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.allEvts1;
              
                if (items ) {
                    return true;
                }
             
                return false;
            }, "Wait for get Events1 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });


        this.testCaseAsync({
            name: "IndexedDbProvider: clear should delete all events",
            stepDelay: 100,
            steps: [() => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                    Assert.ok(false, "error for init");
                });

   
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                    Assert.deepEqual(item, evt, "should add evt");
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                    Assert.ok(false, "error for add evt");
                });
                doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                    this.ctx.evt1 = item;
                    Assert.deepEqual(item, evt1, "should add evt1");
                }, (reason) => {
                    this.ctx.addEvent1Err = reason;
                    Assert.ok(false, "error for add evt1");
                });
                doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                    this.ctx.evt2 = item;
                    Assert.deepEqual(item, evt2, "should add evt2");
                }, (reason) => {
                    this.ctx.addEvent2Err = reason;
                    Assert.ok(false, "error for add evt2");
                });


                doAwait(provider.clear(), (val)=> {
                    this.ctx.clearEvts = val;
                    Assert.ok(val && val.length >= 3, "should clear events"); // may have the events from previous test
                }, (reason)=> {
                    this.ctx.clearEvtsErr = reason;
                    Assert.ok(false, "error for clear");

                });

                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts1 = val;
                    Assert.equal(val && val.length, 0, "should not have any evnets" );
                }, (reason)=> {
                    this.ctx.allEvts1Err = reason;
                    Assert.ok(false, "get events error");
                });

                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.evt;
                let item1 = this.ctx.evt1;
                let item2 = this.ctx.evt2;
                if (item && item1 && item2) {
                    return true;
                }
             
                return false;
            }, "Wait for get Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.allEvts1;
              
                if (items && items.length == 0) {
                    return true;
                }
             
                return false;
            }, "Wait for get Events1 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
        });

        this.testCaseAsync({
            name: "IndexedDbProvider: clean should delete all events that exist longer than max storage time",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new IndexedDbProvider();
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({inStorageMaxTime: 10000}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
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
                this.clock.tick(6000);


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

                doAwait(provider.teardown(), () => {
                    this.ctx.isclosed = true;
                });

            }].concat(PollingAssert.createPollingAssert(() => {
                let isInit = this.ctx.isInit;
                if (isInit) {
                    return true;
                }
                return false;
            }, "Wait for Init response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
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
            }, "Wait for get Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item = this.ctx.cleanEvts;
              
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for clean Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.allEvts1;
              
                if (items) {
                    return true;
                }
             
                return false;
            }, "Wait for get Events1 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let isclosed = this.ctx.isclosed;
                if (isclosed) {
                    return true;
                }
                return false;
            }, "Wait for close response" + new Date().toISOString(), 15, 1000) as any)
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
            iKey: "testIKey",
            criticalCnt: criticalCnt
        }
        return payload;
    }
 
}
