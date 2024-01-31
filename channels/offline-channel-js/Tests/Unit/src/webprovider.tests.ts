import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IConfiguration, arrForEach, createDynamicConfig, generateW3CId, isArray } from "@microsoft/applicationinsights-core-js";
import { WebStorageProvider } from "../../../src/Providers/WebStorageProvider";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { TestChannel } from "./TestHelper";
import { ILocalStorageConfiguration, IStorageTelemetryItem } from "../../../src/Interfaces/IOfflineProvider";
import { doAwaitResponse } from "@nevware21/ts-async";
import { strSubstr } from "@nevware21/ts-utils";


export class OfflineWebProviderTests extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
 
    public testInitialize() {
        super.testInitialize();
        AITestClass.orgLocalStorage.clear();
        let channel = new TestChannel();
        this.coreConfig = {
            instrumentationKey: "testIkey",
            endpointUrl: "https://testurl.com"
        };
        this.core = new AppInsightsCore();
        this.core.initialize(this.coreConfig, [channel]);
        
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
            name: "Web local Storage Provider: Init with storage available",
            test: () => {
                let provider = new WebStorageProvider("localStorage");
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
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com";
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");
                let expectedMaxStorage = 5000000;
                Assert.equal(ctx[1], expectedMaxStorage, "default MaxStorage is set");
                Assert.ok(provider.supportsSyncRequests(), "support sync should be set to true");
            }
        });

        this.testCase({
            name: "Web local Storage Provider: Init with no storage available",
            test: () => {
                let provider = new WebStorageProvider("testStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(!isInit, "init process should return false");
            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: Init with expected config",
            test: () => {
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({
                    autoClean: true,
                    maxStorageSizeInBytes: 1000,
                    inStorageMaxTime: 3600,
                    storageKeyPrefix: "testPrefix"

                } as ILocalStorageConfiguration).cfg;
                let providerCxt = {
                    itemCtx: itemCtx,
                    storageConfig: storageConfig,
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process should return true");

                let ctx = provider["_getDbgPlgTargets"]();
                let expectedStorageKey = "testPrefix_1_dc.services.visualstudio.com";
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");
                let expectedMaxStorage = 1000;
                Assert.equal(ctx[1], expectedMaxStorage, "default MaxStorage is set");
                let expectedMaxTime = 3600;
                Assert.equal(ctx[2], expectedMaxTime, "default MaxStorageTime is set");
                Assert.ok(provider.supportsSyncRequests(), "support sync should be set to true");
            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: getNextBatch with no old events",
            test: () => {
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint:DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let evts = provider.getNextBatch();
                Assert.deepEqual(evts, [], "should have no stored events and return array");
            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: getNextBatch with old events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com";
                let evt = TestHelper.mockEvent(endpoint, 3);
                let jsonObj = TestHelper.mockStorageJSON(evt);
                let evtStr = JSON.stringify(jsonObj);
                AITestClass.orgLocalStorage.setItem(expectedStorageKey, evtStr);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let ctx = provider["_getDbgPlgTargets"]();
                
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");

                let evts = provider.getNextBatch();
                Assert.deepEqual(evts, [evt], "should have one stored event");
            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: getNextBatch should return expected number of events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com";
                let evt = TestHelper.mockEvent(endpoint, 3);
                let evt1 = TestHelper.mockEvent(endpoint, 2);
                let evt2 = TestHelper.mockEvent(endpoint, 1);
                let jsonObj = TestHelper.mockStorageJSON([evt, evt1, evt2]);
                let evtStr = JSON.stringify(jsonObj);
                AITestClass.orgLocalStorage.setItem(expectedStorageKey, evtStr);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let ctx = provider["_getDbgPlgTargets"]();
                
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");

                let evts = provider.getNextBatch();
                Assert.deepEqual(evts, [evt], "should have one stored event");
                
            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: getNextBatch should handle errors",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com";
                
                this.sandbox.stub((window.localStorage) as any, "getItem").callsFake((key) => {
                    throw new Error("test error");
                });
                
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let ctx = provider["_getDbgPlgTargets"]();
                
                Assert.equal(ctx[0], expectedStorageKey, "should have expected storage");
              
                doAwaitResponse(provider.getNextBatch(), (res) => {
                    if (res.reason) {
                        Assert.ok(true, "error promise created");
                        Assert.equal(res.reason.message, "test error", "should create expected promise");
                    } else {
                        Assert.ok(false, "should create promise error");
                    }
                    
                });

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: getNextBatch should return null when no storage available",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                
                let provider = new WebStorageProvider("testStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(!isInit, "init process is expected");

                let ctx = provider["_getDbgPlgTargets"]();
                Assert.equal(ctx[0], undefined, "should have expected storage");
              
                doAwaitResponse(provider.getNextBatch(), (res) => {
                    if (!res.rejected) {
                        Assert.ok(true, "response returned");
                        Assert.equal(res.value, null, "should return null");
                    } else {
                        Assert.ok(false, "should return  successful response");
                    }
                    
                });

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: addEvent should set default id when it is not provided",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let addedEvt = provider.addEvent("", evt, itemCtx);
                Assert.ok(addedEvt, "evt should be added");
                let id =  addedEvt && (addedEvt as any).id;
                Assert.ok(id, "evt id should be set");
                Assert.ok(id.indexOf(".") > -1, "evt id should be set with time");
                let evts = provider.getAllEvents();
                Assert.deepEqual(evts, [evt], "should have the expected stored event");

                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr).evts;
                Assert.deepEqual(Object.keys(storageObj).length, 1, "storgae should have expected events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: addEvent should add expected events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let evt = TestHelper.mockEvent(endpoint, 3);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let addedEvt = provider.addEvent("", evt, itemCtx);
                Assert.ok(addedEvt, "evt should be added");
                let evts = provider.getAllEvents();
                Assert.deepEqual(evts, [evt], "should have the expected stored event");

                let evt1 = TestHelper.mockEvent(endpoint, 2);
                let addedEvt1 = provider.addEvent("", evt1, itemCtx);
                Assert.ok(addedEvt1, "evt should be added test1");
                evts = provider.getAllEvents() as any[];
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt, evt1]), "should have the expected stored event test1");

                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr).evts;
                Assert.deepEqual(Object.keys(storageObj).length, 2, "storgae should have expected two events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: addEvent should handle errors",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({EventsToDropPerTime: 2}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let evt = TestHelper.mockEvent(endpoint, 3, true);
                let addedEvt = provider.addEvent("", evt, itemCtx);
                Assert.ok(addedEvt, "evt should be added");

                let evt1 = TestHelper.mockEvent(endpoint, 2, true);
                let addedEvt1 = provider.addEvent("", evt1, itemCtx);
                Assert.ok(addedEvt1, "evt1 should be added");


                let evt2 = TestHelper.mockEvent(endpoint, 1, true);
                let addedEvt2 = provider.addEvent("", evt2, itemCtx);
                Assert.ok(addedEvt2, "evt2 should be added");

                let evt3 = TestHelper.mockEvent(endpoint, 0, true);
                let addedEvt3 = provider.addEvent("", evt3, itemCtx);
                Assert.ok(addedEvt3, "evt3 should be added");

                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr).evts;
                Assert.deepEqual(Object.keys(storageObj).length, 4, "storage should have expected four events");

                let called = -1;
                let evts: any[] = []
                this.sandbox.stub((window.localStorage) as any, "setItem").callsFake((key, val) => {
                    evts.push(val);
                    called += 1;
                    if (called == 1) {
                        return;
                    }
                    throw new Error("test error");
                });

                let evt4 = TestHelper.mockEvent(endpoint, 5, true);
                let addedEvt4 = provider.addEvent("", evt4, itemCtx);
                Assert.equal(evts.length, 2, "should be called two times");
                let jsonObj = JSON.parse(evts[1]);
                Assert.deepEqual(jsonObj.evts, {[evt.id as any]: evt, [evt1.id as any]: evt1, [evt2.id as any]: evt2, [evt4.id as any]: evt4}, "should have expected events test1");
                let evt6 = TestHelper.mockEvent(endpoint, 6, true);
                doAwaitResponse(provider.addEvent("", evt6, itemCtx), (res) => {
                    if (res.rejected) {
                        Assert.ok(true, "error triggered");
                        Assert.equal(res.reason.message, "Unable to free up event space", "should have expected error");
                        return;
                    }
                    Assert.ok(false, "error is not triggered");
                });

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: removeEvents with id set",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let evt = TestHelper.mockEvent(endpoint, 3);
                let evt1 = TestHelper.mockEvent(endpoint, 2);
                let evt2 = TestHelper.mockEvent(endpoint, 1);
                let evt3 = TestHelper.mockEvent(endpoint, 0);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                provider.addEvent("", evt, itemCtx);
                provider.addEvent("", evt1, itemCtx);
                provider.addEvent("", evt2, itemCtx);
                provider.addEvent("", evt3, itemCtx);
                let evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt, evt1, evt2, evt3]), "should have the expected stored events");

                provider.removeEvents([evt, evt1]);
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt2, evt3]), "should have the expected remaining stored events test1");

                provider.removeEvents([evt]);
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt2, evt3]), "should have the expected remaining stored events test2");
        
                provider.removeEvents([evt, evt2]);
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt3]), "should have the expected remaining stored events test3");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: removeEvents with id not set",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 1, false);
                let evt3 = TestHelper.mockEvent(endpoint, 0, false);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                provider.addEvent("", evt, itemCtx);
                provider.addEvent("", evt1, itemCtx);
                provider.addEvent("", evt2, itemCtx);
                provider.addEvent("", evt3, itemCtx);
                let evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt, evt1, evt2, evt3]), "should have the expected stored events");

                let evts1 = provider.getAllEvents(1);
                Assert.deepEqual(JSON.stringify(evts1), JSON.stringify([evt]), "should have the expected 1 stored events");
                let evts2 = provider.getAllEvents(2);
                Assert.deepEqual(JSON.stringify(evts2), JSON.stringify([evt, evt1]), "should have the expected 2 stored events");

                provider.removeEvents([evt]);
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt1, evt2, evt3]), "should have the expected remaining stored events test1");

                provider.removeEvents([evt1]);
                provider.removeEvents([evt2]);
                provider.removeEvents([evt3]);
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([]), "should have the expected remaining stored events test2");

                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                Assert.deepEqual(storageObj.evts, {}, "storgae should not have any remaining events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: clear should clear all events in storage",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 1, false);
                let evt3 = TestHelper.mockEvent(endpoint, 0, false);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                provider.addEvent("", evt, itemCtx);
                provider.addEvent("", evt1, itemCtx);
                provider.addEvent("", evt2, itemCtx);
                provider.addEvent("", evt3, itemCtx);
                let evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt, evt1, evt2, evt3]), "should have the expected stored events");

                provider.clear();
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([]), "should not have any remaining events");
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                Assert.deepEqual(storageObj.evts, {}, "storgae should not have any remaining events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: Clean should drop events that exist longer than max storage time",
            useFakeTimers: true,
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                let evt2 = TestHelper.mockEvent(endpoint, 1, false);
                let evt3 = TestHelper.mockEvent(endpoint, 0, false);
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({inStorageMaxTime: 1}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");
                this.clock.tick(1);

                provider.addEvent("", evt, itemCtx);
                provider.addEvent("", evt1, itemCtx);
                provider.addEvent("", evt2, itemCtx);
                provider.addEvent("", evt3, itemCtx);
                let evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt, evt1, evt2, evt3]), "should have the expected stored events");
                this.clock.tick(10);

                let isCleaned = provider.clean();
                evts = provider.getAllEvents();
                Assert.ok(isCleaned, "should clean all events");
                evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([]), "should have clean all previous events");
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                Assert.deepEqual(storageObj.evts, {}, "storgae should not have any remaining events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: autoClean should drop expected events when it is set to true",
            useFakeTimers: true,
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");
                this.clock.tick(10);
                let evt = TestHelper.mockEvent(endpoint, 3, false);
                let evt1 = TestHelper.mockEvent(endpoint, 2, false);
                provider.addEvent("", evt, itemCtx);
                provider.addEvent("", evt1, itemCtx);

                this.clock.tick(20);
              
                let provider1 = new WebStorageProvider("localStorage");
                let storageConfig1 = createDynamicConfig({autoClean: true, inStorageMaxTime: 10}).cfg;
                let providerCxt1 = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig1,
                    endpoint: endpoint
                }
                
                
                let evt2 = TestHelper.mockEvent(endpoint, 1, false);
                let evt3 = TestHelper.mockEvent(endpoint, 0, false);
                provider.addEvent("", evt2, itemCtx);
                provider.addEvent("", evt3, itemCtx);

                let isInit1 = provider1.initialize(providerCxt1);
                Assert.ok(isInit1, "init process is successful test1");

                let evts = provider.getAllEvents();
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt2, evt3]), "should clean the expected events");
                
                let storageStr = AITestClass.orgLocalStorage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                let remainingEvts = storageObj.evts;
                Assert.deepEqual(Object.keys(remainingEvts).length, 2, "storgae should have expected remaining events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: Uint8 Array should be handled correctly",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let arr = new Uint8Array([21, 32]);
                let evt = {
                    urlString: endpoint,
                    data: arr,
                    headers: {
                        "header1": "header1val",
                        "header2": "header2val"
                    },
                    isArr: true,
                    disableXhrSync: false,
                    disableFetchKeepAlive: false,
                    sendReason: 1,
                    iKey: "testIKey",
                    criticalCnt: 0
                }
                let provider = new WebStorageProvider("localStorage");
                let itemCtx = this.core.getProcessTelContext();
                let storageConfig = createDynamicConfig({}).cfg;
                let providerCxt = {
                    itemCtx:  itemCtx,
                    storageConfig: storageConfig,
                    endpoint: endpoint
                }
                let isInit = provider.initialize(providerCxt);
                Assert.ok(isInit, "init process is successful");

                let addedEvt = provider.addEvent("", evt, itemCtx);
                Assert.ok(addedEvt, "evt should be added");
                Assert.equal((addedEvt as IStorageTelemetryItem).data, "MjEsMzI=", "should have the expected encoded stored event");
                let evts = provider.getAllEvents();
                let data = evts && evts[0];
                Assert.deepEqual(data.data, arr, "should have the expected decoded stored event array");
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
            let time = new Date().getTime();
            let random = strSubstr(generateW3CId(), 0, 8);
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
                id: setId? time + "." + random : "",
                iKey: "testIKey",
                criticalCnt: criticalCnt
            }
            return payload;
        }

        static mockStorageJSON(item: IStorageTelemetryItem | IStorageTelemetryItem[]): any {
            if (isArray(item)) {
                let evts = {};
                arrForEach(item, (evt) => {
                    let id = evt.id;
                    evts[id as any] = evt

                });
                return {
                    lastAccessTime: 0,
                    evts:evts
                }

            }

            let id = item.id;
            return {
                lastAccessTime: 0,
                evts:{[id as any]: item }
            }

        }
     
}
