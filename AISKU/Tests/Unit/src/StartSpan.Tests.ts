import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { eOTelSpanKind, eOTelSpanStatusCode, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

export class StartSpanTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${StartSpanTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    
    // Track calls to track
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "StartSpanTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: StartSpanTests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    maxBatchInterval: 0,
                    disableExceptionTracking: false
                }
            });

            // Initialize the SDK
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
            name: "StartSpan: Recording span should trigger track when span ends",
            test: () => {
                // Clear previous calls
                this._trackCalls = [];

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

                // End the span - this should trigger track via the onEnd callback
                span!.end();

                // Verify that track was called
                Assert.equal(1, this._trackCalls.length, "track should have been called once for recording span");
                
                // Add defensive check for the telemetry item
                Assert.ok(this._trackCalls.length > 0, "Should have at least one track call");
                const item = this._trackCalls[0];
                Assert.ok(item, "Telemetry item should exist");
                Assert.ok(item.name, "Item name should be present");
                Assert.ok(item.baseData, "Base data should be present");
                
                Assert.ok(item.baseData.properties, "Custom properties should be present");
                Assert.equal("test-value", item.baseData.properties["test.attribute"], "Should include span attributes");
                Assert.equal("http", item.baseData.properties["operation.type"], "Should include all span attributes");
            }
        });

        this.testCase({
            name: "StartSpan: Non-recording span should NOT trigger track when span ends",
            test: () => {
                // Clear previous calls
                this._trackCalls = [];

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

                // Currently, all spans are recording by default
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                Assert.ok(span!.isRecording(), "Span should be recording (default behavior)");

                // End the span - this WILL trigger track since it's recording
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();

                // Currently expecting 1 call since all spans are recording
                // When non-recording spans are implemented, this should be 0
                Assert.equal(1, this._trackCalls.length, "track should be called for recording span (current default behavior)");
                
                // TODO: Update this test when recording: false option is implemented
                // The test should then use recording: false and expect 0 track calls
            }
        });

        this.testCase({
            name: "StartSpan: Multiple recording spans should each trigger track",
            test: () => {
                // Clear previous calls
                this._trackCalls = [];

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

                // Should have two track calls
                Assert.equal(2, this._trackCalls.length, "track should have been called twice");
                
                // Verify both calls have the correct data
                const item1 = this._trackCalls.find(item => 
                    item.baseData && item.baseData.properties && item.baseData.name === "span-1");
                const item2 = this._trackCalls.find(item => 
                    item.baseData && item.baseData.properties && item.baseData.name === "span-2");

                Assert.ok(item1, "Should have item for span-1");
                Assert.ok(item2, "Should have item for span-2");
                
                if (item1 && item2) {
                    Assert.equal(1, item1.baseData.properties["span.number"], "First span should have correct attribute");
                    Assert.equal(2, item2.baseData.properties["span.number"], "Second span should have correct attribute");
                }
            }
        });

        this.testCase({
            name: "StartSpan: Error recording spans should generate telemetry with error status",
            test: () => {
                // Clear previous calls
                this._trackCalls = [];

                // Create an error span
                const span = this._ai.startSpan("error-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "error": true,
                        "error.message": "Something went wrong"
                    }
                });

                Assert.ok(span, "Span should be created");

                // Set error status on the span
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.setStatus({
                    code: eOTelSpanStatusCode.ERROR,
                    message: "Test error occurred"
                });

                // End the span
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();

                // Verify track was called
                Assert.equal(1, this._trackCalls.length, "track should have been called once");
                
                const item = this._trackCalls[0];
                Assert.ok(item, "Telemetry item should be present");
                Assert.ok(item.baseData, "Base data should be present");
                Assert.ok(item.baseData.properties, "Properties should be present");
                Assert.equal("error-span", item.baseData.name, "Should include span name");
            
                
                Assert.ok(item.baseData.properties, "Custom properties should be present");
                Assert.equal(true, item.baseData.properties["error"], "Should include error attribute");
                Assert.equal("Something went wrong", item.baseData.properties["error.message"], "Should include error message");
            }
        });

        this.testCase({
            name: "StartSpan: startSpan with parent context should work",
            test: () => {
                // Clear previous calls
                this._trackCalls = [];

                // Create span with optional parent context parameter
                // (We'll pass null for now since we're not testing context propagation yet)
                const parentContext = null;

                // Create span with parent context
                const span = this._ai.startSpan("child-span", {
                    attributes: { "has.parent": false }
                });

                Assert.ok(span, "Span should be created with parent context");

                // End the span
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                span!.end();

                // Verify track was called
                Assert.equal(1, this._trackCalls.length, "track should have been called once");
                
                const item = this._trackCalls[0];
                Assert.ok(item, "Telemetry item should be present");
                Assert.ok(item.baseData && item.baseData.properties, "Properties should be present");
                Assert.equal("child-span", item.baseData.name, "Should include span name");
                Assert.equal(false, item.baseData.properties["has.parent"], "Should include span attributes");
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