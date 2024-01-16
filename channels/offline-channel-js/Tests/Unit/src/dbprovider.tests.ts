import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { IndexedDbProvider } from "../../../src/Providers/IndexDbProvider";
import { createAsyncPromise, createAsyncRejectedPromise, doAwait } from "@nevware21/ts-async";
import { arrForEach } from "@nevware21/ts-utils";
import { TestChannel } from "./TestHelper";
import { AppInsightsCore, IConfiguration, createDynamicConfig, newGuid } from "@microsoft/applicationinsights-core-js";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { IStorageTelemetryItem } from "../../../src/Interfaces/IOfflineProvider";

export class OfflineDbProviderTests extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
    private ctx: any;
 
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
                let item = this.ctx.evt;
                if (item) {
                    return true;
                }
             
                return false;
            }, "Wait for add Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
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
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                });
            
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                });
                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts = val;
                }, (reason)=> {
                    this.ctx.allEvtsErr = reason;
                });


                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                    this.ctx.evt1 = item;
                }, (reason) => {
                    this.ctx.addEvent1Err = reason;
                });
                doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                    this.ctx.evt2 = item;
                }, (reason) => {
                    this.ctx.addEvent2Err = reason;
                });

                doAwait(provider.getAllEvents(1), (val) => {
                    this.ctx.oneEvts = val;
                }, (reason)=> {
                    this.ctx.oneEvtsErr = reason;
                });

                doAwait(provider.getNextBatch(), (val) => {
                    this.ctx.nextBatch = val;
                }, (reason)=> {
                    this.ctx.nextBatchErr = reason;
                });


                doAwait(provider.getAllEvents(2), (val) => {
                    this.ctx.twoEvts = val;
                }, (reason)=> {
                    this.ctx.twoEvtsErr = reason;
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
                let item = this.ctx.allEvts;
                if (item) {
                    Assert.equal(item[0].criticalCnt, 3, "should get expected events");
                    return true;
                }
             
                return false;
            }, "Wait for get Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item1 = this.ctx.evt1;
                let item2 = this.ctx.evt2;
                if (item1 && item2) {
                    return true;
                }
             
                return false;
            }, "Wait for add Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.oneEvts;
                if (items && items.length == 1) {
                    return true;
                }
             
                return false;
            }, "Wait for get one Event response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
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
                });
   
                doAwait(provider.removeEvents([evt]), (item) => {
                    this.ctx.removeEvts = item;
                }, (reason) => {
                    this.ctx.removeEvtsErr = reason;
                });


                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                let evt4 = TestHelper.mockEvent(endpoint, 4, false);
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                    doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                        this.ctx.evt1 = item;
                        doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                            this.ctx.evt2 = item;
                            doAwait(provider.getAllEvents(), (val) => {
                                this.ctx.allEvts = val;
                                doAwait(provider.removeEvents([evt4]), (item) => {
                                    this.ctx.removeEvts1 = item;
                                    doAwait(provider.removeEvents([evt, evt1]), (item) => {
                                        this.ctx.removeEvts2 = item;
                                        doAwait(provider.getAllEvents(), (val) => {
                                            this.ctx.allEvts1 = val;
                                        }, (reason)=> {
                                            this.ctx.allEvts1Err = reason;
                                        });
                                    }, (reason) => {
                                        this.ctx.removeEvts2Err = reason;
                                    });
                                }, (reason) => {
                                    this.ctx.removeEvts1Err = reason;
                                });
                            }, (reason)=> {
                                this.ctx.allEvtsErr = reason;
                            });
                        }, (reason) => {
                            this.ctx.addEvent2Err = reason;
                        });
                    }, (reason) => {
                        this.ctx.addEvent1Err = reason;
                    });
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
                let items = this.ctx.removeEvts;

                if (items) {
                    Assert.deepEqual(items, [], "should not delete any events");
                    return true;
                }
             
                return false;
            }, "Wait for remove evt response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items = this.ctx.allEvts;
                let cnt = 0;
                if (items) {
                    return true;
                }
             
                return false;
            }, "Wait for get Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let item1 = this.ctx.removeEvts1;
                if (item1) {
                    Assert.deepEqual(item1, [], "should not delete any events test1");
                    return true;
                }
             
                return false;
            }, "Wait for remove Event1 response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
                let items2 = this.ctx.removeEvts2;
                let cnt = 0;
                if (items2) {
                    arrForEach(items2, (item) => {
                        cnt += item.criticalCnt;
                    })
                    Assert.equal(cnt, 4, "should delete expected two events");
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
                });

   
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                });
                doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                    this.ctx.evt1 = item;
                }, (reason) => {
                    this.ctx.addEvent1Err = reason;
                });
                doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                    this.ctx.evt2 = item;
                }, (reason) => {
                    this.ctx.addEvent2Err = reason;
                });
                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts = val;
                }, (reason)=> {
                    this.ctx.allEvtsErr = reason;
                });


                doAwait(provider.clear(), (val)=> {
                    this.ctx.clearEvts = val;
                }, (reason)=> {
                    this.ctx.clearEvtsErr = reason;

                });

                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts1 = val;
                }, (reason)=> {
                    this.ctx.allEvts1Err = reason;
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
                let storageConfig = createDynamicConfig({inStorageMaxTime: 10}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                };
                
                doAwait(provider.initialize(providerCxt), (val) => {
                    this.ctx.isInit = val;
                }, (reason)=> {
                    this.ctx.initErr = reason;
                });

   
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 1, false);
               
                doAwait(provider.addEvent("", evt, itemCtx), (item) => {
                    this.ctx.evt = item;
                }, (reason) => {
                    this.ctx.addEventErr = reason;
                });
                doAwait(provider.addEvent("", evt1, itemCtx), (item) => {
                    this.ctx.evt1 = item;
                }, (reason) => {
                    this.ctx.addEvent1Err = reason;
                });
                this.clock.tick(20);


                let evt2 = TestHelper.mockEvent(endpoint, 2, false);
                doAwait(provider.addEvent("", evt2, itemCtx), (item) => {
                    this.ctx.evt2 = item;
                }, (reason) => {
                    this.ctx.addEvent2Err = reason;
                });
                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts = val;
                }, (reason)=> {
                    this.ctx.allEvtsErr = reason;
                });
                doAwait(provider.clean(), (val) => {
                    this.ctx.cleanEvts = val;
                }, (reason)=> {
                    this.ctx.cleanEvtsErr = reason;
                });


                doAwait(provider.getAllEvents(), (val) => {
                    this.ctx.allEvts1 = val;
                }, (reason)=> {
                    this.ctx.allEvts1Err = reason;
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
                    Assert.equal(item, true, "should drop events");
                    return true;
                }
             
                return false;
            }, "Wait for clean Events response" + new Date().toISOString(), 15, 1000) as any).concat(PollingAssert.createPollingAssert(() => {
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
            id: setId? newGuid() : "",
            iKey: "testIKey",
            criticalCnt: criticalCnt
        }
        return payload;
    }
 
}
