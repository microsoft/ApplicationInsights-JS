import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IConfiguration, IPayloadData, OnCompleteCallback, arrForEach, createDynamicConfig, newGuid } from "@microsoft/applicationinsights-core-js";
import { TestChannel } from "./TestHelper";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { IOfflineChannelConfiguration, eStorageProviders } from "../../../src/Interfaces/IOfflineProvider";
import { OfflineBatchHandler } from "../../../src/OfflineBatchHandler";
import { createAsyncRejectedPromise, doAwait, doAwaitResponse } from "@nevware21/ts-async";
import { eBatchSendStatus, eBatchStoreStatus } from "../../../src/Interfaces/IOfflineBatch";

export class OfflineBatchHandlerTests extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
    private ctx: any;
    private batchHandler: any;
 
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
        AITestClass.orgLocalStorage.clear();
        this.onDone(() => {
            this.core.unload();
        });
        this.core = null as any;
        this.coreConfig = null as any;
        
    }

    public registerTests() {

        this.testCase({
            name: "Offline Batch Handler: init with web storge provider",
            test: () => {
                let storageObj = {providers:[eStorageProviders.LocalStorage, eStorageProviders.SessionStorage], autoClean: true } as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;

                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");

                batchHandler.teardown();
            }
        });

        this.testCase({
            name: "Offline Batch Handler: init with IndexedDB storge provider",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.IndexedDb], autoClean: true, inStorageMaxTime: 1 } as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;

                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                return this._asyncQueue().add(() =>
                    doAwait(batchHandler.initialize(providerCxt),(res) => {
                        this.ctx.isInit = true;
                        let items = batchHandler["_getDbgPlgTargets"]();
                        let provider = items[0];
                        let isInit = items[1];
                        Assert.ok(provider, "provider is initialized");
                        Assert.ok(isInit, "initialization is successful");
                   
                    },(reason) => {
                        Assert.ok(false, "init errors");
                    })
                ).add(() =>
                    doAwait(batchHandler.teardown(),(res) => {
                        this.ctx.isclosed = true;
                    },(reason) => {
                        Assert.ok(false, "teardown errors");
                    })
                )

            }
                
        });

        this.testCase({
            name: "Store Batch: store batch with web storge provider",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true } as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;

                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                

                let result:any[] = [];
                let cb = (res) => {
                    result.push(res);
                }
                let evt = TestHelper.mockEvent(endpoint, 1, false);
                
                return this._asyncQueue().add(() =>
                    doAwait(batchHandler.storeBatch(evt, cb) as any,(storeRes) => {
                        this.ctx.storeBatch = true;
                        this.ctx.result = result;
                        let res = result[0];
                        let state = res.state == eBatchStoreStatus.Success;
                        Assert.ok(state, "state should be ok");
                        let item = res.item;
                        Assert.ok(item.id, "item id should be set");
                        Assert.equal(item.criticalCnt, 1, "expected item should be returned");

                        let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                        let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                        let storageObject = JSON.parse(storageStr);
                        let storageEvts = storageObject.evts;
                        Assert.deepEqual(Object.keys(storageEvts).length, 1, "storgae should only have one event");
                        Assert.ok(storageEvts[item.id], "storgae should contain expected item");
                        
                        
                    }, (reason) => {
                        Assert.ok(false, "init error");
                    })

                ).add(() =>
                    doAwait(batchHandler.hasStoredBatch(),(res) => {
                        this.ctx.hasBatch = res;
                    }, (reason) => {
                        Assert.ok(false, "hasStoreBatch error")
                    })

                ).add(() =>
                    doAwait( batchHandler.teardown(), () => {
                        this.ctx.isclosed = true;
                    },(reason) => {
                        Assert.ok(false, "teardown errors")
                    })
                )
            }
        });

        this.testCase({
            name: "Store Batch: store batch with indexedDB storge provider",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.IndexedDb], autoClean: true, inStorageMaxTime:1} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;

                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                let result:any[] = [];
                let cb = (res) => {
                    this.ctx.storeBatch = true;
                    result.push(res);
                }
                let evt = TestHelper.mockEvent(endpoint, 1, false);
                
                return this._asyncQueue().add(() =>
                    doAwait(batchHandler.initialize(providerCxt),(res) => {
                        this.ctx.isInit = true;
                        let items = batchHandler["_getDbgPlgTargets"]();
                        let provider = items[0];
                        let isInit = items[1];
                        Assert.ok(provider, "provider is initialized");
                        Assert.ok(isInit, "initialization is successful");
                    },(reason) => {
                        Assert.ok(false, "init errors")
                    })

                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt, cb) as any,(res) => {
                        this.ctx.storeBatch = true;
                        this.ctx.result = result;
                    }, (reason) => {
                        Assert.ok(false, "storebatch error")
                    })

                ).add(() =>
                    doAwait(batchHandler.hasStoredBatch(),(res) => {
                        this.ctx.hasBatch = res;
                    }, (reason) => {
                        Assert.ok(false, "hasbatch error");
                    })

                ).add(() =>
                    doAwait( batchHandler.teardown(), () => {
                        this.ctx.isclosed = true;
                    }, (reason) => {
                        Assert.ok(false, "teardown error")
                    })

                )
            }
        });

        this.testCase({
            name: "Clean Batch: clean batch with web storge provider",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, inStorageMaxTime:1} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;

                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                

                let result:any[] = [];
                let cb = (res) => {
                    result.push(res);
                }
                let cb1 = (res) => {
                    this.ctx.hasBatch = res;
                }
                let cb2 = (res) => {
                    this.ctx.cleanBatch = true;
                    this.ctx.cleanBatchRes = res;
                }
                let evt = TestHelper.mockEvent(endpoint, 1, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 3, false);

                return this._asyncQueue().add(() =>
                    doAwait(batchHandler.storeBatch(evt, cb) as any,(res) => {
                        this.ctx.storeBatch = 1;
                        this.ctx.result = result;
                    },(reason) => {
                        Assert.ok(false, "init errors");
                    })

                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt1, cb) as any,(res) => {
                        this.ctx.storeBatch = 2;
                        this.ctx.result = result;
                    },(reason) => {
                        Assert.ok(false, "store batch errors");
                    })

                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt2, cb) as any,(res) => {
                        this.ctx.storeBatch = 3;
                        this.ctx.result = result;
                        let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                        let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                        let storageObject = JSON.parse(storageStr);
                        let storageEvts = storageObject.evts;
                        Assert.deepEqual(Object.keys(storageEvts).length, 3, "storage should have three events");
                    },(reason) => {
                        Assert.ok(false, "storebatch error")
                    })

                ).add(() =>
                    doAwait(batchHandler.hasStoredBatch(cb1),(res) => {
                    }, (reason) => {
                        Assert.ok(false, "hasstoredbatch error");
                    })

                ).add(() =>
                    doAwait(batchHandler.cleanStorage(cb2) as any,(cleanRes) => {
                        let res = this.ctx.cleanBatchRes;
                        Assert.equal(res.batchCnt, 3, "should clean all three items");
                        let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                        let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                        let storageObject = JSON.parse(storageStr);
                        let storageEvts = storageObject.evts;
                        Assert.deepEqual(Object.keys(storageEvts).length, 0, "storgae should not only have any event");
                    },(reason) => {
                        Assert.ok(false, "clean storage errors")
                    })

                ).add(() =>
                    doAwait( batchHandler.teardown(), () => {
                        this.ctx.isclosed = true;
                    }, (reason) => {
                        Assert.ok(false, "teardown error")
                    })

                )
            }
        });

        this.testCase({
            name: "Clean Batch: clean batch with IndexedDB storge provider",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.IndexedDb], autoClean: true, inStorageMaxTime:1} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
                AITestClass.orgLocalStorage.clear();

                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                let provider;
                let result:any[] = [];
                let cb = (res) => {
                    result.push(res);
                }
                let cb1 = (res) => {
                    this.ctx.hasBatch = res;
                }
                let cb2 = (res) => {
                    this.ctx.cleanBatch = true;
                    this.ctx.cleanBatchRes = res;
                }
                let cb3 = (res) => {
                    this.ctx.hasBatch1Called = true;
                    this.ctx.hasBatch1 = res;
                }
                let evt = TestHelper.mockEvent(endpoint, 1, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 3, false);
                
                return this._asyncQueue().add(() =>
                    doAwait(batchHandler.initialize(providerCxt),(res) => {
                        this.ctx.isInit = true;
                        let items = batchHandler["_getDbgPlgTargets"]();
                        provider = items[0];
                        let isInit = items[1];
                        Assert.ok(provider, "provider is initialized");
                        Assert.ok(isInit, "initialization is successful");
                    }, (reason) => {
                        Assert.ok(false, "init errors")
                    })

                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt, cb) as any,(res) => {
                        this.ctx.storeBatch = 1;
                        this.ctx.result = result;
                    }, (reason) => {
                        Assert.ok(false, "store batch errors")
                    })
                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt1, cb) as any,(res) => {
                        this.ctx.storeBatch = 2;
                        this.ctx.result = result;
                    }, (reason) => {
                        Assert.ok(false, "store batch error 1")
                    })
                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt2, cb) as any,(res) => {
                        this.ctx.storeBatch = 3;
                        this.ctx.result = result;
                        Assert.equal(result.length, 3, "response should have three items");
                    }, (reason) => {
                        Assert.ok(false, "store batch error 2")
                    })
                ).add(() =>
                    doAwait(batchHandler.hasStoredBatch(cb1),(res) => {},(reason) => {
                        Assert.ok(false, "has store batch error")
                    })
                ).add(() =>
                    doAwait(batchHandler.cleanStorage(cb2) as any,(cleanRes) => {
                        let res = this.ctx.cleanBatchRes;
                        Assert.equal(res.batchCnt, 3, "should clean all three items");
                    },(reason) => {
                        Assert.ok(false, "clean store batch error")
                    })
                ).add(() =>
                    doAwait(batchHandler.hasStoredBatch(cb3),(res) => {
                        let hasBatch = this.ctx.hasBatch1;
                        Assert.equal(hasBatch, false, "should not contain any events")
                    },(reason) => {
                        Assert.ok(false, "has store store batch error")

                    })
                ).add(() =>
                    doAwait(batchHandler.teardown(), () => {
                        this.ctx.isclosed = true;
                    }, (reason) => {
                        Assert.ok(false, "teardown error")

                    })
                )
            }
        });

        this.testCase({
            name: "Send Next Batch: send Next Batch with web storge provider",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                

                let evt = TestHelper.mockEvent(endpoint, 1, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 3, false);

                let sender1Payload: any[] = []
                let sender1 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(400, {});
                }
                let sender2Payload: any[] = []
                let sender2 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender2Payload.push(payload);
                    oncomplete(200, {});
                }
                let sender3Payload: any[] = []
                let sender3 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender3Payload.push(payload);
                    oncomplete(500, {});
                }

                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
                let res2: any[] = [];
                let cb2 = (res) =>  {
                    res2.push(res);
                }
                let res3: any[] = [];
                let cb3 = (res) =>  {
                    res3.push(res);
                }
                let cb4 = (res) => {
                    this.ctx.hasBatch1Called = true;
                    this.ctx.hasBatch1 = res && res.length >= 1;
                }

                return this._asyncQueue().add(() => {
                    doAwait(batchHandler.storeBatch(evt), (res) => {
                        this.ctx.storeBatch = 1;
                    }, (reason) => {
                        Assert.ok(false, "storeBatch 1 error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.storeBatch(evt1), (res) => {
                        this.ctx.storeBatch = 2;
                    }, (reason) => {
                        Assert.ok(false, "storeBatch 2 error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.storeBatch(evt2), (res) => {
                        this.ctx.storeBatch = 3;
                    }, (reason) => {
                        Assert.ok(false, "storeBatch 3 error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}) as any, (res) => {
                        this.ctx.sendBatch1 = true;
                        this.ctx.sendBatch1Res = res1;
                        this.ctx.sendBatch1Pd = sender1Payload;
                    }, (reason) => {
                        Assert.ok(false, "sendNextBatch 1 error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.sendNextBatch(cb2, false, {sendPOST: sender2}) as any, (res) => {
                        this.ctx.sendBatch2 = true;
                        this.ctx.sendBatch2Res = res2;
                        this.ctx.sendBatch2Pd = sender2Payload;
                    }, (reason) => {
                        Assert.ok(false, "sendNextBatch 2 error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.sendNextBatch(cb3, false, {sendPOST: sender3}) as any, (res) => {
                        this.ctx.sendBatch3 = true;
                        this.ctx.sendBatch3Res = res3;
                        this.ctx.sendBatch3Pd = sender3Payload;
                    }, (reason) => {
                        Assert.ok(false, "sendNextBatch 3 error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.hasStoredBatch(cb4), (res) => {
                    }, (reason) => {
                        Assert.ok(false, "hasStoredBatch error: " + (reason && reason.message));
                    });
                }).add(() => {
                    doAwait(batchHandler.teardown(), () => {
                        this.ctx.isclosed = true;
                    }, (reason) => {
                        Assert.ok(false, "teardown error: " + (reason && reason.message));
                    });
                })

            }
                
        });

        this.testCase({
            name: "Send Next Batch: send Next Batch with IndexedDB provider",
            test: ()=> {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.IndexedDb], autoClean: false, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                this.batchHandler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                

                let evt = TestHelper.mockEvent(endpoint, 1, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 3, false);

                let sender1Payload: any[] = [];
                let sender1 = (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(400, {});
                };
                let res1: any[] = [];
                let cb1 = (res) => {
                    res1.push(res);
                };

                return this._asyncQueue().add(() =>
                    doAwait(batchHandler.storeBatch(evt), (res) => {
                        this.ctx.storeBatch = 1;
                    }, (reason) => {
                        Assert.ok(false, "storeBatch 1 error: " + (reason && reason.message));
                    })
                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt1), (res) => {
                        this.ctx.storeBatch = 2;
                    }, (reason) => {
                        Assert.ok(false, "storeBatch 2 error: " + (reason && reason.message));
                    })
                ).add(() =>
                    doAwait(batchHandler.storeBatch(evt2), (res) => {
                        this.ctx.storeBatch = 3;
                    }, (reason) => {
                        Assert.ok(false, "storeBatch 3 error: " + (reason && reason.message));
                    })
                ).add(() =>
               
                    doAwaitResponse(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}) as any, (res) => {
                        this.ctx.sendBatch1 = true;
                        this.ctx.sendBatch1Res = res1;
                        this.ctx.sendBatch1Pd = sender1Payload;
                        Assert.equal(res.value.state, eBatchSendStatus.Drop, "should have drop status");
                        doAwaitResponse(provider.getAllEvents(), (res)=> {
                            this.ctx.getAll = true;
                            let val = res.value;
                            Assert.equal(val && val.length, 2, "should have 2 events");
                            let sentcriticalCnt = res1[0].data.criticalCnt;
                            arrForEach(val, (item) => {
                                Assert.ok(sentcriticalCnt !== item.criticalCnt, "should not contain deleted item");
                            });
                        });
                    })
                )
            }
        });

        this.testCase({
            name: "Send Next Batch: send Next Batch with IndexedDB provider test1 with retry code",
            test: () => {
                let batchHandler = this.batchHandler;
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                

                let sender1Payload: any[] = []
                let sender1 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(500, {});
                }
           

                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
         
                return this._asyncQueue().add(() =>
                    doAwaitResponse(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}) as any,(res) => {
                        this.ctx.sendBatch1 = true;
                        this.ctx.sendBatch1Res = res1;
                        this.ctx.sendBatch1Pd =  sender1Payload;
                        Assert.equal(res.value.state, eBatchSendStatus.Retry, "should have retry status");
                    })
                ).add(()=>
                    doAwaitResponse(provider.getAllEvents(), (res)=> {
                        this.ctx.getAll = true;
                        let val = res.value;
                        Assert.equal(val && val.length, 1, "should have 1 events");
                        let sentcriticalCnt = res1[0].data.criticalCnt;
                        arrForEach(val, (item) => {
                            Assert.ok(sentcriticalCnt !== item.criticalCnt, "should not contain deleted item");
                        });
                        let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                        let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                        let storageObject = JSON.parse(storageStr);
                        let storageEvts = storageObject.evts;
                        Assert.deepEqual(Object.keys(storageEvts).length, 1, "storgae should only have one event");
                    })
                )
            }
        });

        this.testCase({
            name: "Send Next Batch: send Next Batch with IndexedDB provider test1 with 200",
            test: () => {
                let batchHandler = this.batchHandler;
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                

                let sender1Payload: any[] = []
                let sender1 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(200, {});
                }
           
                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
         
                return this._asyncQueue().add(() =>
                    doAwaitResponse(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}) as any,(res) => {
                        this.ctx.sendBatch1 = true;
                        this.ctx.sendBatch1Res = res1;
                        this.ctx.sendBatch1Pd =  sender1Payload;
                        Assert.equal(res.value.state, eBatchSendStatus.Complete, "should have complete status");
                    })
                ).add(() =>
                    doAwaitResponse(provider.getAllEvents(), (res)=> {
                        this.ctx.getAll = true;
                        let val = res.value;
                        Assert.equal(val && val.length, 0, "should have 0 events");
                        let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                        let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                        Assert.deepEqual(storageStr, null, "storgae should not have one event");
                    })
                )
            }
        });

        this.testCase({
            name: "Send Next Batch: send Next Batch with IndexedDB provider test1 with unload events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let unloadHandler = new OfflineBatchHandler();
                unloadHandler.initialize(providerCxt);
                let evt = TestHelper.mockEvent(endpoint, 1, false);
                unloadHandler.storeBatch(evt); // add events to local storage
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                Assert.ok(storageStr, "storage should have one event");


                let batchHandler = this.batchHandler;
                this.ctx.isInit = true;
                this.ctx.handler = batchHandler;
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");

                let sender1Payload: any[] = []
                let sender1 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(200, {});
                }
           

                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }


                return this._asyncQueue().add(() =>
                    doAwaitResponse(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}) as any,(res) => {
                        this.ctx.sendBatch1 = true;
                        this.ctx.sendBatch1Res = res1;
                        this.ctx.sendBatch1Pd =  sender1Payload;
                        Assert.equal(res.value.state, eBatchSendStatus.Complete, "should have complete status");
                        Assert.equal(res.value.data.id, evt.id, "should have expected event");
                    })
                ).add(() =>
                    doAwaitResponse(provider.getAllEvents(), (res)=> {
                        this.ctx.getAll = true;
                        let val = res.value;
                        Assert.equal(val && val.length, 0, "should have 0 events");
                        let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                        let evts = JSON.parse(storageStr).evts;
                        Assert.deepEqual(evts, {}, "storage should not have one event");
                    })
                )
            }
        });

        this.testCase({
            name: "Send Next Batch: Error handle store batch",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");

                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
                this.sandbox.stub((provider) as any, "addEvent").callsFake((key) => {
                    return createAsyncRejectedPromise(new Error ("add event mock error"));
                });

                let evt = TestHelper.mockEvent(endpoint, 1, false);

                doAwaitResponse(batchHandler.storeBatch(evt, cb1),(res) => {
                    this.ctx.storeBatch = true;
                    if (res.rejected) {
                        Assert.ok(false, "error should be catched");
                        return;
                    }

                    let item = res.value;
                    Assert.equal(item?.state, eBatchStoreStatus.Failure, "should have expected state");
                    Assert.equal(item?.item.message, "add event mock error" , "should have expected message");
                    Assert.equal(res1.length, 1, "should call callback");
                    Assert.equal(res1[0].state, item?.state, "should call callback with expected response");
                })
                
                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item =  this.ctx.storeBatch;
                    
                    if (item) {
                        return true;
                    }
                    return false;
                }, "Wait for store batch response" + new Date().toISOString(), 15, 1000))
            }
        });

        this.testCase({
            name: "Send Next Batch: Error handle clean batch",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                
                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
                this.sandbox.stub((provider) as any, "clear").callsFake((key) => {
                    return createAsyncRejectedPromise(new Error ("clear mock error"));
                });

                doAwaitResponse(batchHandler.cleanStorage(cb1),(res) => {
                    this.ctx.clearBatch = true;

                    if (res.rejected) {
                        Assert.ok(false, "error should be catched");
                        return;
                    }
                    
                    let item = res.value;
                    Assert.equal(item?.batchCnt, 0, "should have expected state");
                    Assert.equal(res1.length, 1, "should call callback");
                    Assert.equal(res1[0].batchCnt, item?.batchCnt, "should call callback with expected response");
                    batchHandler.teardown();
                    
                });

                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item =  this.ctx.clearBatch;
                    
                    if (item) {
                        return true;
                    }
                    return false;
                }, "Wait for clear batch response" + new Date().toISOString(), 15, 1000))
            }
        });

        this.testCase({
            name: "Send Next Batch: Error handle add batch with remove error",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");

                let evt = TestHelper.mockEvent(endpoint, 1, false);

                batchHandler.storeBatch(evt);
                this.sandbox.stub((provider) as any, "removeEvents").callsFake((key) => {
                    return createAsyncRejectedPromise(new Error ("remove mock error"));
                });
                let sender1Payload: any[] = []
                let sender1 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(200, {});
                }
           
                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
         
                doAwaitResponse(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}),(res) => {
                    this.ctx.addBatch = true;
                    if (res.rejected) {
                        Assert.ok(false, "error should be catched");
                        Assert.equal(res.reason.message, "error should be catched");
                        return;
                    }
                    
                    let item = res.value;
                    Assert.equal(item?.state, eBatchSendStatus.Failure, "should have expected state");
                    Assert.equal(item?.data.message, "remove mock error" , "should have expected message");
                    Assert.equal(res1.length, 1, "should call callback");
                    Assert.equal(res1[0].state, item?.state, "should call callback with expected response");
                    batchHandler.teardown();
                });

                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item =  this.ctx.addBatch;
                    if (item) {
                        return true;
                    }
                    return false;
                }, "Wait for add batch response" + new Date().toISOString(), 15, 1000))
            }
        });

        this.testCase({
            name: "Send Next Batch: Error handle add batch",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageObj = {providers:[eStorageProviders.LocalStorage], autoClean: true, senderCfg:{retryCodes: [500]}, maxRetry: 2} as IOfflineChannelConfiguration;
                let  storageConfig = createDynamicConfig(storageObj).cfg;
 
                let itemCtx = this.core.getProcessTelContext();
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let batchHandler = new OfflineBatchHandler();
                batchHandler.initialize(providerCxt);
                let items = batchHandler["_getDbgPlgTargets"]();
                let provider = items[0];
                let isInit = items[1];
                Assert.ok(provider, "provider is initialized");
                Assert.ok(isInit, "initialization is successful");
                
                let sender1Payload: any[] = []
                let sender1 =  (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sender1Payload.push(payload);
                    oncomplete(200, {});
                }
           
                let res1: any[] = [];
                let cb1 = (res) =>  {
                    res1.push(res);
                }
         
                this.sandbox.stub((provider) as any, "getNextBatch").callsFake((key) => {
                    return createAsyncRejectedPromise(new Error ("get mock error"));
                });
                doAwaitResponse(batchHandler.sendNextBatch(cb1, false, {sendPOST: sender1}),(res) => {
                    this.ctx.getBatch = true;
                    if (res.rejected) {
                        Assert.ok(false, "error should be catched test1");
                        return;
                    }
                    let item = res.value;
                    Assert.equal(item?.state, eBatchSendStatus.Failure, "should have expected state");
                    Assert.equal(item?.data.message, "get mock error" , "should have expected message");
                    Assert.equal(res1.length, 1, "should call callback again");
                    Assert.equal(res1[0].state, item?.state, "should call callback with expected response");
                    batchHandler.teardown();
                });

               
                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item =  this.ctx.getBatch;
                    
                    if (item) {
                        return true;
                    }
                    return false;
                }, "Wait for get batch response" + new Date().toISOString(), 15, 1000))
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

    static mockEvent(endPointUrl: string, criticalCnt: number, setId = true) {
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

