import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { IConfig } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { TestChannel } from "./TestHelper";
import { OfflineChannel } from "../../../src/OfflineChannel"

export class ChannelTests extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
 
    public testInitialize() {
        super.testInitialize();
        AITestClass.orgLocalStorage.clear();
        this.coreConfig = {
            instrumentationKey: "testIkey",
            disableInstrumentationKeyValidation: true
        };
        this.core = new AppInsightsCore();
        
    }

    public testCleanup() {
        super.testCleanup();
        AITestClass.orgLocalStorage.clear();
        this.onDone(() => {
            this.core.unload();
        });
        this.core = null as any;
        this.coreConfig = null as any;
        AITestClass.orgLocalStorage.clear();
       
    }

    public registerTests() {

        this.testCase({
            name: "Channel: Init from core",
            test: () => {
                let channel = new OfflineChannel();
                this.core.initialize(this.coreConfig,[channel]);

                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                let inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch.count(), 0, "online should process next");

                channel.teardown();
                
            }
            
        });
        

        this.testCase({
            name: "Channel: Process Telemetry with web provider ",
            useFakeTimers: true,
            test: () => {
            
                let channel = new OfflineChannel();
                channel.initialize(this.coreConfig, this.core,[]);
                let offlineListener = channel.getOfflineListener() as any;
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                let inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch.count(), 0, "online should process next");

                offlineListener.setOnlineState(2);
                channel.processTelemetry(evt);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch.count(), 1, "offline should process");

                this.clock.tick(2000);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch.count(), 0, "provider should store item");
                let storage = AITestClass.orgLocalStorage;
                let storageKey = "AIOffline_1_dc.services.visualstudio.com/v2/track";
                let storageStr = storage.getItem(storageKey) as any;

                let storageObj = JSON.parse(storageStr);
                let evts = storageObj.evts;
                Assert.deepEqual(Object.keys(evts).length, 1, "storgae should have one event");

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
                this.sendJsonResponse(request, {}, 200);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch.count(), 0, "in memo should not have item");

                offlineListener.setOnlineState(2);

                evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                this.clock.tick(2000);

                evt = mockTelemetryItem();
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

                channel.teardown();
                
            }
        });
    }
}

function mockTelemetryItem(): ITelemetryItem {
    let evt = {
        ver: "testVer" + Math.random(),
        name:"testName",
        time: "testTime",
        iKey:"testKey",
        baseData: {pro1: "prop1"},
        baseType: "testType"

    } as ITelemetryItem;
    return evt;
}