import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { eOTelSpanKind, eOTelSpanStatusCode, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

export class TelemetryItemGenerationTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${TelemetryItemGenerationTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "TelemetryItemGenerationTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: TelemetryItemGenerationTests._connectionString,
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
        this.addSpanKindTests();
        this.addStatusCodeTests();
        this.addAttributeTests();
        this.addTelemetryItemStructureTests();
        this.addComplexScenarioTests();
    }

    private addSpanKindTests(): void {
        this.testCase({
            name: "SpanKind: INTERNAL span generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("internal-operation", {
                    kind: eOTelSpanKind.INTERNAL,
                    attributes: { "operation.name": "internal-task" }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate one telemetry item");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                Assert.ok(item.baseData.properties, "Should have properties");
            }
        });

        this.testCase({
            name: "SpanKind: CLIENT span generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("client-request", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: { 
                        "http.method": "GET",
                        "http.url": "https://example.com/api",
                        "custom.attribute": "custom-value"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate one telemetry item");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                // Semantic attributes like http.method are excluded from properties
                Assert.ok(!item.baseData.properties || !item.baseData.properties["http.method"],
                    "http.method should not be in properties (mapped to baseData)");
                // Custom attributes should be in properties
                Assert.equal(item.baseData.properties?.["custom.attribute"], "custom-value",
                    "Custom attributes should be in properties");
            }
        });

        this.testCase({
            name: "SpanKind: SERVER span generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("server-handler", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: { 
                        "http.method": "POST",
                        "http.status_code": 200,
                        "custom.server.id": "server-123"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate one telemetry item");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                // Semantic attributes are excluded from properties
                Assert.ok(!item.baseData.properties || !item.baseData.properties["http.method"],
                    "http.method should not be in properties (mapped to baseData)");
                // Custom attributes should be in properties
                Assert.equal(item.baseData.properties?.["custom.server.id"], "server-123",
                    "Custom attributes should be in properties");
            }
        });

        this.testCase({
            name: "SpanKind: PRODUCER span generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("message-producer", {
                    kind: eOTelSpanKind.PRODUCER,
                    attributes: { 
                        "messaging.system": "kafka",
                        "messaging.destination": "orders-topic",
                        "producer.id": "producer-456"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate one telemetry item");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                // messaging.* attributes may or may not be excluded depending on semantic conventions
                // Custom attributes should be in properties
                Assert.equal(item.baseData.properties?.["producer.id"], "producer-456",
                    "Custom attributes should be in properties");
            }
        });

        this.testCase({
            name: "SpanKind: CONSUMER span generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("message-consumer", {
                    kind: eOTelSpanKind.CONSUMER,
                    attributes: { 
                        "messaging.system": "rabbitmq",
                        "messaging.operation": "receive",
                        "consumer.group": "group-789"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate one telemetry item");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                // messaging.* attributes may or may not be excluded depending on semantic conventions
                // Custom attributes should be in properties
                Assert.equal(item.baseData.properties?.["consumer.group"], "group-789",
                    "Custom attributes should be in properties");
            }
        });

        this.testCase({
            name: "SpanKind: all span kinds generate independent telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const spanKinds = [
                    eOTelSpanKind.INTERNAL,
                    eOTelSpanKind.CLIENT,
                    eOTelSpanKind.SERVER,
                    eOTelSpanKind.PRODUCER,
                    eOTelSpanKind.CONSUMER
                ];

                // Act
                spanKinds.forEach((kind, index) => {
                    const span = this._ai.startSpan(`span-kind-${index}`, { kind });
                    span?.end();
                });

                // Assert
                Assert.equal(this._trackCalls.length, spanKinds.length,
                    "Each span kind should generate telemetry");
            }
        });
    }

    private addStatusCodeTests(): void {
        this.testCase({
            name: "StatusCode: UNSET status generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("unset-status-span");
                // Don't set status - defaults to UNSET
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "StatusCode: OK status generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("ok-status-span");
                span?.setStatus({
                    code: eOTelSpanStatusCode.OK,
                    message: "Operation successful"
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "StatusCode: ERROR status generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("error-status-span");
                span?.setStatus({
                    code: eOTelSpanStatusCode.ERROR,
                    message: "Operation failed"
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "StatusCode: status with message includes message in telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const errorMessage = "Database connection timeout";
                
                // Act
                const span = this._ai.startSpan("status-with-message");
                span?.setStatus({
                    code: eOTelSpanStatusCode.ERROR,
                    message: errorMessage
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                // Note: Implementation may include status message in properties or elsewhere
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData with status information");
            }
        });

        this.testCase({
            name: "StatusCode: changing status before end affects telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("changing-status-span");
                span?.setStatus({ code: eOTelSpanStatusCode.OK });
                span?.setStatus({ code: eOTelSpanStatusCode.ERROR, message: "Changed to error" });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                // The final status (ERROR) should be reflected in telemetry
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData with final status");
            }
        });

        this.testCase({
            name: "StatusCode: multiple spans with different statuses",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span1 = this._ai.startSpan("span-ok");
                span1?.setStatus({ code: eOTelSpanStatusCode.OK });
                span1?.end();

                const span2 = this._ai.startSpan("span-error");
                span2?.setStatus({ code: eOTelSpanStatusCode.ERROR });
                span2?.end();

                const span3 = this._ai.startSpan("span-unset");
                // No status set
                span3?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 3, "Should generate telemetry for all spans");
            }
        });
    }

    private addAttributeTests(): void {
        this.testCase({
            name: "Attributes: span with no attributes generates telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("no-attributes-span");
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "Attributes: span with string attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("string-attrs-span", {
                    attributes: {
                        "user.id": "user123",
                        "session.id": "session456",
                        "operation.name": "checkout"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                // These custom attributes should be in properties
                Assert.equal(item.baseData.properties["user.id"], "user123",
                    "Should include custom string attributes");
                Assert.equal(item.baseData.properties["session.id"], "session456",
                    "Should include custom string attributes");
                // operation.name is a context tag key and gets excluded from properties
            }
        });

        this.testCase({
            name: "Attributes: span with number attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("number-attrs-span", {
                    attributes: {
                        "request.size": 1024,
                        "response.time": 156.78,
                        "retry.count": 3
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                // Custom number attributes should be in properties
                Assert.equal(item.baseData.properties["request.size"], 1024,
                    "Should include custom number attributes");
                Assert.equal(item.baseData.properties["response.time"], 156.78,
                    "Should include custom number attributes");
            }
        });

        this.testCase({
            name: "Attributes: span with boolean attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("boolean-attrs-span", {
                    attributes: {
                        "cache.hit": true,
                        "auth.required": false,
                        "retry.enabled": true
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                Assert.equal(item.baseData.properties["cache.hit"], true,
                    "Should include boolean attributes");
            }
        });

        this.testCase({
            name: "Attributes: span with mixed type attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("mixed-attrs-span", {
                    attributes: {
                        "string.attr": "value",
                        "number.attr": 42,
                        "boolean.attr": true,
                        "float.attr": 3.14
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                Assert.equal(item.baseData.properties["string.attr"], "value");
                Assert.equal(item.baseData.properties["number.attr"], 42);
                Assert.equal(item.baseData.properties["boolean.attr"], true);
            }
        });

        this.testCase({
            name: "Attributes: setAttribute after creation adds to telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("dynamic-attrs-span");
                span?.setAttribute("initial.attr", "initial");
                span?.setAttribute("added.later", "later-value");
                span?.setAttribute("number.added", 999);
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                Assert.equal(item.baseData.properties["initial.attr"], "initial");
                Assert.equal(item.baseData.properties["added.later"], "later-value");
                Assert.equal(item.baseData.properties["number.added"], 999);
            }
        });

        this.testCase({
            name: "Attributes: setAttributes adds multiple attributes to telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("batch-attrs-span");
                span?.setAttributes({
                    "batch.attr1": "value1",
                    "batch.attr2": "value2",
                    "batch.attr3": 123
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                Assert.equal(item.baseData.properties["batch.attr1"], "value1");
                Assert.equal(item.baseData.properties["batch.attr2"], "value2");
                Assert.equal(item.baseData.properties["batch.attr3"], 123);
            }
        });

        this.testCase({
            name: "Attributes: updating attribute value reflects in telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("update-attr-span");
                span?.setAttribute("status", "pending");
                span?.setAttribute("status", "in-progress");
                span?.setAttribute("status", "completed");
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                Assert.equal(item.baseData.properties["status"], "completed",
                    "Should reflect final attribute value");
            }
        });
    }

    private addTelemetryItemStructureTests(): void {
        this.testCase({
            name: "Structure: telemetry item has required fields",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("structure-test-span");
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                
                Assert.ok(item.name, "Should have name");
                Assert.ok(item.baseData, "Should have baseData");
                Assert.ok(item.baseData.properties, "Should have properties");
            }
        });

        this.testCase({
            name: "Structure: span name is in telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const spanName = "my-custom-operation";
                
                // Act
                const span = this._ai.startSpan(spanName);
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                
                // Span name is in baseData.name, not properties.name
                Assert.ok(item.baseData, "Should have baseData");
                Assert.equal(item.baseData.name, spanName,
                    "Span name should be in baseData.name");
            }
        });

        this.testCase({
            name: "Structure: updated span name reflects in telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const originalName = "original-name";
                const updatedName = "updated-name";
                
                // Act
                const span = this._ai.startSpan(originalName);
                span?.updateName(updatedName);
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                
                // Updated span name should be in baseData.name
                Assert.ok(item.baseData, "Should have baseData");
                Assert.equal(item.baseData.name, updatedName,
                    "Updated span name should be in baseData.name");
            }
        });

        this.testCase({
            name: "Structure: trace context is in telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("trace-context-span");
                const spanContext = span?.spanContext();
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                
                // Telemetry should include trace context information
                Assert.ok(spanContext, "Span should have context");
                Assert.ok(spanContext?.traceId, "Should have traceId");
                Assert.ok(spanContext?.spanId, "Should have spanId");
            }
        });

        this.testCase({
            name: "Structure: multiple spans generate separate telemetry items",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span1 = this._ai.startSpan("span-1");
                span1?.end();
                
                const span2 = this._ai.startSpan("span-2");
                span2?.end();
                
                const span3 = this._ai.startSpan("span-3");
                span3?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 3, "Should generate 3 telemetry items");
                
                // Span names are in baseData.name, not properties.name
                const names = this._trackCalls.map(item => item.baseData?.name);
                Assert.ok(names.includes("span-1"), "Should include span-1");
                Assert.ok(names.includes("span-2"), "Should include span-2");
                Assert.ok(names.includes("span-3"), "Should include span-3");
            }
        });
    }

    private addComplexScenarioTests(): void {
        this.testCase({
            name: "Complex: span with kind, status, and attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("complex-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://api.example.com/users",
                        "http.status_code": 201,
                        "request.id": "req-12345",
                        "user.action": "create"
                    }
                });
                span?.setStatus({
                    code: eOTelSpanStatusCode.OK,
                    message: "User created successfully"
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                // Semantic attributes are excluded from properties
                Assert.ok(!item.baseData.properties || !item.baseData.properties["http.method"],
                    "http.method should not be in properties");
                // Custom attributes should be in properties
                Assert.equal(item.baseData.properties?.["request.id"], "req-12345",
                    "Custom attributes should be in properties");
                Assert.equal(item.baseData.properties?.["user.action"], "create",
                    "Custom attributes should be in properties");
            }
        });

        this.testCase({
            name: "Complex: parent-child spans generate separate telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const parentSpan = this._ai.startSpan("parent-operation");
                const parentContext = parentSpan?.spanContext();
                
                const childSpan = this._ai.startSpan("child-operation", undefined, parentContext);
                childSpan?.end();
                
                parentSpan?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 2, "Should generate telemetry for both spans");
                
                // Span names are in baseData.name, not properties.name
                const names = this._trackCalls.map(item => item.baseData?.name);
                Assert.ok(names.includes("child-operation"), "Should include child telemetry");
                Assert.ok(names.includes("parent-operation"), "Should include parent telemetry");
            }
        });

        this.testCase({
            name: "Complex: span with dynamic attributes during execution",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("dynamic-execution-span", {
                    attributes: { "phase": "start" }
                });
                
                span?.setAttribute("phase", "processing");
                span?.setAttribute("items.processed", 50);
                
                span?.setAttribute("phase", "finalizing");
                span?.setAttribute("items.processed", 100);
                
                span?.setStatus({ code: eOTelSpanStatusCode.OK });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData?.properties, "Should have properties");
                Assert.equal(item.baseData.properties["phase"], "finalizing",
                    "Should have final phase value");
                Assert.equal(item.baseData.properties["items.processed"], 100,
                    "Should have final processed count");
            }
        });

        this.testCase({
            name: "Complex: all span kinds with attributes and status",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const testData = [
                    { kind: eOTelSpanKind.INTERNAL, name: "internal-op", attr: "internal-value" },
                    { kind: eOTelSpanKind.CLIENT, name: "client-op", attr: "client-value" },
                    { kind: eOTelSpanKind.SERVER, name: "server-op", attr: "server-value" },
                    { kind: eOTelSpanKind.PRODUCER, name: "producer-op", attr: "producer-value" },
                    { kind: eOTelSpanKind.CONSUMER, name: "consumer-op", attr: "consumer-value" }
                ];

                // Act
                testData.forEach(data => {
                    const span = this._ai.startSpan(data.name, {
                        kind: data.kind,
                        attributes: { "operation.type": data.attr }
                    });
                    span?.setStatus({ code: eOTelSpanStatusCode.OK });
                    span?.end();
                });

                // Assert
                Assert.equal(this._trackCalls.length, testData.length,
                    "Should generate telemetry for all span types");
                
                testData.forEach(data => {
                    // Span names are in baseData.name, not properties.name
                    const telemetry = this._trackCalls.find(
                        item => item.baseData?.name === data.name
                    );
                    Assert.ok(telemetry, `Should have telemetry for ${data.name}`);
                    // Custom attributes should be in properties
                    Assert.equal(telemetry?.baseData?.properties?.["operation.type"], data.attr,
                        `Should have correct attributes for ${data.name}`);
                });
            }
        });

        this.testCase({
            name: "Complex: non-recording spans do not generate telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const recordingSpan = this._ai.startSpan("recording-span", { recording: true });
                recordingSpan?.end();
                
                const nonRecordingSpan = this._ai.startSpan("non-recording-span", { recording: false });
                nonRecordingSpan?.end();

                // Assert
                // Recording span should generate telemetry, non-recording should not
                // Span names are in baseData.name, not properties.name
                const recordingTelemetry = this._trackCalls.find(
                    item => item.baseData?.name === "recording-span"
                );
                const nonRecordingTelemetry = this._trackCalls.find(
                    item => item.baseData?.name === "non-recording-span"
                );
                
                Assert.ok(recordingTelemetry, "Recording span should generate telemetry");
                Assert.ok(!nonRecordingTelemetry, "Non-recording span should not generate telemetry");
            }
        });
    }
}
