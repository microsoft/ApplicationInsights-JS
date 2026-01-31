import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, EventPersistence, IConfig } from "@microsoft/applicationinsights-core-js";
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

                this.clock.tick(1);
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
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                //let inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 2, "should have two events");

                // offline, flush all events in memory, and processTelemetry is not called again
                this.clock.tick(2000);
                //inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory");

                this.clock.tick(2000);
                //inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory and no processTelemtry is called");

                // offline, flush all events and with one event left in memory, and processTelemetry is not called again
                channel.processTelemetry(validEvt);
                channel.processTelemetry(validEvt);
                channel.processTelemetry(validEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled");
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                //inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one event left after flush");

                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                //inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer should be canceld with no events in memory test1");

                // offline with one event saved in memory, and then online with processTelemetry called
                channel.processTelemetry(validEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled");
                //inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one event left after flush");

                offlineListener.setOnlineState(1);
                this.clock.tick(2000);
                //inMemoBatch = channel["_getDbgPlgTargets"]()[1];
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
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
            name: "InMemo Timer: Handle in memory timer with splitEvts set to true",
            useFakeTimers: true,
            test: () => {
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {providers:[eStorageProviders.LocalStorage], inMemoMaxTime: 2000, eventsLimitInMem: 1, splitEvts: true } as IOfflineChannelConfiguration};
                let channel = new OfflineChannel();
                let onlineChannel = new TestChannel();
                this.core.initialize(this.coreConfig,[channel, onlineChannel]);

                this.clock.tick(1);
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

                // offline, processTelemetry is called with normal event
                offlineListener.setOnlineState(2);
                evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer, "in memo timer should be created test3");
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled test1");
                let inMemoMap = channel["_getDbgPlgTargets"]()[1];
                let inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one normal event");

                // offline, processTelemetry is called with critical event
                offlineListener.setOnlineState(2);
                let criticalEvt = mockTelemetryItem(2) as IPostTransmissionTelemetryItem;
                channel.processTelemetry(criticalEvt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer, "in memo timer should be not null");
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled test2");
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one critical event");

                // offline, processTelemetry is called with normal event again
                offlineListener.setOnlineState(2);
                evt = mockTelemetryItem();
                channel.processTelemetry(evt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer, "in memo timer should not be null test1");
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled test2");
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one normal event test1");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one critical event test1");

                // offline, flush all events in memory, and processTelemetry is not called again
                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no noraml event left");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no critical event left");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory");

                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no noraml event left test1");
                inMemoBatch = inMemoMap[EventPersistence.Critical];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no critical event left tes1 ");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer enabled should be false with no events in memory and no processTelemtry is called");
            

                // offline with one normal event saved in memory, and then online with processTelemetry called
                channel.processTelemetry(evt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(inMemoTimer.enabled, "in memo timer should be enabled");
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 1, "should have one normal event left test1");

                offlineListener.setOnlineState(1);
                this.clock.tick(2000);
                inMemoMap = channel["_getDbgPlgTargets"]()[1];
                inMemoBatch = inMemoMap[EventPersistence.Normal];
                Assert.equal(inMemoBatch && inMemoBatch.count(), 0, "should have no event left test1");
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer should be canceld with no events in memory test2");

                channel.processTelemetry(evt);
                inMemoTimer = channel["_getDbgPlgTargets"]()[3];
                Assert.ok(!inMemoTimer.enabled, "in memo timer should be canceld when back online");

              
                channel.teardown();
                
            }
        });

        this.testCase({
            name: "SendNextBatch Timer: Timer should resume sending after offline-to-online transition",
            useFakeTimers: true,
            test: () => {
                let sendCalled = 0;
                
                let sendPost = (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => {
                    sendCalled++;
                    oncomplete(200, {});
                    return;
                }

                let xhrOverride = {sendPOST: sendPost}
                this.coreConfig.extensionConfig = {["OfflineChannel"]: {
                    providers:[eStorageProviders.LocalStorage], 
                    inMemoMaxTime: 2000, 
                    eventsLimitInMem: 2, 
                    maxSentBatchInterval: 10000,
                    senderCfg: {httpXHROverride: xhrOverride, alwaysUseXhrOverride: true}
                } as IOfflineChannelConfiguration};
                
                let channel = new OfflineChannel();
                let onlineChannel = new TestChannel();
                onlineChannel.setIsIdle(true);
                this.core.initialize(this.coreConfig,[channel, onlineChannel]);
                
                let offlineListener = channel.getOfflineListener() as any;
                // Start offline
                offlineListener.setOnlineState(2);
                this.clock.tick(1);
                
                // Verify timer is still enabled while offline
                let sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(sendBatchTimer.enabled, "Timer should be initially enabled even when offline");
                Assert.equal(sendCalled, 0, "No data should be sent while offline");

                // Add events while offline
                let evt = mockTelemetryItem() as IPostTransmissionTelemetryItem;
                evt.persistence = EventPersistence.Critical;
                channel.processTelemetry(evt);
                channel.processTelemetry(evt);

                // Flush to storage
                this.clock.tick(10000);
                
                // Timer should be disabled after send attempt
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(!sendBatchTimer.enabled, "Timer should be disabled after send attempt");
                Assert.equal(sendCalled, 0, "No data should be sent while offline");
                
                // Transition from offline to online - this triggers the bug
                offlineListener.setOnlineState(1);
                
                // Timer should be enabled after going online
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                Assert.ok(sendBatchTimer, "Timer should exist after going online");
                Assert.ok(sendBatchTimer.enabled, "Timer should be enabled after going online");
                
                // Wait for timer to fire
                this.clock.tick(10000);
                
                // BUG: The timer callback still thinks we're offline due to stale closure
                // so it cancels itself and doesn't send data
                sendBatchTimer = channel["_getDbgPlgTargets"]()[4];
                
                // This assertion will fail with the bug - timer gets cancelled
                Assert.ok(sendBatchTimer.enabled, "Timer should still be enabled and continue sending batches");
                
                // This assertion will fail with the bug - no data gets sent
                Assert.ok(sendCalled > 0, "Data should be sent after going online");
                
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
                this.clock.tick(1);
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