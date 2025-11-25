import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { IOTelSpanOptions, eOTelSpanKind, ITelemetryItem, isUndefined, useSpan, isNumber } from "@microsoft/applicationinsights-core-js";
import { isFunction, objIs } from '@nevware21/ts-utils';

export class TraceContextTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${TraceContextTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "TraceContextTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: TraceContextTests._connectionString,
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
            console.error('Failed to initialize tests: ' + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addGetTraceCtxTests();
        this.addActiveSpanTests();
        this.addsetActiveSpanTests();
        this.addIntegrationTests();
    }

    private addGetTraceCtxTests(): void {
        this.testCase({
            name: "getTraceCtx: should return valid trace context after starting a span",
            test: () => {
                // Arrange
                const spanName = "test-span-with-context";
                
                // Act
                const span = this._ai.startSpan(spanName);
                const traceCtx = this._ai.getTraceCtx();

                // Assert
                Assert.ok(span !== null, "Span should be created");
                Assert.ok(traceCtx !== null && traceCtx !== undefined, "Should return trace context after starting span");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.ok(traceCtx!.traceId, "Trace context should have traceId");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.equal("", traceCtx!.spanId, "Trace context should not have a spanId (the default SDK initialization)");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.ok(isUndefined(traceCtx!.traceFlags), "Trace context should NOT have have traceFlags");

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                useSpan(this._ai.core, span!, () => {
                    const nestedTraceCtx = this._ai.getTraceCtx();
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    Assert.equal(traceCtx!.traceId, nestedTraceCtx!.traceId, "TraceId should be the same within the span context");
                    Assert.equal(span?.spanContext().traceId, nestedTraceCtx?.traceId, "TraceId should match the active span's traceId");
                    Assert.equal(span?.spanContext().spanId, nestedTraceCtx?.spanId, "SpanId should match the active span's spanId");
                    Assert.equal(span?.spanContext().traceFlags, nestedTraceCtx?.traceFlags, "TraceFlags should match the active span's traceFlags");
                });
                
                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "getTraceCtx: should return trace context matching active span",
            test: () => {
                // Arrange
                const spanName = "context-matching-span";
                
                // Act
                const span = this._ai.startSpan(spanName);
                const traceCtx = this._ai.getTraceCtx();
                const spanContext = span?.spanContext();

                // Assert
                Assert.ok(span !== null, "Span should be created");
                Assert.ok(traceCtx !== null && traceCtx !== undefined, "Trace context should exist");
                Assert.ok(spanContext !== null && spanContext !== undefined, "Span context should exist");
                
                Assert.equal(traceCtx.traceId, spanContext.traceId, "Trace context traceId should match span context");
                Assert.notEqual(traceCtx.spanId, spanContext.spanId, "Trace context spanId should match span context");

                useSpan(this._ai.core, span!, () => {
                    const activeTraceCtx = this._ai.getTraceCtx();
                    Assert.equal(activeTraceCtx?.traceId, spanContext.traceId, "The active traceId should match span context");
                    Assert.equal(activeTraceCtx?.spanId, spanContext.spanId, "The active spanId should match span context");
                });

                Assert.equal(traceCtx.traceId, spanContext.traceId, "Trace context traceId should match span context");
                Assert.notEqual(traceCtx.spanId, spanContext.spanId, "Trace context spanId should match span context");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "getTraceCtx: should have valid traceId format (32 hex chars)",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("format-test-span");
                
                // Act
                const traceCtx = this._ai.getTraceCtx();

                // Assert
                Assert.ok(traceCtx !== null && traceCtx !== undefined, "Trace context should exist");
                
                if (traceCtx && traceCtx.traceId) {
                    Assert.equal(traceCtx.traceId.length, 32, "TraceId should be 32 characters");
                    Assert.ok(/^[0-9a-f]{32}$/i.test(traceCtx.traceId), 
                        "TraceId should be 32 hex characters");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "getTraceCtx: should have valid spanId format (16 hex chars)",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("spanid-test-span");
                
                // Act
                const traceCtx = this._ai.getTraceCtx();

                // Assert
                Assert.ok(traceCtx !== null && traceCtx !== undefined, "Trace context should exist");
                
                if (traceCtx && traceCtx.spanId) {
                    Assert.equal(traceCtx.spanId.length, 16, "SpanId should be 16 characters");
                    Assert.ok(/^[0-9a-f]{16}$/i.test(traceCtx.spanId), 
                        "SpanId should be 16 hex characters");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "getTraceCtx: should persist context across multiple calls",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("persistence-span");
                
                // Act
                const traceCtx1 = this._ai.getTraceCtx();
                const traceCtx2 = this._ai.getTraceCtx();
                const traceCtx3 = this._ai.getTraceCtx();

                // Assert
                Assert.ok(traceCtx1 !== null && traceCtx1 !== undefined, "First call should return context");
                Assert.ok(traceCtx2 !== null && traceCtx2 !== undefined, "Second call should return context");
                Assert.ok(traceCtx3 !== null && traceCtx3 !== undefined, "Third call should return context");
                
                if (traceCtx1 && traceCtx2 && traceCtx3) {
                    Assert.equal(traceCtx1.traceId, traceCtx2.traceId, "TraceId should be consistent");
                    Assert.equal(traceCtx2.traceId, traceCtx3.traceId, "TraceId should be consistent");
                    Assert.equal(traceCtx1.spanId, traceCtx2.spanId, "SpanId should be consistent");
                    Assert.equal(traceCtx2.spanId, traceCtx3.spanId, "SpanId should be consistent");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "getTraceCtx: should return context for child spans with same traceId",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-span");
                const parentCtx = this._ai.getTraceCtx();
                
                // Act - create child span
                const childSpan = this._ai.startSpan("child-span", undefined, parentCtx || undefined);

                let childCtx;
                useSpan(this._ai.core, childSpan!, () => {
                    childCtx = this._ai.getTraceCtx();
                });

                // Assert
                Assert.ok(parentCtx !== null && parentCtx !== undefined, "Parent context should exist");
                Assert.ok(childCtx !== null && childCtx !== undefined, "Child context should exist");
                
                Assert.equal(childCtx.traceId, parentCtx.traceId, "Child span should have same traceId as parent");
                Assert.notEqual(childCtx.spanId, parentCtx.spanId, "Child span should have different spanId from parent");

                Assert.equal(childSpan?.spanContext().traceId, parentCtx.traceId, "Child span should have same traceId as parent");
                Assert.notEqual(childSpan?.spanContext().spanId, parentCtx.spanId, "Child span should have different spanId from parent");
                Assert.equal(childSpan?.spanContext().spanId, childCtx.spanId, "Child spanId should match its context");
                Assert.equal(childSpan?.spanContext().traceId, childCtx.traceId, "Child traceId should match its context");

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });
    }

    private addActiveSpanTests(): void {
        this.testCase({
            name: "activeSpan: should return null when no span is active (via trace provider)",
            test: () => {
                // Assert
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const activeSpan = this._ai.getActiveSpan();
                Assert.ok(activeSpan, "Should Always return a non-null span when no span is active");
                Assert.equal(false, activeSpan.isRecording(), "Returned span should be a non-recording span");
            }
        });

        this.testCase({
            name: "activeSpan: should return null when createNew is false and no span is active",
            test: () => {
                // Act
                const activeSpan = this._ai.getActiveSpan(false);

                // Assert
                Assert.equal(activeSpan, null, "Should return null when createNew is false and no active span exists");
            }
        });

        this.testCase({
            name: "activeSpan: should return existing span when createNew is false and span is active",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("test-span");
                this._ai.setActiveSpan(span);

                // Act
                const activeSpan = this._ai.getActiveSpan(false);

                // Assert
                Assert.ok(activeSpan, "Should return the active span");
                Assert.equal(activeSpan, span, "Should return the same span object");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "activeSpan: should return active span after setActiveSpan (via trace provider)",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("active-span-test");
                
                // Act
                this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(activeSpan !== null, "Should return the active span");
                Assert.equal(activeSpan.name, span.name, "Active span should match the set span");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "activeSpan: should return the most recently set active span",
            test: () => {
                // Arrange
                const span1 = this._ai.startSpan("span-1");
                const span2 = this._ai.startSpan("span-2");
                const span3 = this._ai.startSpan("span-3");
                
                // Act & Assert
                this._ai.setActiveSpan(span1);
                let activeSpan = this._ai.getActiveSpan();
                Assert.equal(activeSpan.name, span1.name, "Should return span1 as active");

                this._ai.setActiveSpan(span2);
                activeSpan = this._ai.getActiveSpan();
                Assert.equal(activeSpan.name, span2.name, "Should return span2 as active");

                this._ai.setActiveSpan(span3);
                activeSpan = this._ai.getActiveSpan();
                Assert.equal(activeSpan.name, span3.name, "Should return span3 as active");

                // Cleanup
                span1?.end();
                span2?.end();
                span3?.end();
            }
        });

        this.testCase({
            name: "activeSpan: active span should have valid span context",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("context-check-span");
                
                // Act
                this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();
                const spanContext = activeSpan.spanContext();

                // Assert
                Assert.ok(activeSpan !== null, "Active span should exist");
                Assert.ok(objIs(activeSpan, span), "Active span should match the set span");
                Assert.ok(spanContext !== null && spanContext !== undefined, "Active span should have valid context");
                
                Assert.ok(spanContext.traceId, "Should have traceId");
                Assert.ok(spanContext.spanId, "Should have spanId");
                Assert.ok(isUndefined(spanContext.traceFlags), "Should have default traceFlags (undefined)");
                Assert.equal(undefined, spanContext?.traceFlags, "TraceFlags should not have sampled flag set by default");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "activeSpan: should work with recording spans",
            test: () => {
                // Arrange
                const options: IOTelSpanOptions = {
                    recording: true,
                    kind: eOTelSpanKind.CLIENT
                };
                const span = this._ai.startSpan("recording-span", options);
                
                // Act
                this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(activeSpan !== null, "Active span should exist");
                Assert.ok(activeSpan.isRecording(), "Active span should be recording");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "activeSpan: should work with non-recording spans",
            test: () => {
                // Arrange
                const options: IOTelSpanOptions = {
                    recording: false
                };
                const span = this._ai.startSpan("non-recording-span", options);
                
                // Act
                this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(activeSpan !== null, "Active span should exist");
                Assert.ok(!activeSpan.isRecording(), "Active span should not be recording");

                // Cleanup
                span?.end();
            }
        });
    }

    private addsetActiveSpanTests(): void {
        this.testCase({
            name: "setActiveSpan: should set a span as active",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("set-active-test");
                
                // Act
                const scope = this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(scope !== null, "Scope should be returned");
                Assert.equal(scope.span, span, "Scope.span should equal the passed span");
                Assert.ok(activeSpan !== null, "Active span should be set");
                Assert.equal(activeSpan, span, "ActiveSpan() should return the same span object");
                Assert.equal(activeSpan.name, span.name, "Set span should be the active span");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "setActiveSpan: should update getTraceCtx to reflect active span",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("trace-ctx-update-test");
                
                // Act
                const scope = this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();
                const traceCtx = this._ai.getTraceCtx();
                const spanContext = span.spanContext();

                // Assert
                Assert.ok(scope !== null, "Scope should be returned");
                Assert.equal(scope.span, span, "Scope.span should equal the passed span");
                Assert.equal(activeSpan, span, "ActiveSpan() should return the same span object");
                Assert.ok(traceCtx !== null && traceCtx !== undefined, 
                    "Trace context should be updated");
                
                if (traceCtx && spanContext) {
                    Assert.equal(traceCtx.traceId, spanContext.traceId, 
                        "Trace context should match active span");
                    Assert.equal(traceCtx.spanId, spanContext.spanId, 
                        "Trace context spanId should match active span");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "setActiveSpan: should allow switching between multiple spans",
            test: () => {
                // Arrange
                const span1 = this._ai.startSpan("switch-span-1");
                const span2 = this._ai.startSpan("switch-span-2");
                
                // Act & Assert
                // Set first span as active
                let scope = this._ai.setActiveSpan(span1);
                let activeSpan = this._ai.getActiveSpan();
                Assert.equal(scope.span, span1, "Scope.span should equal span1");
                Assert.equal(activeSpan, span1, "ActiveSpan() should return span1");
                Assert.equal(activeSpan.name, span1.name, "First span should be active");

                // Switch to second span
                scope = this._ai.setActiveSpan(span2);
                activeSpan = this._ai.getActiveSpan();
                Assert.equal(scope.span, span2, "Scope.span should equal span2");
                Assert.equal(activeSpan, span2, "ActiveSpan() should return span2");
                Assert.equal(activeSpan.name, span2.name, "Second span should be active");

                // Switch back to first span
                scope = this._ai.setActiveSpan(span1);
                activeSpan = this._ai.getActiveSpan();
                Assert.equal(scope.span, span1, "Scope.span should equal span1 again");
                Assert.equal(activeSpan, span1, "ActiveSpan() should return span1 again");
                Assert.equal(activeSpan.name, span1.name, "First span should be active again");

                // Cleanup
                span1?.end();
                span2?.end();
            }
        });

        this.testCase({
            name: "setActiveSpan: should work with spans of different kinds",
            test: () => {
                // Arrange
                const clientSpan = this._ai.startSpan("client-span", { kind: eOTelSpanKind.CLIENT });
                const serverSpan = this._ai.startSpan("server-span", { kind: eOTelSpanKind.SERVER });
                
                // Act & Assert
                let scope = this._ai.setActiveSpan(clientSpan);
                let activeSpan = this._ai.getActiveSpan();
                Assert.equal(scope.span, clientSpan, "Scope.span should equal clientSpan");
                Assert.equal(activeSpan, clientSpan, "ActiveSpan() should return clientSpan");
                Assert.equal(activeSpan.kind, eOTelSpanKind.CLIENT, 
                    "Client span should be active with correct kind");

                scope = this._ai.setActiveSpan(serverSpan);
                activeSpan = this._ai.getActiveSpan();
                Assert.equal(scope.span, serverSpan, "Scope.span should equal serverSpan");
                Assert.equal(activeSpan, serverSpan, "ActiveSpan() should return serverSpan");
                Assert.equal(activeSpan.kind, eOTelSpanKind.SERVER, 
                    "Server span should be active with correct kind");

                // Cleanup
                clientSpan?.end();
                serverSpan?.end();
            }
        });

        this.testCase({
            name: "setActiveSpan: should work with spans that have attributes",
            test: () => {
                // Arrange
                const attributes = {
                    "http.method": "GET",
                    "http.url": "https://example.com",
                    "custom.attribute": "test-value"
                };
                const span = this._ai.startSpan("attributed-span", { attributes });
                
                // Act
                const scope = this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(scope !== null, "Scope should be returned");
                Assert.equal(scope.span, span, "Scope.span should equal the passed span");
                Assert.ok(activeSpan !== null, "Active span should exist");
                Assert.equal(activeSpan, span, "ActiveSpan() should return the same span object");
                Assert.equal(activeSpan.name, span.name, "Span name should match");
                
                const spanAttributes = activeSpan.attributes;
                Assert.equal(spanAttributes["http.method"], "GET", 
                    "Attributes should be preserved");
                Assert.equal(spanAttributes["http.url"], "https://example.com", 
                    "Attributes should be preserved");
                Assert.equal(spanAttributes["custom.attribute"], "test-value", 
                    "Custom attributes should be preserved");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "setActiveSpan: should handle ended spans",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("ended-span");
                
                // Act
                span.end();
                
                const scope = this._ai.setActiveSpan(span);
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(scope !== null, "Scope should be returned");
                Assert.equal(scope.span, span, "Scope.span should equal the passed ended span");
                Assert.ok(activeSpan !== null, "Should be able to set ended span as active");
                Assert.equal(activeSpan, span, "ActiveSpan() should return the same ended span object");
                Assert.ok(activeSpan.ended, "Active span should be marked as ended");

                // Cleanup is already done (span.end() called)
            }
        });
    }

    private addIntegrationTests(): void {
        this.testCase({
            name: "Integration: getTraceCtx, activeSpan, and setActiveSpan should work together",
            test: () => {
                // Arrange
                const span1 = this._ai.startSpan("integration-span-1");
                const span2 = this._ai.startSpan("integration-span-2");
                
                // Act & Assert - Set first span active
                this._ai.setActiveSpan(span1);
                
                let activeSpan = this._ai.getActiveSpan();
                let traceCtx = this._ai.getTraceCtx();
                let span1Context = span1.spanContext();
                
                Assert.equal(activeSpan.name, span1.name, "Active span should be span1");
                Assert.equal(traceCtx?.spanId, span1Context.spanId, 
                    "Trace context should match span1");

                // Switch to second span
                this._ai.setActiveSpan(span2);
                
                activeSpan = this._ai.getActiveSpan();
                traceCtx = this._ai.getTraceCtx();
                let span2Context = span2.spanContext();
                
                Assert.equal(activeSpan.name, span2.name, "Active span should be span2");
                Assert.equal(traceCtx?.spanId, span2Context.spanId, 
                    "Trace context should match span2");

                // Cleanup
                span1?.end();
                span2?.end();
            }
        });

        this.testCase({
            name: "Integration: parent-child span relationship via getTraceCtx",
            test: () => {
                // Arrange & Act
                const parentSpan = this._ai.startSpan("integration-parent");
                
                this._ai.setActiveSpan(parentSpan);
                const parentCtx = this._ai.getTraceCtx();
                
                // Create child span using parent context
                const childSpan = this._ai.startSpan("integration-child", undefined, parentCtx || undefined);
                this._ai.setActiveSpan(childSpan);
                
                const childCtx = this._ai.getTraceCtx();
                const activeSpan = this._ai.getActiveSpan();

                // Assert
                Assert.ok(parentCtx !== null && parentCtx !== undefined, "Parent context should exist");
                Assert.ok(childCtx !== null && childCtx !== undefined, "Child context should exist");
                
                Assert.equal(childCtx.traceId, parentCtx.traceId, "Child should inherit parent's traceId");
                Assert.notEqual(childCtx.spanId, parentCtx.spanId, "Child should have different spanId");
                
                Assert.equal(activeSpan.name, "integration-child", "Active span should be the child span");

                // Cleanup
                childSpan?.end();
                
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "Integration: multiple spans with trace context propagation",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("root-span");
                
                this._ai.setActiveSpan(rootSpan);
                const rootCtx = this._ai.getTraceCtx();
                
                // Create first child
                const child1Span = this._ai.startSpan("child-1", undefined, rootCtx || undefined);
                this._ai.setActiveSpan(child1Span);
                const child1Ctx = this._ai.getTraceCtx();
                
                // Create second child (sibling to first child)
                const child2Span = this._ai.startSpan("child-2", undefined, rootCtx || undefined);
                this._ai.setActiveSpan(child2Span);
                const child2Ctx = this._ai.getTraceCtx();

                // Assert - all should share the same traceId
                Assert.equal(child1Ctx.traceId, rootCtx.traceId, 
                    "Child 1 should share root traceId");
                Assert.equal(child2Ctx.traceId, rootCtx.traceId, 
                    "Child 2 should share root traceId");
                
                // But have different spanIds
                Assert.notEqual(child1Ctx.spanId, rootCtx.spanId, 
                    "Child 1 should have different spanId");
                Assert.notEqual(child2Ctx.spanId, rootCtx.spanId, 
                    "Child 2 should have different spanId");
                Assert.notEqual(child1Ctx.spanId, child2Ctx.spanId, 
                    "Siblings should have different spanIds");

                // Cleanup
                child2Span?.end();
                child1Span?.end();
                
                rootSpan?.end();
            }
        });

        this.testCase({
            name: "Integration: trace provider availability check",
            test: () => {
                // Act
                const provider = this._ai.core.getTraceProvider();
                Assert.equal(this._ai.getTraceProvider(), provider, "Core and AI instance should return same trace provider");

                // Assert
                Assert.ok(provider !== null && provider !== undefined, "Trace provider should be available");
                
                Assert.ok(isFunction(provider.createSpan), "Provider should have createSpan method");
                Assert.ok(isFunction(this._ai.getActiveSpan), "Provider should have activeSpan method");
                Assert.ok(isFunction(this._ai.setActiveSpan), "Provider should have setActiveSpan method");
                Assert.ok(isFunction(provider.getProviderId), "Provider should have getProviderId method");
                Assert.ok(isFunction(provider.isAvailable), "Provider should have isAvailable method");
            }
        });

        this.testCase({
            name: "Integration: trace provider isAvailable should reflect initialization state",
            test: () => {
                // Act
                const provider = this._ai.core.getTraceProvider();

                // Assert
                const isAvailable = provider.isAvailable();
                Assert.ok(typeof isAvailable === 'boolean', "isAvailable should return boolean");
                Assert.ok(isAvailable, "Provider should be available after SDK initialization");
            }
        });

        this.testCase({
            name: "Integration: trace provider should have identifiable providerId",
            test: () => {
                // Act
                const provider = this._ai.core.getTraceProvider();

                // Assert
                if (provider) {
                    const providerId = provider.getProviderId();
                    Assert.ok(providerId, "Provider should have an ID");
                    Assert.ok(typeof providerId === 'string', 
                        "Provider ID should be a string");
                    Assert.ok(providerId.length > 0, 
                        "Provider ID should not be empty");
                }
            }
        });
    }
}
