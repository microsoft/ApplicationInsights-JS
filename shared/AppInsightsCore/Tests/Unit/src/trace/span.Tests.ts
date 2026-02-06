import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { getDeferred, ICachedValue, isNullOrUndefined, mathMin, objDefine, perfNow, strSubstr } from "@nevware21/ts-utils";
import { createSpan } from "../../../../src/otel/api/trace/span";
import { createOTelApi } from "../../../../src/otel/api/OTelApi";
import { IOTelSpanCtx } from "../../../../src/interfaces/otel/trace/IOTelSpanCtx";
import { IOTelApi } from "../../../../src/interfaces/otel/IOTelApi";
import { IOTelConfig } from "../../../../src/interfaces/otel/config/IOTelConfig";
import { eOTelSpanStatusCode } from "../../../../src/enums/otel/OTelSpanStatus";
import { IOTelAttributes } from "../../../../src/interfaces/otel/IOTelAttributes";
import { IReadableSpan } from "../../../../src/interfaces/otel/trace/IReadableSpan";
import { IDistributedTraceContext } from "../../../../src/interfaces/ai/IDistributedTraceContext";
import { createDistributedTraceContext } from "../../../../src/core/TelemetryHelpers";
import { generateW3CId } from "../../../../src/utils/CoreUtils";
import { suppressTracing, unsuppressTracing, isTracingSuppressed, useSpan, withSpan } from "../../../../src/otel/api/trace/utils";
import { ITraceCfg } from "../../../../src/interfaces/otel/config/IOTelTraceCfg";
import { AppInsightsCore } from "../../../../src/core/AppInsightsCore";
import { IConfiguration } from "../../../../src/interfaces/ai/IConfiguration";
import { ITraceProvider, ISpanScope, ITraceHost } from "../../../../src/interfaces/ai/ITraceProvider";
import { IOTelSpanOptions } from "../../../../src/interfaces/otel/trace/IOTelSpanOptions";
import { eOTelSpanKind } from "../../../../src/enums/otel/OTelSpanKind";

export class SpanTests extends AITestClass {

    private _mockApi!: IOTelApi;
    private _mockSpanContext!: IDistributedTraceContext;
    private _onEndCalls!: IReadableSpan[];
    private _core!: AppInsightsCore;

    public testInitialize() {
        super.testInitialize();
        this._onEndCalls = [];

        // Create mock span context
        this._mockSpanContext = createDistributedTraceContext({
            traceId: "12345678901234567890123456789012",
            spanId: "1234567890123456",
            traceFlags: 1,
            isRemote: false
        });

        // Create mock API
        this._mockApi = {
            cfg: {
                errorHandlers: {}
            } as IOTelConfig
        } as IOTelApi;
    }

    public testCleanup() {
        super.testCleanup();
        this._onEndCalls = [];
        
        // Clean up AppInsightsCore instance if initialized
        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }
        this._core = undefined as any;
    }

    /**
     * Helper function to create a simple trace provider with onEnd callback
     */
    private _createTestTraceProvider(host: ITraceHost, onEnd?: (span: IReadableSpan) => void): ICachedValue<ITraceProvider> {
        const actualOnEnd = onEnd || ((span) => this._onEndCalls.push(span));

        return getDeferred(() => {
            const provider: ITraceProvider = {
                api: this._mockApi,
                createSpan: (name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan => {
                    // Create a new distributed trace context for this span
                    let newCtx: IDistributedTraceContext;
                    let parentCtx: IDistributedTraceContext | undefined;

                    if (options && options.root) {
                        newCtx = createDistributedTraceContext();
                    } else {
                        newCtx = createDistributedTraceContext(parent || host.getTraceCtx());
                        if (newCtx.parentCtx) {
                            parentCtx = newCtx.parentCtx;
                        }
                    }

                    // Always generate a new spanId
                    newCtx.spanId = strSubstr(generateW3CId(), 0, 16);

                    // Get configuration from the core if available
                    let isRecording = options?.recording !== false;
                    if (this._core && this._core.config && this._core.config.traceCfg && this._core.config.traceCfg.suppressTracing) {
                        isRecording = false;
                    }
                    
                    // Create the span context
                    const spanCtx: IOTelSpanCtx = {
                        api: this._mockApi,
                        spanContext: newCtx,
                        attributes: options?.attributes,
                        startTime: options?.startTime,
                        isRecording: isRecording,
                        onEnd: actualOnEnd
                    };

                    if (parentCtx) {
                        objDefine(spanCtx, "parentSpanContext", {
                            v: parentCtx,
                            w: false
                        });
                    }

                    return createSpan(spanCtx, name, options?.kind || eOTelSpanKind.INTERNAL);
                },
                getProviderId: (): string => "test-provider",
                isAvailable: (): boolean => true
            };
            
            return provider;
        });
    }

    /**
     * Helper function to set up AppInsightsCore with trace provider
     */
    private _setupCore(config?: Partial<IConfiguration>): AppInsightsCore {
        this._core = new AppInsightsCore();
        
        // Create a simple test channel
        const testChannel = {
            identifier: "TestChannel",
            priority: 1001,
            initialize: () => {},
            processTelemetry: () => {},
            teardown: () => {},
            isInitialized: () => true
        };
        
        const coreConfig: IConfiguration = {
            instrumentationKey: "test-ikey-12345",
            traceCfg: {
                serviceName: "test-service"
            },
            ...config
        };

        // Initialize the core with the test channel
        this._core.initialize(coreConfig, [testChannel]);

        // Set up the trace provider
        const traceProvider = this._createTestTraceProvider(this._core);
        this._core.setTraceProvider(traceProvider);

        return this._core;
    }

    public registerTests() {
        this.testCase({
            name: "createSpan: should create span with basic properties",
            test: () => {
                // Arrange
                const spanName = "test-span";
                const spanKind = eOTelSpanKind.CLIENT;
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };

                // Act
                const span = createSpan(spanCtx, spanName, spanKind);

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.equal(span.name, spanName, "Span name should match");
                Assert.equal(span.kind, spanKind, "Span kind should match");
                Assert.equal(span.spanContext().traceId, this._mockSpanContext.traceId, "Trace ID should match");
                Assert.equal(span.spanContext().spanId, this._mockSpanContext.spanId, "Span ID should match");
                Assert.ok(span.isRecording(), "Span should be recording by default");
                Assert.ok(!span.ended, "Span should not be ended initially");
            }
        });

        this.testCase({
            name: "suppressTracing: span with suppressTracing config should not be recording",
            test: () => {
                // Arrange - create mock API with suppressTracing enabled
                const mockApiWithSuppression: IOTelApi = {
                    cfg: {
                        traceCfg: {
                            suppressTracing: true
                        } as ITraceCfg,
                        errorHandlers: {}
                    } as IOTelConfig
                } as IOTelApi;

                const spanCtx: IOTelSpanCtx = {
                    api: mockApiWithSuppression,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };

                // Act
                const span = createSpan(spanCtx, "suppressed-span", eOTelSpanKind.CLIENT);

                // Assert
                Assert.ok(!span.isRecording(), "Span should not be recording when suppressTracing is enabled");
                Assert.ok(span, "Span should still be created");
                Assert.equal(span.name, "suppressed-span", "Span name should be set correctly");
            }
        });

        this.testCase({
            name: "suppressTracing: suppressTracing() helper should set config and return context",
            test: () => {
                // Arrange - create a context with traceCfg (following IConfiguration pattern)
                const testContext = {
                    traceCfg: {
                        suppressTracing: false
                    } as ITraceCfg
                };

                // Act
                const returnedContext = suppressTracing(testContext);

                // Assert
                Assert.equal(returnedContext, testContext, "suppressTracing should return the same context");
                Assert.ok(testContext.traceCfg.suppressTracing, "suppressTracing config should be set to true");
                Assert.ok(isTracingSuppressed(testContext), "isTracingSuppressed should return true");
            }
        });

        this.testCase({
            name: "suppressTracing: unsuppressTracing() helper should clear config and return context",
            test: () => {
                // Arrange - create a context with suppressTracing enabled (following IConfiguration pattern)
                const testContext = {
                    traceCfg: {
                        suppressTracing: true
                    } as ITraceCfg
                };

                // Act
                const returnedContext = unsuppressTracing(testContext);

                // Assert
                Assert.equal(returnedContext, testContext, "unsuppressTracing should return the same context");
                Assert.ok(!testContext.traceCfg.suppressTracing, "suppressTracing config should be set to false");
                Assert.ok(!isTracingSuppressed(testContext), "isTracingSuppressed should return false");
            }
        });

        this.testCase({
            name: "createSpan: should create span with options",
            test: () => {
                // Arrange
                const spanName = "test-span-with-options";
                const spanKind = eOTelSpanKind.SERVER;
                const attributes: IOTelAttributes = {
                    "service.name": "test-service",
                    "http.method": "GET",
                    "http.status_code": 200
                };

                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };

                // Act
                const span = createSpan(spanCtx, spanName, spanKind);
                
                // Set attributes after creation
                span.setAttributes(attributes);

                // Assert
                Assert.ok(span, "Span should be created");
                Assert.equal(span.name, spanName, "Span name should match");
                Assert.equal(span.kind, spanKind, "Span kind should match");
                Assert.ok(span.isRecording(), "Span should be recording");
                Assert.ok(!span.ended, "Span should not be ended initially");
            }
        });

        this.testCase({
            name: "createSpan: should end span and call onEnd callback",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Act
                span.end();

                // Assert
                Assert.ok(span.ended, "Span should be marked as ended");
                Assert.equal(this._onEndCalls.length, 1, "onEnd callback should be called once");
                Assert.equal(this._onEndCalls[0], span, "onEnd should be called with the span");
            }
        });

        this.testCase({
            name: "createSpan: should set and get attributes",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Act
                span.setAttribute("http.method", "POST");
                span.setAttribute("http.status_code", 201);
                span.setAttributes({
                    "service.name": "test-service",
                    "user.authenticated": true
                });

                // Assert - Note: The exact attribute retrieval method depends on implementation
                // This test verifies that setAttribute and setAttributes don't throw errors
                Assert.ok(span, "Span should still be valid after setting attributes");
                Assert.ok(span.isRecording(), "Span should still be recording");
            }
        });

        this.testCase({
            name: "createSpan: should set span status",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Act
                span.setStatus({
                    code: eOTelSpanStatusCode.ERROR,
                    message: "Something went wrong"
                });

                // Assert
                Assert.ok(span, "Span should still be valid after setting status");
                Assert.ok(span.isRecording(), "Span should still be recording");
            }
        });

        this.testCase({
            name: "createSpan: should handle events (not yet implemented)",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Act & Assert - Currently events are not supported, so this test just verifies span remains valid
                // span.addEvent("request.started"); // Not implemented yet
                // span.addEvent("response.received", { ... }); // Not implemented yet

                Assert.ok(span, "Span should still be valid");
                Assert.ok(span.isRecording(), "Span should still be recording");
            }
        });

        this.testCase({
            name: "createSpan: should record exception",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                const testError = new Error("Test error");

                // Act
                span.recordException(testError);
                span.recordException({
                    name: "CustomError",
                    message: "Custom error message",
                    stack: "Error stack trace"
                });

                // Assert
                Assert.ok(span, "Span should still be valid after recording exceptions");
                Assert.ok(span.isRecording(), "Span should still be recording");
            }
        });

        this.testCase({
            name: "createSpan: should update span name",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "original-name", eOTelSpanKind.CLIENT);

                // Act
                span.updateName("updated-name");

                // Assert
                Assert.equal(span.name, "updated-name", "Span name should be updated");
                Assert.ok(span.isRecording(), "Span should still be recording");
            }
        });

        this.testCase({
            name: "createSpan: should handle multiple end calls gracefully",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Act
                span.end();
                span.end(); // Second call should be ignored
                span.end(); // Third call should be ignored

                // Assert
                Assert.ok(span.ended, "Span should be marked as ended");
                Assert.equal(this._onEndCalls.length, 1, "onEnd callback should be called only once");
            }
        });

        this.testCase({
            name: "createSpan: should not record operations after span is ended",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                span.end();

                // Act & Assert - These operations should not throw but should be ignored
                span.setAttribute("test.attr", "test-value");
                // span.addEvent("test.event"); // Not implemented yet
                span.setStatus({ code: eOTelSpanStatusCode.ERROR });
                span.updateName("new-name");
                span.recordException(new Error("Test error"));

                // The span name should not change after ending
                Assert.equal(span.name, "test-span", "Span name should not change after ending");
                Assert.ok(span.ended, "Span should remain ended");
                Assert.ok(!span.isRecording(), "Span should not be recording after ending");
            }
        });

        this.testCase({
            name: "createSpan: should handle invalid attribute values",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Act & Assert - These should not throw errors
                span.setAttribute("", "empty-key");
                span.setAttribute("null-value", null as any);
                span.setAttribute("undefined-value", undefined as any);
                span.setAttribute("object-value", { nested: "object" } as any);
                span.setAttribute("array-value", [1, 2, 3] as any);

                Assert.ok(span, "Span should remain valid after setting invalid attributes");
                Assert.ok(span.isRecording(), "Span should still be recording");
            }
        });

        this.testCase({
            name: "createSpan: should work with different span kinds",
            test: () => {
                // Test each span kind
                const spanKinds = [
                    eOTelSpanKind.INTERNAL,
                    eOTelSpanKind.SERVER,
                    eOTelSpanKind.CLIENT,
                    eOTelSpanKind.PRODUCER,
                    eOTelSpanKind.CONSUMER
                ];

                spanKinds.forEach((kind, index) => {
                    // Arrange
                    const spanCtx: IOTelSpanCtx = {
                        api: this._mockApi,
                        spanContext: this._mockSpanContext,
                        onEnd: (span) => this._onEndCalls.push(span)
                    };

                    // Act
                    const span = createSpan(spanCtx, `test-span-${index}`, kind);

                    // Assert
                    Assert.ok(span, `Span should be created for kind ${kind}`);
                    Assert.equal(span.kind, kind, `Span kind should match ${kind}`);
                    Assert.ok(span.isRecording(), `Span should be recording for kind ${kind}`);
                });
            }
        });

        this.testCase({
            name: "createSpan: should handle span context correctly",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };

                // Act
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                const spanContext = span.spanContext();

                // Assert
                Assert.ok(spanContext, "Span context should be available");
                Assert.equal(spanContext.traceId, this._mockSpanContext.traceId, "Trace ID should match");
                Assert.equal(spanContext.spanId, this._mockSpanContext.spanId, "Span ID should match");
                Assert.equal(spanContext.traceFlags, this._mockSpanContext.traceFlags, "Trace flags should match");
            }
        });

        // === AppInsightsCore Integration Tests ===

        this.testCase({
            name: "AppInsightsCore Integration: should create span using core.startSpan with trace provider",
            test: () => {
                // Arrange
                const core = this._setupCore();

                // Act
                const span = core.startSpan("integration-test-span", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "service.name": "test-service",
                        "operation.type": "web-request"
                    }
                });

                // Assert
                Assert.ok(span, "Span should be created via core.startSpan");
                const readableSpan = span! as IReadableSpan;
                Assert.equal(readableSpan.name, "integration-test-span", "Span name should match");
                Assert.equal(readableSpan.kind, eOTelSpanKind.SERVER, "Span kind should match");
                Assert.ok(span!.isRecording(), "Span should be recording");
                Assert.ok(!readableSpan.ended, "Span should not be ended initially");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should call onEnd callback when span ends",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const span = core.startSpan("callback-test-span");
                Assert.equal(this._onEndCalls.length, 0, "No onEnd calls initially");

                // Act
                Assert.ok(span, "Span should be created");
                span!.end();

                // Assert
                const readableSpan = span! as IReadableSpan;
                Assert.ok(readableSpan.ended, "Span should be ended");
                Assert.equal(this._onEndCalls.length, 1, "onEnd callback should be called once");
                Assert.equal(this._onEndCalls[0].name, "callback-test-span", "onEnd should receive the correct span");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should inherit trace context from core",
            test: () => {
                // Arrange
                const core = this._setupCore();
                
                // Set a specific trace context on the core
                const parentTraceContext = createDistributedTraceContext({
                    traceId: "parent-trace-12345678901234567890123456789012",
                    spanId: "parent-span-1234567890123456",
                    traceFlags: 1
                });
                core.setTraceCtx(parentTraceContext);

                // Act
                const span = core.startSpan("child-span");

                // Assert
                Assert.ok(span, "Child span should be created");
                const spanContext = span!.spanContext();
                Assert.equal(spanContext.traceId, parentTraceContext.traceId, "Child span should inherit parent trace ID");
                Assert.notEqual(spanContext.spanId, parentTraceContext.spanId, "Child span should have different span ID");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should handle configuration with suppressTracing",
            test: () => {
                // Arrange
                const core = this._setupCore({
                    traceCfg: {
                        suppressTracing: true,
                        serviceName: "suppressed-service"
                    }
                });

                // Act
                const span = core.startSpan("suppressed-span");

                // Assert
                Assert.ok(span, "Span should still be created when suppressTracing is enabled");
                const readableSpan = span! as IReadableSpan;
                Assert.ok(!span!.isRecording(), "Span should not be recording when suppressTracing is enabled");
                Assert.equal(readableSpan.name, "suppressed-span", "Span name should be set correctly");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should support active span management",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");

                // Act
                const span = core.startSpan("active-span-test");
                Assert.ok(span, "Span should be created");
                
                // Debug: Check if trace provider exists
                const traceProvider = core.getTraceProvider!();
                Assert.ok(traceProvider, "Trace provider should exist");
                Assert.ok(traceProvider!.isAvailable(), "Trace provider should be available");
                
                // Debug: Check trace provider before setActiveSpan
                const providerActiveSpanBefore = core.getActiveSpan();
                Assert.equal(providerActiveSpanBefore, initialActiveSpan, "Trace provider should return the initially active span before setActiveSpan");
                
                // Manually set as active span (this would normally be done by startActiveSpan)
                const scope = core.setActiveSpan(span!);

                // Assert scope object
                Assert.ok(scope, "Scope should be returned");
                Assert.equal(scope.span, span, "Scope.span should equal the passed span");

                // Debug: Check trace provider directly after setActiveSpan
                const providerActiveSpanAfter = core.getActiveSpan();
                Assert.ok(providerActiveSpanAfter, "Trace provider should have active span after setActiveSpan");
                Assert.equal(providerActiveSpanAfter, span, "Trace provider active span should be the same instance");

                // Assert
                const activeSpan = core.getActiveSpan();
                Assert.ok(activeSpan, "Active span should be available");
                if (activeSpan) {
                    const readableActiveSpan = activeSpan as IReadableSpan;
                    Assert.equal(readableActiveSpan.name, "active-span-test", "Active span should be the correct span");
                    Assert.equal(activeSpan, span, "Active span should be the same instance");
                }
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should create child spans with proper parent-child relationship",
            test: () => {
                // Arrange
                const core = this._setupCore();
                
                // Act
                const parentSpan = core.startSpan("parent-operation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: { "operation.name": "process-request" }
                });
                Assert.ok(parentSpan, "Parent span should be created");
                
                // Set parent as active
                const scope = core.setActiveSpan(parentSpan!);
                const activeSpan = core.getActiveSpan();
                
                // Assert scope and activeSpan
                Assert.ok(scope, "Scope should be returned");
                Assert.equal(scope.span, parentSpan, "Scope.span should equal the parent span");
                Assert.equal(activeSpan, parentSpan, "GetGetGetGetGetGetGetGetGetActiveSpan() should return the parent span");
                
                const childSpan = core.startSpan("child-operation", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: { "operation.name": "database-query" }
                });
                Assert.ok(childSpan, "Child span should be created");

                // Assert
                const parentContext = parentSpan!.spanContext();
                const childContext = childSpan!.spanContext();
                
                Assert.equal(childContext.traceId, parentContext.traceId, "Child should have same trace ID as parent");
                Assert.notEqual(childContext.spanId, parentContext.spanId, "Child should have different span ID from parent");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should handle span attributes and status correctly",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const span = core.startSpan("attribute-test-span", {
                    attributes: {
                        "initial.attribute": "initial-value"
                    }
                });

                // Act
                Assert.ok(span, "Span should be created");
                span!.setAttribute("http.method", "POST");
                span!.setAttribute("http.status_code", 201);
                span!.setAttributes({
                    "service.version": "1.2.3",
                    "user.authenticated": true
                });
                
                span!.setStatus({
                    code: eOTelSpanStatusCode.OK,
                    message: "Operation completed successfully"
                });

                // Assert
                const readableSpan = span! as IReadableSpan;
                Assert.ok(span!.isRecording(), "Span should still be recording");
                Assert.ok(!readableSpan.ended, "Span should not be ended");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should handle span lifecycle properly",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const span = core.startSpan("lifecycle-test-span");
                Assert.equal(this._onEndCalls.length, 0, "No onEnd calls initially");

                // Act - Perform operations during span lifetime
                Assert.ok(span, "Span should be created");
                span!.setAttribute("test.phase", "active");
                span!.recordException(new Error("Test exception for logging"));
                span!.updateName("lifecycle-test-span-updated");
                
                // End the span
                span!.end();

                // Assert
                const readableSpan = span! as IReadableSpan;
                Assert.ok(readableSpan.ended, "Span should be ended");
                Assert.equal(readableSpan.name, "lifecycle-test-span-updated", "Span name should be updated");
                Assert.ok(!span!.isRecording(), "Span should not be recording after ending");
                Assert.equal(this._onEndCalls.length, 1, "onEnd callback should be called once");
                
                // Verify operations after end are ignored
                span!.setAttribute("test.phase", "completed");
                span!.updateName("should-not-change");
                Assert.equal(readableSpan.name, "lifecycle-test-span-updated", "Span name should not change after ending");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should handle multiple spans and proper cleanup",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const spans: IReadableSpan[] = [];

                // Act - Create multiple spans
                for (let i = 0; i < 5; i++) {
                    const span = core.startSpan(`batch-span-${i}`, {
                        kind: eOTelSpanKind.INTERNAL,
                        attributes: {
                            "span.index": i,
                            "batch.id": "test-batch-123"
                        }
                    });
                    Assert.ok(span, `Span ${i} should be created`);
                    spans.push(span!);
                }

                // End all spans
                spans.forEach(span => span.end());

                // Assert
                Assert.equal(spans.length, 5, "Should have created 5 spans");
                Assert.equal(this._onEndCalls.length, 5, "Should have 5 onEnd callback calls");
                
                spans.forEach((span, index) => {
                    const readableSpan = span as IReadableSpan;
                    Assert.ok(readableSpan.ended, `Span ${index} should be ended`);
                    Assert.equal(readableSpan.name, `batch-span-${index}`, `Span ${index} should have correct name`);
                });
                
                // Verify all spans in onEnd calls
                this._onEndCalls.forEach((readableSpan, index) => {
                    Assert.equal(readableSpan.name, `batch-span-${index}`, `onEnd span ${index} should have correct name`);
                });
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should handle trace provider configuration changes",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const originalProvider = core.getTraceProvider();
                Assert.ok(originalProvider, "Original trace provider should be available");

                // Act - Create new trace provider with different onEnd behavior
                let alternativeOnEndCalls: IReadableSpan[] = [];
                const newProvider = this._createTestTraceProvider(core, (span) => {
                    alternativeOnEndCalls.push(span);
                });
                
                core.setTraceProvider(newProvider);
                const updatedProvider = core.getTraceProvider();

                // Create spans with new provider
                const span1 = core.startSpan("provider-change-test-1");
                Assert.ok(span1, "Span should be created with new provider");
                span1!.end();

                // Assert
                Assert.notEqual(updatedProvider, originalProvider, "Trace provider should be updated");
                Assert.equal(this._onEndCalls.length, 0, "Original onEnd callback should not be called");
                Assert.equal(alternativeOnEndCalls.length, 1, "New onEnd callback should be called");
                Assert.equal(alternativeOnEndCalls[0].name, "provider-change-test-1", "New callback should receive correct span");
            }
        });

        this.testCase({
            name: "AppInsightsCore Integration: should handle configuration inheritance from core config",
            test: () => {
                // Arrange
                const core = this._setupCore({
                    traceCfg: {
                        serviceName: "integration-test-service",
                        generalLimits: {
                            attributeCountLimit: 64,
                            attributeValueLengthLimit: 256
                        // },
                        // spanLimits: {
                        //     attributeCountLimit: 32,
                        //     eventCountLimit: 16,
                        //     linkCountLimit: 8
                        }
                    }
                });

                // Act
                const span = core.startSpan("config-inheritance-test", {
                    attributes: {
                        "service.name": "integration-test-service", // Should inherit from traceCfg
                        "test.configured": true
                    }
                });

                // Assert
                Assert.ok(span, "Span should be created with inherited configuration");
                const readableSpan = span! as IReadableSpan;
                Assert.ok(span!.isRecording(), "Span should be recording");
                
                // The span should exist and be functional - detailed config validation
                // would require access to internal span configuration which is not exposed
                Assert.equal(readableSpan.name, "config-inheritance-test", "Span name should be correct");
            }
        });

        // === Tracer startActiveSpan Tests ===

        this.testCase({
            name: "Tracer.startActiveSpan: should set span as active during callback execution",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                const initialActiveSpan = core.getActiveSpan();

                let activeSpanInsideCallback: IReadableSpan | null | undefined = null;
                let callbackExecuted = false;

                // Act
                const result = tracer.startActiveSpan("test-operation", (span) => {
                    callbackExecuted = true;
                    
                    // Check if the span is set as active in the host instance
                    activeSpanInsideCallback = core.getActiveSpan();
                    
                    span.setAttribute("test.key", "test-value");
                    return "callback-result";
                });

                // Assert
                Assert.ok(callbackExecuted, "Callback should have been executed");
                Assert.equal(result, "callback-result", "Should return callback result");
                Assert.ok(activeSpanInsideCallback, "Active span should be set during callback");
                Assert.equal(activeSpanInsideCallback?.name, "test-operation", "Active span should be the created span");
                
                // Verify active span is restored after callback
                const activeSpanAfterCallback = core.getActiveSpan();
                Assert.equal(activeSpanAfterCallback, initialActiveSpan, "Active span should be restored to initial state");
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: should automatically end span after callback completes",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                
                let spanInsideCallback: IReadableSpan | null = null;
                const initialOnEndCount = this._onEndCalls.length;

                // Act
                tracer.startActiveSpan("auto-end-test", (span) => {
                    spanInsideCallback = span;
                    Assert.ok(!span.ended, "Span should not be ended during callback");
                    span.setAttribute("operation.type", "test");
                });

                // Assert
                Assert.ok(spanInsideCallback, "Span should have been passed to callback");
                Assert.ok(spanInsideCallback!.ended, "Span should be ended after callback completes");
                Assert.equal(this._onEndCalls.length, initialOnEndCount + 1, "onEnd should have been called");
                Assert.equal(this._onEndCalls[this._onEndCalls.length - 1].name, "auto-end-test", "onEnd should receive the correct span");
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: should handle nested startActiveSpan calls",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                
                const executionTrace: string[] = [];

                // Act
                const result = tracer.startActiveSpan("outer-operation", (outerSpan) => {
                    const outerActiveSpan = core.getActiveSpan();
                    executionTrace.push(`outer-start: ${outerActiveSpan?.name}`);
                    
                    outerSpan.setAttribute("level", "outer");
                    
                    // Nested startActiveSpan
                    const innerResult = tracer.startActiveSpan("inner-operation", (innerSpan) => {
                        const innerActiveSpan = core.getActiveSpan();
                        executionTrace.push(`inner: ${innerActiveSpan?.name}`);
                        
                        innerSpan.setAttribute("level", "inner");
                        
                        // Verify the inner span is now active
                        Assert.equal(innerActiveSpan?.name, "inner-operation", "Inner span should be active during inner callback");
                        
                        return "inner-result";
                    });
                    
                    // After inner callback, outer should be active again
                    const outerActiveSpanRestored = core.getActiveSpan();
                    executionTrace.push(`outer-end: ${outerActiveSpanRestored?.name}`);
                    
                    Assert.equal(outerActiveSpanRestored?.name, "outer-operation", "Outer span should be restored as active after inner callback");
                    
                    return `outer(${innerResult})`;
                });

                // Assert
                Assert.equal(result, "outer(inner-result)", "Nested startActiveSpan should work correctly");
                Assert.equal(executionTrace.length, 3, "Should have captured 3 execution points");
                Assert.equal(executionTrace[0], "outer-start: outer-operation", "Outer callback should see outer span active");
                Assert.equal(executionTrace[1], "inner: inner-operation", "Inner callback should see inner span active");
                Assert.equal(executionTrace[2], "outer-end: outer-operation", "Outer callback should see outer span restored after inner");
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: should handle async callback with active span management",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                const initialActiveSpan = core.getActiveSpan();
                
                let activeSpanDuringAsync: IReadableSpan | null | undefined = null;

                // Act
                return tracer.startActiveSpan("async-operation", async (span) => {
                    // Check active span at start
                    activeSpanDuringAsync = core.getActiveSpan();
                    Assert.equal(activeSpanDuringAsync?.name, "async-operation", "Span should be active at start of async callback");
                    
                    span.setAttribute("async.phase", "start");
                    
                    // Simulate async operation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Check active span after async operation
                    const activeSpanAfterAwait = core.getActiveSpan();
                    Assert.equal(activeSpanAfterAwait?.name, "async-operation", "Span should still be active after await");
                    
                    span.setAttribute("async.phase", "end");
                    
                    return "async-result";
                }).then(result => {
                    // Assert
                    Assert.equal(result, "async-result", "Should return async callback result");
                    Assert.ok(activeSpanDuringAsync, "Active span should have been set during callback");
                    
                    // Verify active span is restored after async callback completes
                    const activeSpanAfterCallback = core.getActiveSpan();
                    Assert.equal(activeSpanAfterCallback, initialActiveSpan, "Active span should be restored after async callback");
                });
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: should handle exceptions and still restore active span",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                const initialActiveSpan = core.getActiveSpan();
                
                let spanInsideCallback: IReadableSpan | null = null;
                let exceptionThrown = false;

                // Act
                try {
                    tracer.startActiveSpan("error-operation", (span) => {
                        spanInsideCallback = span;
                        const activeSpan = core.getActiveSpan();
                        Assert.equal(activeSpan?.name, "error-operation", "Span should be active before exception");
                        
                        throw new Error("Test exception");
                    });
                } catch (error: any) {
                    exceptionThrown = true;
                    Assert.equal(error.message, "Test exception", "Should propagate exception");
                }

                // Assert
                Assert.ok(exceptionThrown, "Exception should have been thrown");
                Assert.ok(spanInsideCallback, "Span should have been created");
                Assert.ok(spanInsideCallback!.ended, "Span should be ended even after exception");
                
                // Verify active span is restored even after exception
                const activeSpanAfterException = core.getActiveSpan();
                Assert.equal(activeSpanAfterException, initialActiveSpan, "Active span should be restored even after exception");
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: should work with options parameter",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                
                let activeSpanInsideCallback: IReadableSpan | null | undefined = null;

                // Act
                const result = tracer.startActiveSpan("options-test", 
                    {
                        kind: eOTelSpanKind.SERVER,
                        attributes: {
                            "http.method": "POST",
                            "http.route": "/api/test"
                        }
                    },
                    (span) => {
                        activeSpanInsideCallback = core.getActiveSpan();
                        
                        Assert.equal(span.kind, eOTelSpanKind.SERVER, "Span kind should match options");
                        span.setAttribute("response.status", 200);
                        
                        return "options-result";
                    }
                );

                // Assert
                Assert.equal(result, "options-result", "Should return callback result");
                Assert.ok(activeSpanInsideCallback, "Active span should be set during callback");
                Assert.equal(activeSpanInsideCallback?.name, "options-test", "Active span should be the created span");
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: child spans should inherit parent from active span",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const otelApi = createOTelApi({ host: core });
                const tracer = otelApi.trace.getTracer("test-tracer");
                
                let parentSpanId: string | undefined;
                let childSpanParentId: string | undefined;

                // Act
                tracer.startActiveSpan("parent-operation", (parentSpan) => {
                    parentSpanId = parentSpan.spanContext().spanId;
                    
                    // Create a child span using startSpan (not startActiveSpan)
                    // It should automatically use the active span (parent-operation) as parent
                    const childSpan = core.startSpan("child-operation");
                    
                    Assert.ok(childSpan, "Child span should be created");
                    const childContext = childSpan!.spanContext();
                    childSpanParentId = childSpan!.parentSpanId;
                    
                    // Verify parent-child relationship
                    Assert.equal(childContext.traceId, parentSpan.spanContext().traceId, "Child should have same trace ID as parent");
                    
                    childSpan!.end();
                });

                // Assert
                Assert.ok(parentSpanId, "Parent span ID should be captured");
                Assert.equal(childSpanParentId, parentSpanId, "Child span parent ID should match parent span ID");
            }
        });

        // === withSpan Helper Tests ===

        this.testCase({
            name: "withSpan: should execute function with span as active span",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const testSpan = core.startSpan("withSpan-test-active");
                Assert.ok(testSpan, "Test span should be created");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                const testFunction = () => {
                    capturedActiveSpan = core.getActiveSpan();
                    return "test-result";
                };

                // Act
                const result = withSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "test-result", "withSpan should return function result");
                Assert.ok(capturedActiveSpan, "Function should have access to active span");
                Assert.equal(capturedActiveSpan, testSpan, "Active span should be the provided span");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Active span should be restored after execution");
            }
        });

        this.testCase({
            name: "withSpan: should restore previous active span after execution",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const previousSpan = core.startSpan("previous-span");
                const testSpan = core.startSpan("withSpan-test-restore");
                Assert.ok(previousSpan && testSpan, "Both spans should be created");
                
                // Set previous span as active
                core.setActiveSpan(previousSpan!);
                Assert.equal(core.getActiveSpan(), previousSpan, "Previous span should be active initially");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                const testFunction = () => {
                    capturedActiveSpan = core.getActiveSpan();
                    return 42;
                };

                // Act
                const result = withSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, 42, "withSpan should return function result");
                Assert.equal(capturedActiveSpan, testSpan, "Function should have access to test span");
                Assert.equal(core.getActiveSpan(), previousSpan, "Previous active span should be restored");
            }
        });

        this.testCase({
            name: "withSpan: should handle function with arguments",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("withSpan-test-args");
                Assert.ok(testSpan, "Test span should be created");
                
                let capturedArgs: any[] = [];
                const testFunction = (...args: any[]) => {
                    capturedArgs = args;
                    return args.reduce((sum, val) => sum + val, 0);
                };

                // Act
                const result = withSpan(core, testSpan!, testFunction, undefined, 10, 20, 30);

                // Assert
                Assert.equal(result, 60, "withSpan should return correct sum");
                Assert.equal(capturedArgs.length, 3, "Function should receive all arguments");
                Assert.equal(capturedArgs[0], 10, "First argument should be correct");
                Assert.equal(capturedArgs[1], 20, "Second argument should be correct");
                Assert.equal(capturedArgs[2], 30, "Third argument should be correct");
            }
        });

        this.testCase({
            name: "withSpan: should handle function with thisArg context",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("withSpan-test-this");
                Assert.ok(testSpan, "Test span should be created");
                
                const contextObject = {
                    value: 100,
                    getValue: function(multiplier: number) {
                        return this.value * multiplier;
                    }
                };
                
                // Act
                const result = withSpan(core, testSpan!, contextObject.getValue, contextObject, 2);

                // Assert
                Assert.equal(result, 200, "withSpan should execute with correct this context");
            }
        });

        this.testCase({
            name: "withSpan: should handle exceptions and still restore active span",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const previousSpan = core.startSpan("previous-span-exception");
                const testSpan = core.startSpan("withSpan-test-exception");
                Assert.ok(previousSpan && testSpan, "Both spans should be created");
                
                core.setActiveSpan(previousSpan!);
                
                const testFunction = () => {
                    throw new Error("Test exception");
                };

                // Act & Assert
                let thrownError: Error | null = null;
                try {
                    withSpan(core, testSpan!, testFunction);
                } catch (error) {
                    thrownError = error as Error;
                }

                Assert.ok(thrownError, "Exception should be thrown");
                Assert.equal(thrownError!.message, "Test exception", "Exception message should be preserved");
                Assert.equal(core.getActiveSpan(), previousSpan, "Previous active span should be restored even after exception");
            }
        });

        this.testCase({
            name: "withSpan: should work with functions returning different types",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("withSpan-test-types");
                Assert.ok(testSpan, "Test span should be created");

                // Test string return
                const stringResult = withSpan(core, testSpan!, () => "hello world");
                Assert.equal(stringResult, "hello world", "String return should work");

                // Test number return
                const numberResult = withSpan(core, testSpan!, () => 123.45);
                Assert.equal(numberResult, 123.45, "Number return should work");

                // Test boolean return
                const booleanResult = withSpan(core, testSpan!, () => true);
                Assert.equal(booleanResult, true, "Boolean return should work");

                // Test object return
                const objectResult = withSpan(core, testSpan!, () => ({ key: "value" }));
                Assert.ok(objectResult && objectResult.key === "value", "Object return should work");

                // Test undefined return
                const undefinedResult = withSpan(core, testSpan!, () => undefined);
                Assert.equal(undefinedResult, undefined, "Undefined return should work");

                // Test null return
                const nullResult = withSpan(core, testSpan!, () => null);
                Assert.equal(nullResult, null, "Null return should work");
            }
        });

        this.testCase({
            name: "withSpan: should work with async-like function patterns",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const testSpan = core.startSpan("withSpan-test-async-pattern");
                Assert.ok(testSpan, "Test span should be created");
                
                let spanDuringExecution: IReadableSpan | null = null;
                
                // Simulate async-like pattern with callback
                const asyncFunction = (callback: (result: string) => void) => {
                    spanDuringExecution = core.getActiveSpan();
                    // Simulate some async work completing synchronously for this test
                    callback("async-result");
                    return "function-result";
                };

                let callbackResult = "";
                const callback = (result: string) => {
                    callbackResult = result;
                };

                // Act
                const result = withSpan(core, testSpan!, asyncFunction, undefined, callback);

                // Assert
                Assert.equal(result, "function-result", "withSpan should return main function result");
                Assert.equal(callbackResult, "async-result", "Callback should be executed");
                Assert.equal(spanDuringExecution, testSpan, "Active span should be available during execution");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Active span should be restored after completion");
            }
        });

        this.testCase({
            name: "withSpan: should work when no previous active span exists",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                const testSpan = core.startSpan("withSpan-test-no-previous");
                Assert.ok(testSpan, "Test span should be created");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Just starting a span should not change active span");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                const testFunction = () => {
                    capturedActiveSpan = core.getActiveSpan();
                    return "success";
                };

                // Act
                const result = withSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "success", "Function should execute successfully");
                Assert.equal(capturedActiveSpan, testSpan, "Test span should be active during execution");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "No active span should be restored");
            }
        });

        this.testCase({
            name: "withSpan: should work with nested withSpan calls",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const outerSpan = core.startSpan("outer-span");
                const innerSpan = core.startSpan("inner-span");
                Assert.ok(outerSpan && innerSpan, "Both spans should be created");
                
                const executionTrace: string[] = [];
                
                const innerFunction = () => {
                    const activeSpan = core.getActiveSpan();
                    executionTrace.push(`inner: ${activeSpan ? (activeSpan as IReadableSpan).name : 'null'}`);
                    return "inner-result";
                };
                
                const outerFunction = () => {
                    const activeSpanBefore = core.getActiveSpan();
                    executionTrace.push(`outer-start: ${activeSpanBefore ? (activeSpanBefore as IReadableSpan).name : 'null'}`);
                    
                    const innerResult = withSpan(core, innerSpan!, innerFunction);
                    
                    const activeSpanAfter = core.getActiveSpan();
                    executionTrace.push(`outer-end: ${activeSpanAfter ? (activeSpanAfter as IReadableSpan).name : 'null'}`);
                    
                    return `outer(${innerResult})`;
                };

                // Act
                const result = withSpan(core, outerSpan!, outerFunction);

                // Assert
                Assert.equal(result, "outer(inner-result)", "Nested withSpan should work correctly");
                Assert.equal(executionTrace.length, 3, "Should have captured 3 execution points");
                Assert.equal(executionTrace[0], "outer-start: outer-span", "Outer function should see outer span");
                Assert.equal(executionTrace[1], "inner: inner-span", "Inner function should see inner span");
                Assert.equal(executionTrace[2], "outer-end: outer-span", "Outer function should see outer span restored");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "No active span should remain after nested execution");
            }
        });

        this.testCase({
            name: "withSpan: should handle span operations within withSpan context",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const testSpan = core.startSpan("withSpan-test-operations");
                Assert.ok(testSpan, "Test span should be created");
                
                const testFunction = () => {
                    const activeSpan = core.getActiveSpan();
                    Assert.ok(activeSpan, "Should have active span in function");
                    
                    // Perform span operations
                    activeSpan!.setAttribute("operation.name", "test-operation");
                    activeSpan!.setAttribute("operation.step", 1);
                    
                    // Create child span
                    const childSpan = core.startSpan("child-operation");
                    Assert.ok(childSpan, "Child span should be created");
                    
                    childSpan!.setAttribute("child.attribute", "child-value");
                    childSpan!.end();
                    
                    return "operations-completed";
                };

                // Act
                const result = withSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "operations-completed", "Function should complete successfully");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Active span should be restored");
                
                // Verify span operations were applied (span should still be valid)
                const readableSpan = testSpan! as IReadableSpan;
                Assert.ok(!readableSpan.ended, "Test span should not be ended");
                Assert.ok(testSpan!.isRecording(), "Test span should still be recording");
            }
        });

        this.testCase({
            name: "withSpan: should work with core that has no trace provider",
            test: () => {
                // Arrange
                const core = new AppInsightsCore();
                
                // Create a simple test channel
                const testChannel = {
                    identifier: "TestChannel",
                    priority: 1001,
                    initialize: () => {},
                    processTelemetry: () => {},
                    teardown: () => {},
                    isInitialized: () => true
                };
                
                core.initialize({ instrumentationKey: "test-key" }, [testChannel]); // Initialize with channel but no trace provider
                
                // Create a mock span (this would need to come from somewhere else since no provider)
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const mockSpan = createSpan(spanCtx, "mock-span", eOTelSpanKind.CLIENT);
                
                let functionExecuted = false;
                const testFunction = () => {
                    functionExecuted = true;
                    return "no-provider-result";
                };

                // Act
                const result = withSpan(core, mockSpan, testFunction);

                // Assert
                Assert.equal(result, "no-provider-result", "Function should execute even without trace provider");
                Assert.ok(functionExecuted, "Function should have been executed");
                
                // Cleanup
                core.unload(false);
            }
        });

        this.testCase({
            name: "withSpan: performance test - should not add significant overhead",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("withSpan-performance-test");
                Assert.ok(testSpan, "Test span should be created");
                
                const iterations = 10000;
                let computeResult = 0;
                
                const computeFunction = (base: number, multiplier: number) => {
                    // Simple computation to measure overhead
                    return base * multiplier + Math.sqrt(base);
                };

                // Measure time without withSpan
                const startWithout = perfNow();
                for (let i = 0; i < iterations; i++) {
                    computeResult += computeFunction(i, 2);
                }
                const timeWithout = perfNow() - startWithout;

                // Reset result
                computeResult = 0;

                // Measure time with withSpan
                const startWith = perfNow();
                for (let i = 0; i < iterations; i++) {
                    computeResult += withSpan(core, testSpan!, computeFunction, undefined, i, 2);
                }
                const timeWith = perfNow() - startWith;

                // Assert reasonable performance characteristics
                // withSpan should not add more than 10x overhead (very generous threshold)
                const overhead = timeWith / (timeWithout || 1);
                Assert.ok(overhead < 15, `withSpan overhead should be reasonable: ${overhead.toFixed(2)}x`);
                
                // Results should be the same
                Assert.ok(computeResult > 0, "Computations should have produced results");
            }
        });
        // === useSpan Helper Tests ===

        this.testCase({
            name: "useSpan: should execute function with span as active span",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const testSpan = core.startSpan("useSpan-test-active");
                Assert.ok(testSpan, "Test span should be created");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                const testFunction = () => {
                    capturedActiveSpan = core.getActiveSpan();
                    return "test-result";
                };

                // Act
                const result = useSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "test-result", "useSpan should return function result");
                Assert.ok(capturedActiveSpan, "Function should have access to active span");
                Assert.equal(capturedActiveSpan, testSpan, "Active span should be the provided span");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Active span should be restored after execution");
            }
        });

        this.testCase({
            name: "useSpan: should restore previous active span after execution",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const previousSpan = core.startSpan("previous-span");
                const testSpan = core.startSpan("useSpan-test-restore");
                Assert.ok(previousSpan && testSpan, "Both spans should be created");
                
                // Set previous span as active
                core.setActiveSpan(previousSpan!);
                Assert.equal(core.getActiveSpan(), previousSpan, "Previous span should be active initially");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                const testFunction = () => {
                    capturedActiveSpan = core.getActiveSpan();
                    return 42;
                };

                // Act
                const result = useSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, 42, "useSpan should return function result");
                Assert.equal(capturedActiveSpan, testSpan, "Function should have access to test span");
                Assert.equal(core.getActiveSpan(), previousSpan, "Previous active span should be restored");
            }
        });

        this.testCase({
            name: "useSpan: should handle function with arguments",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("useSpan-test-args");
                Assert.ok(testSpan, "Test span should be created");
                
                let capturedArgs: any[] = [];
                const testFunction = (scope: ISpanScope, ...args: any[]) => {
                    capturedArgs = args;
                    return args.reduce((sum, val) => sum + val, 0);
                };

                // Act
                const result = useSpan(core, testSpan!, testFunction, undefined, 10, 20, 30);

                // Assert
                Assert.equal(result, 60, "useSpan should return correct sum");
                Assert.equal(capturedArgs.length, 3, "Function should receive all arguments");
                Assert.equal(capturedArgs[0], 10, "First argument should be correct");
                Assert.equal(capturedArgs[1], 20, "Second argument should be correct");
                Assert.equal(capturedArgs[2], 30, "Third argument should be correct");
            }
        });

        this.testCase({
            name: "useSpan: should handle function with thisArg context",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("useSpan-test-this");
                Assert.ok(testSpan, "Test span should be created");
                
                const contextObject = {
                    value: 100,
                    getValue: function(scope: ISpanScope, multiplier: number) {
                        return this.value * multiplier;
                    }
                };
                
                // Act
                const result = useSpan(core, testSpan!, contextObject.getValue, contextObject, 2);

                // Assert
                Assert.equal(result, 200, "useSpan should execute with correct this context");
            }
        });

        this.testCase({
            name: "useSpan: should handle exceptions and still restore active span",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const previousSpan = core.startSpan("previous-span-exception");
                const testSpan = core.startSpan("useSpan-test-exception");
                Assert.ok(previousSpan && testSpan, "Both spans should be created");
                
                core.setActiveSpan(previousSpan!);
                
                const testFunction = () => {
                    throw new Error("Test exception");
                };

                // Act & Assert
                let thrownError: Error | null = null;
                try {
                    useSpan(core, testSpan!, testFunction);
                } catch (error) {
                    thrownError = error as Error;
                }

                Assert.ok(thrownError, "Exception should be thrown");
                Assert.equal(thrownError!.message, "Test exception", "Exception message should be preserved");
                Assert.equal(core.getActiveSpan(), previousSpan, "Previous active span should be restored even after exception");
            }
        });

        this.testCase({
            name: "useSpan: should work with functions returning different types",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("useSpan-test-types");
                Assert.ok(testSpan, "Test span should be created");

                // Test string return
                const stringResult = useSpan(core, testSpan!, () => "hello world");
                Assert.equal(stringResult, "hello world", "String return should work");

                // Test number return
                const numberResult = useSpan(core, testSpan!, () => 123.45);
                Assert.equal(numberResult, 123.45, "Number return should work");

                // Test boolean return
                const booleanResult = useSpan(core, testSpan!, () => true);
                Assert.equal(booleanResult, true, "Boolean return should work");

                // Test object return
                const objectResult = useSpan(core, testSpan!, () => ({ key: "value" }));
                Assert.ok(objectResult && objectResult.key === "value", "Object return should work");

                // Test undefined return
                const undefinedResult = useSpan(core, testSpan!, () => undefined);
                Assert.equal(undefinedResult, undefined, "Undefined return should work");

                // Test null return
                const nullResult = useSpan(core, testSpan!, () => null);
                Assert.equal(nullResult, null, "Null return should work");
            }
        });

        this.testCase({
            name: "useSpan: should work with async-like function patterns",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const testSpan = core.startSpan("useSpan-test-async-pattern");
                Assert.ok(testSpan, "Test span should be created");
                
                let spanDuringExecution: IReadableSpan | null = null;
                
                // Simulate async-like pattern with callback
                const asyncFunction = (scope: ISpanScope, callback: (result: string) => void) => {
                    spanDuringExecution = scope.span;
                    // Simulate some async work completing synchronously for this test
                    callback("async-result");
                    return "function-result";
                };

                let callbackResult = "";
                const callback = (result: string) => {
                    callbackResult = result;
                };

                // Act
                const result = useSpan(core, testSpan!, asyncFunction, undefined, callback);

                // Assert
                Assert.equal(result, "function-result", "useSpan should return main function result");
                Assert.equal(callbackResult, "async-result", "Callback should be executed");
                Assert.equal(spanDuringExecution, testSpan, "Active span should be available during execution");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Active span should be restored after completion");
            }
        });

        this.testCase({
            name: "useSpan: should work when no previous active span exists",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                const testSpan = core.startSpan("useSpan-test-no-previous");
                Assert.ok(testSpan, "Test span should be created");
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "With a traceprovider, activeSpan should not be null");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                const testFunction = () => {
                    capturedActiveSpan = core.getActiveSpan();
                    return "success";
                };

                // Act
                const result = useSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "success", "Function should execute successfully");
                Assert.equal(capturedActiveSpan, testSpan, "Test span should be active during execution");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "No active span should be restored (was null)");
            }
        });

        this.testCase({
            name: "useSpan: should work with nested useSpan calls",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const outerSpan = core.startSpan("outer-span");
                const innerSpan = core.startSpan("inner-span");
                Assert.ok(outerSpan && innerSpan, "Both spans should be created");
                
                const executionTrace: string[] = [];
                
                const innerFunction = (scope: ISpanScope) => {
                    const activeSpan = scope.span;
                    executionTrace.push(`inner: ${activeSpan ? (activeSpan as IReadableSpan).name : 'null'}`);
                    return "inner-result";
                };
                
                const outerFunction = (scope: ISpanScope) => {
                    const activeSpanBefore = scope.span;
                    executionTrace.push(`outer-start: ${activeSpanBefore ? (activeSpanBefore as IReadableSpan).name : 'null'}`);
                    
                    const innerResult = useSpan(core, innerSpan!, innerFunction);
                    
                    const activeSpanAfter = core.getActiveSpan();
                    executionTrace.push(`outer-end: ${activeSpanAfter ? (activeSpanAfter as IReadableSpan).name : 'null'}`);
                    
                    return `outer(${innerResult})`;
                };

                // Act
                const result = useSpan(core, outerSpan!, outerFunction);

                // Assert
                Assert.equal(result, "outer(inner-result)", "Nested useSpan should work correctly");
                Assert.equal(executionTrace.length, 3, "Should have captured 3 execution points");
                Assert.equal(executionTrace[0], "outer-start: outer-span", "Outer function should see outer span");
                Assert.equal(executionTrace[1], "inner: inner-span", "Inner function should see inner span");
                Assert.equal(executionTrace[2], "outer-end: outer-span", "Outer function should see outer span restored");
                Assert.equal(core.getActiveSpan?.(), initialActiveSpan, "The initial active span should be restored after nested execution");
            }
        });

        this.testCase({
            name: "useSpan: should handle span operations within useSpan context",
            test: () => {
                // Arrange
                const core = this._setupCore();
                let initialActiveSpan = core.getActiveSpan();
                Assert.ok(!isNullOrUndefined(initialActiveSpan), "Initially, activeSpan should not be null with a trace provider");
                const testSpan = core.startSpan("useSpan-test-operations");
                Assert.ok(testSpan, "Test span should be created");
                
                const testFunction = (scope: ISpanScope) => {
                    const activeSpan = scope.span;
                    Assert.ok(activeSpan, "Should have active span in function");
                    
                    // Perform span operations
                    activeSpan.setAttribute("operation.name", "test-operation");
                    activeSpan.setAttribute("operation.step", 1);
                    
                    // Create child span
                    const childSpan = core.startSpan("child-operation");
                    Assert.ok(childSpan, "Child span should be created");
                    
                    childSpan?.setAttribute("child.attribute", "child-value");
                    childSpan?.end();
                    
                    return "operations-completed";
                };

                // Act
                const result = useSpan(core, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "operations-completed", "Function should complete successfully");
                Assert.equal(core.getActiveSpan(), initialActiveSpan, "Active span should be restored");
                
                // Verify span operations were applied (span should still be valid)
                const readableSpan = testSpan! as IReadableSpan;
                Assert.ok(!readableSpan.ended, "Test span should not be ended");
                Assert.ok(testSpan!.isRecording(), "Test span should still be recording");
            }
        });

        this.testCase({
            name: "useSpan: should work with core that has no trace provider",
            test: () => {
                // Arrange
                const core = new AppInsightsCore();
                
                // Create a simple test channel
                const testChannel = {
                    identifier: "TestChannel",
                    priority: 1001,
                    initialize: () => {},
                    processTelemetry: () => {},
                    teardown: () => {},
                    isInitialized: () => true
                };
                
                core.initialize({ instrumentationKey: "test-key" }, [testChannel]); // Initialize with channel but no trace provider
                
                // Create a mock span (this would need to come from somewhere else since no provider)
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span)
                };
                const mockSpan = createSpan(spanCtx, "mock-span", eOTelSpanKind.CLIENT);
                
                let functionExecuted = false;
                const testFunction = () => {
                    functionExecuted = true;
                    return "no-provider-result";
                };

                // Act
                const result = useSpan(core, mockSpan, testFunction);

                // Assert
                Assert.equal(result, "no-provider-result", "Function should execute even without trace provider");
                Assert.ok(functionExecuted, "Function should have been executed");
                
                // Cleanup
                core.unload(false);
            }
        });

        this.testCase({
            name: "useSpan: performance test - should not add significant overhead",
            test: () => {
                // Arrange
                const core = this._setupCore();
                const testSpan = core.startSpan("useSpan-performance-test");
                Assert.ok(testSpan, "Test span should be created");
                
                const iterations = 10000;
                let computeResult = 0;
                
                const computeFunction = (_scope: ISpanScope, base: number, multiplier: number) => {
                    // Simple computation to measure overhead
                    return base * multiplier + Math.sqrt(base);
                };

                let maxOverhead: number = 100;

                // Perform multiple runs to get a stable measurement
                for (let lp = 0; lp < 10; lp++) {
                    // Measure time without useSpan
                    const startWithout = perfNow();
                    for (let i = 0; i < iterations; i++) {
                        computeResult += computeFunction(null as any as ISpanScope, i, 2);
                    }
                    const timeWithout = perfNow() - startWithout;

                    // Reset result
                    computeResult = 0;

                    // Measure time with useSpan
                    const startWith = perfNow();
                    for (let i = 0; i < iterations; i++) {
                        computeResult += useSpan(core, testSpan!, computeFunction, undefined, i, 2);
                    }

                    // Results should be the same
                    Assert.ok(computeResult > 0, "Computations should have produced results");

                    const timeWith = perfNow() - startWith;

                    const overhead = timeWith / (timeWithout || 1);

                    if (lp === 0) {
                        maxOverhead = overhead;
                    }
                    maxOverhead = mathMin(maxOverhead, overhead);
                }

                // Assert reasonable performance characteristics
                // useSpan should not add more than 10x overhead (very generous threshold)
                Assert.ok(maxOverhead < 10, `useSpan overhead should be reasonable: ${maxOverhead.toFixed(2)}x`);
                
            }
        });
    }
}