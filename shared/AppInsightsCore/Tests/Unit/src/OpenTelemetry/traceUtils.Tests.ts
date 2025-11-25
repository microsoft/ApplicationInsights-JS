import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { isSpanContextValid, wrapSpanContext, createNonRecordingSpan, isReadableSpan } from "../../../../src/OpenTelemetry/trace/utils";
import { IDistributedTraceContext } from "../../../../src/JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { IOTelApi } from "../../../../src/OpenTelemetry/interfaces/IOTelApi";
import { createOTelApi } from "../../../../src/OpenTelemetry/otelApi";
import { eOTelSpanKind } from "../../../../src/OpenTelemetry/enums/trace/OTelSpanKind";
import { IOTelApiCtx } from "../../../../src/OpenTelemetry/interfaces/IOTelApiCtx";
import { IOTelSpanCtx } from "../../../../src/OpenTelemetry/interfaces/trace/IOTelSpanCtx";
import { createSpan } from "../../../../src/OpenTelemetry/trace/span";
import { createW3cTraceState } from "../../../../src/JavaScriptSDK/W3cTraceState";
import { createDistributedTraceContext } from "../../../../src/JavaScriptSDK/TelemetryHelpers";
import { IAppInsightsCore } from "../../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
import { AppInsightsCore } from "../../../../src/applicationinsights-core-js";

function _createDistributedContext(traceId: string, spanId: string, traceFlags: number, traceState?: string): IDistributedTraceContext {
    const theContext: IDistributedTraceContext = {
        traceId: traceId,
        spanId: spanId,
        traceFlags: traceFlags,
        getName: function (): string {
            throw new Error("Function not implemented.");
        },
        setName: function (pageName: string): void {
            throw new Error("Function not implemented.");
        },
        getTraceId: function (): string {
            throw new Error("Function not implemented.");
        },
        setTraceId: function (newValue: string): void {
            throw new Error("Function not implemented.");
        },
        getSpanId: function (): string {
            throw new Error("Function not implemented.");
        },
        setSpanId: function (newValue: string): void {
            throw new Error("Function not implemented.");
        },
        getTraceFlags: function (): number | undefined {
            throw new Error("Function not implemented.");
        },
        setTraceFlags: function (newValue?: number): void {
            throw new Error("Function not implemented.");
        },
        pageName: "",
        isRemote: false,
        traceState: traceState ? createW3cTraceState(traceState) : createW3cTraceState()
    };

    return theContext;
}

function _createOtelApi(core: IAppInsightsCore): IOTelApi {
    let otelCfg = {
        traceCfg: {},
        errorHandlers: {
            attribError: (message: string, key: string, value: any) => {
                console.error(message);
            },
            spanError: (message: string, spanName: string) => {
                console.error(message);
            },
            debug: (message: string) => {
                console.error(message);
            },
            warn: (message: string) => {
                console.error(message);
            },
            error: (message: string) => {
                console.error(message);
            },
            notImplemented: (message: string) => {
                console.error(message);
            }
        }
    }

    return createOTelApi({
        core: core
    }, "default");
}

export class TraceUtilsTests extends AITestClass {
    private _core: IAppInsightsCore = null as any;
    private _otelApi!: IOTelApi;
    private _validSpanContext!: IDistributedTraceContext;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._core.initialize({
            instrumentationKey: "00000000-0000-0000-0000-000000000000",
            disableInstrumentationKeyValidation: true,
            traceCfg: {},
            errorHandlers: {
                attribError: (message: string, key: string, value: any) => {
                    console.error(message);
                },
                spanError: (message: string, spanName: string) => {
                    console.error(message);
                },
                debug: (message: string) => {
                    console.error(message);
                },
                warn: (message: string) => {
                    console.error(message);
                },
                error: (message: string) => {
                    console.error(message);
                },
                notImplemented: (message: string) => {
                    console.error(message);
                }
            }
        }, []);

        this._otelApi = _createOtelApi(this._core);
        
        // Valid span context with proper IDs
        this._validSpanContext = _createDistributedContext("12345678901234567890123456789012", "1234567890123456", 1);
    }

    public testCleanup() {
        if (this._core) {
            this._core.unload(false);
            this._core = null as any;
        }
        this._otelApi = null as any;
        this._validSpanContext = null as any;
    }

    public registerTests() {
        this.addIsSpanContextValidTests();
        this.addWrapSpanContextTests();
        this.addCreateNonRecordingSpanTests();
        this.addIsReadableSpanTests();
    }

    private addIsSpanContextValidTests(): void {
        this.testCase({
            name: "isSpanContextValid: should return true for valid span context",
            test: () => {
                // Act
                const result = isSpanContextValid(this._validSpanContext);

                // Assert
                Assert.ok(result, "Should return true for valid span context");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for invalid trace ID",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("invalid-trace-id", "1234567890123456", 1);

                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for invalid trace ID");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for invalid span ID",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("12345678901234567890123456789012", "bad", 1);
                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for invalid span ID");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for null context",
            test: () => {
                // Act
                const result = isSpanContextValid(null as any);

                // Assert
                Assert.ok(!result, "Should return false for null context");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for undefined context",
            test: () => {
                // Act
                const result = isSpanContextValid(undefined as any);

                // Assert
                Assert.ok(!result, "Should return false for undefined context");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for empty trace ID",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("", "1234567890123456", 1);
                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for empty trace ID");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for empty span ID",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("12345678901234567890123456789012", "", 1);
                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for empty span ID");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for all-zero trace ID",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("00000000000000000000000000000000", "1234567890123456", 1);

                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for all-zero trace ID");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for all-zero span ID",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("12345678901234567890123456789012", "0000000000000000", 1);
                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for all-zero span ID");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for trace ID with wrong length",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("123456789012", "1234567890123456", 1);

                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for trace ID with wrong length");
            }
        });

        this.testCase({
            name: "isSpanContextValid: should return false for span ID with wrong length",
            test: () => {
                // Arrange
                const invalidContext: IDistributedTraceContext = _createDistributedContext("12345678901234567890123456789012", "1234", 1);
                // Act
                const result = isSpanContextValid(invalidContext);

                // Assert
                Assert.ok(!result, "Should return false for span ID with wrong length");
            }
        });
    }

    private addWrapSpanContextTests(): void {
        this.testCase({
            name: "wrapSpanContext: should create non-recording span from valid context",
            test: () => {
                // Act
                const wrappedSpan = wrapSpanContext(this._otelApi, this._validSpanContext);

                // Assert
                Assert.ok(wrappedSpan, "Should create a span");
                Assert.ok(!wrappedSpan.isRecording(), "Wrapped span should not be recording");
                Assert.equal(wrappedSpan.spanContext().traceId, this._validSpanContext.traceId, "Trace ID should match");
                Assert.equal(wrappedSpan.spanContext().spanId, this._validSpanContext.spanId, "Span ID should match");
            }
        });

        this.testCase({
            name: "wrapSpanContext: should include span ID in wrapped span name",
            test: () => {
                // Act
                const wrappedSpan = wrapSpanContext(this._otelApi, this._validSpanContext);

                // Assert
                Assert.ok(wrappedSpan.name.includes(this._validSpanContext.spanId), 
                    "Span name should include original span ID");
                Assert.ok(wrappedSpan.name.includes("wrapped"), 
                    "Span name should indicate it's a wrapped span");
            }
        });

        this.testCase({
            name: "wrapSpanContext: should preserve trace flags",
            test: () => {
                // Arrange
                const contextWithFlags: IDistributedTraceContext = _createDistributedContext("12345678901234567890123456789012", "1234567890123456", 1);

                // Act
                const wrappedSpan = wrapSpanContext(this._otelApi, contextWithFlags);

                // Assert
                Assert.equal(wrappedSpan.spanContext().traceFlags, contextWithFlags.traceFlags,
                    "Trace flags should be preserved");
            }
        });

        this.testCase({
            name: "wrapSpanContext: should handle context with tracestate",
            test: () => {
                // Arrange
                let contextWithState: IDistributedTraceContext = createDistributedTraceContext();
                contextWithState.traceId = "12345678901234567890123456789012";
                contextWithState.spanId = "1234567890123456";
                contextWithState.traceFlags = 1;
                contextWithState.traceState.set("vendor", "value");

                // Act
                const wrappedSpan = wrapSpanContext(this._otelApi, contextWithState);

                // Assert
                Assert.ok(wrappedSpan, "Should create span with tracestate");
                Assert.equal(wrappedSpan.spanContext().traceState, contextWithState.traceState,
                    "Trace state should be preserved if present");
            }
        });

        this.testCase({
            name: "wrapSpanContext: wrapped span should not be ended",
            test: () => {
                // Act
                const wrappedSpan = wrapSpanContext(this._otelApi, this._validSpanContext);

                // Assert
                Assert.ok(!wrappedSpan.ended, "Wrapped span should not be ended initially");
            }
        });

        this.testCase({
            name: "wrapSpanContext: wrapped span should be internal kind",
            test: () => {
                // Act
                const wrappedSpan = wrapSpanContext(this._otelApi, this._validSpanContext);

                // Assert
                Assert.equal(wrappedSpan.kind, eOTelSpanKind.INTERNAL, 
                    "Wrapped span should have INTERNAL kind");
            }
        });
    }

    private addCreateNonRecordingSpanTests(): void {
        this.testCase({
            name: "createNonRecordingSpan: should create non-recording span",
            test: () => {
                // Arrange
                const spanName = "test-non-recording";

                // Act
                const span = createNonRecordingSpan(this._otelApi, spanName, this._validSpanContext);

                // Assert
                Assert.ok(span, "Should create a span");
                Assert.ok(!span.isRecording(), "Span should not be recording");
                Assert.equal(span.name, spanName, "Span name should match");
            }
        });

        this.testCase({
            name: "createNonRecordingSpan: should use provided span context",
            test: () => {
                // Arrange
                const spanName = "context-test";

                // Act
                const span = createNonRecordingSpan(this._otelApi, spanName, this._validSpanContext);

                // Assert
                Assert.equal(span.spanContext().traceId, this._validSpanContext.traceId,
                    "Trace ID should match provided context");
                Assert.equal(span.spanContext().spanId, this._validSpanContext.spanId,
                    "Span ID should match provided context");
                Assert.equal(span.spanContext().traceFlags, this._validSpanContext.traceFlags,
                    "Trace flags should match provided context");
            }
        });

        this.testCase({
            name: "createNonRecordingSpan: should create span with INTERNAL kind",
            test: () => {
                // Act
                const span = createNonRecordingSpan(this._otelApi, "test", this._validSpanContext);

                // Assert
                Assert.equal(span.kind, eOTelSpanKind.INTERNAL,
                    "Non-recording span should have INTERNAL kind");
            }
        });

        this.testCase({
            name: "createRecordingSpan: recording span with onEnd should still trigger callback",
            test: () => {
                // Arrange
                let onEndCalled = false;
                
                // Create a non-recording span directly with createSpan to test onEnd callback behavior
                const spanCtx: IOTelSpanCtx = {
                    api: this._otelApi,
                    spanContext: this._validSpanContext,
                    onEnd: () => {
                        onEndCalled = true;
                    }
                };
                
                // Act - Create span directly with our custom context that includes onEnd callback
                const span = createSpan(spanCtx, "test-recording-with-callback", eOTelSpanKind.INTERNAL);
                Assert.ok(span.isRecording(), "Span should be recording");
                span.end();

                // Assert
                // onEnd callbacks are called regardless of recording state when the callback is provided
                Assert.ok(onEndCalled, "onEnd callback should be called even for non-recording spans when callback is registered");
            }
        });

        this.testCase({
            name: "createNonRecordingSpan: non-recording span with onEnd should still trigger callback",
            test: () => {
                // Arrange
                let onEndCalled = false;
                
                // Create a non-recording span directly with createSpan to test onEnd callback behavior
                const spanCtx: IOTelSpanCtx = {
                    api: this._otelApi,
                    spanContext: this._validSpanContext,
                    isRecording: false,  // Non-recording span
                    onEnd: () => {
                        onEndCalled = true;
                    }
                };
                
                // Act - Create span directly with our custom context that includes onEnd callback
                const span = createSpan(spanCtx, "test-non-recording-with-callback", eOTelSpanKind.INTERNAL);
                Assert.ok(!span.isRecording(), "Span should not be recording");
                span.end();

                // Assert
                // onEnd callbacks are called regardless of recording state when the callback is provided
                // Allows for post-end processing even for non-recording spans, including tracking the number of non-recording spans ended
                Assert.ok(onEndCalled, "onEnd callback should be called even for non-recording spans when callback is registered");
            }
        });

        this.testCase({
            name: "createNonRecordingSpan: utility function creates span without onEnd callback",
            test: () => {
                // Arrange & Act
                // createNonRecordingSpan is a utility that doesn't accept an onEnd callback parameter
                const span = createNonRecordingSpan(this._otelApi, "test-non-recording", this._validSpanContext);

                // Assert
                Assert.ok(!span.isRecording(), "Span should not be recording");
                // This just verifies the utility function works as expected - no onEnd callback to test

                span.end();

                // Validate that calling after end does not cause issues
                Assert.ok(!span.isRecording(), "Span should not be recording");
            }
        });

        this.testCase({
            name: "createNonRecordingSpan: should accept custom span names",
            test: () => {
                // Arrange
                const customNames = [
                    "operation-1",
                    "http-request",
                    "database-query",
                    "cache-lookup",
                    ""
                ];

                // Act & Assert
                customNames.forEach(name => {
                    const span = createNonRecordingSpan(this._otelApi, name, this._validSpanContext);
                    Assert.equal(span.name, name, `Span name should be '${name}'`);
                    Assert.ok(!span.isRecording(), "All non-recording spans should not be recording");
                });
            }
        });

        this.testCase({
            name: "createNonRecordingSpan: should preserve tracestate from context",
            test: () => {
                // Arrange
                const contextWithState: IDistributedTraceContext = _createDistributedContext("12345678901234567890123456789012", "1234567890123456", 1, "vendor1=value1,vendor2=value2");

                // Act
                const span = createNonRecordingSpan(this._otelApi, "test", contextWithState);

                // Assert
                Assert.equal(span.spanContext().traceState, contextWithState.traceState,
                    "Trace state should be preserved");
            }
        });
    }

    private addIsReadableSpanTests(): void {
        this.testCase({
            name: "isReadableSpan: should return true for valid span",
            test: () => {
                // Arrange - create a real span
                const span = createNonRecordingSpan(this._otelApi, "test", this._validSpanContext);

                // Act
                const result = isReadableSpan(span);

                // Assert
                Assert.ok(result, "Should return true for a valid readable span");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for null",
            test: () => {
                // Act
                const result = isReadableSpan(null);

                // Assert
                Assert.ok(!result, "Should return false for null");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for undefined",
            test: () => {
                // Act
                const result = isReadableSpan(undefined);

                // Assert
                Assert.ok(!result, "Should return false for undefined");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for empty object",
            test: () => {
                // Act
                const result = isReadableSpan({});

                // Assert
                Assert.ok(!result, "Should return false for empty object");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for object with only some properties",
            test: () => {
                // Arrange
                const partialSpan = {
                    name: "test",
                    kind: eOTelSpanKind.CLIENT
                };

                // Act
                const result = isReadableSpan(partialSpan);

                // Assert
                Assert.ok(!result, "Should return false for object missing required properties");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for object missing spanContext method",
            test: () => {
                // Arrange
                const invalidSpan = {
                    name: "test",
                    kind: eOTelSpanKind.CLIENT,
                    duration: [0, 0],
                    ended: false,
                    startTime: [0, 0],
                    endTime: [0, 0],
                    attributes: {},
                    links: [],
                    events: [],
                    status: { code: 0 },
                    resource: {},
                    instrumentationScope: {},
                    droppedAttributesCount: 0,
                    isRecording: () => false,
                    setStatus: () => {},
                    updateName: () => {},
                    setAttribute: () => {},
                    setAttributes: () => {},
                    end: () => {},
                    recordException: () => {}
                    // Missing spanContext method
                };

                // Act
                const result = isReadableSpan(invalidSpan);

                // Assert
                Assert.ok(!result, "Should return false when spanContext method is missing");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for object with non-function methods",
            test: () => {
                // Arrange
                const invalidSpan = {
                    name: "test",
                    kind: eOTelSpanKind.CLIENT,
                    spanContext: "not a function",
                    duration: [0, 0],
                    ended: false,
                    startTime: [0, 0],
                    endTime: [0, 0],
                    attributes: {},
                    links: [],
                    events: [],
                    status: { code: 0 },
                    resource: {},
                    instrumentationScope: {},
                    droppedAttributesCount: 0,
                    isRecording: () => false,
                    setStatus: () => {},
                    updateName: () => {},
                    setAttribute: () => {},
                    setAttributes: () => {},
                    end: () => {},
                    recordException: () => {}
                };

                // Act
                const result = isReadableSpan(invalidSpan);

                // Assert
                Assert.ok(!result, "Should return false when required methods are not functions");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for primitive values",
            test: () => {
                // Act & Assert
                Assert.ok(!isReadableSpan("string"), "Should return false for string");
                Assert.ok(!isReadableSpan(123), "Should return false for number");
                Assert.ok(!isReadableSpan(true), "Should return false for boolean");
            }
        });

        this.testCase({
            name: "isReadableSpan: should return false for array",
            test: () => {
                // Act
                const result = isReadableSpan([]);

                // Assert
                Assert.ok(!result, "Should return false for array");
            }
        });

        this.testCase({
            name: "isReadableSpan: should validate all required properties exist",
            test: () => {
                // Arrange - create a valid span to ensure our check is comprehensive
                const span = createNonRecordingSpan(this._otelApi, "validation-test", this._validSpanContext);

                // Act - verify the span has all required properties
                const hasName = "name" in span;
                const hasKind = "kind" in span;
                const hasSpanContext = typeof span.spanContext === "function";
                const hasDuration = "duration" in span;
                const hasEnded = "ended" in span;
                const hasStartTime = "startTime" in span;
                const hasEndTime = "endTime" in span;
                const hasAttributes = "attributes" in span;
                const hasLinks = "links" in span;
                const hasEvents = "events" in span;
                const hasStatus = "status" in span;
                const hasResource = "resource" in span;
                const hasInstrumentationScope = "instrumentationScope" in span;
                const hasDroppedAttributesCount = "droppedAttributesCount" in span;
                const hasIsRecording = typeof span.isRecording === "function";
                const hasSetStatus = typeof span.setStatus === "function";
                const hasUpdateName = typeof span.updateName === "function";
                const hasSetAttribute = typeof span.setAttribute === "function";
                const hasSetAttributes = typeof span.setAttributes === "function";
                const hasEnd = typeof span.end === "function";
                const hasRecordException = typeof span.recordException === "function";

                // Assert
                Assert.ok(hasName, "Should have name property");
                Assert.ok(hasKind, "Should have kind property");
                Assert.ok(hasSpanContext, "Should have spanContext method");
                Assert.ok(hasDuration, "Should have duration property");
                Assert.ok(hasEnded, "Should have ended property");
                Assert.ok(hasStartTime, "Should have startTime property");
                Assert.ok(hasEndTime, "Should have endTime property");
                Assert.ok(hasAttributes, "Should have attributes property");
                Assert.ok(hasLinks, "Should have links property");
                Assert.ok(hasEvents, "Should have events property");
                Assert.ok(hasStatus, "Should have status property");
                Assert.ok(hasResource, "Should have resource property");
                Assert.ok(hasInstrumentationScope, "Should have instrumentationScope property");
                Assert.ok(hasDroppedAttributesCount, "Should have droppedAttributesCount property");
                Assert.ok(hasIsRecording, "Should have isRecording method");
                Assert.ok(hasSetStatus, "Should have setStatus method");
                Assert.ok(hasUpdateName, "Should have updateName method");
                Assert.ok(hasSetAttribute, "Should have setAttribute method");
                Assert.ok(hasSetAttributes, "Should have setAttributes method");
                Assert.ok(hasEnd, "Should have end method");
                Assert.ok(hasRecordException, "Should have recordException method");

                // Final validation
                Assert.ok(isReadableSpan(span), "isReadableSpan should return true for complete span");
            }
        });

        this.testCase({
            name: "isReadableSpan: should work with recording spans",
            test: () => {
                // Arrange - this would be a recording span in real usage
                const recordingSpan = createNonRecordingSpan(this._otelApi, "recording-test", this._validSpanContext);

                // Act
                const result = isReadableSpan(recordingSpan);

                // Assert
                Assert.ok(result, "Should return true for both recording and non-recording spans");
            }
        });
    }
}
