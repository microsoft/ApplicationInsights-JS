import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import { eOTelSpanKind, ITelemetryItem, suppressTracing, unsuppressTracing, isTracingSuppressed } from "@microsoft/applicationinsights-core-js";


function _createAndInitializeSDK(connectionString: string): ApplicationInsights {
    let newInst = new ApplicationInsights({
        config: {
            connectionString: connectionString,
            disableAjaxTracking: false,
            disableXhr: false,
            maxBatchInterval: 0,
            disableExceptionTracking: false
        }
    });

    // Initialize the SDK
    newInst.loadAppInsights();

    return newInst
}

export class TraceSuppressionTests extends AITestClass {
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${TraceSuppressionTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    
    // Track calls to track for validation
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "TraceSuppressionTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];
            this._ai = _createAndInitializeSDK(TraceSuppressionTests._connectionString);

            // Hook core.track to capture calls
            const originalTrack = this._ai.core.track;
            this._ai.core.track = (item: ITelemetryItem) => {
                this._trackCalls.push(item);
                return originalTrack.call(this._ai.core, item);
            };

        } catch (e) {
            console.error("Failed to initialize TraceSuppressionTests: " + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addTests();
    }

    private addTests(): void {

        this.testCase({
            name: "TraceSuppression: new SDK instance should have tracing enabled by default and state should not leak between instances",
            test: () => {
                // Step 1: Verify first instance has tracing enabled by default
                Assert.ok(!isTracingSuppressed(this._ai.core), "Instance 1: Tracing should NOT be suppressed in new instance");
                Assert.ok(!isTracingSuppressed(this._ai.core.config), "Instance 1: Tracing should NOT be suppressed on config");
                Assert.ok(!isTracingSuppressed(this._ai.otelApi), "Instance 1: Tracing should NOT be suppressed on otelApi");
                
                // Verify that spans can record by default
                const span1 = this._ai.startSpan("default-span");
                Assert.ok(span1, "Instance 1: Span should be created");
                Assert.ok(span1!.isRecording(), "Instance 1: Span should be recording by default");
                span1!.end();
                Assert.equal(this._trackCalls.length, 1, "Instance 1: Telemetry should be tracked by default");

                // Step 2: Suppress tracing on this instance
                suppressTracing(this._ai.core);
                Assert.ok(isTracingSuppressed(this._ai.core), "Instance 1: Tracing should be suppressed after suppressTracing()");
                
                // Verify suppression works - span still reports isRecording()=true but doesn't send telemetry
                const span2 = this._ai.startSpan("suppressed-span");
                Assert.ok(!span2!.isRecording(), "Instance 2: Span reports isRecording()=false when suppressed");
                span2!.end();
                Assert.equal(this._trackCalls.length, 1, "Instance 1: No additional telemetry when suppressed");

                // Step 3: Clean up first instance and create a new instance
                this._ai.unload(false);
                
                this._ai = _createAndInitializeSDK(TraceSuppressionTests._connectionString);
                // Hook core.track to capture calls
                const originalTrack = this._ai.core.track;
                this._ai.core.track = (item: ITelemetryItem) => {
                    this._trackCalls.push(item);
                    return originalTrack.call(this._ai.core, item);
                };

                // Step 4: Verify new instance has tracing enabled by default (not inheriting suppressed state)
                Assert.ok(!isTracingSuppressed(this._ai.core), "Instance 2: Tracing should NOT be suppressed in new instance");
                Assert.ok(!isTracingSuppressed(this._ai.core.config), "Instance 2: Tracing should NOT be suppressed on config");
                Assert.ok(!isTracingSuppressed(this._ai.otelApi), "Instance 2: Tracing should NOT be suppressed on otelApi");
                
                // Verify that spans can record in the new instance
                const span3 = this._ai.startSpan("new-instance-span");
                Assert.ok(span3, "Instance 2: Span should be created");
                Assert.ok(span3!.isRecording(), "Instance 2: Span should be recording by default (state should not leak)");
                span3!.end();
                Assert.equal(this._trackCalls.length, 2, "Instance 2: Telemetry should be tracked in new instance");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppressTracing should be available as exported function",
            test: () => {
                // Verify that suppressTracing functions are available as imports
                Assert.ok(typeof suppressTracing === "function", "suppressTracing should be available as exported function");
                Assert.ok(typeof unsuppressTracing === "function", "unsuppressTracing should be available as exported function");
                Assert.ok(typeof isTracingSuppressed === "function", "isTracingSuppressed should be available as exported function");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppressTracing on core should prevent span recording",
            test: () => {
                // Arrange
                this._trackCalls = [];
                Assert.ok(!isTracingSuppressed(this._ai.core), "Tracing should not be suppressed initially");

                // Act - suppress tracing
                suppressTracing(this._ai.core);
                Assert.ok(isTracingSuppressed(this._ai.core), "Tracing should be suppressed after calling suppressTracing");

                // Create span while tracing is suppressed
                const span = this._ai.startSpan("suppressed-span", {
                    kind: eOTelSpanKind.INTERNAL,
                    attributes: {
                        "test.suppressed": true
                    }
                });

                // Assert
                Assert.ok(span, "Span should still be created");
                Assert.ok(!span!.isRecording(), "Span reports isRecording()=false");
                
                // End the span - should not generate telemetry
                span!.end();
                
                Assert.equal(this._trackCalls.length, 0, "No telemetry should be tracked when tracing is suppressed");
            }
        });

        this.testCase({
            name: "TraceSuppression: unsuppressTracing should restore span recording",
            test: () => {
                // Arrange
                this._trackCalls = [];
                suppressTracing(this._ai.core);
                Assert.ok(isTracingSuppressed(this._ai.core), "Tracing should be suppressed");

                // Create span while suppressed - still reports isRecording()=true but won't send telemetry
                const suppressedSpan = this._ai.startSpan("suppressed-span");
                Assert.ok(!suppressedSpan!.isRecording(), "Span reports isRecording()=false even when suppressed");
                suppressedSpan!.end();

                // Act - unsuppress tracing
                unsuppressTracing(this._ai.core);
                Assert.ok(!isTracingSuppressed(this._ai.core), "Tracing should not be suppressed after unsuppressTracing");

                // Create new span after unsuppressing
                const recordingSpan = this._ai.startSpan("recording-span", {
                    attributes: {
                        "test.recording": true
                    }
                });

                // Assert
                Assert.ok(recordingSpan, "Span should be created");
                Assert.ok(recordingSpan!.isRecording(), "Span should be recording after unsuppressing");
                
                // End the span - should generate telemetry
                recordingSpan!.end();
                
                Assert.equal(this._trackCalls.length, 1, "Telemetry should be tracked after unsuppressing");
                Assert.equal(this._trackCalls[0].baseData?.name, "recording-span", "Tracked span should have correct name");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppressTracing on config should prevent span recording",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Suppress via config object
                suppressTracing(this._ai.core.config);
                Assert.ok(isTracingSuppressed(this._ai.core.config), "Tracing should be suppressed on config");
                Assert.ok(isTracingSuppressed(this._ai.core), "Tracing should be suppressed on core");

                // Act - create span
                const span = this._ai.startSpan("config-suppressed-span");

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.ok(!span!.isRecording(), "Span reports isRecording()=false");
                span!.end();
                
                Assert.equal(this._trackCalls.length, 0, "No telemetry when suppressed via config");
            }
        });

        this.testCase({
            name: "TraceSuppression: multiple startSpan calls while suppressed should all create non-recording spans",
            test: () => {
                // Arrange
                this._trackCalls = [];
                suppressTracing(this._ai.core);

                // Act - create multiple spans
                const span1 = this._ai.startSpan("span-1");
                const span2 = this._ai.startSpan("span-2", { kind: eOTelSpanKind.CLIENT });
                const span3 = this._ai.startSpan("span-3", { kind: eOTelSpanKind.SERVER });

                // Assert - spans still report isRecording()=true, suppression only affects telemetry output
                Assert.ok(!span1!.isRecording(), "Span 1 reports isRecording()=false");
                Assert.ok(!span2!.isRecording(), "Span 2 reports isRecording()=false");
                Assert.ok(!span3!.isRecording(), "Span 3 reports isRecording()=false");

                // All spans should still be valid and support operations
                span1!.setAttribute("test", "value1");
                span2!.setStatus({ code: 0 });
                span3!.updateName("updated-span-3");

                span1!.end();
                span2!.end();
                span3!.end();

                Assert.equal(this._trackCalls.length, 0, "No telemetry should be generated for any suppressed span");
            }
        });

        this.testCase({
            name: "TraceSuppression: parent-child span hierarchy with suppression",
            test: () => {
                // Arrange
                this._trackCalls = [];
                suppressTracing(this._ai.core);

                // Act - create parent and child spans while suppressed
                const parentSpan = this._ai.startSpan("parent-span", {
                    kind: eOTelSpanKind.SERVER
                });
                Assert.ok(!parentSpan!.isRecording(), "Parent span reports isRecording()=false");

                const childSpan = this._ai.startSpan("child-span", {
                    kind: eOTelSpanKind.INTERNAL
                });
                Assert.ok(!childSpan!.isRecording(), "Child span reports isRecording()=false");

                // Verify parent-child relationship still established
                const childContext = childSpan!.spanContext();
                const parentContext = parentSpan!.spanContext();
                Assert.equal(childContext.traceId, parentContext.traceId, "Child should share traceId with parent");
                Assert.notEqual(childContext.spanId, parentContext.spanId, "Child should have different spanId");

                childSpan!.end();
                parentSpan!.end();

                Assert.equal(this._trackCalls.length, 0, "No telemetry for suppressed hierarchy");
            }
        });

        this.testCase({
            name: "TraceSuppression: toggle suppression during span lifecycle",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Create recording span
                const span1 = this._ai.startSpan("recording-span");
                Assert.ok(span1!.isRecording(), "Span should be recording initially");

                // Suppress tracing mid-lifecycle
                suppressTracing(this._ai.core);

                // Create new span while suppressed
                const span2 = this._ai.startSpan("suppressed-span");
                Assert.ok(!span2!.isRecording(), "Span reports isRecording()=false when suppressed");

                // End both spans
                span1!.end(); // Was recording but tracing has been suppressed before it ends
                span2!.end(); // Was not recording

                // Verify telemetry
                Assert.equal(this._trackCalls.length, 0, "Only the recording span should generate telemetry");

                // Unsuppress and create another span
                unsuppressTracing(this._ai.core);
                const span3 = this._ai.startSpan("restored-span");
                Assert.ok(span3!.isRecording(), "New span should be recording after unsuppressing");
                span3!.end();

                Assert.equal(this._trackCalls.length, 1, "Restored span should generate telemetry");
            }
        });

        this.testCase({
            name: "TraceSuppression: toggle suppression during span lifecycle",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Create recording span
                const span1 = this._ai.startSpan("recording-span");
                Assert.ok(span1!.isRecording(), "Span should be recording initially");

                // Suppress tracing mid-lifecycle
                suppressTracing(this._ai.core);

                // Create new span while suppressed
                const span2 = this._ai.startSpan("suppressed-span");
                Assert.ok(!span2!.isRecording(), "Span reports isRecording()=false when suppressed");

                // Unsuppress and create another span
                unsuppressTracing(this._ai.core);

                // End both spans
                span1!.end(); // Was recording
                span2!.end(); // Was not recording as tracing was suppressed when created

                // Verify telemetry
                Assert.equal(this._trackCalls.length, 1, "Only the recording span should generate telemetry");
                Assert.equal(this._trackCalls[0].baseData?.name, "recording-span", "Recording span telemetry");

                const span3 = this._ai.startSpan("restored-span");
                Assert.ok(span3!.isRecording(), "New span should be recording after unsuppressing");
                span3!.end();

                Assert.equal(this._trackCalls.length, 2, "Restored span should generate telemetry");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppressTracing should affect all span kinds",
            test: () => {
                // Arrange
                this._trackCalls = [];
                suppressTracing(this._ai.core);

                // Act - create spans of all kinds
                const internalSpan = this._ai.startSpan("internal", { kind: eOTelSpanKind.INTERNAL });
                const clientSpan = this._ai.startSpan("client", { kind: eOTelSpanKind.CLIENT });
                const serverSpan = this._ai.startSpan("server", { kind: eOTelSpanKind.SERVER });
                const producerSpan = this._ai.startSpan("producer", { kind: eOTelSpanKind.PRODUCER });
                const consumerSpan = this._ai.startSpan("consumer", { kind: eOTelSpanKind.CONSUMER });

                // Assert - all spans still report isRecording()=true, suppression only prevents telemetry output
                Assert.ok(!internalSpan!.isRecording(), "INTERNAL span reports isRecording()=false");
                Assert.ok(!clientSpan!.isRecording(), "CLIENT span reports isRecording()=false");
                Assert.ok(!serverSpan!.isRecording(), "SERVER span reports isRecording()=false");
                Assert.ok(!producerSpan!.isRecording(), "PRODUCER span reports isRecording()=false");
                Assert.ok(!consumerSpan!.isRecording(), "CONSUMER span reports isRecording()=false");

                // End all spans
                internalSpan!.end();
                clientSpan!.end();
                serverSpan!.end();
                producerSpan!.end();
                consumerSpan!.end();

                Assert.equal(this._trackCalls.length, 0, "No telemetry for any span kind when suppressed");
            }
        });

        this.testCase({
            name: "TraceSuppression: span operations should still work when tracing is suppressed",
            test: () => {
                // Arrange
                suppressTracing(this._ai.core);
                const span = this._ai.startSpan("suppressed-span");
                Assert.ok(!span!.isRecording(), "Span reports isRecording()=false");

                // Act - perform various span operations
                span!.setAttribute("string-attr", "value");
                span!.setAttribute("number-attr", 42);
                span!.setAttribute("boolean-attr", true);
                
                span!.setAttributes({
                    "batch-1": "test1",
                    "batch-2": 123
                });

                span!.setStatus({
                    code: 0,
                    message: "Test status"
                });

                span!.updateName("updated-name");

                span!.recordException(new Error("Test exception"));

                // Assert - operations should not throw
                Assert.ok(true, "All operations completed without throwing");
                
                // Verify span properties
                Assert.equal(span!.name, "updated-name", "Name should be updated");
                Assert.ok(!span!.ended, "Span should not be ended yet");
                
                span!.end();
                Assert.ok(span!.ended, "Span should be ended");
            }
        });

        this.testCase({
            name: "TraceSuppression: isTracingSuppressed should return false when not suppressed",
            test: () => {
                // Ensure no suppression
                unsuppressTracing(this._ai.core);

                // Assert
                Assert.ok(!isTracingSuppressed(this._ai.core), "Should return false when not suppressed");
                Assert.ok(!isTracingSuppressed(this._ai.core.config), "Config should also not be suppressed");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppressTracing should return the same context",
            test: () => {
                // Act
                const returnedCore = suppressTracing(this._ai.core);
                const returnedConfig = suppressTracing(this._ai.core.config);

                // Assert
                Assert.equal(returnedCore, this._ai.core, "suppressTracing should return the same core instance");
                Assert.equal(returnedConfig, this._ai.core.config, "suppressTracing should return the same config instance");
                Assert.ok(isTracingSuppressed(returnedCore), "Returned core should have suppression enabled");
                Assert.ok(isTracingSuppressed(returnedConfig), "Returned config should have suppression enabled");
            }
        });

        this.testCase({
            name: "TraceSuppression: unsuppressTracing should return the same context",
            test: () => {
                // Arrange
                suppressTracing(this._ai.core);

                // Act
                const returnedCore = unsuppressTracing(this._ai.core);
                const returnedConfig = unsuppressTracing(this._ai.core.config);

                // Assert
                Assert.equal(returnedCore, this._ai.core, "unsuppressTracing should return the same core instance");
                Assert.equal(returnedConfig, this._ai.core.config, "unsuppressTracing should return the same config instance");
                Assert.ok(!isTracingSuppressed(returnedCore), "Returned core should have suppression disabled");
                Assert.ok(!isTracingSuppressed(returnedConfig), "Returned config should have suppression disabled");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppression state should persist across multiple checks",
            test: () => {
                // Initial state
                Assert.ok(!isTracingSuppressed(this._ai.core), "Initially not suppressed");

                // Suppress
                suppressTracing(this._ai.core);
                Assert.ok(isTracingSuppressed(this._ai.core), "Should be suppressed - check 1");
                Assert.ok(isTracingSuppressed(this._ai.core), "Should be suppressed - check 2");
                Assert.ok(isTracingSuppressed(this._ai.core), "Should be suppressed - check 3");

                // Unsuppress
                unsuppressTracing(this._ai.core);
                Assert.ok(!isTracingSuppressed(this._ai.core), "Should not be suppressed - check 1");
                Assert.ok(!isTracingSuppressed(this._ai.core), "Should not be suppressed - check 2");
                Assert.ok(!isTracingSuppressed(this._ai.core), "Should not be suppressed - check 3");
            }
        });

        this.testCase({
            name: "TraceSuppression: span attributes should be preserved when tracing is suppressed",
            test: () => {
                // Arrange
                this._trackCalls = [];
                suppressTracing(this._ai.core);

                // Act - create span with attributes
                const span = this._ai.startSpan("suppressed-with-attrs", {
                    attributes: {
                        "initial.attr1": "value1",
                        "initial.attr2": 100
                    }
                });

                Assert.ok(!span!.isRecording(), "Span reports isRecording()=false");

                // Add more attributes
                span!.setAttribute("runtime.attr", "added-later");

                // Assert - attributes should still be accessible
                const attributes = (span as any).attributes || {};
                Assert.ok(attributes["initial.attr1"] === undefined || attributes["runtime.attr"] === undefined,
                    "Attributes should not be stored as span was not recording");

                span!.end();
                Assert.equal(this._trackCalls.length, 0, "No telemetry should be generated");
            }
        });

        this.testCase({
            name: "TraceSuppression: span context should be valid when tracing is suppressed",
            test: () => {
                // Arrange
                suppressTracing(this._ai.core);

                // Act
                const span = this._ai.startSpan("suppressed-context-test");
                Assert.ok(!span!.isRecording(), "Span reports isRecording()=false");

                // Assert - span context should be valid
                const spanContext = span!.spanContext();
                Assert.ok(spanContext, "Span context should exist");
                Assert.ok(spanContext.traceId, "Trace ID should exist");
                Assert.ok(spanContext.spanId, "Span ID should exist");
                Assert.equal(spanContext.traceId.length, 32, "Trace ID should be 32 hex characters");
                Assert.equal(spanContext.spanId.length, 16, "Span ID should be 16 hex characters");

                span!.end();
            }
        });

        this.testCase({
            name: "TraceSuppression: rapid suppression toggling should work correctly",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Act - rapidly toggle suppression
                for (let i = 0; i < 5; i++) {
                    suppressTracing(this._ai.core);
                    Assert.ok(isTracingSuppressed(this._ai.core), `Should be suppressed on iteration ${i}`);
                    
                    unsuppressTracing(this._ai.core);
                    Assert.ok(!isTracingSuppressed(this._ai.core), `Should not be suppressed on iteration ${i}`);
                }

                // Final state check
                Assert.ok(!isTracingSuppressed(this._ai.core), "Should end in unsuppressed state");

                // Create a recording span
                const span = this._ai.startSpan("final-span");
                Assert.ok(span!.isRecording(), "Span should be recording after toggles");
                span!.end();

                Assert.equal(this._trackCalls.length, 1, "Telemetry should be tracked");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppression should work with explicit parent context",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Create a recording parent span first
                const parentSpan = this._ai.startSpan("parent-recording");
                Assert.ok(parentSpan!.isRecording(), "Parent should be recording");
                const parentContext = this._ai.getTraceCtx();

                // Suppress tracing
                suppressTracing(this._ai.core);

                // Act - create child with explicit parent while suppressed
                const childSpan = this._ai.startSpan("child-suppressed", {
                    kind: eOTelSpanKind.INTERNAL
                }, parentContext);

                // Assert
                Assert.ok(!childSpan!.isRecording(), "Child span reports isRecording()=false when suppressed");
                
                const childContext = childSpan!.spanContext();
                Assert.equal(childContext.traceId, parentContext!.traceId, "Child should have same traceId as parent");

                unsuppressTracing(this._ai.core);

                childSpan!.end();
                parentSpan!.end();

                // Only parent should generate telemetry
                Assert.equal(this._trackCalls.length, 1, "Only parent span should generate telemetry");
                Assert.equal(this._trackCalls[0].baseData?.name, "parent-recording", "Parent span telemetry");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppression should work even with  parent context",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Create a recording parent span first
                const parentSpan = this._ai.startSpan("parent-recording");
                Assert.ok(parentSpan!.isRecording(), "Parent should be recording");
                const parentContext = this._ai.getTraceCtx();

                // Suppress tracing
                suppressTracing(this._ai.core);

                // Act - create child with explicit parent while suppressed
                const childSpan = this._ai.startSpan("child-suppressed", {
                    kind: eOTelSpanKind.INTERNAL
                }, parentContext);

                // Assert
                Assert.ok(!childSpan!.isRecording(), "Child span reports isRecording()=false when suppressed");
                
                const childContext = childSpan!.spanContext();
                Assert.equal(childContext.traceId, parentContext!.traceId, "Child should have same traceId as parent");

                childSpan!.end();
                parentSpan!.end();

                // Only parent should generate telemetry
                Assert.equal(this._trackCalls.length, 0, "Parent span should not generate telemetry either as suppression is active");
            }
        });

        this.testCase({
            name: "TraceSuppression: isTracingSuppressed should handle null/undefined gracefully",
            test: () => {
                // Act & Assert - should not throw
                let result1: boolean;
                let result2: boolean;
                
                try {
                    result1 = isTracingSuppressed(null as any);
                    result2 = isTracingSuppressed(undefined as any);
                    Assert.ok(true, "isTracingSuppressed should handle null/undefined without throwing");
                    Assert.ok(!result1, "Should return false for null");
                    Assert.ok(!result2, "Should return false for undefined");
                } catch (e) {
                    Assert.ok(false, "isTracingSuppressed should not throw for null/undefined");
                }
            }
        });

        this.testCase({
            name: "TraceSuppression: suppressTracing with startSpan integration test",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Test 1: Normal recording
                const span1 = this._ai.startSpan("normal-1");
                Assert.ok(span1!.isRecording(), "Span 1 should be recording");
                span1!.end();
                Assert.equal(this._trackCalls.length, 1, "Should have 1 telemetry item");

                // Test 2: Suppress and verify spans still report isRecording()=true but don't send telemetry
                suppressTracing(this._ai.core);
                const span2 = this._ai.startSpan("suppressed-1");
                const span3 = this._ai.startSpan("suppressed-2");
                Assert.ok(!span2!.isRecording(), "Span 2 reports isRecording()=false when suppressed");
                Assert.ok(!span3!.isRecording(), "Span 3 reports isRecording()=false when suppressed");
                span2!.end();
                span3!.end();
                Assert.equal(this._trackCalls.length, 1, "Should still have only 1 telemetry item");

                // Test 3: Unsuppress and verify startSpan creates recording spans again
                unsuppressTracing(this._ai.core);
                const span4 = this._ai.startSpan("normal-2");
                Assert.ok(span4!.isRecording(), "Span 4 should be recording");
                span4!.end();
                Assert.equal(this._trackCalls.length, 2, "Should have 2 telemetry items");

                // Verify telemetry content
                Assert.equal(this._trackCalls[0].baseData?.name, "normal-1", "First telemetry is from span1");
                Assert.equal(this._trackCalls[1].baseData?.name, "normal-2", "Second telemetry is from span4");
            }
        });

        this.testCase({
            name: "TraceSuppression: suppression with nested spans",
            test: () => {
                // Arrange
                this._trackCalls = [];
                suppressTracing(this._ai.core);

                // Create and set active span manually
                const span1 = this._ai.startSpan("outer-span");
                Assert.ok(!span1!.isRecording(), "Outer span reports isRecording()=false");
                
                // Simulate nested operation
                const span2 = this._ai.startSpan("inner-span");
                Assert.ok(!span2!.isRecording(), "Inner span reports isRecording()=false");
                span2!.end();
                span1!.end();

                Assert.equal(this._trackCalls.length, 0, "No telemetry for suppressed nested spans");
            }
        });
    }
}
