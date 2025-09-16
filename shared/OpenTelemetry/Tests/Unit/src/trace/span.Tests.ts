import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { dumpObj, perfNow, isFunction, isString, isNumber, isBoolean, isObject, isArray } from "@nevware21/ts-utils";
import { IOTelApi } from "../../../../src/interfaces/IOTelApi";
import { eOTelSpanKind, eOTelSpanStatusCode, IOTelAttributes, IOTelConfig, IOTelErrorHandlers, IOTelSpanContext, IReadableSpan } from "@microsoft/applicationinsights-core-js";
import { IOTelSpanCtx } from "../../../../src/interfaces/trace/IOTelSpanCtx";
import { createSpan } from "../../../../src/trace/span";

export class SpanTests extends AITestClass {

    private _mockApi: IOTelApi;
    private _mockSpanContext: IOTelSpanContext;
    private _onEndCalls: IReadableSpan[];

    public testInitialize() {
        super.testInitialize();
        this._onEndCalls = [];

        // Create mock span context
        this._mockSpanContext = {
            traceId: "12345678901234567890123456789012",
            spanId: "1234567890123456",
            traceFlags: 1,
            isRemote: false
        };

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
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
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
            name: "createSpan: basic function signature validation",
            test: () => {
                // Validate the function signature by checking argument count
                Assert.equal(createSpan.length, 3, "createSpan should accept 3 parameters");
            }
        });

        this.testCase({
            name: "createSpan: should call onEnd when span.end() is called",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                Assert.equal(this._onEndCalls.length, 0, "onEnd should not be called before end()");
                
                span.end();

                // Assert
                Assert.equal(this._onEndCalls.length, 1, "onEnd should be called once");
                Assert.equal(this._onEndCalls[0], span, "onEnd should be called with the span instance");
                Assert.ok(span.ended, "Span should be marked as ended");
                Assert.ok(!span.isRecording(), "Span should not be recording after ending");
            }
        });

        this.testCase({
            name: "span context validation",
            test: () => {
                // Test span context structure
                Assert.ok(this._mockSpanContext.traceId, "Span context should have traceId");
                Assert.ok(this._mockSpanContext.spanId, "Span context should have spanId");
                Assert.ok(isNumber(this._mockSpanContext.traceFlags), "Trace flags should be a number");
                Assert.equal(this._mockSpanContext.traceId.length, 32, "TraceId should be 32 characters");
                Assert.equal(this._mockSpanContext.spanId.length, 16, "SpanId should be 16 characters");
            }
        });

        this.testCase({
            name: "span kind enum validation",
            test: () => {
                // Test that span kinds are properly defined
                Assert.ok(isNumber(eOTelSpanKind.INTERNAL), "INTERNAL span kind should be defined");
                Assert.ok(isNumber(eOTelSpanKind.CLIENT), "CLIENT span kind should be defined");
                Assert.ok(isNumber(eOTelSpanKind.SERVER), "SERVER span kind should be defined");
                Assert.ok(isNumber(eOTelSpanKind.PRODUCER), "PRODUCER span kind should be defined");
                Assert.ok(isNumber(eOTelSpanKind.CONSUMER), "CONSUMER span kind should be defined");
            }
        });

        this.testCase({
            name: "span status enum validation",
            test: () => {
                // Test that span status codes are properly defined
                Assert.ok(isNumber(eOTelSpanStatusCode.UNSET), "UNSET status should be defined");
                Assert.ok(isNumber(eOTelSpanStatusCode.OK), "OK status should be defined");
                Assert.ok(isNumber(eOTelSpanStatusCode.ERROR), "ERROR status should be defined");
            }
        });

        this.testCase({
            name: "error handlers structure validation",
            test: () => {
                // Test error handlers structure
                const errorHandlers: IOTelErrorHandlers = {
                    attribError: (message: string, key: string, value: any) => {},
                    spanError: (message: string, spanName: string) => {},
                    warn: (message: string) => {},
                    error: (message: string) => {},
                    debug: (message: string) => {},
                    notImplemented: (message: string) => {}
                };

                Assert.ok(isFunction(errorHandlers.attribError), "attribError should be a function");
                Assert.ok(isFunction(errorHandlers.spanError), "spanError should be a function");
                Assert.ok(isFunction(errorHandlers.warn), "warn should be a function");
                Assert.ok(isFunction(errorHandlers.error), "error should be a function");
                Assert.ok(isFunction(errorHandlers.debug), "debug should be a function");
                Assert.ok(isFunction(errorHandlers.notImplemented), "notImplemented should be a function");
            }
        });

        this.testCase({
            name: "attributes interface validation",
            test: () => {
                // Test attributes interface
                const attributes: IOTelAttributes = {
                    "string-attr": "value",
                    "number-attr": 42,
                    "boolean-attr": true,
                    "array-attr": ["a", "b", "c"]
                };

                Assert.ok(isString(attributes["string-attr"]), "String attribute should be string");
                Assert.ok(isNumber(attributes["number-attr"]), "Number attribute should be number");
                Assert.ok(isBoolean(attributes["boolean-attr"]), "Boolean attribute should be boolean");
                Assert.ok(isArray(attributes["array-attr"]), "Array attribute should be array");
            }
        });

        this.testCase({
            name: "span context interface completeness",
            test: () => {
                // Validate all required span context fields are defined
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                Assert.ok(spanCtx.api, "SpanCtx should have api");
                Assert.ok(spanCtx.context, "SpanCtx should have context");
                Assert.ok(spanCtx.spanContext, "SpanCtx should have spanContext");
                
                // Test optional fields
                spanCtx.startTime = perfNow();
                spanCtx.isRecording = true;
                spanCtx.attributes = { "test": "value" };
                spanCtx.onEnd = (span) => {};
                
                Assert.ok(isNumber(spanCtx.startTime), "startTime should be number when set");
                Assert.ok(isBoolean(spanCtx.isRecording), "isRecording should be boolean when set");
                Assert.ok(isObject(spanCtx.attributes), "attributes should be object when set");
                Assert.ok(isFunction(spanCtx.onEnd), "onEnd should be function when set");
            }
        });

        this.testCase({
            name: "createSpan: should handle onEnd callback being undefined",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    // onEnd is undefined,
                    resource: {} as any,
                    instrumentationScope: {} as any

                };

                // Act & Assert - should not throw
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                span.end(); // Should not throw when onEnd is undefined
                
                Assert.ok(span.ended, "Span should be ended");
            }
        });

        this.testCase({
            name: "createSpan: should create span with empty name when orgName is null/undefined",
            test: () => {
                // Test cases for various null/undefined values
                const testCases = [null, undefined, ""];
                
                testCases.forEach((testName, index) => {
                    const spanCtx: IOTelSpanCtx = {
                        api: this._mockApi,
                        context: {} as any,
                        spanContext: this._mockSpanContext,
                        onEnd: (span) => this._onEndCalls.push(span),
                        resource: {} as any,
                        instrumentationScope: {} as any
                    };

                    const span = createSpan(spanCtx, testName as any, eOTelSpanKind.INTERNAL);
                    
                    Assert.equal(span.name, testName || "", `Span name should be empty string for test case ${index}`);
                });
            }
        });

        this.testCase({
            name: "createSpan: should use default span kind when not provided",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "test-span", null as any);

                // Assert
                Assert.equal(span.kind, eOTelSpanKind.INTERNAL, "Should default to INTERNAL span kind");
            }
        });

        this.testCase({
            name: "createSpan: setAttribute should work when recording",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                span.setAttribute("test.key", "test.value");
                span.setAttribute("test.number", 42);
                span.setAttribute("test.boolean", true);

                // Assert
                const attributes = span.attributes;
                Assert.equal(attributes["test.key"], "test.value", "String attribute should be set");
                Assert.equal(attributes["test.number"], 42, "Number attribute should be set");
                Assert.equal(attributes["test.boolean"], true, "Boolean attribute should be set");
            }
        });

        this.testCase({
            name: "createSpan: setAttributes should work when recording",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                span.setAttributes({
                    "attr1": "value1",
                    "attr2": 123,
                    "attr3": true
                });

                // Assert
                const attributes = span.attributes;
                Assert.equal(attributes["attr1"], "value1", "Attribute 1 should be set");
                Assert.equal(attributes["attr2"], 123, "Attribute 2 should be set");
                Assert.equal(attributes["attr3"], true, "Attribute 3 should be set");
            }
        });

        this.testCase({
            name: "createSpan: setStatus should work",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);
                span.setStatus({ 
                    code: eOTelSpanStatusCode.ERROR, 
                    message: "Test error message" 
                });

                // Assert
                const status = span.status;
                Assert.equal(status.code, eOTelSpanStatusCode.ERROR, "Status code should be set");
                Assert.equal(status.message, "Test error message", "Status message should be set");
            }
        });

        this.testCase({
            name: "createSpan: updateName should work",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "original-name", eOTelSpanKind.CLIENT);
                Assert.equal(span.name, "original-name", "Original name should be set");
                
                span.updateName("updated-name");

                // Assert
                Assert.equal(span.name, "updated-name", "Name should be updated");
            }
        });

        this.testCase({
            name: "createSpan: should return same span instance from fluent methods",
            test: () => {
                // Arrange
                const spanCtx: IOTelSpanCtx = {
                    api: this._mockApi,
                    context: {} as any,
                    spanContext: this._mockSpanContext,
                    onEnd: (span) => this._onEndCalls.push(span),
                    resource: {} as any,
                    instrumentationScope: {} as any
                };

                // Act
                const span = createSpan(spanCtx, "test-span", eOTelSpanKind.CLIENT);

                // Assert fluent interface
                Assert.equal(span.setAttribute("key", "value"), span, "setAttribute should return span instance");
                Assert.equal(span.setAttributes({}), span, "setAttributes should return span instance");
                Assert.equal(span.setStatus({ code: eOTelSpanStatusCode.OK }), span, "setStatus should return span instance");
                Assert.equal(span.updateName("new-name"), span, "updateName should return span instance");
                Assert.equal(span.addEvent("event"), span, "addEvent should return span instance");
                Assert.equal(span.addLink({ context: this._mockSpanContext }), span, "addLink should return span instance");
                Assert.equal(span.addLinks([]), span, "addLinks should return span instance");
            }
        });
    }
}
