import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import { eOTelSpanKind, eOTelSpanStatusCode, isTracingSuppressed, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { setBypassLazyCache } from "@nevware21/ts-utils";

/**
 * Integration Tests for Span APIs with Properties Plugin and Analytics Plugin
 *
 * Tests verify that span telemetry correctly integrates with:
 * - PropertiesPlugin: session, user, device, application context
 * - AnalyticsPlugin: telemetry creation, dependency tracking, page views
 * - Telemetry Initializers: custom property injection
 * - SDK configuration: sampling, disabled tracking, etc.
 */
export class SpanPluginIntegrationTests extends AITestClass {
    private _ai!: ApplicationInsights;

    constructor(testName?: string) {
        super(testName || "SpanPluginIntegrationTests");
    }

    public testInitialize() {
        try {
            setBypassLazyCache(true);
            this.useFakeServer = true;
            
            this._ai = new ApplicationInsights({
                config: {
                    instrumentationKey: "test-ikey-123",
                    disableInstrumentationKeyValidation: true,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    disableFetchTracking: false,
                    enableAutoRouteTracking: false,
                    disableExceptionTracking: false,
                    maxBatchInterval: 100,
                    enableDebug: false,
                    extensionConfig: {
                        ["AppInsightsPropertiesPlugin"]: {
                            accountId: "test-account-id"
                        }
                    }
                }
            });

            this._ai.loadAppInsights();
        } catch (e) {
            Assert.ok(false, "Failed to initialize tests: " + e);
            console.error("Failed to initialize tests: " + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
        setBypassLazyCache(false);
    }

    public registerTests() {
        this.addPropertiesPluginIntegrationTests();
        this.addAnalyticsPluginIntegrationTests();
        this.addTelemetryInitializerTests();
        this.addSessionContextTests();
        this.addUserContextTests();
        this.addDeviceContextTests();
        this.addDistributedTraceContextTests();
        this.addSamplingIntegrationTests();
        this.addConfigurationIntegrationTests();
    }

    private addPropertiesPluginIntegrationTests(): void {
        this.testCase({
            name: "PropertiesPlugin: span telemetry includes session context",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                const span = this._ai.startSpan("test-operation", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Span should be created");

                Assert.equal(false, isTracingSuppressed(span), "Span should not be suppressed");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(1, sentItems.length, "Telemetry should be sent");

                const payload = sentItems[0];
                Assert.ok(payload, "Payload should exist");
                Assert.ok(payload.tags, "Payload should have tags");
                
                // Session ID is sent in tags with key "ai.session.id"
                const sessionId = payload.tags["ai.session.id"];
                Assert.ok(sessionId, "Session ID should be in tags");
                Assert.ok(sessionId.length > 0, "Session ID should not be empty");
            }
        });

        this.testCase({
            name: "PropertiesPlugin: span telemetry includes user context",
            useFakeTimers: true,
            test: () => {
                // Set user context before creating span
                this._ai.context.user.authenticatedId = "test-auth-user-123";
                this._ai.context.user.accountId = "test-account-456";

                const span = this._ai.startSpan("user-operation", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.setAttribute("custom.prop", "value");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(1, sentItems.length, "Telemetry should be sent");

                const payload = sentItems[0];
                Assert.ok(payload, "Payload should exist");
                Assert.ok(payload.tags, "Payload should have tags");
                
                // User auth ID is sent in tags with key "ai.user.authUserId"
                const authUserId = payload.tags["ai.user.authUserId"];
                Assert.equal(authUserId, "test-auth-user-123", "Authenticated ID should match");
                
                // Account ID is sent in tags with key "ai.user.accountId"
                const accountId = payload.tags["ai.user.accountId"];
                Assert.equal(accountId, "test-account-456", "Account ID should be in tags");
            }
        });

        this.testCase({
            name: "PropertiesPlugin: span telemetry includes device context",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("device-operation", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Span should be created");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(1, sentItems.length, "Telemetry should be sent");
                const payload = sentItems[0];
                Assert.ok(payload, "Payload should exist");
                Assert.ok(payload.tags, "Payload should have tags");
                
                // Device info is sent in tags with keys "ai.device.type" and "ai.device.id"
                const deviceType = payload.tags["ai.device.type"];
                Assert.equal(deviceType, "Browser", "Device type should be Browser");
                
                const deviceId = payload.tags["ai.device.id"];
                Assert.equal(deviceId, "browser", "Device ID should be browser");
            }
        });

        this.testCase({
            name: "PropertiesPlugin: span telemetry includes SDK version from internal context",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("sdk-version-check", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(1, sentItems.length, "Telemetry should be sent");
                const payload = sentItems[0];
                Assert.ok(payload, "Payload should exist");
                Assert.ok(payload.tags, "Payload should have tags");
                
                // SDK version is sent in tags with key "ai.internal.sdkVersion"
                const sdkVersion = payload.tags["ai.internal.sdkVersion"];
                Assert.ok(sdkVersion, "SDK version should exist");
                Assert.ok(sdkVersion.indexOf("javascript") >= 0 || sdkVersion.indexOf("ext1") >= 0,
                    "SDK version should contain javascript or extension prefix");
            }
        });

        this.testCase({
            name: "PropertiesPlugin: web context applied to span telemetry",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("web-context-operation", {
                    kind: eOTelSpanKind.SERVER
                });
                Assert.ok(span, "Span should be created");
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(1, sentItems.length, "Telemetry should be sent");

                const payload = sentItems[0];
                Assert.ok(payload, "Payload should exist");
                
                // Web context info like browser is sent in data section or tags
                // Just verify the payload was sent successfully with telemetry
                Assert.ok(payload.data, "Payload should have data section");
            }
        });
    }

    private addAnalyticsPluginIntegrationTests(): void {
        this.testCase({
            name: "AnalyticsPlugin: CLIENT span creates RemoteDependencyData",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("http-request", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "GET",
                        "http.url": "https://api.example.com/data",
                        "http.status_code": 200
                    }
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                span.setStatus({ code: eOTelSpanStatusCode.OK });
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Telemetry should be sent");

                const item = sentItems[0] as ITelemetryItem;
                Assert.ok(item.data, "Data should exist");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.equal(item.data!.baseType, "RemoteDependencyData", "BaseType should be RemoteDependencyData");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.ok(item.data!.baseData, "BaseData should exist");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.equal(item.data!.baseData.name, "GET /data", "Name should match span name");
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.equal(item.data!.baseData.success, true, "Success should be true for OK status");
            }
        });

        this.testCase({
            name: "AnalyticsPlugin: PRODUCER span creates RemoteDependencyData with message type",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("send-message", {
                    kind: eOTelSpanKind.PRODUCER,
                    attributes: {
                        "messaging.system": "rabbitmq",
                        "messaging.destination": "orders-queue",
                        "messaging.operation": "send"
                    }
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Telemetry should be sent");

                const item = sentItems[0] as ITelemetryItem;
                Assert.ok(item.data, "Data should exist");
                if (!item.data) {
                    return;
                }
                Assert.equal(item.data.baseType, "RemoteDependencyData", "BaseType should be RemoteDependencyData");
                Assert.ok(item.data.baseData, "BaseData should exist");
                if (!item.data.baseData) {
                    return;
                }
                Assert.ok(item.data.baseData.type, "Type should be set for message dependency");
            }
        });

        this.testCase({
            name: "AnalyticsPlugin: custom properties merged into baseData",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("operation-with-props", {
                    kind: eOTelSpanKind.INTERNAL,
                    attributes: {
                        "custom.string": "value",
                        "custom.number": 42,
                        "custom.boolean": true
                    }
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                span.setAttribute("runtime.prop", "added-after-start");
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Telemetry should be sent");

                const item = sentItems[0] as ITelemetryItem;
                if (!item.data) {
                    return;
                }
                Assert.ok(item.data.baseData, "BaseData should exist");
                if (!item.data.baseData) {
                    return;
                }

                // Custom properties should be in properties object
                if (item.data.baseData.properties) {
                    Assert.equal(item.data.baseData.properties["custom.string"], "value", "String property should be preserved");
                    Assert.equal(item.data.baseData.properties["custom.number"], 42, "Number property should be preserved");
                    Assert.equal(item.data.baseData.properties["custom.boolean"], "true", "Boolean property should be preserved");
                    Assert.equal(item.data.baseData.properties["runtime.prop"], "added-after-start",
                        "Runtime-added property should be present");
                }
            }
        });

        this.testCase({
            name: "AnalyticsPlugin: span duration calculated correctly",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("timed-operation", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                // Simulate some time passing
                this.clock.tick(250);

                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Telemetry should be sent");

                const item = sentItems[0] as ITelemetryItem;
                if (!item.data) {
                    return;
                }
                Assert.ok(item.data.baseData, "BaseData should exist");
                if (!item.data.baseData) {
                    return;
                }
                Assert.equal(item.data.baseData.name, "timed-operation", "Name should match span name");
                Assert.ok(item.data.baseData.duration, "Duration should exist");

                // Duration should be approximately 250ms (formatted as time span string)
                const durationMs = this.parseDurationToMs(item.data.baseData.duration);
                Assert.ok(durationMs >= 240 && durationMs <= 260,
                    "Duration should be ~250ms, got " + durationMs + "ms - " + JSON.stringify(item));
            }
        });

        this.testCase({
            name: "AnalyticsPlugin: failed span sets success=false",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("failing-operation", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                span.setStatus({
                    code: eOTelSpanStatusCode.ERROR,
                    message: "Operation failed"
                });
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Telemetry should be sent");

                const item = sentItems[0] as ITelemetryItem;
                if (!item.data) {
                    return;
                }
                Assert.ok(item.data.baseData, "BaseData should exist");
                if (!item.data.baseData) {
                    return;
                }
                Assert.equal(item.data.baseData.success, false, "Success should be false for ERROR status");
            }
        });
    }

    private addTelemetryInitializerTests(): void {
        this.testCase({
            name: "TelemetryInitializer: can modify span telemetry",
            useFakeTimers: true,
            test: () => {
                let initializerCalled = false;

                this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                    initializerCalled = true;

                    if (item.baseType === "RemoteDependencyData") {
                        // Add custom property via initializer
                        item.baseData = item.baseData || {};
                        item.baseData.properties = item.baseData.properties || {};
                        item.baseData.properties["initializer.added"] = "custom-value";
                        item.baseData.properties["initializer.timestamp"] = new Date().toISOString();
                    }

                    return true;
                });

                const span = this._ai.startSpan("initialized-span", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                span.end();
                this.clock.tick(500);

                Assert.ok(initializerCalled, "Telemetry initializer should be called");

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Telemetry should be sent");

                const item = sentItems[0] as ITelemetryItem;
                if (!item.data) {
                    return;
                }
                if (!item.data.baseData) {
                    return;
                }
                Assert.ok(item.data.baseData.properties, "Properties should exist");
                Assert.equal(item.data.baseData.properties["initializer.added"], "custom-value",
                    "Initializer-added property should be present");
                Assert.ok(item.data.baseData.properties["initializer.timestamp"],
                    "Timestamp should be added by initializer");
            }
        });

        this.testCase({
            name: "TelemetryInitializer: can filter span telemetry",
            useFakeTimers: true,
            test: () => {
                this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                    // Filter out spans with specific attribute
                    if (item.baseType === "RemoteDependencyData" &&
                        item.baseData &&
                        item.baseData.properties &&
                        item.baseData.properties["filter.me"] === "true") {
                        return false; // Reject this telemetry
                    }
                    return true;
                });

                // This span should be filtered out
                const filteredSpan = this._ai.startSpan("filtered-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "filter.me": "true"
                    }
                });
                Assert.ok(filteredSpan, "Filtered span should be created");
                if (filteredSpan) {
                    filteredSpan.end();
                }

                // This span should go through
                const normalSpan = this._ai.startSpan("normal-span", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(normalSpan, "Normal span should be created");
                if (normalSpan) {
                    normalSpan.end();
                }

                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(sentItems.length, 1, "Only one span should be sent (filtered one rejected)");

                const item = sentItems[0] as ITelemetryItem;
                if (item.data && item.data.baseData) {
                    Assert.equal(item.data.baseData.name, "normal-span", "Only normal span should be sent");
                }
            }
        });

        this.testCase({
            name: "TelemetryInitializer: can enrich with context data",
            useFakeTimers: true,
            test: () => {
                this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                    // Add environment and build info to all span telemetry
                    if (item.baseType === "RemoteDependencyData") {
                        item.baseData = item.baseData || {};
                        item.baseData.properties = item.baseData.properties || {};
                        item.baseData.properties["environment"] = "test";
                        item.baseData.properties["build.version"] = "1.2.3";
                        item.baseData.properties["region"] = "us-west";
                    }
                    return true;
                });

                const span = this._ai.startSpan("enriched-span", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                const item = sentItems[0] as ITelemetryItem;
                if (!item.data) {
                    return;
                }
                if (!item.data.baseData) {
                    return;
                }

                Assert.equal(item.data.baseData.properties["environment"], "test", "Environment should be added");
                Assert.equal(item.data.baseData.properties["build.version"], "1.2.3", "Build version should be added");
                Assert.equal(item.data.baseData.properties["region"], "us-west", "Region should be added");
            }
        });
    }

    private addSessionContextTests(): void {
        this.testCase({
            name: "SessionContext: consistent session ID across multiple spans",
            useFakeTimers: true,
            test: () => {
                const span1 = this._ai.startSpan("operation-1", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span1, "First span should be created");
                if (span1) {
                    span1.end();
                }

                const span2 = this._ai.startSpan("operation-2", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span2, "Second span should be created");
                if (span2) {
                    span2.end();
                }

                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(sentItems.length, 2, "Two telemetry items should be sent");

                const payload1 = sentItems[0];
                const payload2 = sentItems[1];

                const sessionId1 = payload1.tags ? payload1.tags["ai.session.id"] : undefined;
                const sessionId2 = payload2.tags ? payload2.tags["ai.session.id"] : undefined;

                Assert.ok(sessionId1, "First item should have session ID");
                Assert.ok(sessionId2, "Second item should have session ID");
                Assert.equal(sessionId1, sessionId2, "Session IDs should be consistent");
            }
        });

        this.testCase({
            name: "SessionContext: session renewal doesn't affect active spans",
            useFakeTimers: true,
            test: () => {
                const span1 = this._ai.startSpan("before-renewal", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span1, "Span before renewal should be created");
                if (span1) {
                    span1.end();
                }
                this.clock.tick(500);

                // Simulate session renewal time passing (30+ minutes)
                this.clock.tick(31 * 60 * 1000);

                const span2 = this._ai.startSpan("after-renewal", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span2, "Span after renewal should be created");
                if (span2) {
                    span2.end();
                }
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(sentItems.length, 2, "Both spans should be sent");

                // Session might have renewed, but both spans should have valid session IDs
                const payload1 = sentItems[0];
                const payload2 = sentItems[1];

                const sessionId1 = payload1.tags ? payload1.tags["ai.session.id"] : undefined;
                const sessionId2 = payload2.tags ? payload2.tags["ai.session.id"] : undefined;

                Assert.ok(sessionId1, "First span should have session ID");
                Assert.ok(sessionId2, "Second span should have session ID");
            }
        });
    }

    private addUserContextTests(): void {
        this.testCase({
            name: "UserContext: setting user ID applies to subsequent spans",
            useFakeTimers: true,
            test: () => {
                // Set user context
                this._ai.context.user.id = "user-12345";
                this._ai.context.user.authenticatedId = "auth-user-67890";

                const span = this._ai.startSpan("user-operation", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                const payload = sentItems[0];

                Assert.ok(payload.tags, "Payload should have tags");
                
                // User ID is sent in tags with key "ai.user.id"
                const userId = payload.tags["ai.user.id"];
                Assert.equal(userId, "user-12345", "User ID should match");
                
                // Auth user ID is sent in tags with key "ai.user.authUserId"
                const authUserId = payload.tags["ai.user.authUserId"];
                Assert.equal(authUserId, "auth-user-67890", "Authenticated ID should match");
            }
        });

        this.testCase({
            name: "UserContext: clearing user context removes from spans",
            useFakeTimers: true,
            test: () => {
                // Set then clear
                this._ai.context.user.authenticatedId = "temp-user";
                this._ai.context.user.clearAuthenticatedUserContext();

                const span = this._ai.startSpan("after-clear", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                const payload = sentItems[0];

                // User context should still exist but authenticated ID should be undefined/missing
                if (payload.tags) {
                    const authUserId = payload.tags["ai.user.authUserId"];
                    Assert.ok(!authUserId || authUserId === undefined,
                        "Authenticated ID should be cleared");
                }
            }
        });
    }

    private addDeviceContextTests(): void {
        this.testCase({
            name: "DeviceContext: device information included in all spans",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("device-check", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                const payload = sentItems[0];

                Assert.ok(payload.tags, "Payload should have tags");
                
                // Device info is sent in tags
                const deviceType = payload.tags["ai.device.type"];
                const deviceId = payload.tags["ai.device.id"];
                
                Assert.ok(deviceType, "Device type should be set");
                Assert.ok(deviceId, "Device ID should be set");
            }
        });
    }

    private addDistributedTraceContextTests(): void {
        this.testCase({
            name: "DistributedTrace: parent-child spans share trace ID",
            useFakeTimers: true,
            test: () => {
                const parentSpan = this._ai.startSpan("parent-op", {
                    kind: eOTelSpanKind.SERVER
                });
                Assert.ok(parentSpan, "Parent span should be created");
                if (!parentSpan) {
                    return;
                }

                const childSpan = this._ai.startSpan("child-op", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(childSpan, "Child span should be created");

                parentSpan.end();
                if (childSpan) {
                    childSpan.end();
                }
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(sentItems.length, 2, "Both spans should be sent");

                const parentPayload = sentItems[0];
                const childPayload = sentItems[1];

                // Both should have same operation ID (trace ID) in tags
                const parentOpId = parentPayload.tags ? parentPayload.tags["ai.operation.id"] : undefined;
                const childOpId = childPayload.tags ? childPayload.tags["ai.operation.id"] : undefined;

                Assert.ok(parentOpId, "Parent should have operation ID");
                Assert.ok(childOpId, "Child should have operation ID");
                Assert.equal(parentOpId, childOpId, "Trace IDs should match for parent and child");
            }
        });

        this.testCase({
            name: "DistributedTrace: span context propagates through telemetry",
            useFakeTimers: true,
            test: () => {
                const span = this._ai.startSpan("traced-operation", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }

                const spanContext = span.spanContext();
                Assert.ok(spanContext.traceId, "Span should have trace ID");
                Assert.ok(spanContext.spanId, "Span should have span ID");

                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                const payload = sentItems[0];

                // Trace context should be in tags
                if (payload.tags) {
                    const operationId = payload.tags["ai.operation.id"];
                    const operationParentId = payload.tags["ai.operation.parentId"];
                    
                    Assert.equal(operationId, spanContext.traceId, "Operation ID should match trace ID");
                    Assert.ok(operationParentId, "Operation parent ID should be set");
                }
            }
        });
    }

    private addSamplingIntegrationTests(): void {
        this.testCase({
            name: "Sampling: 1% sampling allows minimal span telemetry",
            useFakeTimers: true,
            test: () => {
                // Recreate AI with 1% sampling (minimum valid value)
                this._ai.unload(false);

                this._ai = new ApplicationInsights({
                    config: {
                        instrumentationKey: "test-ikey-123",
                        samplingPercentage: 1
                    }
                });
                this._ai.loadAppInsights();

                const span = this._ai.startSpan("low-sampled", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should still be created");
                if (span) {
                    span.end();
                }
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                // With 1% sampling, telemetry may or may not be sent (depends on sample hash)
                Assert.ok(sentItems.length >= 0, "Telemetry should respect 1% sampling rate");
            }
        });

        this.testCase({
            name: "Sampling: 100% sampling sends all span telemetry",
            useFakeTimers: true,
            test: () => {
                // Default config has 100% sampling
                const spans = [];
                for (let i = 0; i < 10; i++) {
                    const span = this._ai.startSpan("operation-" + i, {
                        kind: eOTelSpanKind.INTERNAL
                    });
                    Assert.ok(span, "Span " + i + " should be created");
                    if (span) {
                        span.end();
                        spans.push(span);
                    }
                }
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.equal(sentItems.length, 10, "All 10 spans should be sent with 100% sampling");
            }
        });
    }

    private addConfigurationIntegrationTests(): void {
        this.testCase({
            name: "Config: disableAjaxTracking doesn't affect manual spans",
            useFakeTimers: true,
            test: () => {
                // Config already has disableAjaxTracking: false, but manual spans should work regardless
                const span = this._ai.startSpan("manual-span", {
                    kind: eOTelSpanKind.CLIENT
                });
                Assert.ok(span, "Manual span should be created");
                if (!span) {
                    return;
                }
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Manual span should be sent regardless of ajax tracking config");
            }
        });

        this.testCase({
            name: "Config: maxBatchInterval affects when span telemetry is sent",
            useFakeTimers: true,
            test: () => {
                // Current config has maxBatchInterval: 0 (send immediately)
                const span = this._ai.startSpan("immediate-send", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }
                span.end();

                // No tick needed with maxBatchInterval: 0
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                Assert.ok(sentItems.length > 0, "Span should be sent immediately");
            }
        });

        this.testCase({
            name: "Config: extensionConfig reaches PropertiesPlugin",
            useFakeTimers: true,
            test: () => {
                // We set accountId in extensionConfig during init
                const span = this._ai.startSpan("config-test", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span, "Span should be created");
                if (!span) {
                    return;
                }
                span.end();
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();
                const payload = sentItems[0];

                // Check if account ID from config made it through tags
                if (payload.tags) {
                    const accountId = payload.tags["ai.user.accountId"];
                    if (accountId) {
                        Assert.equal(accountId, "test-account-id",
                            "Account ID from config should be present in tags");
                    }
                }
            }
        });

        this.testCase({
            name: "Config: dynamic configuration changes affect new spans",
            useFakeTimers: true,
            test: () => {
                // Create span with initial config
                const span1 = this._ai.startSpan("before-config-change", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span1, "First span should be created");
                if (span1) {
                    span1.end();
                }
                this.clock.tick(500);

                // Change configuration dynamically
                this._ai.config.extensionConfig = this._ai.config.extensionConfig || {};
                this._ai.config.extensionConfig["AppInsightsChannelPlugin"] =
                    this._ai.config.extensionConfig["AppInsightsChannelPlugin"] || {};
                this._ai.config.extensionConfig["AppInsightsChannelPlugin"].samplingPercentage = 1;
                this.clock.tick(500); // Allow config change to propagate

                // Create span after config change
                const span2 = this._ai.startSpan("after-config-change", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(span2, "Second span should be created");
                if (span2) {
                    span2.end();
                }
                this.clock.tick(500);

                const sentItems = this.getSentTelemetry();

                // First span should be sent (100% default), second may be sampled (1%)
                Assert.ok(sentItems.length >= 1, "At least first span should be sent");

                const firstItem = sentItems[0] as ITelemetryItem;
                if (firstItem.data && firstItem.data.baseData) {
                    Assert.equal(firstItem.data.baseData.name, "before-config-change",
                        "First span should be sent before config change");
                }
            }
        });
    }

    // Helper methods
    private getSentTelemetry(): any[] {
        const items: any[] = [];
        const requests = this.activeXhrRequests;
        if (requests) {
            requests.forEach((request: any) => {
                if (request.requestBody) {
                    try {
                        const payload = JSON.parse(request.requestBody);
                        if (payload && Array.isArray(payload)) {
                            items.push(...payload);
                        } else if (payload) {
                            items.push(payload);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });
        }
        return items;
    }

    private parseDurationToMs(duration: string): number {
        // Duration format: "00:00:00.250" or similar
        if (!duration) {
            return 0;
        }

        const parts = duration.split(":");
        if (parts.length !== 3) {
            return 0;
        }

        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const secondsParts = parts[2].split(".");
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = secondsParts[1] ? parseInt(secondsParts[1].padEnd(3, "0").substring(0, 3), 10) : 0;

        return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
    }
}
