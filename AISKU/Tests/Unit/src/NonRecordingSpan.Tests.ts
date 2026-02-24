import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import { eOTelSpanKind, eOTelSpanStatusCode, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

/**
 * Comprehensive tests for non-recording span behavior
 * 
 * Non-recording spans are used for:
 * - Context propagation without telemetry overhead
 * - Testing and debugging scenarios
 * - Wrapping external span contexts
 * - Performance-sensitive scenarios
 */
export class NonRecordingSpanTests extends AITestClass {
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${NonRecordingSpanTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "NonRecordingSpanTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: NonRecordingSpanTests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    maxBatchInterval: 0,
                    disableExceptionTracking: false
                }
            });

            this._ai.loadAppInsights();

            // Hook core.track to capture calls
            const originalTrack = this._ai.core.track;
            this._ai.core.track = (item: ITelemetryItem) => {
                this._trackCalls.push(item);
                return originalTrack.call(this._ai.core, item);
            };
        } catch (e) {
            console.error("Failed to initialize tests: " + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addBasicNonRecordingTests();
        this.addAttributeOperationTests();
        this.addStatusAndNameTests();
        this.addSpanKindTests();
        this.addHierarchyTests();
        this.addTelemetryGenerationTests();
        this.addPerformanceTests();
        this.addEdgeCaseTests();
    }

    private addBasicNonRecordingTests(): void {
        this.testCase({
            name: "NonRecording: span created with recording:false is not recording",
            test: () => {
                // Act
                const span = this._ai.startSpan("non-recording-basic", { recording: false });

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.ok(!span.isRecording(), "Span should not be recording");
                Assert.equal(span.name, "non-recording-basic", "Span name should be set");
            }
        });

        this.testCase({
            name: "NonRecording: default recording:true creates recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("recording-default");

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.ok(span.isRecording(), "Span should be recording by default");
            }
        });

        this.testCase({
            name: "NonRecording: explicit recording:true creates recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("recording-explicit", { recording: true });

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.ok(span.isRecording(), "Span should be recording");
            }
        });

        this.testCase({
            name: "NonRecording: isRecording() returns false throughout lifecycle",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-lifecycle", { recording: false });

                // Act & Assert - Before operations
                Assert.ok(!span.isRecording(), "Should not be recording initially");

                // Perform operations
                span!.setAttribute("key", "value");
                Assert.ok(!span.isRecording(), "Should not be recording after setAttribute");

                span!.setStatus({ code: eOTelSpanStatusCode.OK });
                Assert.ok(!span.isRecording(), "Should not be recording after setStatus");

                span!.updateName("new-name");
                Assert.ok(!span.isRecording(), "Should not be recording after updateName");

                span!.end();
                Assert.ok(!span.isRecording(), "Should not be recording after end");
            }
        });
    }

    private addAttributeOperationTests(): void {
        this.testCase({
            name: "NonRecording: setAttribute does not store attributes",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-attrs", { recording: false });

                // Act
                span!.setAttribute("key1", "value1");
                span!.setAttribute("key2", 123);
                span!.setAttribute("key3", true);

                // Assert
                const attrs = span!.attributes;
                Assert.ok(attrs, "Attributes object should exist");
                // Non-recording spans don't store attributes
                Assert.equal(Object.keys(attrs).length, 0, "No attributes should be stored");
            }
        });

        this.testCase({
            name: "NonRecording: setAttributes does not store attributes",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-set-attrs", { recording: false });

                // Act
                span!.setAttributes({
                    "attr1": "value1",
                    "attr2": 456,
                    "attr3": false,
                    "attr4": [1, 2, 3]
                });

                // Assert
                const attrs = span!.attributes;
                Assert.equal(Object.keys(attrs).length, 0, "No attributes should be stored");
            }
        });

        this.testCase({
            name: "NonRecording: setAttribute returns span for chaining",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-chain", { recording: false });

                // Act
                const result = span!.setAttribute("key", "value");

                // Assert
                Assert.equal(result, span, "setAttribute should return the span for chaining");
            }
        });

        this.testCase({
            name: "NonRecording: setAttributes returns span for chaining",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-chain-multi", { recording: false });

                // Act
                const result = span!.setAttributes({ "key1": "value1", "key2": "value2" });

                // Assert
                Assert.equal(result, span, "setAttributes should return the span for chaining");
            }
        });

        this.testCase({
            name: "NonRecording: multiple setAttribute calls increment dropped count",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-dropped", { recording: false });

                // Act
                span!.setAttribute("key1", "value1");
                span!.setAttribute("key2", "value2");
                span!.setAttribute("key3", "value3");
                span!.setAttributes({ "key4": "value4", "key5": "value5" });

                // Assert
                const droppedCount = span!.droppedAttributesCount;
                Assert.ok(droppedCount >= 5, `At least 5 attributes should be dropped, got ${droppedCount}`);
            }
        });

        this.testCase({
            name: "NonRecording: setAttribute after end() increments dropped count",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-after-end", { recording: false });
                span!.end();

                // Act
                span!.setAttribute("late-key", "late-value");

                // Assert - Should not throw, just increment dropped count
                Assert.ok(span.ended, "Span should be ended");
                Assert.ok(span.droppedAttributesCount > 0, "Dropped attribute count should be incremented");
            }
        });
    }

    private addStatusAndNameTests(): void {
        this.testCase({
            name: "NonRecording: setStatus changes status even when not recording",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-status", { recording: false });

                // Act
                span!.setStatus({ code: eOTelSpanStatusCode.ERROR, message: "Test error" });

                // Assert
                Assert.equal(span.status.code, eOTelSpanStatusCode.ERROR, "Status code should be set");
                Assert.equal(span.status.message, "Test error", "Status message should be set");
            }
        });

        this.testCase({
            name: "NonRecording: setStatus returns span for chaining",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("non-recording-status-chain", { recording: false });

                // Act
                const result = span!.setStatus({ code: eOTelSpanStatusCode.OK });

                // Assert
                Assert.equal(result, span, "setStatus should return the span for chaining");
            }
        });

        this.testCase({
            name: "NonRecording: updateName changes name even when not recording",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("original-name", { recording: false });

                // Act
                span!.updateName("updated-name");

                // Assert
                Assert.equal(span.name, "updated-name", "Name should be updated");
            }
        });

        this.testCase({
            name: "NonRecording: updateName returns span for chaining",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("chain-name", { recording: false });

                // Act
                const result = span!.updateName("new-chain-name");

                // Assert
                Assert.equal(result, span, "updateName should return the span for chaining");
            }
        });

        this.testCase({
            name: "NonRecording: chained operations work correctly",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("chaining-test", { recording: false });

                // Act
                const result = span
                    .setAttribute("key1", "value1")
                    .setAttributes({ "key2": "value2" })
                    .setStatus({ code: eOTelSpanStatusCode.OK })
                    .updateName("chained-name");

                // Assert
                Assert.equal(result, span, "All operations should return the span");
                Assert.equal(span.name, "chained-name", "Name should be updated");
                Assert.equal(span.status.code, eOTelSpanStatusCode.OK, "Status should be set");
            }
        });
    }

    private addSpanKindTests(): void {
        this.testCase({
            name: "NonRecording: CLIENT kind non-recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("client-non-recording", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: false
                });

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.equal(span.kind, eOTelSpanKind.CLIENT, "Kind should be CLIENT");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: SERVER kind non-recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("server-non-recording", {
                    kind: eOTelSpanKind.SERVER,
                    recording: false
                });

                // Assert
                Assert.equal(span.kind, eOTelSpanKind.SERVER, "Kind should be SERVER");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: INTERNAL kind non-recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("internal-non-recording", {
                    kind: eOTelSpanKind.INTERNAL,
                    recording: false
                });

                // Assert
                Assert.equal(span.kind, eOTelSpanKind.INTERNAL, "Kind should be INTERNAL");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: PRODUCER kind non-recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("producer-non-recording", {
                    kind: eOTelSpanKind.PRODUCER,
                    recording: false
                });

                // Assert
                Assert.equal(span.kind, eOTelSpanKind.PRODUCER, "Kind should be PRODUCER");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: CONSUMER kind non-recording span",
            test: () => {
                // Act
                const span = this._ai.startSpan("consumer-non-recording", {
                    kind: eOTelSpanKind.CONSUMER,
                    recording: false
                });

                // Assert
                Assert.equal(span.kind, eOTelSpanKind.CONSUMER, "Kind should be CONSUMER");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });
    }

    private addHierarchyTests(): void {
        this.testCase({
            name: "NonRecording: parent recording, child non-recording",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("recording-parent", { 
                    kind: eOTelSpanKind.SERVER,
                    recording: true 
                });
                const parentContext = parentSpan!.spanContext();

                // Act
                const childSpan = this._ai.startSpan("non-recording-child", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: false
                }, parentContext);

                // Assert
                Assert.ok(parentSpan!.isRecording(), "Parent should be recording");
                Assert.ok(!childSpan.isRecording(), "Child should not be recording");
                Assert.equal(childSpan!.spanContext().traceId, parentContext.traceId, 
                    "Child should share parent's trace ID");
            }
        });

        this.testCase({
            name: "NonRecording: parent non-recording, child recording",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("non-recording-parent", { 
                    kind: eOTelSpanKind.SERVER,
                    recording: false 
                });
                const parentContext = parentSpan!.spanContext();

                // Act
                const childSpan = this._ai.startSpan("recording-child", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: true
                }, parentContext);

                // Assert
                Assert.ok(!parentSpan.isRecording(), "Parent should not be recording");
                Assert.ok(childSpan!.isRecording(), "Child should be recording");
                Assert.equal(childSpan!.spanContext().traceId, parentContext.traceId, 
                    "Child should share parent's trace ID");
            }
        });

        this.testCase({
            name: "NonRecording: both parent and child non-recording",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("non-recording-parent-2", { 
                    recording: false 
                });
                const parentContext = parentSpan!.spanContext();

                // Act
                const childSpan = this._ai.startSpan("non-recording-child-2", {
                    recording: false
                }, parentContext);

                // Assert
                Assert.ok(!parentSpan.isRecording(), "Parent should not be recording");
                Assert.ok(!childSpan.isRecording(), "Child should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: multi-level hierarchy with mixed recording",
            test: () => {
                // Arrange
                const level1 = this._ai.startSpan("level1-recording", { recording: true });
                const level1Context = level1!.spanContext();

                const level2 = this._ai.startSpan("level2-non-recording", {
                    recording: false
                }, level1Context);
                const level2Context = level2!.spanContext();

                const level3 = this._ai.startSpan("level3-recording", {
                    recording: true
                }, level2Context);

                // Assert
                Assert.ok(level1!.isRecording(), "Level 1 should be recording");
                Assert.ok(!level2.isRecording(), "Level 2 should not be recording");
                Assert.ok(level3!.isRecording(), "Level 3 should be recording");

                // All should share the same trace ID
                Assert.equal(level2!.spanContext().traceId, level1Context.traceId, 
                    "Level 2 should share trace ID");
                Assert.equal(level3!.spanContext().traceId, level1Context.traceId, 
                    "Level 3 should share trace ID");
            }
        });
    }

    private addTelemetryGenerationTests(): void {
        this.testCase({
            name: "NonRecording: no telemetry generated on end()",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Act
                const span = this._ai.startSpan("non-recording-no-telemetry", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: false
                });
                span!.setAttribute("should-not-appear", "in-telemetry");
                span!.setStatus({ code: eOTelSpanStatusCode.OK });
                span!.end();

                // Assert
                const telemetryItem = this._trackCalls.find(
                    item => item.baseData?.name === "non-recording-no-telemetry"
                );
                Assert.ok(!telemetryItem, "Non-recording span should not generate telemetry");
            }
        });

        this.testCase({
            name: "NonRecording: recording span generates telemetry, non-recording does not",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Act
                const recordingSpan = this._ai.startSpan("recording-generates", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: true
                });
                recordingSpan.end();

                const nonRecordingSpan = this._ai.startSpan("non-recording-silent", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: false
                });
                nonRecordingSpan.end();

                // Assert
                const recordingTelemetry = this._trackCalls.find(
                    item => item.baseData?.name === "recording-generates"
                );
                const nonRecordingTelemetry = this._trackCalls.find(
                    item => item.baseData?.name === "non-recording-silent"
                );

                Assert.ok(recordingTelemetry, "Recording span should generate telemetry");
                Assert.ok(!nonRecordingTelemetry, "Non-recording span should not generate telemetry");
            }
        });

        this.testCase({
            name: "NonRecording: parent recording generates telemetry, child non-recording does not",
            test: () => {
                // Arrange
                this._trackCalls = [];

                // Act
                const parent = this._ai.startSpan("parent-with-telemetry", {
                    kind: eOTelSpanKind.SERVER,
                    recording: true
                });
                const parentContext = parent.spanContext();

                const child = this._ai.startSpan("child-without-telemetry", {
                    kind: eOTelSpanKind.CLIENT,
                    recording: false
                }, parentContext);

                child.end();
                parent.end();

                // Assert
                const parentTelemetry = this._trackCalls.find(
                    item => item.baseData?.name === "parent-with-telemetry"
                );
                const childTelemetry = this._trackCalls.find(
                    item => item.baseData?.name === "child-without-telemetry"
                );

                Assert.ok(parentTelemetry, "Parent recording span should generate telemetry");
                Assert.ok(!childTelemetry, "Child non-recording span should not generate telemetry");
            }
        });
    }

    private addPerformanceTests(): void {
        this.testCase({
            name: "NonRecording: multiple non-recording spans minimal overhead",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const spanCount = 100;

                // Act
                const startTime = Date.now();
                for (let i = 0; i < spanCount; i++) {
                    const span = this._ai.startSpan(`non-recording-perf-${i}`, {
                        recording: false
                    });
                    span!.setAttribute("iteration", i);
                    span!.setStatus({ code: eOTelSpanStatusCode.OK });
                    span!.end();
                }
                const elapsed = Date.now() - startTime;

                // Assert
                Assert.ok(elapsed < 1000, `Creating ${spanCount} non-recording spans should be fast, took ${elapsed}ms`);
                Assert.equal(this._trackCalls.length, 0, "No telemetry should be generated for non-recording spans");
            }
        });

        this.testCase({
            name: "NonRecording: attribute operations are fast on non-recording spans",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("perf-attrs", { recording: false });
                const attrCount = 1000;

                // Act
                const startTime = Date.now();
                for (let i = 0; i < attrCount; i++) {
                    span!.setAttribute(`key${i}`, `value${i}`);
                }
                const elapsed = Date.now() - startTime;

                // Assert
                Assert.ok(elapsed < 500, `Setting ${attrCount} attributes should be fast, took ${elapsed}ms`);
                Assert.equal(Object.keys(span.attributes).length, 0, "Attributes should not be stored");
            }
        });
    }

    private addEdgeCaseTests(): void {
        this.testCase({
            name: "NonRecording: end() can be called multiple times safely",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("multi-end", { recording: false });

                // Act & Assert - Should not throw
                span!.end();
                Assert.ok(span.ended, "Span should be ended");

                span!.end();
                Assert.ok(span.ended, "Span should still be ended");

                span!.end();
                Assert.ok(span.ended, "Span should still be ended");
            }
        });

        this.testCase({
            name: "NonRecording: operations after end() do not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ops-after-end", { recording: false });
                span!.end();

                // Act & Assert - Should not throw
                span!.setAttribute("late-attr", "value");
                span!.setAttributes({ "late-attrs": "values" });
                span!.setStatus({ code: eOTelSpanStatusCode.ERROR });
                span!.updateName("late-name");
                
                Assert.ok(span.ended, "Span should remain ended");
            }
        });

        this.testCase({
            name: "NonRecording: null and undefined attribute values handled",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-attrs", { recording: false });

                // Act & Assert - Should not throw
                span!.setAttribute("null-value", null as any);
                span!.setAttribute("undefined-value", undefined as any);
                span!.setAttributes({
                    "null-in-set": null as any,
                    "undefined-in-set": undefined as any
                });

                Assert.ok(!span.isRecording(), "Span should still be non-recording");
            }
        });

        this.testCase({
            name: "NonRecording: empty string name allowed",
            test: () => {
                // Act
                const span = this._ai.startSpan("", { recording: false });

                // Assert
                Assert.ok(span, "Span with empty name should be created");
                Assert.equal(span.name, "", "Name should be empty string");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: special characters in span name",
            test: () => {
                // Arrange
                const specialNames = [
                    "span/with/slashes",
                    "span:with:colons",
                    "span-with-dashes",
                    "span.with.dots",
                    "span with spaces",
                    "span\twith\ttabs",
                    "span(with)parens",
                    "span[with]brackets",
                    "span{with}braces"
                ];

                // Act & Assert
                specialNames.forEach(name => {
                    const span = this._ai.startSpan(name, { recording: false });
                    Assert.ok(span, `Span with name '${name}' should be created`);
                    Assert.equal(span.name, name, "Name should be preserved");
                    Assert.ok(!span.isRecording(), "Should not be recording");
                });
            }
        });

        this.testCase({
            name: "NonRecording: very long span name handled",
            test: () => {
                // Arrange
                const longName = "a".repeat(10000);

                // Act
                const span = this._ai.startSpan(longName, { recording: false });

                // Assert
                Assert.ok(span, "Span with very long name should be created");
                Assert.ok(!span.isRecording(), "Should not be recording");
            }
        });

        this.testCase({
            name: "NonRecording: spanContext() returns valid context",
            test: () => {
                // Act
                const span = this._ai.startSpan("context-check", { recording: false });
                const context = span!.spanContext();

                // Assert
                Assert.ok(context, "Context should exist");
                Assert.ok(context.traceId, "Trace ID should exist");
                Assert.ok(context.spanId, "Span ID should exist");
                Assert.ok(context.traceId.length === 32, "Trace ID should be 32 characters");
                Assert.ok(context.spanId.length === 16, "Span ID should be 16 characters");
            }
        });

        this.testCase({
            name: "NonRecording: status object immutability",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("status-immutable", { recording: false });
                span!.setStatus({ code: eOTelSpanStatusCode.OK, message: "Initial" });

                // Act
                const status1 = span!.status;
                span!.setStatus({ code: eOTelSpanStatusCode.ERROR, message: "Changed" });
                const status2 = span!.status;

                // Assert
                Assert.equal(status1.code, eOTelSpanStatusCode.OK, "First status should be OK");
                Assert.equal(status2.code, eOTelSpanStatusCode.ERROR, "Second status should be ERROR");
            }
        });
    }
}
