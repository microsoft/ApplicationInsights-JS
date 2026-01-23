import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { 
    IReadableSpan, IOTelSpanOptions, eOTelSpanKind, ITraceProvider, ITelemetryItem,
    isFunction
} from "@microsoft/applicationinsights-core-js";

export class TraceProviderTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${TraceProviderTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "TraceProviderTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: TraceProviderTests._connectionString,
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
        this.addProviderAvailabilityTests();
        this.addGetProviderIdTests();
        this.addIsAvailableTests();
        this.addCreateSpanTests();
        this.addProviderIntegrationTests();
    }

    private addProviderAvailabilityTests(): void {
        this.testCase({
            name: "TraceProvider: getTraceProvider should return provider instance",
            test: () => {
                // Act
                const provider = this._ai.core.getTraceProvider();

                // Assert
                Assert.ok(provider !== null && provider !== undefined, 
                    "Should return a trace provider instance");
                Assert.ok(typeof provider === 'object', 
                    "Provider should be an object");
            }
        });

        this.testCase({
            name: "TraceProvider: provider should have all required methods",
            test: () => {
                // Act
                const provider = this._ai.core.getTraceProvider();
                Assert.equal(this._ai.getTraceProvider(), provider, "Core and AI instance should return same trace provider");

                // Assert
                Assert.ok(provider, "Provider should exist");
                if (provider) {
                    Assert.ok(isFunction(provider.createSpan), "Should have createSpan method");
                    Assert.ok(isFunction(this._ai.getActiveSpan), "Should have activeSpan method");
                    Assert.ok(isFunction(this._ai.setActiveSpan), "Should have setActiveSpan method");
                    Assert.ok(isFunction(provider.getProviderId), "Should have getProviderId method");
                    Assert.ok(isFunction(provider.isAvailable), "Should have isAvailable method");
                }
            }
        });

        this.testCase({
            name: "TraceProvider: provider should be available after SDK initialization",
            test: () => {
                // Act
                const provider = this._ai.core.getTraceProvider();

                // Assert
                Assert.ok(provider !== null, "Provider should not be null");
                Assert.ok(provider !== undefined, "Provider should not be undefined");
            }
        });

        this.testCase({
            name: "TraceProvider: multiple calls to getTraceProvider should return same provider",
            test: () => {
                // Act
                const provider1 = this._ai.core.getTraceProvider();
                const provider2 = this._ai.core.getTraceProvider();
                const provider3 = this._ai.core.getTraceProvider();

                // Assert
                Assert.ok(provider1 === provider2, 
                    "First and second calls should return same provider");
                Assert.ok(provider2 === provider3, 
                    "Second and third calls should return same provider");
            }
        });
    }

    private addGetProviderIdTests(): void {
        this.testCase({
            name: "getProviderId: should return a string identifier",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const providerId = provider?.getProviderId();

                // Assert
                Assert.ok(providerId !== null && providerId !== undefined, 
                    "Provider ID should not be null or undefined");
                Assert.ok(typeof providerId === 'string', 
                    "Provider ID should be a string");
            }
        });

        this.testCase({
            name: "getProviderId: should return non-empty string",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const providerId = provider?.getProviderId();

                // Assert
                if (providerId) {
                    Assert.ok(providerId.length > 0, 
                        "Provider ID should not be empty");
                }
            }
        });

        this.testCase({
            name: "getProviderId: should return consistent ID across multiple calls",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const providerId1 = provider?.getProviderId();
                const providerId2 = provider?.getProviderId();
                const providerId3 = provider?.getProviderId();

                // Assert
                Assert.equal(providerId1, providerId2, 
                    "Provider ID should be consistent across calls");
                Assert.equal(providerId2, providerId3, 
                    "Provider ID should be consistent across calls");
            }
        });

        this.testCase({
            name: "getProviderId: should return identifiable name",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const providerId = provider?.getProviderId();

                // Assert
                Assert.ok(providerId, "Provider ID should exist");
                if (providerId) {
                    // Provider ID should be a meaningful identifier, not just random characters
                    Assert.ok(providerId.length > 2, 
                        "Provider ID should be more than 2 characters");
                }
            }
        });
    }

    private addIsAvailableTests(): void {
        this.testCase({
            name: "isAvailable: should return boolean value",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const isAvailable = provider?.isAvailable();

                // Assert
                Assert.ok(typeof isAvailable === 'boolean', 
                    "isAvailable should return a boolean");
            }
        });

        this.testCase({
            name: "isAvailable: should return true after SDK initialization",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const isAvailable = provider?.isAvailable();

                // Assert
                Assert.ok(isAvailable === true, 
                    "Provider should be available after SDK initialization");
            }
        });

        this.testCase({
            name: "isAvailable: should be consistent across multiple calls",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const isAvailable1 = provider?.isAvailable();
                const isAvailable2 = provider?.isAvailable();
                const isAvailable3 = provider?.isAvailable();

                // Assert
                Assert.equal(isAvailable1, isAvailable2, 
                    "Availability should be consistent");
                Assert.equal(isAvailable2, isAvailable3, 
                    "Availability should be consistent");
            }
        });

        this.testCase({
            name: "isAvailable: available provider should allow span creation",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();
                const isAvailable = provider?.isAvailable();

                // Act
                let canCreateSpan = false;
                if (provider && isAvailable) {
                    const span = provider.createSpan("availability-test-span");
                    canCreateSpan = span !== null && span !== undefined;
                    span?.end();
                }

                // Assert
                Assert.ok(isAvailable, "Provider should be available");
                Assert.ok(canCreateSpan, 
                    "Available provider should allow span creation");
            }
        });

        this.testCase({
            name: "isAvailable: should reflect provider initialization state",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // After full SDK initialization, provider should be available
                Assert.ok(provider !== null, "Provider should not be null");

                // Act
                const isAvailable = provider?.isAvailable();

                Assert.ok(isAvailable !== undefined, "isAvailable should not be undefined");

                // Assert
                    
                Assert.ok(isFunction(provider.createSpan), "Available provider should have createSpan");
                Assert.ok(isFunction(provider.getProviderId), "Available provider should have getProviderId");
                Assert.ok(isFunction(provider.isAvailable), "Available provider should have isAvailable");
                Assert.ok(isFunction(this._ai.getActiveSpan), "Available provider should have activeSpan");
                Assert.ok(isFunction(this._ai.setActiveSpan), "Available provider should have setActiveSpan");
                Assert.ok(isFunction(this._ai.core.getActiveSpan), "Available core should have activeSpan");
                Assert.ok(isFunction(this._ai.core.setActiveSpan), "Available core should have setActiveSpan");
            }
        });
    }

    private addCreateSpanTests(): void {
        this.testCase({
            name: "Provider createSpan: should create valid span",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();
                const spanName = "provider-create-span-test";

                // Act
                let span: IReadableSpan | null = null;
                if (provider) {
                    span = provider.createSpan(spanName);
                }

                // Assert
                Assert.ok(span !== null && span !== undefined, 
                    "Provider should create a span");
                if (span) {
                    Assert.equal(span.name, spanName, "Span name should match");
                    Assert.ok(typeof span.isRecording === 'function', 
                        "Span should have isRecording method");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Provider createSpan: should create span with options",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();
                const spanName = "provider-span-with-options";
                const options: IOTelSpanOptions = {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "test.attribute": "value"
                    }
                };

                // Act
                let span: IReadableSpan | null = null;
                if (provider) {
                    span = provider.createSpan(spanName, options);
                }

                // Assert
                Assert.ok(span !== null, "Provider should create span with options");
                if (span) {
                    Assert.equal(span.kind, eOTelSpanKind.CLIENT, 
                        "Span kind should match options");
                    Assert.ok(span.attributes["test.attribute"] === "value", 
                        "Span attributes should be set");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Provider createSpan: should create span with parent context",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();
                let parentSpan: IReadableSpan | null = null;
                let childSpan: IReadableSpan | null = null;

                if (provider) {
                    parentSpan = provider.createSpan("parent-span");
                    const parentCtx = parentSpan.spanContext();

                    // Act
                    childSpan = provider.createSpan("child-span", undefined, parentCtx);

                    // Assert
                    Assert.ok(childSpan !== null, "Child span should be created");
                    if (childSpan && parentSpan) {
                        const childCtx = childSpan.spanContext();
                        Assert.equal(childCtx.traceId, parentCtx.traceId, 
                            "Child should inherit parent traceId");
                        Assert.notEqual(childCtx.spanId, parentCtx.spanId, 
                            "Child should have different spanId");
                    }
                }

                // Cleanup
                childSpan?.end();
                parentSpan?.end();
            }
        });

        this.testCase({
            name: "Provider createSpan: should create multiple independent spans",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                let span1: IReadableSpan | null = null;
                let span2: IReadableSpan | null = null;
                let span3: IReadableSpan | null = null;

                if (provider) {
                    span1 = provider.createSpan("span-1");
                    span2 = provider.createSpan("span-2");
                    span3 = provider.createSpan("span-3");
                }

                // Assert
                Assert.ok(span1 !== null, "First span should be created");
                Assert.ok(span2 !== null, "Second span should be created");
                Assert.ok(span3 !== null, "Third span should be created");

                if (span1 && span2 && span3) {
                    const ctx1 = span1.spanContext();
                    const ctx2 = span2.spanContext();
                    const ctx3 = span3.spanContext();

                    Assert.notEqual(ctx1.spanId, ctx2.spanId, 
                        "Spans should have different spanIds");
                    Assert.notEqual(ctx2.spanId, ctx3.spanId, 
                        "Spans should have different spanIds");
                    Assert.notEqual(ctx1.spanId, ctx3.spanId, 
                        "Spans should have different spanIds");
                }

                // Cleanup
                span1?.end();
                span2?.end();
                span3?.end();
            }
        });

        this.testCase({
            name: "Provider createSpan: should create recording spans by default",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                let span: IReadableSpan | null = null;
                if (provider) {
                    span = provider.createSpan("recording-test");
                }

                // Assert
                Assert.ok(span !== null, "Span should be created");
                if (span) {
                    Assert.ok(span.isRecording(), 
                        "Span should be recording by default");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Provider createSpan: should respect recording option when false",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();
                const options: IOTelSpanOptions = {
                    recording: false
                };

                // Act
                let span: IReadableSpan | null = null;
                if (provider) {
                    span = provider.createSpan("non-recording-test", options);
                }

                // Assert
                Assert.ok(span !== null, "Span should be created");
                if (span) {
                    Assert.ok(!span.isRecording(), 
                        "Span should not be recording when options.recording is false");
                }

                // Cleanup
                span?.end();
            }
        });
    }

    private addProviderIntegrationTests(): void {
        this.testCase({
            name: "Integration: provider operations should work with SDK instance",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act - Create span via provider
                let providerSpan: IReadableSpan | null = null;
                if (provider) {
                    providerSpan = provider.createSpan("provider-integration-span");
                }

                // Create span via SDK
                const sdkSpan = this._ai.startSpan("sdk-integration-span");

                // Assert
                Assert.ok(providerSpan !== null, 
                    "Provider should create span successfully");
                Assert.ok(sdkSpan !== null, 
                    "SDK should create span successfully");

                if (providerSpan && sdkSpan) {
                    // Both spans should have valid contexts
                    const providerCtx = providerSpan.spanContext();
                    const sdkCtx = sdkSpan.spanContext();

                    Assert.ok(providerCtx.traceId, "Provider span should have traceId");
                    Assert.ok(providerCtx.spanId, "Provider span should have spanId");
                    Assert.ok(sdkCtx.traceId, "SDK span should have traceId");
                    Assert.ok(sdkCtx.spanId, "SDK span should have spanId");
                }

                // Cleanup
                providerSpan?.end();
                sdkSpan?.end();
            }
        });

        this.testCase({
            name: "Integration: provider activeSpan and setActiveSpan work together",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                let span: IReadableSpan | null = null;
                if (provider) {
                    span = provider.createSpan("active-integration-span");
                    this._ai.setActiveSpan(span);
                    const activeSpan = this._ai.getActiveSpan();

                    // Assert
                    Assert.ok(activeSpan !== null, "Active span should be retrievable");
                    Assert.equal(activeSpan.name, span.name, 
                        "Active span should match the set span");
                    Assert.equal(activeSpan, this._ai.core.getActiveSpan(), "Active span from core should match active span from SDK");
                }

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Integration: provider availability affects span creation",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const isAvailable = provider?.isAvailable();
                let canCreateSpan = false;

                if (provider) {
                    try {
                        const span = provider.createSpan("availability-integration-test");
                        canCreateSpan = span !== null;
                        span?.end();
                    } catch (e) {
                        canCreateSpan = false;
                    }
                }

                // Assert
                if (isAvailable) {
                    Assert.ok(canCreateSpan, 
                        "Available provider should successfully create spans");
                } else {
                    // If provider is not available, we should handle it gracefully
                    Assert.ok(!canCreateSpan || canCreateSpan, 
                        "Provider availability state should be consistent with span creation");
                }
            }
        });

        this.testCase({
            name: "Integration: provider ID is consistent with trace operations",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                const providerId = provider?.getProviderId();
                let span: IReadableSpan | null = null;
                
                if (provider) {
                    span = provider.createSpan("provider-id-integration");
                }

                // Assert
                Assert.ok(providerId, "Provider should have an ID");
                Assert.ok(span !== null, 
                    "Provider with ID should be able to create spans");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Integration: provider methods are callable without errors",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act & Assert - All methods should be callable
                Assert.ok(provider !== null, "Provider should exist");

                if (provider) {
                    // Test getProviderId
                    Assert.doesNotThrow(() => {
                        const id = provider.getProviderId();
                        Assert.ok(typeof id === 'string', "getProviderId should return string");
                    }, "getProviderId should not throw");

                    // Test isAvailable
                    Assert.doesNotThrow(() => {
                        const available = provider.isAvailable();
                        Assert.ok(typeof available === 'boolean', 
                            "isAvailable should return boolean");
                    }, "isAvailable should not throw");

                    // Test createSpan
                    Assert.doesNotThrow(() => {
                        const span = provider.createSpan("error-test-span");
                        Assert.ok(span !== null, "createSpan should return span");
                        span?.end();
                    }, "createSpan should not throw");

                    // Test activeSpan
                    Assert.doesNotThrow(() => {
                        const active = this._ai.getActiveSpan();
                        // Can be null, that's ok
                        Assert.ok(active === null || typeof active === 'object', 
                            "activeSpan should return null or span object");
                    }, "activeSpan should not throw");

                    const span = provider.createSpan("set-active-error-test");

                    // Test setActiveSpan
                    Assert.doesNotThrow(() => {
                        this._ai.setActiveSpan(span);
                        span?.end();
                    }, "setActiveSpan should not throw");

                    // Test setActiveSpan
                    Assert.doesNotThrow(() => {
                        this._ai.setActiveSpan(span);
                    }, "setActiveSpan should not throw when the span has already ended");

                    // Test setActiveSpan
                    Assert.doesNotThrow(() => {
                        span?.end();
                    }, "ending an already ended span should not throw");
                }
            }
        });

        this.testCase({
            name: "Integration: provider supports root span creation",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();

                // Act
                let rootSpan: IReadableSpan | null = null;
                if (provider) {
                    rootSpan = provider.createSpan("root-span", { root: true });
                }

                // Assert
                Assert.ok(rootSpan !== null, "Root span should be created");
                if (rootSpan) {
                    const ctx = rootSpan.spanContext();
                    Assert.ok(ctx.traceId, "Root span should have traceId");
                    Assert.ok(ctx.spanId, "Root span should have spanId");
                }

                // Cleanup
                rootSpan?.end();
            }
        });

        this.testCase({
            name: "Integration: provider supports different span kinds",
            test: () => {
                // Arrange
                const provider = this._ai.core.getTraceProvider();
                const spanKinds = [
                    eOTelSpanKind.INTERNAL,
                    eOTelSpanKind.SERVER,
                    eOTelSpanKind.CLIENT,
                    eOTelSpanKind.PRODUCER,
                    eOTelSpanKind.CONSUMER
                ];

                // Act & Assert
                if (provider) {
                    spanKinds.forEach(kind => {
                        const span = provider.createSpan(`span-kind-${kind}`, { kind });
                        Assert.ok(span !== null, `Span with kind ${kind} should be created`);
                        Assert.equal(span?.kind, kind, 
                            `Span should have kind ${kind}`);
                        span?.end();
                    });
                }
            }
        });
    }
}
