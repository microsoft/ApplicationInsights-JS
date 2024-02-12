import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, EventPersistence, IConfig } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, IConfiguration, IPayloadData, OnCompleteCallback } from "@microsoft/applicationinsights-core-js";
import { TestChannel, mockTelemetryItem } from "./TestHelper";
import { OfflineChannel } from "../../../src/OfflineChannel";
import { IOfflineChannelConfiguration, eStorageProviders } from "../../../src/Interfaces/IOfflineProvider";
import { IPostTransmissionTelemetryItem } from "../../../src/applicationinsights-offlinechannel-js";

export class Offlinetimer extends AITestClass {
    private core: AppInsightsCore;
    private coreConfig: IConfig & IConfiguration;
 
    public testInitialize() {
        super.testInitialize();
        AITestClass.orgLocalStorage.clear();
      
        this.coreConfig = {
            instrumentationKey: "testIkey",
            endpointUrl:  DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH
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
       
    }

    public registerTests() {

        this.testCase({
            name: "InMemo Timer: Handle in memory timer",
            useFakeTimers: true,
            test: () => {
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 2000, minPersistenceLevel: EventPersistence.Critical, eventsLimitInMem: 2 } as IOfflineChannelConfiguration};
                let channel = new OfflineChannel();
                let onlineChannel = new TestChannel();
                this.core.initialize(this.coreConfig,[channel, onlineChannel]);
                let offlineListener = channel.getOfflineListener() as any;

                // online, processTelemetry is not called
                offlineListener.setOnlineState(1);
                let inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer, "in memo timer should be null");

                // offline, processTelemetry is not called
                offlineListener.setOnlineState(2);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer, "in memo timer should be null test1");

                // online, processTelemetry is called
                offlineListener.setOnlineState(1);
                let evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer, "in memo timer should be null test2");

                // offline, processTelemetry is called with event that should not be sent
                offlineListener.setOnlineState(2);
                evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer, "in memo timer should be null test3");

                // offline, processTelemetry is called with event that should be sent
                offlineListener.setOnlineState(2);
                let validEvt = mockTelemetryItem() as IPostTransmissionTelemetryItem;
                validEvt.persistence = 2;
                channel.processTelemetry(validEvt);
                channel.processTelemetry(validEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer, "in memo timer should be created");
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled");
                let inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 2, "should have two events");

                // offline, flush all events in memory, and processTelemetry is not called again
                this.clock.tick(2000);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory");

                this.clock.tick(2000);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory and no processTelemtry is called");

                // offline, flush all events and with one event left in memory, and processTelemetry is not called again
                channel.processTelemetry(validEvt);
                channel.processTelemetry(validEvt);
                channel.processTelemetry(validEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled");
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one event left after flush");

                this.clock.tick(2000);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer should be canceld with no events in memory test1");

                // offline with one event saved in memory, and then online with processTelemetry called
                channel.processTelemetry(validEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled");
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one event left after flush");

                offlineListener.setOnlineState(1);
                this.clock.tick(2000);
                inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer should be canceld with no events in memory test2");

                channel.processTelemetry(validEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer should be canceld when back online");

              
                channel.teardown();
                
            }
        });

        this.testCase({
            name: "SendNextBatch Timer: Handle sendNextBatch timer",
            useFakeTimers: true,
            test: () => {
                let called = 0;
                let sendPost = (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    // first call, return complete, data null;
                    called ++;
                    console.log("test")
                    oncomplete(200, {});
                    return;

                }

                let xhrOverride = {sendPOST: sendPost}
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 2000, eventsLimitInMem: 2, maxSentBatchInterval: 10000,
                    senderCfg: {httpXHROverride: xhrOverride, alwaysUseXhrOverride: true}
                } as IOfflineChannelConfiguration};
                let channel = new OfflineChannel();
                let onlineChannel = new TestChannel();
                this.core.initialize(this.coreConfig,[channel, onlineChannel]);
                let offlineListener = channel.getOfflineListener() as any;

                // online, processTelemetry is not called
                offlineListener.setOnlineState(1);
                let sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(sendBatchTimer, "sendBatch timer should be created after init");
                Assert.ok(sendBatchTimer.enabled, "sendBatch timer should be enabled");

                // online, processTelemetry is not called, no previous stored events returned
                this.clock.tick(10000);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(!sendBatchTimer.enabled, "sendBatch timer should not start again with no events in storage");

                // online, processTelemetry called, no previous stored events returned
                this.clock.tick(10000);
                let evt = mockTelemetryItem() as IPostTransmissionTelemetryItem;
                evt.persistence = 2;
                channel.processTelemetry(evt);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(!sendBatchTimer.enabled, "sendBatch timer should not start again with no events in storage test1");
                Assert.equal(called, 0 , "no data is sent");

                // offline, processTelemetry is not called
                offlineListener.setOnlineState(2);
                this.clock.tick(10000);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(!sendBatchTimer.enabled, "sendBatch timer should not start again with no events in storage test2");
                Assert.equal(called, 0 , "no data is sent");

                // offline, processTelemetry is called, in Memory flush called
                channel.processTelemetry(evt);
                channel.processTelemetry(evt);
                this.clock.tick(10000);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(!sendBatchTimer.enabled, "sendBatch timer should not start again with no events in storage test3");
                Assert.equal(called, 0 , "no data is sent");

                // online, with online sender is not idle
                offlineListener.setOnlineState(1);
                onlineChannel.setIsIdle(false);
                channel.processTelemetry(evt);
                this.clock.tick(10000);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(sendBatchTimer.enabled, "sendBatch timer be refreshed when it is online and not idle");
                Assert.equal(called, 0 , "no data is sent");

                // online, with online sender is idle
                offlineListener.setOnlineState(1);
                onlineChannel.setIsIdle(true);
                channel.processTelemetry(evt);
                this.clock.tick(10000);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(sendBatchTimer.enabled, "sendBatch timer be refreshed when it is online and idle");
                Assert.equal(called, 1 , "data is sent");

                // online, with processTelemtry called again
                offlineListener.setOnlineState(1);
                channel.processTelemetry(evt);
                this.clock.tick(10000);
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(!sendBatchTimer.enabled, "sendBatch timer not be refreshed when it is online and no stored events");
                Assert.equal(called, 1 , "no data is sent again");

              

                channel.teardown();
                
            }
        });
    }
}