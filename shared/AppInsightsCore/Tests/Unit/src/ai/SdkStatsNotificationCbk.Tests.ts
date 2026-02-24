import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { createSdkStatsNotifCbk, ISdkStatsConfig, ISdkStatsNotifCbk } from "../../../../src/core/SdkStatsNotificationCbk";
import { ITelemetryItem } from "../../../../src/interfaces/ai/ITelemetryItem";
import { NotificationManager } from "../../../../src/core/NotificationManager";

export class SdkStatsNotificationCbkTests extends AITestClass {
    private _trackedItems: ITelemetryItem[];
    private _flushCalled: boolean;
    private _listener: ISdkStatsNotifCbk;

    public testInitialize() {
        super.testInitialize();
        this._trackedItems = [];
        this._flushCalled = false;
        this._listener = null;
    }

    public testCleanup() {
        super.testCleanup();
        if (this._listener) {
            this._listener.unload();
            this._listener = null;
        }
        this._trackedItems = [];
        this._flushCalled = false;
    }

    public registerTests() {
        this._testCreation();
        this._testEventsSent();
        this._testEventsDiscarded();
        this._testEventsRetry();
        this._testFlush();
        this._testUnload();
        this._testBaseTypeMapping();
        this._testSdkStatsMetricFiltering();
        this._testNotificationManagerIntegration();
    }

    private _createListener(overrides?: Partial<ISdkStatsConfig>): ISdkStatsNotifCbk {
        let _self = this;
        let cfg: ISdkStatsConfig = {
            trk: function (item: ITelemetryItem) {
                _self._trackedItems.push(item);
            },
            lang: "JavaScript",
            ver: "3.3.6",
            int: 100, // short interval for testing
            fnFlush: function () {
                _self._flushCalled = true;
            }
        };

        if (overrides) {
            for (var key in overrides) {
                if (overrides.hasOwnProperty(key)) {
                    (cfg as any)[key] = (overrides as any)[key];
                }
            }
        }

        _self._listener = createSdkStatsNotifCbk(cfg);
        return _self._listener;
    }

    private _makeItem(baseType: string, name?: string): ITelemetryItem {
        return {
            name: name || "test",
            baseType: baseType
        } as ITelemetryItem;
    }

    private _testCreation() {
        this.testCase({
            name: "SdkStatsNotifCbk: createSdkStatsNotifCbk returns an object with required methods",
            test: () => {
                let listener = this._createListener();

                Assert.ok(listener, "Listener should be created");
                Assert.ok(listener.eventsSent, "eventsSent should be defined");
                Assert.ok(listener.eventsDiscarded, "eventsDiscarded should be defined");
                Assert.ok(listener.eventsRetry, "eventsRetry should be defined");
                Assert.ok(listener.flush, "flush should be defined");
                Assert.ok(listener.unload, "unload should be defined");
            }
        });
    }

    private _testEventsSent() {
        this.testCase({
            name: "SdkStatsNotifCbk: eventsSent accumulates success counts and flushes Item_Success_Count",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [
                    this._makeItem("EventData"),
                    this._makeItem("ExceptionData"),
                    this._makeItem("EventData")
                ];

                listener.eventsSent(items);
                listener.flush();

                // Should have 2 metrics: one for CUSTOM_EVENT (count 2), one for EXCEPTION (count 1)
                Assert.equal(2, this._trackedItems.length, "Should emit 2 metrics");

                let successItems = this._trackedItems.filter(function (item) {
                    return item.name === "Item_Success_Count";
                });
                Assert.equal(2, successItems.length, "All metrics should be Item_Success_Count");

                // Verify props
                let customEventMetric = successItems.filter(function (item) {
                    return item.baseData.properties["telemetry_type"] === "CUSTOM_EVENT";
                })[0];
                Assert.ok(customEventMetric, "Should have CUSTOM_EVENT metric");
                Assert.equal(2, customEventMetric.baseData.average, "CUSTOM_EVENT count should be 2");
                Assert.equal("JavaScript", customEventMetric.baseData.properties["language"], "Language should be JavaScript");
                Assert.equal("3.3.6", customEventMetric.baseData.properties["version"], "Version should be 3.3.6");
                Assert.equal("unknown", customEventMetric.baseData.properties["computeType"], "computeType should be unknown");

                let exceptionMetric = successItems.filter(function (item) {
                    return item.baseData.properties["telemetry_type"] === "EXCEPTION";
                })[0];
                Assert.ok(exceptionMetric, "Should have EXCEPTION metric");
                Assert.equal(1, exceptionMetric.baseData.average, "EXCEPTION count should be 1");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: eventsSent with multiple batches before flush accumulates correctly",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([this._makeItem("EventData")]);
                listener.eventsSent([this._makeItem("EventData"), this._makeItem("EventData")]);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Should emit 1 metric (all CUSTOM_EVENT)");
                Assert.equal(3, this._trackedItems[0].baseData.average, "Should accumulate to 3");
            }
        });
    }

    private _testEventsDiscarded() {
        this.testCase({
            name: "SdkStatsNotifCbk: eventsDiscarded with NonRetryableStatus and sendType emits correct drop.code",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [
                    this._makeItem("EventData"),
                    this._makeItem("RemoteDependencyData")
                ];

                // reason=1 (NonRetryableStatus), sendType=403 (HTTP status)
                listener.eventsDiscarded(items, 1, 403);
                listener.flush();

                Assert.equal(2, this._trackedItems.length, "Should emit 2 dropped metrics");

                let allDropped = this._trackedItems.filter(function (item) {
                    return item.name === "Item_Dropped_Count";
                });
                Assert.equal(2, allDropped.length, "All should be Item_Dropped_Count");

                // Verify drop.code is the HTTP status code as string
                allDropped.forEach(function (item) {
                    Assert.equal("403", item.baseData.properties["drop.code"], "drop.code should be '403'");
                });
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: eventsDiscarded with client exception reason emits CLIENT_EXCEPTION drop.code",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [this._makeItem("ExceptionData")];

                // reason=2 (InvalidEvent) - should map to CLIENT_EXCEPTION
                listener.eventsDiscarded(items, 2);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Should emit 1 dropped metric");
                Assert.equal("Item_Dropped_Count", this._trackedItems[0].name, "Name should be Item_Dropped_Count");
                Assert.equal("CLIENT_EXCEPTION", this._trackedItems[0].baseData.properties["drop.code"], "drop.code should be CLIENT_EXCEPTION");
                Assert.equal("EXCEPTION", this._trackedItems[0].baseData.properties["telemetry_type"], "telemetry_type should be EXCEPTION");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: eventsDiscarded with reason=1 but no sendType uses CLIENT_EXCEPTION",
            test: () => {
                let listener = this._createListener();

                listener.eventsDiscarded([this._makeItem("EventData")], 1);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Should emit 1 metric");
                Assert.equal("CLIENT_EXCEPTION", this._trackedItems[0].baseData.properties["drop.code"],
                    "drop.code should be CLIENT_EXCEPTION when sendType is not provided");
            }
        });
    }

    private _testEventsRetry() {
        this.testCase({
            name: "SdkStatsNotifCbk: eventsRetry accumulates retry counts with status code",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [
                    this._makeItem("EventData"),
                    this._makeItem("MessageData")
                ];

                listener.eventsRetry(items, 429);
                listener.flush();

                Assert.equal(2, this._trackedItems.length, "Should emit 2 retry metrics");

                let allRetry = this._trackedItems.filter(function (item) {
                    return item.name === "Item_Retry_Count";
                });
                Assert.equal(2, allRetry.length, "All should be Item_Retry_Count");

                allRetry.forEach(function (item) {
                    Assert.equal("429", item.baseData.properties["retry.code"], "retry.code should be '429'");
                });
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: eventsRetry with different status codes creates separate buckets",
            test: () => {
                let listener = this._createListener();

                listener.eventsRetry([this._makeItem("EventData")], 429);
                listener.eventsRetry([this._makeItem("EventData")], 503);
                listener.eventsRetry([this._makeItem("EventData")], 429);
                listener.flush();

                Assert.equal(2, this._trackedItems.length, "Should emit 2 retry metrics (separate codes)");

                let retryBy429 = this._trackedItems.filter(function (item) {
                    return item.baseData.properties["retry.code"] === "429";
                });
                Assert.equal(1, retryBy429.length, "Should have one 429 metric");
                Assert.equal(2, retryBy429[0].baseData.average, "429 count should be 2");

                let retryBy503 = this._trackedItems.filter(function (item) {
                    return item.baseData.properties["retry.code"] === "503";
                });
                Assert.equal(1, retryBy503.length, "Should have one 503 metric");
                Assert.equal(1, retryBy503[0].baseData.average, "503 count should be 1");
            }
        });
    }

    private _testFlush() {
        this.testCase({
            name: "SdkStatsNotifCbk: flush resets accumulators (second flush emits nothing)",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([this._makeItem("EventData")]);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "First flush should emit 1 metric");

                // Reset tracking
                this._trackedItems = [];
                listener.flush();

                Assert.equal(0, this._trackedItems.length, "Second flush should emit nothing");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: flush emits all three metric types when success, dropped, and retry exist",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([this._makeItem("EventData")]);
                listener.eventsDiscarded([this._makeItem("ExceptionData")], 2);
                listener.eventsRetry([this._makeItem("MessageData")], 503);
                listener.flush();

                Assert.equal(3, this._trackedItems.length, "Should emit 3 metrics");

                let names = this._trackedItems.map(function (item) { return item.name; }).sort();
                Assert.deepEqual(["Item_Dropped_Count", "Item_Retry_Count", "Item_Success_Count"], names,
                    "Should have all three metric types");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: flush emits MetricData baseType on all metrics",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([this._makeItem("EventData")]);
                listener.flush();

                Assert.equal("MetricData", this._trackedItems[0].baseType, "baseType should be MetricData");
                Assert.equal(1, this._trackedItems[0].baseData.sampleCount, "sampleCount should be 1");
            }
        });
    }

    private _testUnload() {
        this.testCase({
            name: "SdkStatsNotifCbk: unload flushes remaining counts and calls fnFlush",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([this._makeItem("EventData")]);
                listener.unload();
                // Nullify to avoid double unload in testCleanup
                this._listener = null;

                Assert.equal(1, this._trackedItems.length, "Should flush remaining counts on unload");
                Assert.ok(this._flushCalled, "fnFlush should be called on unload");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: unload with no pending data still calls fnFlush",
            test: () => {
                let listener = this._createListener();

                listener.unload();
                this._listener = null;

                Assert.equal(0, this._trackedItems.length, "Should not emit any metrics when no data");
                Assert.ok(this._flushCalled, "fnFlush should still be called");
            }
        });
    }

    private _testBaseTypeMapping() {
        this.testCase({
            name: "SdkStatsNotifCbk: all baseType values map to correct telemetry_type",
            test: () => {
                let listener = this._createListener();

                let mappings: { [key: string]: string } = {
                    "EventData": "CUSTOM_EVENT",
                    "MetricData": "CUSTOM_METRIC",
                    "RemoteDependencyData": "DEPENDENCY",
                    "ExceptionData": "EXCEPTION",
                    "PageviewData": "PAGE_VIEW",
                    "PageviewPerformanceData": "PAGE_VIEW",
                    "MessageData": "TRACE",
                    "RequestData": "REQUEST",
                    "AvailabilityData": "AVAILABILITY"
                };

                for (var baseType in mappings) {
                    if (mappings.hasOwnProperty(baseType)) {
                        listener.eventsSent([this._makeItem(baseType)]);
                    }
                }

                listener.flush();

                // PageviewData and PageviewPerformanceData both map to PAGE_VIEW, so they'll be merged
                // MetricData maps to CUSTOM_METRIC
                // That gives us 8 unique telemetry_type values
                Assert.equal(8, this._trackedItems.length, "Should have 8 unique telemetry_type metrics");

                let types: string[] = this._trackedItems.map(function (item) {
                    return item.baseData.properties["telemetry_type"];
                }).sort();

                Assert.deepEqual(
                    ["AVAILABILITY", "CUSTOM_EVENT", "CUSTOM_METRIC", "DEPENDENCY", "EXCEPTION", "PAGE_VIEW", "REQUEST", "TRACE"],
                    types,
                    "All expected telemetry types should be present"
                );

                // PAGE_VIEW should have count 2 (PageviewData + PageviewPerformanceData)
                let pageView = this._trackedItems.filter(function (item) {
                    return item.baseData.properties["telemetry_type"] === "PAGE_VIEW";
                })[0];
                Assert.equal(2, pageView.baseData.average, "PAGE_VIEW count should be 2");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: unknown baseType defaults to CUSTOM_EVENT",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([this._makeItem("UnknownType")]);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Should emit 1 metric");
                Assert.equal("CUSTOM_EVENT", this._trackedItems[0].baseData.properties["telemetry_type"],
                    "Unknown baseType should default to CUSTOM_EVENT");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: missing baseType defaults to CUSTOM_EVENT",
            test: () => {
                let listener = this._createListener();

                listener.eventsSent([{ name: "test" } as ITelemetryItem]);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Should emit 1 metric");
                Assert.equal("CUSTOM_EVENT", this._trackedItems[0].baseData.properties["telemetry_type"],
                    "Missing baseType should default to CUSTOM_EVENT");
            }
        });
    }

    private _testSdkStatsMetricFiltering() {
        this.testCase({
            name: "SdkStatsNotifCbk: SDK stats metrics (Item_Success_Count etc) are not counted",
            test: () => {
                let listener = this._createListener();

                // These should be filtered out - they are SDK stats metrics themselves
                let sdkStatsItems: ITelemetryItem[] = [
                    this._makeItem("MetricData", "Item_Success_Count"),
                    this._makeItem("MetricData", "Item_Dropped_Count"),
                    this._makeItem("MetricData", "Item_Retry_Count")
                ];

                listener.eventsSent(sdkStatsItems);
                listener.flush();

                Assert.equal(0, this._trackedItems.length,
                    "SDK stats metrics should not be counted to prevent infinite recursion");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: SDK stats metrics are filtered but regular metrics still counted",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [
                    this._makeItem("MetricData", "Item_Success_Count"), // filtered
                    this._makeItem("EventData", "myCustomEvent"),       // counted
                    this._makeItem("MetricData", "Item_Retry_Count"),  // filtered
                    this._makeItem("ExceptionData", "error")           // counted
                ];

                listener.eventsSent(items);
                listener.flush();

                Assert.equal(2, this._trackedItems.length, "Should emit 2 metrics (2 types counted)");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: SDK stats filtering works for eventsDiscarded too",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [
                    this._makeItem("MetricData", "Item_Success_Count"),
                    this._makeItem("EventData", "myEvent")
                ];

                listener.eventsDiscarded(items, 2);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Only non-SDK-stats items should be counted");
                Assert.equal("CUSTOM_EVENT", this._trackedItems[0].baseData.properties["telemetry_type"],
                    "Should only count the EventData item");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: SDK stats filtering works for eventsRetry too",
            test: () => {
                let listener = this._createListener();

                let items: ITelemetryItem[] = [
                    this._makeItem("MetricData", "Item_Dropped_Count"),
                    this._makeItem("MessageData", "trace")
                ];

                listener.eventsRetry(items, 429);
                listener.flush();

                Assert.equal(1, this._trackedItems.length, "Only non-SDK-stats items should be counted");
                Assert.equal("TRACE", this._trackedItems[0].baseData.properties["telemetry_type"],
                    "Should only count the MessageData item");
            }
        });
    }

    private _testNotificationManagerIntegration() {
        this.testCase({
            name: "SdkStatsNotifCbk: can be added to NotificationManager as a listener",
            test: () => {
                let listener = this._createListener();
                let mgr = new NotificationManager();
                mgr.addNotificationListener(listener);

                Assert.equal(1, mgr.listeners.length, "Listener should be added");
                Assert.equal(listener, mgr.listeners[0], "Should be the same listener instance");

                mgr.removeNotificationListener(listener);
                Assert.equal(0, mgr.listeners.length, "Listener should be removed");

                mgr.unload();
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: listener has all required notification callback properties",
            test: () => {
                let listener = this._createListener();

                // Verify the listener implements the expected INotificationListener methods
                Assert.ok(typeof listener.eventsSent === "function", "eventsSent should be a function");
                Assert.ok(typeof listener.eventsDiscarded === "function", "eventsDiscarded should be a function");
                Assert.ok(typeof listener.eventsRetry === "function", "eventsRetry should be a function");
                Assert.ok(typeof listener.flush === "function", "flush should be a function");
                Assert.ok(typeof listener.unload === "function", "unload should be a function");
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: removal from NotificationManager prevents listener from receiving events",
            test: () => {
                let listener = this._createListener();
                let mgr = new NotificationManager();
                mgr.addNotificationListener(listener);

                // Directly invoke listener to verify data flow
                listener.eventsSent([this._makeItem("EventData")]);
                listener.flush();
                Assert.equal(1, this._trackedItems.length, "Should have 1 metric before removal");

                // Remove listener and verify it's gone
                mgr.removeNotificationListener(listener);
                Assert.equal(0, mgr.listeners.length, "Listener should be removed from manager");

                mgr.unload();
            }
        });

        this.testCase({
            name: "SdkStatsNotifCbk: multiple listeners can be added to NotificationManager",
            test: () => {
                let listener1 = this._createListener();
                let trackedItems2: ITelemetryItem[] = [];
                let listener2 = createSdkStatsNotifCbk({
                    trk: function (item: ITelemetryItem) {
                        trackedItems2.push(item);
                    },
                    lang: "JavaScript",
                    ver: "3.3.6",
                    int: 100
                });

                let mgr = new NotificationManager();
                mgr.addNotificationListener(listener1);
                mgr.addNotificationListener(listener2);

                Assert.equal(2, mgr.listeners.length, "Both listeners should be added");

                mgr.removeNotificationListener(listener1);
                Assert.equal(1, mgr.listeners.length, "Only one listener should remain");

                mgr.removeNotificationListener(listener2);
                Assert.equal(0, mgr.listeners.length, "No listeners should remain");

                listener2.unload();
                mgr.unload();
            }
        });
    }
}
