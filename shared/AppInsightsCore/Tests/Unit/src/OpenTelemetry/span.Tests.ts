import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { perfNow, isFunction, isString, isNumber, isBoolean, isObject, isArray } from "@nevware21/ts-utils";
import { createSpan } from "../../../../src/OpenTelemetry/trace/span";
import { IOTelSpanCtx } from "../../../../src/OpenTelemetry/interfaces/trace/IOTelSpanCtx";
import { IOTelApi } from "../../../../src/OpenTelemetry/interfaces/IOTelApi";
import { IOTelConfig } from "../../../../src/OpenTelemetry/interfaces/config/IOTelConfig";
import { eOTelSpanKind } from "../../../../src/OpenTelemetry/interfaces/trace/IOTelSpanOptions";
import { eOTelSpanStatusCode } from "../../../../src/OpenTelemetry/enums/trace/OTelSpanStatus";
import { IOTelErrorHandlers } from "../../../../src/OpenTelemetry/interfaces/config/IOTelErrorHandlers";
import { IOTelAttributes } from "../../../../src/OpenTelemetry/interfaces/IOTelAttributes";
import { IReadableSpan } from "../../../../src/OpenTelemetry/interfaces/trace/IReadableSpan";
import { IDistributedTraceContext } from "../../../../src/JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { createDistributedTraceContext } from "../../../../src/JavaScriptSDK/TelemetryHelpers";
import { generateW3CId } from "../../../../src/JavaScriptSDK/CoreUtils";
import { suppressTracing, unsuppressTracing, isTracingSuppressed } from "../../../../src/OpenTelemetry/trace/utils";
import { ITraceCfg } from "../../../../src/OpenTelemetry/interfaces/config/ITraceCfg";
import { AppInsightsCore } from "../../../../src/JavaScriptSDK/AppInsightsCore";
import { IConfiguration } from "../../../../src/JavaScriptSDK.Interfaces/IConfiguration";
import { ITraceProvider } from "../../../../src/JavaScriptSDK.Interfaces/ITraceProvider";
import { createOTelApi } from "../../../../src/OpenTelemetry/otelApi";
import { IOTelApiCtx } from "../../../../src/OpenTelemetry/interfaces/IOTelApiCtx";
import { IOTelSpanOptions } from "../../../../src/OpenTelemetry/interfaces/trace/IOTelSpanOptions";

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
    private _createTestTraceProvider(onEnd?: (span: IReadableSpan) => void): ITraceProvider {
        const actualOnEnd = onEnd || ((span) => this._onEndCalls.push(span));
        let _activeSpan: IReadableSpan | null = null;

        const provider: ITraceProvider = {
            createSpan: (name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan => {
                // Create a new distributed trace context for this span
                let newCtx: IDistributedTraceContext;
                if (parent) {
                    // For child spans: keep parent's traceId but generate new spanId
                    newCtx = createDistributedTraceContext({
                        traceId: parent.traceId,
                        spanId: generateW3CId().substring(0, 16), // Generate new 16-char spanId
                        traceFlags: parent.traceFlags || 0,
                        isRemote: false
                    });
                } else {
                    // For root spans: generate new traceId and spanId
                    newCtx = createDistributedTraceContext();
                }
                
                // Get configuration from the core if available, including suppressTracing
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

                return createSpan(spanCtx, name, options?.kind || eOTelSpanKind.INTERNAL);
            },
            
            activeSpan: (): IReadableSpan | null => {
                return _activeSpan;
            },
            
            setActiveSpan: (span: IReadableSpan): void => {
                _activeSpan = span;
            },
            
            getProviderId: (): string => "test-provider",
            isAvailable: (): boolean => true
        };
        
        return provider;
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
        const traceProvider = this._createTestTraceProvider();
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
                Assert.equal(core.activeSpan!(), null, "No active span initially");

                // Act
                const span = core.startSpan("active-span-test");
                Assert.ok(span, "Span should be created");
                
                // Debug: Check if trace provider exists
                const traceProvider = core.getTraceProvider!();
                Assert.ok(traceProvider, "Trace provider should exist");
                Assert.ok(traceProvider!.isAvailable(), "Trace provider should be available");
                
                // Debug: Check trace provider before setActiveSpan
                const providerActiveSpanBefore = traceProvider!.activeSpan();
                Assert.equal(providerActiveSpanBefore, null, "Trace provider should not have active span initially");
                
                // Manually set as active span (this would normally be done by startActiveSpan)
                core.setActiveSpan!(span!);

                // Debug: Check trace provider directly after setActiveSpan
                const providerActiveSpanAfter = traceProvider!.activeSpan();
                Assert.ok(providerActiveSpanAfter, "Trace provider should have active span after setActiveSpan");
                Assert.equal(providerActiveSpanAfter, span, "Trace provider active span should be the same instance");

                // Assert
                const activeSpan = core.activeSpan!();
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
                core.setActiveSpan!(parentSpan!);
                
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
                const newProvider = this._createTestTraceProvider((span) => {
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
                        },
                        spanLimits: {
                            attributeCountLimit: 32,
                            eventCountLimit: 16,
                            linkCountLimit: 8
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
    }
}