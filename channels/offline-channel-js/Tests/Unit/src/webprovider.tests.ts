import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IConfiguration, arrForEach, createDynamicConfig, isArray, newGuid } from "@microsoft/applicationinsights-core-js";
import { WebStorageProvider } from "../../../src/Providers/WebStorageProvider";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { TestChannel } from "./TestHelper";
import { IInternalPayloadData } from "../../../src/Interfaces/IOfflineProvider";


interface IStorageTelemetryItem extends IInternalPayloadData {
    /**
     * The storage id of the telemetry item that has been attempted to be sent.
     */
    iKey?: string;
    sync?: boolean;
    criticalCnt?: number;
}


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
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
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
            name: "Web local Storage Provider: getAllEvents with no old events",
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

                let evts = provider.getAllEvents();
                Assert.deepEqual(evts, [], "should have no stored events");

            }
            
        });

        this.testCase({
            name: "Web local Storage Provider: getAllEvents with old events",
            test: () => {
                let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
                let expectedStorageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
                
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

                let evts = provider.getAllEvents();
                Assert.deepEqual(evts, [evt], "should have one stored event");

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
                let id = addedEvt.id;
                Assert.ok(id, "evt id should be set");
                Assert.ok(id.indexOf(".") > -1, "evt id should be set with time");
                let evts = provider.getAllEvents();
                Assert.deepEqual(evts, [evt], "should have the expected stored event");

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
                Assert.deepEqual(JSON.stringify(evts), JSON.stringify([evt, evt1]), "should have the expected stored event test1")

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

                let storageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
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
                let storageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
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
                let storageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
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
                let storageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
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

        // this.testCase({
        //     name: "Web local Storage Provider: Uint8 Array should be handled correctly",
        //     test: () => {
        //         let endpoint = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
        //         let arr = new Uint8Array([21, 32]);
        //         let evt = {
        //             urlString: endpoint,
        //             data: arr,
        //             headers: {
        //                 "header1": "header1val",
        //                 "header2": "header2val"
        //             },
        //             isArr: true,
        //             disableXhrSync: false,
        //             disableFetchKeepAlive: false,
        //             sendReason: 1,
        //             iKey: "testIKey",
        //             criticalCnt: 0
        //         }
        //         let provider = new WebStorageProvider("localStorage");
        //         let itemCtx = this.core.getProcessTelContext();
        //         let storageConfig = createDynamicConfig({}).cfg;
        //         let providerCxt = {
        //             itemCtx:  itemCtx,
        //             storageConfig: storageConfig,
        //             endpoint: endpoint
        //         }
        //         let isInit = provider.initialize(providerCxt);
        //         Assert.ok(isInit, "init process is successful");

        //         let addedEvt = provider.addEvent("", evt, itemCtx);
        //         Assert.ok(addedEvt, "evt should be added");
        //         let evts = provider.getAllEvents();
        //         Assert.deepEqual(evts, [evt], "should have the expected stored event");
        //     }
            
        // });




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
