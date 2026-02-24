// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { AppInsightsCore } from "../../../../src/index";
import { IAppInsightsCore } from "../../../../src/interfaces/ai/IAppInsightsCore";
import { createOTelApi } from "../../../../src/otel/api/OTelApi";
import { IOTelApi } from "../../../../src/interfaces/otel/IOTelApi";
import { IOTelApiCtx } from "../../../../src/interfaces/otel/IOTelApiCtx";
import { createNonRecordingSpan, wrapSpanContext, withSpan, useSpan, isTracingSuppressed, suppressTracing, unsuppressTracing } from "../../../../src/otel/api/trace/utils";
import { createDistributedTraceContext } from "../../../../src/core/TelemetryHelpers";
import { IChannelControls } from "../../../../src/interfaces/ai/IChannelControls";

/**
 * Negative tests for OpenTelemetry SDK helpers in AppInsights Core
 * These tests ensure that no exceptions are thrown and helpers behave correctly
 * when there is no trace provider or support instances
 */
export class OTelNegativeTests extends AITestClass {
    private _core: IAppInsightsCore = null as any;

    public testInitialize() {
        // Create a minimal mock channel to satisfy core initialization requirements
        const mockChannel: IChannelControls = {
            pause: () => {},
            resume: () => {},
            flush: () => {},
            teardown: () => {},
            processTelemetry: () => {},
            initialize: () => {},
            identifier: "mockChannel",
            priority: 1001
        } as any;

        this._core = new AppInsightsCore();
        this._core.initialize({
            instrumentationKey: "00000000-0000-0000-0000-000000000000",
            disableInstrumentationKeyValidation: true,
            traceCfg: {},
            errorHandlers: {}
        }, [mockChannel]);
    }

    public testCleanup() {
        if (this._core) {
            this._core.unload(false);
            this._core = null as any;
        }
    }

    public registerTests() {
        this.addCoreWithoutTraceProviderTests();
        this.addTraceApiWithNullCoreTests();
        this.addOTelApiWithInvalidContextTests();
        this.addUtilsWithNullParametersTests();
        this.addSpanOperationsWithoutProviderTests();
        this.addTraceCfgNullHandlingTests();
    }

    private addCoreWithoutTraceProviderTests(): void {
        this.testCase({
            name: "Core.startSpan: should return null when no trace provider is set",
            test: () => {
                // Act - core initialized but no trace provider set
                const span = this._core.startSpan("test-span");

                // Assert - should return null gracefully without throwing
                Assert.equal(span, null, "Should return null when no trace provider is available");
            }
        });

        this.testCase({
            name: "Core.getActiveSpan: should return null when no trace provider is set",
            test: () => {
                // Act
                const activeSpan = this._core.getActiveSpan();

                // Assert
                Assert.equal(activeSpan, null, "Should return null when no trace provider is available");
            }
        });

        this.testCase({
            name: "Core.getActiveSpan: should return null when createNew is false without trace provider",
            test: () => {
                // Act
                const activeSpan = this._core.getActiveSpan(false);

                // Assert
                Assert.equal(activeSpan, null, "Should return null when createNew is false and no trace provider is available");
            }
        });

        this.testCase({
            name: "Core.getActiveSpan: should return null when createNew is true without trace provider",
            test: () => {
                // Act
                const activeSpan = this._core.getActiveSpan(true);

                // Assert
                Assert.equal(activeSpan, null, "Should return null when no trace provider is available regardless of createNew value");
            }
        });

        this.testCase({
            name: "Core.setActiveSpan: should handle gracefully when no trace provider is set",
            test: () => {
                // Arrange
                const mockSpan = {
                    name: "test",
                    spanContext: () => createDistributedTraceContext()
                } as any;

                // Act - should not throw even without trace provider
                const scope = this._core.setActiveSpan(mockSpan);
                const activeSpan = this._core.getActiveSpan();

                // Assert
                Assert.ok(scope, "Should return a scope object");
                Assert.equal(scope.host, this._core, "Scope should reference the core");
                Assert.equal(scope.span, mockSpan, "Scope should reference the span");
                Assert.equal(activeSpan, mockSpan, "GetGetGetGetGetGetGetGetGetActiveSpan() should return the same span object");
                
                // Restore should be callable without throwing
                Assert.doesNotThrow(() => {
                    scope.restore();
                }, "Restore should not throw when no trace provider is available");

                // Multiple restore calls should be safe
                Assert.doesNotThrow(() => {
                    scope.restore();
                    scope.restore();
                }, "Multiple restore calls should not throw");
            }
        });

        this.testCase({
            name: "Core.getTraceProvider: should return null when no trace provider is set",
            test: () => {
                // Act
                const provider = this._core.getTraceProvider();

                // Assert
                Assert.equal(provider, null, "Should return null when no trace provider is set");
            }
        });

        this.testCase({
            name: "Core.setTraceCtx: should not throw when setting context without trace provider",
            test: () => {
                // Arrange
                const ctx = createDistributedTraceContext();
                ctx.traceId = "12345678901234567890123456789012";
                ctx.spanId = "1234567890123456";

                // Act & Assert
                Assert.doesNotThrow(() => {
                    this._core.setTraceCtx(ctx);
                }, "setTraceCtx should not throw without trace provider");

                // Verify context was set
                const retrievedCtx = this._core.getTraceCtx();
                Assert.equal(retrievedCtx, ctx, "Should retrieve the same context that was set");
            }
        });

        this.testCase({
            name: "Core.setTraceCtx: should handle null context gracefully",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    this._core.setTraceCtx(null);
                }, "setTraceCtx should handle null gracefully");

                const ctx = this._core.getTraceCtx(false);
                Assert.equal(ctx, null, "Should return null when set to null and createNew is false");
            }
        });
    }

    private addTraceApiWithNullCoreTests(): void {
        this.testCase({
            name: "TraceApi: should create otelApi with initialized core",
            test: () => {
                // Arrange
                const otelApiCtx: IOTelApiCtx = {
                    host: this._core
                };

                let otelApi: IOTelApi;
                
                // Act & Assert - creation should not throw
                Assert.doesNotThrow(() => {
                    otelApi = createOTelApi(otelApiCtx);
                }, "createOTelApi should not throw with initialized core");

                Assert.ok(otelApi, "Should create otelApi with initialized core");
            }
        });

        this.testCase({
            name: "TraceApi.getActiveSpan: should not return a span without trace provider",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const traceApi = otelApi.trace;

                // Act
                const activeSpan = traceApi.getActiveSpan();

                // Assert
                Assert.ok(!activeSpan, "Should not return a span");
            }
        });

        this.testCase({
            name: "TraceApi.setActiveSpan: should handle null span without throwing",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const traceApi = otelApi.trace;

                // Act & Assert - should not throw with null
                Assert.doesNotThrow(() => {
                    traceApi.setActiveSpan(null);
                }, "setActiveSpan should handle null gracefully");

                // Should not throw with undefined
                Assert.doesNotThrow(() => {
                    traceApi.setActiveSpan(undefined);
                }, "setActiveSpan should handle undefined gracefully");
            }
        });

        this.testCase({
            name: "TraceApi.setActiveSpan: should handle span without spanContext method",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const traceApi = otelApi.trace;
                
                const invalidSpan = {
                    name: "test"
                    // Missing spanContext method
                } as any;

                // Act & Assert - should handle gracefully
                let scope: any;
                Assert.doesNotThrow(() => {
                    scope = traceApi.setActiveSpan(invalidSpan);
                }, "Should handle span without spanContext method");
                
                // Validate scope was returned and references the span
                Assert.ok(scope, "Scope should be returned");
                Assert.equal(scope.span, invalidSpan, "Scope.span should equal the invalid span");
                
                // Validate activeSpan returns the span
                const activeSpan = this._core.getActiveSpan();
                Assert.equal(activeSpan, invalidSpan, "GetGetGetGetGetGetGetGetGetActiveSpan() should return the invalid span");
            }
        });

        this.testCase({
            name: "TraceApi.setActiveSpan: should handle span with legacy context() method",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const traceApi = otelApi.trace;
                
                const legacySpan = {
                    name: "legacy",
                    context: () => ({
                        traceId: "12345678901234567890123456789012",
                        spanId: "1234567890123456",
                        traceFlags: 1
                    })
                } as any;

                // Act & Assert - should handle legacy API
                let scope: any;
                Assert.doesNotThrow(() => {
                    scope = traceApi.setActiveSpan(legacySpan);
                }, "Should handle legacy span with context() method");
                
                // Validate scope was returned and references the span
                Assert.ok(scope, "Scope should be returned");
                Assert.equal(scope.span, legacySpan, "Scope.span should equal the legacy span");
                
                // Validate activeSpan returns the span
                const activeSpan = this._core.getActiveSpan();
                Assert.equal(activeSpan, legacySpan, "GetGetGetGetGetGetGetGetGetActiveSpan() should return the legacy span");
            }
        });
    }

    private addOTelApiWithInvalidContextTests(): void {
        this.testCase({
            name: "TracerProvider.getTracer: should return tracer without trace provider",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });

                // Act & Assert - should not throw when getting tracer
                Assert.doesNotThrow(() => {
                    const tracer = otelApi.getTracer("test-component");
                    Assert.ok(tracer, "Should return a tracer instance");
                }, "getTracer should not throw without trace provider");
            }
        });

        this.testCase({
            name: "Tracer.startSpan: should return null without trace provider",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const tracer = otelApi.getTracer("test");

                // Act
                const span = tracer.startSpan("operation");

                // Assert
                Assert.equal(span, null, "Should return null when trace provider is not available");
            }
        });

        this.testCase({
            name: "Tracer.startActiveSpan: should handle missing trace provider",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const tracer = otelApi.getTracer("test");
                let callbackExecuted = false;

                // Act
                const result = tracer.startActiveSpan("operation", (span) => {
                    callbackExecuted = true;
                    return "result";
                });

                // Assert - callback should not execute when span creation fails
                Assert.ok(callbackExecuted, "Callback should execute even when span is null");
                Assert.equal(result, "result", "Should return the result from the callback even when no span created");
            }
        });

        this.testCase({
            name: "TracerProvider.shutdown: should not throw without trace provider",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });

                // Act & Assert - shutdown should not throw
                Assert.doesNotThrow(() => {
                    otelApi.shutdown();
                }, "shutdown should not throw without trace provider");
            }
        });

        this.testCase({
            name: "TracerProvider.forceFlush: should not throw without trace provider",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });

                // Act & Assert
                Assert.doesNotThrow(() => {
                    otelApi.forceFlush();
                }, "forceFlush should not throw without trace provider");
            }
        });
    }

    private addUtilsWithNullParametersTests(): void {
        this.testCase({
            name: "createNonRecordingSpan: should handle null spanContext gracefully",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });

                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = createNonRecordingSpan(otelApi, "test", null as any);
                    Assert.ok(span, "Should create span even with null context");
                    Assert.ok(!span.isRecording(), "Should be non-recording");
                }, "createNonRecordingSpan should handle null context");
            }
        });

        this.testCase({
            name: "wrapSpanContext: should handle minimal context object",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const minimalContext = {
                    traceId: "12345678901234567890123456789012",
                    spanId: "1234567890123456"
                } as any;

                // Act & Assert
                Assert.doesNotThrow(() => {
                    const wrapped = wrapSpanContext(otelApi, minimalContext);
                    Assert.ok(wrapped, "Should wrap minimal context");
                    Assert.ok(!wrapped.isRecording(), "Should be non-recording");
                }, "wrapSpanContext should handle minimal context");
            }
        });

        this.testCase({
            name: "withSpan: should execute callback with core",
            test: () => {
                // Arrange
                const mockSpan = {
                    name: "test",
                    spanContext: () => createDistributedTraceContext()
                } as any;
                
                let callbackExecuted = false;
                const callback = () => {
                    callbackExecuted = true;
                    return "result";
                };

                // Act & Assert
                Assert.doesNotThrow(() => {
                    const result = withSpan(this._core, mockSpan, callback);
                    Assert.ok(callbackExecuted, "Callback should execute");
                    Assert.equal(result, "result", "Should return callback result");
                }, "withSpan should work without trace provider");
            }
        });

        this.testCase({
            name: "useSpan: should provide scope to callback",
            test: () => {
                // Arrange
                const mockSpan = {
                    name: "test"
                } as any;
                
                let scopeReceived = false;
                const callback = (scope: any) => {
                    scopeReceived = scope !== undefined;
                    return "result";
                };

                // Act & Assert
                Assert.doesNotThrow(() => {
                    const result = useSpan(this._core, mockSpan, callback);
                    Assert.ok(scopeReceived, "Callback should receive scope");
                    Assert.equal(result, "result", "Should return callback result");
                }, "useSpan should work without trace provider");
            }
        });

        this.testCase({
            name: "withSpan: should handle callback throwing exception",
            test: () => {
                // Arrange
                const ctx = createDistributedTraceContext();
                ctx.traceId = "12345678901234567890123456789012";
                ctx.spanId = "1234567890123456";
                
                const mockSpan = {
                    name: "test",
                    spanContext: () => ctx
                } as any;
                
                const callback = () => {
                    throw new Error("Test error");
                };

                // Act & Assert
                Assert.throws(() => {
                    withSpan(this._core, mockSpan, callback);
                }, (err: Error) => err.message === "Test error", "Should propagate callback exception");
            }
        });

        this.testCase({
            name: "useSpan: should restore scope even when callback throws",
            test: () => {
                // Arrange
                const mockSpan = { name: "test" } as any;
                const callback = () => {
                    throw new Error("Test error");
                };

                // Act & Assert - should throw but ensure cleanup happens
                Assert.throws(() => {
                    useSpan(this._core, mockSpan, callback);
                }, (err: Error) => err.message === "Test error", "Should propagate exception");
            }
        });
    }

    private addSpanOperationsWithoutProviderTests(): void {
        this.testCase({
            name: "NonRecordingSpan: operations should not throw",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const ctx = createDistributedTraceContext();
                ctx.traceId = "12345678901234567890123456789012";
                ctx.spanId = "1234567890123456";
                const span = createNonRecordingSpan(otelApi, "test", ctx);

                // Act & Assert - all operations should be safe
                Assert.doesNotThrow(() => {
                    span.setAttribute("key", "value");
                    span.setAttributes({ key1: "value1", key2: "value2" });
                    span.setStatus({ code: 0 });
                    span.updateName("new-name");
                    span.recordException(new Error("test"));
                    span.end();
                }, "Non-recording span operations should not throw");
            }
        });

        this.testCase({
            name: "NonRecordingSpan: multiple end calls should be safe",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({ host: this._core });
                const ctx = createDistributedTraceContext();
                ctx.traceId = "12345678901234567890123456789012";
                ctx.spanId = "1234567890123456";
                const span = createNonRecordingSpan(otelApi, "test", ctx);

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span.end();
                    span.end();
                    span.end();
                }, "Multiple end calls should be safe");
            }
        });

        this.testCase({
            name: "Span: operations after end should log errors but not throw",
            test: () => {
                // Arrange
                const otelApi = createOTelApi({
                    host: this._core
                });
                
                const ctx = createDistributedTraceContext();
                ctx.traceId = "12345678901234567890123456789012";
                ctx.spanId = "1234567890123456";
                const span = createNonRecordingSpan(otelApi, "test", ctx);
                span.end();

                // Act & Assert - operations after end should not throw
                Assert.doesNotThrow(() => {
                    span.setAttribute("key", "value");
                    span.setAttributes({ key: "value" });
                }, "Operations after end should not throw");
            }
        });
    }

    private addTraceCfgNullHandlingTests(): void {
        this.testCase({
            name: "suppressTracing: should handle null context gracefully",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const result = suppressTracing(null as any);
                    Assert.equal(result, null, "Should return the input context");
                }, "suppressTracing should handle null gracefully");
            }
        });

        this.testCase({
            name: "unsuppressTracing: should handle null context gracefully",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const result = unsuppressTracing(null as any);
                    Assert.equal(result, null, "Should return the input context");
                }, "unsuppressTracing should handle null gracefully");
            }
        });

        this.testCase({
            name: "isTracingSuppressed: should return false for null context",
            test: () => {
                // Act
                const result = isTracingSuppressed(null as any);

                // Assert
                Assert.equal(result, false, "Should return false when context is null");
            }
        });

        this.testCase({
            name: "suppressTracing: should handle context without traceCfg",
            test: () => {
                // Arrange
                const contextWithoutTraceCfg = {} as any;

                // Act & Assert
                Assert.doesNotThrow(() => {
                    suppressTracing(contextWithoutTraceCfg);
                }, "Should handle context without traceCfg");

                // Should not affect the context when traceCfg is missing
                Assert.equal(isTracingSuppressed(contextWithoutTraceCfg), false,
                    "Should return false when traceCfg is missing");
            }
        });

        this.testCase({
            name: "suppressTracing: should work with core instance",
            test: () => {
                // Arrange
                this._core.config.traceCfg = {};

                // Act
                suppressTracing(this._core);

                // Assert
                Assert.equal(isTracingSuppressed(this._core), true,
                    "Should suppress tracing on core instance");

                // Cleanup
                unsuppressTracing(this._core);
                Assert.equal(isTracingSuppressed(this._core), false,
                    "Should unsuppress tracing on core instance");
            }
        });

        this.testCase({
            name: "suppressTracing: should work with otelApi instance",
            test: () => {
                // Arrange
                this._core.config.traceCfg = {};
                const otelApi = createOTelApi({ host: this._core });

                // Act
                suppressTracing(otelApi);

                // Assert
                Assert.equal(isTracingSuppressed(otelApi), true,
                    "Should suppress tracing on otelApi instance");

                // Cleanup
                unsuppressTracing(otelApi);
            }
        });

        this.testCase({
            name: "suppressTracing: should work with config instance",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: "test",
                    traceCfg: {}
                } as any;

                // Act
                suppressTracing(config);

                // Assert
                Assert.equal(isTracingSuppressed(config), true,
                    "Should suppress tracing on config instance");

                // Cleanup
                unsuppressTracing(config);
            }
        });

        this.testCase({
            name: "isTracingSuppressed: should handle undefined traceCfg properties",
            test: () => {
                // Arrange
                const config = {
                    traceCfg: {
                        // suppressTracing is undefined
                    }
                } as any;

                // Act
                const result = isTracingSuppressed(config);

                // Assert
                Assert.equal(result, false, "Should return false when suppressTracing is undefined");
            }
        });
    }
}
