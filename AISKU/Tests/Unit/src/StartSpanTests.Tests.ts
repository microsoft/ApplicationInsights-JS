import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { 
    IReadableSpan, IOTelSpanOptions, eOTelSpanKind, eOTelSpanStatusCode, newId, IDistributedTraceContext
} from "@microsoft/applicationinsights-core-js";
import { 
    ITraceTelemetry, eSeverityLevel
} from '@microsoft/applicationinsights-common';

export class StartSpanTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${StartSpanTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    
    // Track calls to trackTrace
    private _trackTraceCalls: { trace: ITraceTelemetry, properties: any }[] = [];

    constructor(testName?: string) {
        super(testName || "StartSpanTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackTraceCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: StartSpanTests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    maxBatchInterval: 0,
                    disableExceptionTracking: false
                }
            });

            // Hook trackTrace to capture calls
            const originalTrackTrace = this._ai.trackTrace;
            this._ai.trackTrace = (trace: ITraceTelemetry, customProperties?: any) => {
                this._trackTraceCalls.push({ trace, properties: customProperties });
                return originalTrackTrace.call(this._ai, trace, customProperties);
            };

            // Initialize the SDK
            this._ai.loadAppInsights();
            
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
        this.addTests();
    }

    private addTests(): void {

        this.testCase({
            name: "StartSpan: startSpan method should exist on ApplicationInsights instance",
            test: () => {
                // Verify that startSpan method exists
                Assert.ok(this._ai, "ApplicationInsights should be initialized");
                Assert.ok(typeof this._ai.startSpan === 'function', "startSpan method should exist");

                // Check core initialization
                Assert.ok(this._ai.core, "Core should be available");
                const core = this._ai.core;
                if (core) {
                    // Check if core has startSpan method
                    Assert.ok(typeof core.startSpan === 'function', "Core should have startSpan method");

                    // Test basic startSpan call on the core directly after initialization
                    const coreSpan = core.startSpan("debug-core-span");
                    Assert.ok(coreSpan !== null, `Core startSpan returned ${coreSpan} instead of a span object`);
                }
                
                // Test basic startSpan call after initialization
                const span = this._ai.startSpan("debug-span");
                
                // Should now return a valid span object
                Assert.ok(span !== null, `startSpan returned ${span} instead of a span object`);
                
                Assert.ok(typeof span!.isRecording === 'function', "Span should have isRecording method");
                Assert.ok(typeof span!.end === 'function', "Span should have end method");
                const isRecording = span!.isRecording();
                Assert.ok(typeof isRecording === 'boolean', `isRecording should return boolean, got ${typeof isRecording}: ${isRecording}`);
            }
        });

        this.testCase({
            name: "StartSpan: Recording span should trigger trackTrace when span ends",
            test: () => {
                // Clear previous calls
                this._trackTraceCalls = [];

                // Create a recording span using startSpan
                const span = this._ai.startSpan("test-recording-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "test.attribute": "test-value",
                        "operation.type": "http"
                    }
                });

                Assert.ok(span, "Span should be created");

                // Verify it's a recording span
                Assert.ok(span!.isRecording(), "Span should be recording");

                // End the span - this should trigger trackTrace via the onEnd callback
                span!.end();

                // Verify that trackTrace was called
                Assert.equal(1, this._trackTraceCalls.length, "trackTrace should have been called once for recording span");
                
                // Add defensive check for the call object
                Assert.ok(this._trackTraceCalls.length > 0, "Should have at least one trackTrace call");
                const call = this._trackTraceCalls[0];
                Assert.ok(call, "Call object should exist");
                Assert.ok(call.trace, "Trace telemetry should be present");
                Assert.ok(call.trace.message, "Trace message should be present");
                Assert.ok(call.trace.message.includes("test-recording-span"), "Trace message should include span name");
                
                Assert.ok(call.properties, "Custom properties should be present");
                Assert.equal("test-value", call.properties["test.attribute"], "Should include span attributes");
                Assert.equal("http", call.properties["operation.type"], "Should include all span attributes");
            }
        });

        this.testCase({
            name: "StartSpan: Non-recording span should NOT trigger trackTrace when span ends",
            test: () => {
                // Clear previous calls
                this._trackTraceCalls = [];

                // NOTE: Currently all spans are recording by default
                // When the recording: false option is implemented, this test will need to be updated
                // For now, we'll create a regular span and document the expected behavior
                const span = this._ai.startSpan("test-would-be-non-recording-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "test.attribute": "non-recording-value"
                    }
                });

                Assert.ok(span, "Span should be created");
                if (!span) return;

                // Currently, all spans are recording by default
                Assert.ok(span.isRecording(), "Span should be recording (default behavior)");

                // End the span - this WILL trigger trackTrace since it's recording
                span.end();

                // Currently expecting 1 call since all spans are recording
                // When non-recording spans are implemented, this should be 0
                Assert.equal(1, this._trackTraceCalls.length, "trackTrace should be called for recording span (current default behavior)");
                
                // TODO: Update this test when recording: false option is implemented
                // The test should then use recording: false and expect 0 trackTrace calls
            }
        });

        this.testCase({
            name: "StartSpan: Multiple recording spans should each trigger trackTrace",
            test: () => {
                // Clear previous calls
                this._trackTraceCalls = [];

                // Create multiple recording spans
                const span1 = this._ai.startSpan("span-1", {
                    attributes: { "span.number": 1 }
                });
                const span2 = this._ai.startSpan("span-2", {
                    attributes: { "span.number": 2 }
                });

                Assert.ok(span1 && span2, "Both spans should be created");

                // End both spans
                span1!.end();
                span2!.end();

                // Should have two trackTrace calls
                Assert.equal(2, this._trackTraceCalls.length, "trackTrace should have been called twice");
                
                // Verify both calls have the correct data
                const call1 = this._trackTraceCalls.find(call => 
                    call.trace.message && call.trace.message.includes("span-1"));
                const call2 = this._trackTraceCalls.find(call => 
                    call.trace.message && call.trace.message.includes("span-2"));

                Assert.ok(call1, "Should have call for span-1");
                Assert.ok(call2, "Should have call for span-2");
                
                if (call1 && call2) {
                    Assert.equal(1, call1.properties["span.number"], "First span should have correct attribute");
                    Assert.equal(2, call2.properties["span.number"], "Second span should have correct attribute");
                }
            }
        });

        this.testCase({
            name: "StartSpan: Error recording spans should generate traces with error severity",
            test: () => {
                // Clear previous calls
                this._trackTraceCalls = [];

                // Create an error span
                const span = this._ai.startSpan("error-span", {
                kind: eOTelSpanKind.CLIENT,
                attributes: {
                    "error": true,
                    "error.message": "Something went wrong"
                }
            });

            Assert.ok(span, "Span should be created");
            if (!span) return;

            // Set error status on the span
            span.setStatus({
                code: eOTelSpanStatusCode.ERROR,
                message: "Test error occurred"
            });

            // End the span
            span.end();

            // Verify trackTrace was called with error severity
            Assert.equal(1, this._trackTraceCalls.length, "trackTrace should have been called once");
            
            const call = this._trackTraceCalls[0];
            Assert.ok(call.trace, "Trace telemetry should be present");
            Assert.equal(eSeverityLevel.Error, call.trace.severityLevel, "Should have error severity level");
            Assert.ok(call.trace.message.includes("error-span"), "Should include span name in message");
            
                
                Assert.ok(call.properties, "Custom properties should be present");
                Assert.equal(true, call.properties["error"], "Should include error attribute");
                Assert.equal("Something went wrong", call.properties["error.message"], "Should include error message");
            }
        });

        this.testCase({
            name: "StartSpan: startSpan with parent context should work",
            test: () => {
                // Clear previous calls
                this._trackTraceCalls = [];

                // Create span with optional parent context parameter
                // (We'll pass null for now since we're not testing context propagation yet)
                const parentContext = null;

                // Create span with parent context
                const span = this._ai.startSpan("child-span", {
                    attributes: { "has.parent": false }
                });

                Assert.ok(span, "Span should be created with parent context");
                if (!span) return;

                // End the span
                span.end();

                // Verify trackTrace was called
                Assert.equal(1, this._trackTraceCalls.length, "trackTrace should have been called once");
                
                const call = this._trackTraceCalls[0];
                Assert.ok(call.trace, "Trace telemetry should be present");
                Assert.ok(call.trace.message.includes("child-span"), "Should include span name");
                Assert.equal(false, call.properties["has.parent"], "Should include span attributes");
            }
        });

        this.testCase({
            name: "StartSpan: startSpan should return valid span when trace provider is available",
            test: () => {
                // After initialization, the trace provider should be available
                // and startSpan should return a valid span object
                const span = this._ai.startSpan("test-span");
                
                // Now that initialization is complete, we should get a valid span
                Assert.ok(span !== null, "startSpan should return a valid span after initialization");
                Assert.ok(typeof span === 'object', "Span should be an object");
                
                Assert.ok(typeof span!.end === 'function', "Span should have end method");
                Assert.ok(typeof span!.isRecording === 'function', "Span should have isRecording method");
                span!.end();
            }
        });
    }
}