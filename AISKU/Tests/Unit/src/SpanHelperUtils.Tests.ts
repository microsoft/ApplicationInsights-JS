import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import {
    createDistributedTraceContext,
    eOTelSpanKind,
    eOTelSpanStatusCode,
    IDistributedTraceInit,
    isReadableSpan,
    isSpanContextValid,
    ITelemetryItem,
    wrapSpanContext
} from "@microsoft/applicationinsights-core-js";

/**
 * Comprehensive tests for span helper utility functions
 * 
 * Tests verify:
 * - isSpanContextValid: validates span context
 * - wrapSpanContext: wraps external span contexts
 * - isReadableSpan: type guard for spans
 * - createNonRecordingSpan: creates non-recording spans (tested via wrapSpanContext)
 */
export class SpanHelperUtilsTests extends AITestClass {
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${SpanHelperUtilsTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "SpanHelperUtilsTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: SpanHelperUtilsTests._connectionString,
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
        this.addIsSpanContextValidTests();
        this.addWrapSpanContextTests();
        this.addIsReadableSpanTests();
        this.addHelperIntegrationTests();
    }

    private addIsSpanContextValidTests(): void {
        this.testCase({
            name: "isSpanContextValid: valid span context returns true",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("test-span");
                const spanContext = span?.spanContext();

                // Act
                const isValid = isSpanContextValid(spanContext!);

                // Assert
                Assert.ok(isValid, "Valid span context should return true");
                span?.end();
            }
        });

        this.testCase({
            name: "isSpanContextValid: valid traceId and spanId returns true",
            test: () => {
                // Arrange - create valid context
                const validContext = createDistributedTraceContext({
                    traceId: "0123456789abcdef0123456789abcdef", // 32 hex chars
                    spanId: "0123456789abcdef", // 16 hex chars
                    traceFlags: 1
                });

                // Act
                const isValid = isSpanContextValid(validContext);

                // Assert
                Assert.ok(isValid, "Context with valid IDs should return true");
            }
        });

        this.testCase({
            name: "isSpanContextValid: invalid traceId returns false",
            test: () => {
                // Arrange - traceId too short (use IDistributedTraceInit directly, not createDistributedTraceContext which validates)
                const invalidContext: IDistributedTraceInit = {
                    traceId: "0123456789abcdef", // Only 16 chars (should be 32)
                    spanId: "0123456789abcdef",
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "Context with invalid traceId should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: invalid spanId returns false",
            test: () => {
                // Arrange - spanId too short (use IDistributedTraceInit directly, not createDistributedTraceContext which validates)
                const invalidContext: IDistributedTraceInit = {
                    traceId: "0123456789abcdef0123456789abcdef",
                    spanId: "01234567", // Only 8 chars (should be 16)
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "Context with invalid spanId should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: all zeros traceId returns false",
            test: () => {
                // Arrange - all zeros is invalid per spec (use IDistributedTraceInit directly, not createDistributedTraceContext which validates)
                const invalidContext: IDistributedTraceInit = {
                    traceId: "00000000000000000000000000000000",
                    spanId: "0123456789abcdef",
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "Context with all-zero traceId should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: all zeros spanId returns false",
            test: () => {
                // Arrange - all zeros is invalid per spec (use IDistributedTraceInit directly, not createDistributedTraceContext which validates)
                const invalidContext: IDistributedTraceInit = {
                    traceId: "0123456789abcdef0123456789abcdef",
                    spanId: "0000000000000000",
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "Context with all-zero spanId should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: null context returns false",
            test: () => {
                // Act
                const isValid = isSpanContextValid(null as any);

                // Assert
                Assert.ok(!isValid, "Null context should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: undefined context returns false",
            test: () => {
                // Act
                const isValid = isSpanContextValid(undefined as any);

                // Assert
                Assert.ok(!isValid, "Undefined context should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: empty traceId returns false",
            test: () => {
                // Arrange - use IDistributedTraceInit directly, not createDistributedTraceContext which validates
                const invalidContext: IDistributedTraceInit = {
                    traceId: "",
                    spanId: "0123456789abcdef",
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "Empty traceId should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: empty spanId returns false",
            test: () => {
                // Arrange - use IDistributedTraceInit directly, not createDistributedTraceContext which validates
                const invalidContext: IDistributedTraceInit = {
                    traceId: "0123456789abcdef0123456789abcdef",
                    spanId: "",
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "Empty spanId should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: non-hex characters in traceId returns false",
            test: () => {
                // Arrange - use IDistributedTraceInit directly, not createDistributedTraceContext which validates
                const invalidContext: IDistributedTraceInit = {
                    traceId: "0123456789abcdefghij456789abcdef", // Contains g-j
                    spanId: "0123456789abcdef",
                    traceFlags: 1
                };

                // Act
                const isValid = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!isValid, "TraceId with non-hex chars should return false");
            }
        });

        this.testCase({
            name: "isSpanContextValid: uppercase hex characters are valid",
            test: () => {
                // Arrange
                const validContext = createDistributedTraceContext({
                    traceId: "0123456789ABCDEF0123456789ABCDEF",
                    spanId: "0123456789ABCDEF",
                    traceFlags: 1
                });

                // Act
                const isValid = isSpanContextValid(validContext);

                // Assert
                Assert.ok(isValid, "Uppercase hex characters should be valid");
            }
        });

        this.testCase({
            name: "isSpanContextValid: mixed case hex characters are valid",
            test: () => {
                // Arrange
                const validContext = createDistributedTraceContext({
                    traceId: "0123456789AbCdEf0123456789AbCdEf",
                    spanId: "0123456789AbCdEf",
                    traceFlags: 1
                });

                // Act
                const isValid = isSpanContextValid(validContext);

                // Assert
                Assert.ok(isValid, "Mixed case hex characters should be valid");
            }
        });
    }

    private addWrapSpanContextTests(): void {
        this.testCase({
            name: "wrapSpanContext: creates non-recording span from context",
            test: () => {
                // Arrange
                const originalSpan = this._ai.startSpan("original-span");
                const spanContext = originalSpan?.spanContext();

                // Act
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext!);

                // Assert
                Assert.ok(wrappedSpan, "Wrapped span should be created");
                Assert.ok(!wrappedSpan.isRecording(), "Wrapped span should not be recording");
                Assert.equal(wrappedSpan.spanContext().traceId, spanContext?.traceId, "TraceId should match");
                Assert.equal(wrappedSpan.spanContext().spanId, spanContext?.spanId, "SpanId should match");

                // Cleanup
                originalSpan?.end();
                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: wrapped span name includes spanId",
            test: () => {
                // Arrange
                const spanContext = createDistributedTraceContext({
                    traceId: "0123456789abcdef0123456789abcdef",
                    spanId: "0123456789abcdef",
                    traceFlags: 1
                });

                // Act
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext);

                // Assert
                Assert.ok(wrappedSpan.name.includes(spanContext.spanId), 
                    "Wrapped span name should include spanId");
                Assert.ok(wrappedSpan.name.includes("wrapped"), 
                    "Wrapped span name should indicate it's wrapped");

                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: wrapped span does not generate telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const spanContext = createDistributedTraceContext({
                    traceId: "abcdef0123456789abcdef0123456789",
                    spanId: "abcdef0123456789",
                    traceFlags: 1
                });

                // Act
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext);
                wrappedSpan.setAttribute("test", "value");
                wrappedSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                wrappedSpan.end();

                // Assert
                Assert.equal(this._trackCalls.length, 0, 
                    "Wrapped span should not generate telemetry");
            }
        });

        this.testCase({
            name: "wrapSpanContext: wrapped span kind is INTERNAL",
            test: () => {
                // Arrange
                const spanContext = createDistributedTraceContext({
                    traceId: "fedcba9876543210fedcba9876543210",
                    spanId: "fedcba9876543210",
                    traceFlags: 1
                });

                // Act
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext);

                // Assert
                Assert.equal(wrappedSpan.kind, eOTelSpanKind.INTERNAL, 
                    "Wrapped span should have INTERNAL kind");

                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: can use wrapped span as parent",
            test: () => {
                // Arrange
                const parentContext = createDistributedTraceContext({
                    traceId: "1234567890abcdef1234567890abcdef",
                    spanId: "1234567890abcdef",
                    traceFlags: 1
                });
                const wrappedParent = wrapSpanContext(this._ai.otelApi, parentContext);

                // Act - create child with wrapped parent
                const childSpan = this._ai.startSpan("child-span", {
                    kind: eOTelSpanKind.CLIENT
                }, wrappedParent.spanContext());

                // Assert
                Assert.ok(childSpan, "Child span should be created");
                Assert.equal(childSpan.spanContext().traceId, parentContext.traceId, 
                    "Child should have same traceId as wrapped parent");

                // Cleanup
                childSpan?.end();
                wrappedParent.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: wrapped span supports all span operations",
            test: () => {
                // Arrange
                const spanContext = createDistributedTraceContext({
                    traceId: "aabbccddeeff00112233445566778899",
                    spanId: "aabbccddeeff0011",
                    traceFlags: 1
                });
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext);

                // Act - perform various operations
                wrappedSpan.setAttribute("key1", "value1");
                wrappedSpan.setAttributes({
                    "key2": 123,
                    "key3": true
                });
                wrappedSpan.updateName("new-name");
                wrappedSpan.setStatus({ code: eOTelSpanStatusCode.OK, message: "Success" });
                wrappedSpan.recordException(new Error("Test error"));

                // Assert - operations should not throw
                Assert.ok(true, "All operations should complete without error");
                Assert.equal(wrappedSpan.name, "new-name", "Name should be updated");

                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: preserves traceFlags if present",
            test: () => {
                // Arrange
                const spanContext = createDistributedTraceContext({
                    traceId: "11112222333344445555666677778888",
                    spanId: "1111222233334444",
                    traceFlags: 1 // Sampled
                });

                // Act
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext);

                // Assert
                Assert.equal(wrappedSpan.spanContext().traceFlags, 1, 
                    "TraceFlags should be preserved");

                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: multiple wrapped spans from same context are independent",
            test: () => {
                // Arrange
                const spanContext = createDistributedTraceContext({
                    traceId: "99887766554433221100ffeeddccbbaa",
                    spanId: "9988776655443322",
                    traceFlags: 1
                });

                // Act
                const wrapped1 = wrapSpanContext(this._ai.otelApi, spanContext);
                const wrapped2 = wrapSpanContext(this._ai.otelApi, spanContext);

                // Assert - both wrap same context but are different span objects
                Assert.notEqual(wrapped1, wrapped2, "Should create different span objects");
                Assert.equal(wrapped1.spanContext().traceId, wrapped2.spanContext().traceId, 
                    "Both should have same traceId");
                Assert.equal(wrapped1.spanContext().spanId, wrapped2.spanContext().spanId, 
                    "Both should have same spanId");

                // Operations on one should not affect the other
                wrapped1.updateName("wrapped-1");
                wrapped2.updateName("wrapped-2");
                Assert.equal(wrapped1.name, "wrapped-1", "First span name");
                Assert.equal(wrapped2.name, "wrapped-2", "Second span name");

                wrapped1.end();
                wrapped2.end();
            }
        });

        this.testCase({
            name: "wrapSpanContext: can wrap context from external system",
            test: () => {
                // Arrange - simulate receiving context from external system (e.g., HTTP header)
                const externalContext = createDistributedTraceContext({
                    traceId: "00112233445566778899aabbccddeeff",
                    spanId: "0011223344556677",
                    traceFlags: 1
                });

                // Act
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, externalContext);
                
                // Create child span to continue the trace
                const childSpan = this._ai.startSpan("continue-external-trace", {
                    kind: eOTelSpanKind.SERVER
                }, wrappedSpan.spanContext());

                // Assert
                Assert.equal(childSpan?.spanContext().traceId, externalContext.traceId, 
                    "Should continue external trace");
                Assert.notEqual(childSpan?.spanContext().spanId, externalContext.spanId, 
                    "Should have new spanId");

                // Cleanup
                childSpan?.end();
                wrappedSpan.end();
            }
        });
    }

    private addIsReadableSpanTests(): void {
        this.testCase({
            name: "isReadableSpan: valid span returns true",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("test-span");

                // Act
                const isValid = isReadableSpan(span);

                // Assert
                Assert.ok(isValid, "Valid span should return true");

                span?.end();
            }
        });

        this.testCase({
            name: "isReadableSpan: null returns false",
            test: () => {
                // Act
                const isValid = isReadableSpan(null);

                // Assert
                Assert.ok(!isValid, "Null should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: undefined returns false",
            test: () => {
                // Act
                const isValid = isReadableSpan(undefined);

                // Assert
                Assert.ok(!isValid, "Undefined should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: plain object returns false",
            test: () => {
                // Arrange
                const notASpan = {
                    name: "fake-span",
                    kind: eOTelSpanKind.INTERNAL
                };

                // Act
                const isValid = isReadableSpan(notASpan);

                // Assert
                Assert.ok(!isValid, "Plain object should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: object with partial span interface returns false",
            test: () => {
                // Arrange - object with some but not all required properties
                const partialSpan = {
                    name: "partial",
                    kind: eOTelSpanKind.CLIENT,
                    spanContext: () => ({ traceId: "123", spanId: "456" }),
                    // Missing: duration, ended, startTime, endTime, etc.
                };

                // Act
                const isValid = isReadableSpan(partialSpan);

                // Assert
                Assert.ok(!isValid, "Partial span interface should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: recording span returns true",
            test: () => {
                // Arrange
                const recordingSpan = this._ai.startSpan("recording", { recording: true });

                // Act
                const isValid = isReadableSpan(recordingSpan);

                // Assert
                Assert.ok(isValid, "Recording span should return true");

                recordingSpan?.end();
            }
        });

        this.testCase({
            name: "isReadableSpan: non-recording span returns true",
            test: () => {
                // Arrange
                const nonRecordingSpan = this._ai.startSpan("non-recording", { recording: false });

                // Act
                const isValid = isReadableSpan(nonRecordingSpan);

                // Assert
                Assert.ok(isValid, "Non-recording span should return true");

                nonRecordingSpan?.end();
            }
        });

        this.testCase({
            name: "isReadableSpan: wrapped span context returns true",
            test: () => {
                // Arrange
                const spanContext = createDistributedTraceContext({
                    traceId: "aabbccdd00112233aabbccdd00112233",
                    spanId: "aabbccdd00112233",
                    traceFlags: 1
                });
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, spanContext);

                // Act
                const isValid = isReadableSpan(wrappedSpan);

                // Assert
                Assert.ok(isValid, "Wrapped span should return true");

                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "isReadableSpan: ended span returns true",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-span");
                span?.end();

                // Act
                const isValid = isReadableSpan(span);

                // Assert
                Assert.ok(isValid, "Ended span should still return true");
            }
        });

        this.testCase({
            name: "isReadableSpan: span with all kinds returns true",
            test: () => {
                // Arrange & Act & Assert
                const internalSpan = this._ai.startSpan("internal", { kind: eOTelSpanKind.INTERNAL });
                Assert.ok(isReadableSpan(internalSpan), "INTERNAL span should be valid");
                internalSpan?.end();

                const clientSpan = this._ai.startSpan("client", { kind: eOTelSpanKind.CLIENT });
                Assert.ok(isReadableSpan(clientSpan), "CLIENT span should be valid");
                clientSpan?.end();

                const serverSpan = this._ai.startSpan("server", { kind: eOTelSpanKind.SERVER });
                Assert.ok(isReadableSpan(serverSpan), "SERVER span should be valid");
                serverSpan?.end();

                const producerSpan = this._ai.startSpan("producer", { kind: eOTelSpanKind.PRODUCER });
                Assert.ok(isReadableSpan(producerSpan), "PRODUCER span should be valid");
                producerSpan?.end();

                const consumerSpan = this._ai.startSpan("consumer", { kind: eOTelSpanKind.CONSUMER });
                Assert.ok(isReadableSpan(consumerSpan), "CONSUMER span should be valid");
                consumerSpan?.end();
            }
        });

        this.testCase({
            name: "isReadableSpan: string returns false",
            test: () => {
                // Act
                const isValid = isReadableSpan("not a span");

                // Assert
                Assert.ok(!isValid, "String should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: number returns false",
            test: () => {
                // Act
                const isValid = isReadableSpan(12345);

                // Assert
                Assert.ok(!isValid, "Number should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: array returns false",
            test: () => {
                // Act
                const isValid = isReadableSpan([]);

                // Assert
                Assert.ok(!isValid, "Array should return false");
            }
        });

        this.testCase({
            name: "isReadableSpan: function returns false",
            test: () => {
                // Act
                const isValid = isReadableSpan(() => {});

                // Assert
                Assert.ok(!isValid, "Function should return false");
            }
        });
    }

    private addHelperIntegrationTests(): void {
        this.testCase({
            name: "Integration: validate context before wrapping",
            test: () => {
                // Arrange - good practice to validate before wrapping
                const validContext: IDistributedTraceInit = {
                    traceId: "aaaabbbbccccddddeeeeffffaaaabbbb",
                    spanId: "aaaabbbbccccdddd",
                    traceFlags: 1
                };
                const invalidContext: IDistributedTraceInit = {
                    traceId: "invalid",
                    spanId: "also-bad",
                    traceFlags: 1
                };

                // Act & Assert - validate before wrapping
                Assert.ok(isSpanContextValid(validContext), "Valid context should pass validation");
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, validContext);
                Assert.ok(wrappedSpan, "Should wrap valid context");
                Assert.ok(isReadableSpan(wrappedSpan), "Wrapped span should be readable");
                wrappedSpan.end();

                // Don't wrap invalid context
                Assert.ok(!isSpanContextValid(invalidContext), 
                    "Should detect invalid context before wrapping");
            }
        });

        this.testCase({
            name: "Integration: type-safe span handling with isReadableSpan",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("type-safe");
                const maybeSpan: any = span;

                // Act - type guard allows safe access
                if (isReadableSpan(maybeSpan)) {
                    // TypeScript knows this is IReadableSpan now
                    const context = maybeSpan.spanContext();
                    maybeSpan.setAttribute("safe", "access");
                    maybeSpan.end();

                    // Assert
                    Assert.ok(context.traceId, "Can safely access span properties");
                } else {
                    Assert.ok(false, "Span should be readable");
                }
            }
        });

        this.testCase({
            name: "Integration: wrap external trace and continue locally",
            test: () => {
                // Arrange - simulate receiving trace context from external service
                const externalContext = createDistributedTraceContext({
                    traceId: "1234567890abcdef1234567890abcdef",
                    spanId: "1234567890abcdef",
                    traceFlags: 1
                });

                // Act - validate and wrap
                Assert.ok(isSpanContextValid(externalContext),
                    "External context should be valid");

                const wrappedExternal = wrapSpanContext(
                    this._ai.otelApi,
                    externalContext
                );
                Assert.ok(isReadableSpan(wrappedExternal),
                    "Wrapped external should be readable");

                // Continue trace with local spans
                const localSpan1 = this._ai.startSpan("local-processing", {
                    kind: eOTelSpanKind.SERVER
                }, wrappedExternal.spanContext());

                const localSpan2 = this._ai.startSpan("database-call", {
                    kind: eOTelSpanKind.CLIENT
                }, localSpan1?.spanContext());

                // Assert - trace continuity
                Assert.equal(localSpan1?.spanContext().traceId, externalContext.traceId,
                    "Local span should continue external trace");
                Assert.equal(localSpan2?.spanContext().traceId, externalContext.traceId,
                    "Nested span should continue external trace");
                Assert.notEqual(localSpan2?.spanContext().spanId, externalContext.spanId,
                    "Should have new span IDs");

                // Cleanup
                localSpan2?.end();
                localSpan1?.end();
                wrappedExternal.end();
            }
        });

        this.testCase({
            name: "Integration: helper functions work with all span kinds",
            test: () => {
                // Test each span kind
                const kinds = [
                    eOTelSpanKind.INTERNAL,
                    eOTelSpanKind.CLIENT,
                    eOTelSpanKind.SERVER,
                    eOTelSpanKind.PRODUCER,
                    eOTelSpanKind.CONSUMER
                ];

                for (const kind of kinds) {
                    // Create span
                    const span = this._ai.startSpan(`span-kind-${kind}`, { kind });
                    Assert.ok(span, `Span with kind ${kind} should be created`);

                    // Verify with isReadableSpan
                    Assert.ok(isReadableSpan(span), `Span kind ${kind} should be readable`);

                    // Get and validate context
                    const context = span?.spanContext();
                    Assert.ok(isSpanContextValid(context!), 
                        `Span kind ${kind} should have valid context`);

                    // Wrap the context
                    const wrapped = wrapSpanContext(this._ai.otelApi, context!);
                    Assert.ok(isReadableSpan(wrapped), 
                        `Wrapped span from kind ${kind} should be readable`);

                    // Cleanup
                    span?.end();
                    wrapped.end();
                }

                Assert.ok(true, "All span kinds tested successfully");
            }
        });

        this.testCase({
            name: "Integration: helpers work after span lifecycle",
            test: () => {
                // Arrange - create and end span
                const span = this._ai.startSpan("lifecycle-test");
                const context = span?.spanContext();
                span?.end();

                // Act & Assert - helpers should still work with ended span
                Assert.ok(isReadableSpan(span), 
                    "isReadableSpan should work with ended span");
                Assert.ok(isSpanContextValid(context!), 
                    "isSpanContextValid should work with context from ended span");

                const wrapped = wrapSpanContext(this._ai.otelApi, context!);
                Assert.ok(isReadableSpan(wrapped), 
                    "Can wrap context from ended span");

                wrapped.end();
            }
        });

        this.testCase({
            name: "Integration: defensive programming with helpers",
            test: () => {
                // Arrange - potentially problematic inputs
                const nullValue: any = null;
                const undefinedValue: any = undefined;
                const emptyObject: any = {};
                const wrongType: any = "not a span";

                // Act & Assert - helpers should handle gracefully
                Assert.ok(!isReadableSpan(nullValue), "Handle null");
                Assert.ok(!isReadableSpan(undefinedValue), "Handle undefined");
                Assert.ok(!isReadableSpan(emptyObject), "Handle empty object");
                Assert.ok(!isReadableSpan(wrongType), "Handle wrong type");

                Assert.ok(!isSpanContextValid(nullValue), "Validate null context");
                Assert.ok(!isSpanContextValid(undefinedValue), "Validate undefined context");
                Assert.ok(!isSpanContextValid(emptyObject), "Validate empty context");
                Assert.ok(!isSpanContextValid(wrongType), "Validate wrong type context");
            }
        });

        this.testCase({
            name: "Integration: wrap and use as active span",
            test: () => {
                // Arrange
                const externalContext = createDistributedTraceContext({
                    traceId: "activespan123456789012345678901234",
                    spanId: "activespan123456",
                    traceFlags: 1
                });

                // Act - wrap and set as active
                const wrappedSpan = wrapSpanContext(this._ai.otelApi, externalContext);
                const scope = this._ai.core.setActiveSpan(wrappedSpan);

                // Create child that should automatically get wrapped span as parent
                const childSpan = this._ai.startSpan("auto-child", {
                    kind: eOTelSpanKind.INTERNAL
                });

                // Assert
                Assert.equal(childSpan?.spanContext().traceId, externalContext.traceId, 
                    "Child should inherit traceId from active wrapped span");

                // Cleanup
                childSpan?.end();
                scope?.restore();
                wrappedSpan.end();
            }
        });

        this.testCase({
            name: "Integration: validation chain for incoming distributed trace",
            test: () => {
                // Simulate complete flow of receiving and processing distributed trace
                
                // Step 1: Receive trace context (e.g., from HTTP headers)
                const receivedContext = createDistributedTraceContext({
                    traceId: "abcdef0123456789abcdef0123456789",
                    spanId: "abcdef0123456789",
                    traceFlags: 1
                });

                // Step 2: Validate received context
                Assert.ok(isSpanContextValid(receivedContext), "Received trace context should be valid");

                // Step 3: Wrap context to create local span representation
                const remoteSpan = wrapSpanContext(this._ai.otelApi, receivedContext);
                Assert.ok(isReadableSpan(remoteSpan), "Failed to create readable span");

                // Step 4: Create local server span as child
                const serverSpan = this._ai.startSpan("handle-request", {
                    kind: eOTelSpanKind.SERVER
                }, remoteSpan.spanContext());

                Assert.ok(isReadableSpan(serverSpan), "Server span should be readable");

                // Step 5: Verify trace continuity
                const serverContext = serverSpan?.spanContext();
                Assert.ok(isSpanContextValid(serverContext!), 
                    "Server span should have valid context");
                Assert.equal(serverContext?.traceId, receivedContext.traceId, 
                    "Trace ID should be preserved across process boundary");

                // Step 6: Complete request handling
                serverSpan?.setAttribute("http.status_code", 200);
                serverSpan?.setStatus({ code: eOTelSpanStatusCode.OK });
                serverSpan?.end();
                remoteSpan.end();

                Assert.ok(true, "Complete distributed trace flow validated");
            }
        });
    }
}
