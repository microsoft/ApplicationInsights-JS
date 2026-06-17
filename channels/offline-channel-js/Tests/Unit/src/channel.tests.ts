import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, EventPersistence, IConfig } from "@microsoft/applicationinsights-core-js";
import { AppInsightsCore, IConfiguration, arrForEach, getGlobal, getGlobalInst, objKeys } from "@microsoft/applicationinsights-core-js";
import { TestChannel, mockTelemetryItem } from "./TestHelper";
import { OfflineChannel } from "../../../src/OfflineChannel"
import { IOfflineChannelConfiguration, eStorageProviders } from "../../../src/applicationinsights-offlinechannel-js";

export class ChannelTests extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
    private ctx: any;
    private fetchStub: any;
    private _fetch: any;
    private evtSent: any;
    private evtDiscard: any;
    private evtStore: any;
    private batchDrop: any;
    private levelKeys: any;
 
    public testInitialize() {
        super.testInitialize();
        AITestClass.orgLocalStorage.clear();
        this.coreConfig = {
            instrumentationKey: "testIkey",
            disableInstrumentationKeyValidation: true,
            endpointUrl: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
        };
        this.core = new AppInsightsCore();
        this.ctx = {};
        this._fetch = getGlobalInst("fetch");
        this.evtDiscard = 0;
        this.evtSent = 0;
        this.evtStore = 0;
        this.batchDrop = 0;
        this.levelKeys = [EventPersistence.Critical, EventPersistence.Normal];
        
    }

    public testCleanup() {
        super.testCleanup();
        AITestClass.orgLocalStorage.clear();
        this.onDone(() => {
            this.core.unload(false);
        });
        this.core = null as any;
        this.coreConfig = null as any;
        AITestClass.orgLocalStorage.clear();
        this.ctx = null;
        this.fetchStub = null;
        getGlobal().fetch = this._fetch;
        if (window.localStorage){
            window.localStorage.clear();
        }
        this.evtDiscard = 0;
        this.evtSent = 0;
        this.evtStore = 0;
        this.batchDrop = 0;
        this.levelKeys = null;
       
    }

    public registerTests() {

        this.testCase({
            name: "Channel: Init from core",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let onlineChannel = new TestChannel();
                this.core.initialize(this.coreConfig,[channel, onlineChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;

                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });

                this.clock.tick(1);

                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");

                channel.teardown();
                
            }
            
        });
        
        this.testCase({
            name: "Channel: Init from core indexed db",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let onlineChannel = new TestChannel();
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.IndexedDb], inMemoMaxTime: 2000} as IOfflineChannelConfiguration};
                this.core.initialize(this.coreConfig,[channel, onlineChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;

                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });
                this.clock.tick(1);
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);

                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");

                channel.teardown();
                
            }
            
        });

        this.testCase({
            name: "Channel: Process Telemetry with web provider ",
            useFakeTimers: true,
            test: () => {
                let window = getGlobalInst("window");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {inMemoMaxTime: 2000} as IOfflineChannelConfiguration};
                let sendChannel = new TestChannel();
                let storedEvts:any[] = [];
                let expectedStoreId: any[] = [];

                this.core.initialize(this.coreConfig, [sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                        arrForEach(evts, (item) => {
                            storedEvts.push(item.ver);
                        })
                        
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });
            
                let channel = new OfflineChannel();
               
                channel.initialize(this.coreConfig, this.core,[]);
                this.onDone(() => {
                    channel.teardown();
                });

                this.clock.tick(1);
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                expectedStoreId.push(evt.ver);
                channel.processTelemetry(evt);
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                let inMemoBatch = inMemoMap[EventPersistence.Normal];

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");

                offlineListener.setOnlineState(2);
                channel.processTelemetry(evt);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "offline should process");

                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 0, "provider should store item");
                let storage = AITestClass.orgLocalStorage;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = storage.getItem(storageKey) as any;
                Assert.ok(storageStr.indexOf("header1") > -1, "should contain expeceted header");

                let storageObj = JSON.parse(storageStr);
                let evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 1, "storage should have one event");

                this.clock.tick(10);

                offlineListener.setOnlineState(1);
                this.clock.tick(15000);

                let requests = this._getXhrRequests();
                Assert.deepEqual(requests.length, 1, "xhr request should be triggered");
                storageStr = storage.getItem(storageKey) as any;
                storageObj = JSON.parse(storageStr);
                evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 0, "storage should not have one event");
                let request = requests[0];
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 0, "in memo should not have item");

                offlineListener.setOnlineState(2);

                evt = mockTelemetryItem();
                expectedStoreId.push(evt.ver);
                channel.processTelemetry(evt);
                this.clock.tick(2000);

                evt = mockTelemetryItem();
                expectedStoreId.push(evt.ver);
                channel.processTelemetry(evt);
                this.clock.tick(2000);
                storageStr = storage.getItem(storageKey) as any;
                storageObj = JSON.parse(storageStr);
                evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 2, "storage should have two events");

                offlineListener.setOnlineState(1);
                this.clock.tick(15000);
                requests = this._getXhrRequests();
                Assert.deepEqual(requests.length, 2, "xhr request should be triggered again");
                storageStr = storage.getItem(storageKey) as any;
                storageObj = JSON.parse(storageStr);
                evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 1, "storage should have one event test1");
                request = requests[1];
                this.sendJsonResponse(request, {}, 200);

                this.clock.tick(15000);
                requests = this._getXhrRequests();
                Assert.deepEqual(requests.length, 3, "xhr request should be triggered again test1");
                request = requests[2];
                this.sendJsonResponse(request, {}, 200);
                storageStr = storage.getItem(storageKey) as any;
                storageObj = JSON.parse(storageStr);
                evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 0, "storage should not have one event test1");

                this.clock.tick(1);

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called test1");
                Assert.equal(this.evtStore, 3, "store listener notification should be called three times test1");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called test1");

                Assert.deepEqual( storedEvts, expectedStoreId, "should notify expected evts");

                channel.teardown();
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: "Channel: Process Telemetry with web provider when splitevts is set to true ",
            useFakeTimers: true,
            test: () => {
                let window = getGlobalInst("window");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {inMemoMaxTime: 2000, splitEvts: true} as IOfflineChannelConfiguration};
                let sendChannel = new TestChannel();
                let storedEvts:any[] = [];
                let expectedStoreId: any[] = [];

                this.core.initialize(this.coreConfig, [sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                        arrForEach(evts, (item) => {
                            storedEvts.push(item.ver);
                        })
                        
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });
            
                let channel = new OfflineChannel();
               
                channel.initialize(this.coreConfig, this.core,[]);
                this.onDone(() => {
                    channel.teardown();
                });

                this.clock.tick(1);
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                expectedStoreId.push(evt.ver);
                channel.processTelemetry(evt);
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");
                
                offlineListener.setOnlineState(2);
                // process EventPersistence.Normal event
                channel.processTelemetry(evt);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "offline should process normal event");
                // process ventPersistence.Critical event
                let criticalEvt = mockTelemetryItem(2);
                channel.processTelemetry(criticalEvt);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch.count(), 1, "offline should process critical event");
                

                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 0, "provider should store normal item");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch.count(), 0, "provider should store critical normal item");
                let storage = AITestClass.orgLocalStorage;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = storage.getItem(storageKey) as any;
                Assert.ok(storageStr.indexOf("header1") > -1, "should contain expeceted header");

                let storageObj = JSON.parse(storageStr);
                let evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 2, "storage should have two events");

                let normalCnt = '"criticalCnt":0';
                let criticalCnt = '"criticalCnt":1';
                Assert.ok(storageStr.indexOf(normalCnt) > -1, "should contain expeceted critical count for normal event batches");
                Assert.ok(storageStr.indexOf(criticalCnt) > -1, "should contain expeceted critical count for critical event batches");

                this.clock.tick(1);

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called test1");
                Assert.equal(this.evtStore, 2, "store listener notification should be called two times test1");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called test1");

                channel.teardown();
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

       
        this.testCase({
            name: "Channel: Process Telemetry with indexed db provider",
            useFakeTimers: true,
            pollDelay: 100,
            test: () => {
                let window = getGlobalInst("window");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sendChannel = new TestChannel();
                this.core.initialize(this.coreConfig, [sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                        this.ctx.sent = this.ctx.sent || [];
                        this.ctx.sent.push(batch.data);
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });

                let channel = new OfflineChannel();
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.IndexedDb], inMemoMaxTime: 2000} as IOfflineChannelConfiguration};
                channel.initialize(this.coreConfig, this.core,[]);

                this.clock.tick(1);
                let senderInst =  channel["_getDbgPlgTargets"]()[2];
                let sender1 =  (payload: any, oncomplete: any, sync?: boolean) => {
                    oncomplete(200, {});
                }
                this.ctx.called = 0;
                this.sandbox.stub((senderInst) as any, "sendPOST").callsFake((payload: any, oncomplete: any, sync?: boolean) => {
                    this.ctx.called++;
                    return sender1(payload, oncomplete, sync)
                });
                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");
                
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                let inMemoBatch = inMemoMap[EventPersistence.Normal];
            

                offlineListener.setOnlineState(2);
                channel.processTelemetry(evt);
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "offline should process");

                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 0, "provider should store item");

                this.clock.tick(10);

                offlineListener.setOnlineState(1);
                this.clock.tick(15000);


                offlineListener.setOnlineState(2);

                evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                this.clock.tick(2000);
                evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                this.clock.tick(2000);
                

                offlineListener.setOnlineState(1);
                this.clock.tick(15000);

                channel.teardown();

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
      
                return this._asyncQueue().concat(PollingAssert.asyncTaskPollingAssert(() => {
                    let item = this.ctx.called;
                    if (item == 2) {
                        Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called test1");
                        Assert.equal(this.evtStore, 3, "store listener notification should be called twice test1");
                        // only wait one 15000 interval, so sent notification should be sent twice only
                        Assert.equal(this.evtSent, 2, "sent listener notification should not called twice test1");
                        let evts = this.ctx.sent;
                        Assert.ok(evts[0].indexOf(evts[1]) < 0, "events should be different");
                        Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called test1");

                        return true;
                    }
                    return false;
                }, "Wait for fetch response " + new Date().toISOString(), 200, 1000));
            }
        });

        this.testCase({
            name: "Channel: add event when in Memory batch is full",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let sendChannel = new TestChannel();
                // make sure in memo time is long enough
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 200000000, eventsLimitInMem: 1, minPersistenceLevel: 2} as IOfflineChannelConfiguration};
                this.core.initialize(this.coreConfig,[channel, sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });

                this.clock.tick(1);

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");
              
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(2);
                let evt1 = mockTelemetryItem(2);
                let ver1 = evt1.ver;
                let evt2 = mockTelemetryItem(2);
                channel.processTelemetry(evt1);
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "online should process evt1");


                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                channel.processTelemetry(evt2);
                Assert.equal(inMemoBatch.count(), 1, "online should process evt2");

                let storage = AITestClass.orgLocalStorage;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = storage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                let evts = storageObj.evts;
                Assert.equal(evts && Object.keys(evts).length, 1, "should have one events");
                Assert.ok(storageStr.indexOf(ver1) > -1, "should contain only the first event");
                this.clock.tick(1);
                Assert.equal(this.evtDiscard, 0, "discard listener notification should not called test1");
                Assert.equal(this.evtStore, 1, "store listener notification should be called once test1");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called test1")

                let invalidEvt = mockTelemetryItem();
                channel.processTelemetry(invalidEvt);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "online should not process invalid item");
                this.clock.tick(1);
                Assert.equal(this.evtDiscard, 1, "discard listener notification should be called once test2");
                Assert.equal(this.evtStore, 1, "store listener notification should be called once test2");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called test2");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called test2");
                

                channel.teardown();
                
            }
            
        });

        this.testCase({
            name: "Channel: add event when in Memory batch is full with splitEvts set to true",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let sendChannel = new TestChannel();
                // make sure in memo time is long enough
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 200000000, eventsLimitInMem: 1, splitEvts: true} as IOfflineChannelConfiguration};
                this.core.initialize(this.coreConfig,[channel, sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });

                this.clock.tick(1);

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");

                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                Assert.ok(inMemoMap, "inMemoMap should exist");
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
              
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(2);

                // eventsLimitInMem = 1, means for each persistent level, max number allowed for in memory events is 1

                // process one critical event and one normal event (inMemoMap[nomral] should have 1 event and inMemoMap[critical] should have 1 event)
                // then process another normal event (one normal event should be saved, inMemoMap[nomral] should have 1 event and inMemoMap[critical] should have 1 event)
                let normalEvt1 = mockTelemetryItem();
                let ver1 = normalEvt1.ver;
                let normalEvt2 = mockTelemetryItem();
                let criticalEvt1 = mockTelemetryItem(2);
                let cVer1 = criticalEvt1.ver;
                channel.processTelemetry(normalEvt1);
                channel.processTelemetry(criticalEvt1);
                
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "online should process normal evt");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch.count(), 1, "online should process critical evt2");
                channel.processTelemetry(normalEvt2);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "normal event batch should have one event");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch.count(), 1, "critical event batch should have one event");

                let storage = AITestClass.orgLocalStorage;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = storage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                let evts = storageObj.evts;
                Assert.equal(evts && Object.keys(evts).length, 1, "should have one events");
                Assert.ok(storageStr.indexOf(ver1) > -1, "should contain only the first event");
                this.clock.tick(1);
                Assert.equal(this.evtDiscard, 0, "discard listener notification should not called test1");
                Assert.equal(this.evtStore, 1, "store listener notification should be called once test1");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called test1");

                // process another critical event
                let criticalEvt2 = mockTelemetryItem(2);
                channel.processTelemetry(criticalEvt2);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "normal event batch should have one event test1");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch.count(), 1, "critical event batch should have one event test1");

                storage = AITestClass.orgLocalStorage;
                storageKey = "AIOffline_1_dc.services.visualstudio.com";
                storageStr = storage.getItem(storageKey) as any;
                storageObj = JSON.parse(storageStr);
                evts = storageObj.evts;
                Assert.equal(evts && Object.keys(evts).length, 2, "should have two events");
                Assert.ok(storageStr.indexOf(ver1) > -1, "should contain the first normal event");
                Assert.ok(storageStr.indexOf(cVer1) > -1, "should contain the first critical event");
                this.clock.tick(1);
                Assert.equal(this.evtDiscard, 0, "discard listener notification should not called test2");
                Assert.equal(this.evtStore, 2, "store listener notification should be called twice test2");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called test2");

                
                channel.teardown();
                
            }
            
        });

        this.testCase({
            name: "Channel: drop batch notification should be handled with inMemo batch",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let sendChannel = new TestChannel();
                // make sure in memo time is long enough
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 200000000, eventsLimitInMem: 1} as IOfflineChannelConfiguration};
                this.core.initialize(this.coreConfig,[channel, sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });

                this.clock.tick(1);
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                this.sandbox.stub((inMemoBatch) as any, "addEvent").callsFake((evt) => {
                    return false;
                });
                Assert.equal(inMemoBatch.count(), 0, "in memo has no events");
                

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should not be called");
              
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(2);
                let evt = mockTelemetryItem();
               
                channel.processTelemetry(evt);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 0, "should not process evt");

                this.clock.tick(1);
                Assert.equal(this.evtDiscard, 1, "discard listener notification should be called once test1");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called once test1");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called test1");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should be called test1");
                

                channel.teardown();
                
            }
            
        });

        this.testCase({
            name: "Channel: drop batch notification should be with send",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let sendChannel = new TestChannel();
                let senderCalled = 0;
                // make sure in memo time is long enough
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 200, eventsLimitInMem: 1} as IOfflineChannelConfiguration};
                this.core.initialize(this.coreConfig,[channel, sendChannel]);
                this.core.addNotificationListener({
                    eventsDiscarded: (evts, reason) => {
                        this.evtDiscard += 1;
                    },
                    offlineEventsStored: (evts) => {
                        this.evtStore += 1;
                    },
                    offlineBatchSent: (batch) => {
                        this.evtSent += 1;
                    },
                    offlineBatchDrop(cnt, reason) {
                        this.batchDrop += 1;
                    }
                });
                this.clock.tick(1);

                let senderInst =  channel["_getDbgPlgTargets"]()[2];
                let sender1 =  (payload: any, oncomplete: any, sync?: boolean) => {
                    oncomplete(800, {});
                }

                this.sandbox.stub((senderInst) as any, "sendPOST").callsFake((payload: any, oncomplete: any, sync?: boolean) => {
                    senderCalled ++;
                    return sender1(payload, oncomplete, sync)
                });

                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.equal(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                let inMemoBatch = inMemoMap[EventPersistence.Normal];

                Assert.equal(this.evtDiscard, 0, "discard listener notification should not be called");
                Assert.equal(this.evtStore, 0, "store listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called");
                Assert.equal(this.batchDrop, 0, "batch drop listener notification should be called");
                
              
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(2);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "offline should process evt");

                this.clock.tick(300);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 0, "in Memo should have no events remaining");
                let storage = AITestClass.orgLocalStorage;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com";
                let storageStr = storage.getItem(storageKey) as any;
                let storageObj = JSON.parse(storageStr);
                let evts = storageObj.evts;
                Assert.equal(evts && Object.keys(evts).length, 1, "should have one events");

                offlineListener.setOnlineState(1);
                this.clock.tick(15000);
                Assert.equal(senderCalled, 1, "sent should be called once");

                this.clock.tick(1);
                Assert.equal(this.evtDiscard, 0, "discard listener notification shouldnot be called once test1");
                Assert.equal(this.evtStore, 1, "store listener notification should be called once test1");
                Assert.equal(this.evtSent, 0, "sent listener notification should not be called test1");

                

                channel.teardown();
                
            }
            
        });

        this.testCase({
            name: "Channel: Should handle endpoint change",
            useFakeTimers: true,
            test: () => {
                let channel = new OfflineChannel();
                let sendChannel = new TestChannel();
                // make sure in memo time is long enough
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 200000} as IOfflineChannelConfiguration};
                this.core.initialize(this.coreConfig,[channel, sendChannel]);

                this.clock.tick(1);
                
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(2);

                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let mapKeys = objKeys(inMemoMap);
                Assert.deepEqual(mapKeys.length, this.levelKeys.length, "in memo map should have expected keys");
                Assert.ok(inMemoMap, "inMemoMap should exist");
                arrForEach(this.levelKeys, (key) => {
                    let inMemoBatch = inMemoMap[key];
                    Assert.equal(inMemoBatch.count(), 0, key + " in memo batch should exist");
                });

                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                
                let config = channel["_getDbgPlgTargets"]()[0];
                Assert.ok(config, "should have config");
                Assert.equal(config.url, DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH, "should have expected url");

                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "offline should process evt");

                // should get url from online channel first
                let expectedUrl = "testUrl";
                sendChannel.endpoint = expectedUrl;
                this.core.config.endpointUrl = expectedUrl;
                this.core.config.instrumentationKey = "test1";
                this.clock.tick(1);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "in memo has one events");
                Assert.equal(inMemoBatch.endpoint(), expectedUrl, "in memo has expected url");
                config = channel["_getDbgPlgTargets"]()[0];
                Assert.ok(config, "should have config");
                Assert.equal(config.url, expectedUrl, "should have expected url");

                // when can't get from online channel, get from core
                let expectedUrl1 = "testURL1";
                sendChannel.endpoint = "";
                this.core.config.instrumentationKey = "test2";
                this.core.config.endpointUrl = expectedUrl1;
                this.clock.tick(1);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "in memo has one events");
                Assert.equal(inMemoBatch.endpoint(), expectedUrl1, "in memo has expected url test1");
                config = channel["_getDbgPlgTargets"]()[0];
                Assert.ok(config, "should have config");
                Assert.equal(config.url, expectedUrl1, "should have expected url test1");


                // when sender channel url change
                let expectedUrl2 = "testURL2";
                sendChannel.endpoint = "";
                this.core.config.extensionConfig = this.core.config.extensionConfig || {};
                this.core.config.endpointUrl = expectedUrl2;
                this.core.config.extensionConfig[sendChannel.identifier].endpointUrl = expectedUrl2;
                this.clock.tick(1);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch.count(), 1, "in memo has one events");
                Assert.equal(inMemoBatch.endpoint(), expectedUrl2, "in memo has expected url test1");
                config = channel["_getDbgPlgTargets"]()[0];
                Assert.ok(config, "should have config");
                Assert.equal(config.url, expectedUrl2, "should have expected url test1");

                
                channel.teardown();
                
            }
            
        });
    }
}
