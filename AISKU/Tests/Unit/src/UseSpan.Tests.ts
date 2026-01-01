import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import {
    IReadableSpan, eOTelSpanKind, eOTelSpanStatusCode, useSpan, ITelemetryItem, ISpanScope, ITraceHost
} from "@microsoft/applicationinsights-core-js";
import { IAppInsightsCore } from "@microsoft/applicationinsights-core-js/src/applicationinsights-core-js";

export class UseSpanTests extends AITestClass {
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${UseSpanTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    
    // Track calls to track for validation
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "UseSpanTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: UseSpanTests._connectionString,
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
            console.error("Failed to initialize UseSpan tests: " + e);
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
            name: "UseSpan: useSpan should be available as exported function",
            test: () => {
                // Verify that useSpan is available as an import
                Assert.ok(typeof useSpan === "function", "useSpan should be available as exported function");
            }
        });

        this.testCase({
            name: "UseSpan: should execute function within span context",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-context-test", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "test.type": "context-execution"
                    }
                });
                
                Assert.ok(testSpan, "Test span should be created");
                Assert.ok(this._ai.core, "Core should be available");
                
                let capturedActiveSpan: IReadableSpan | null = null;
                let capturedHost: ITraceHost | null = null;
                const testFunction = function(this: ISpanScope) {
                    capturedActiveSpan = this.host.getActiveSpan();
                    capturedHost = this.host;
                    return "context-success";
                };

                // Act
                const result = useSpan(this._ai.core!, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "context-success", "Function should execute and return result");
                Assert.ok(capturedActiveSpan, "Function should have access to active span");
                Assert.equal(capturedActiveSpan, testSpan, "Active span should be the provided test span");
                Assert.equal(capturedHost, this._ai.core, "Active host should be the core instance (passed to useSpan)");
            }
        });

        this.testCase({
            name: "UseSpan: should work with telemetry tracking inside span context",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const testSpan = this._ai.startSpan("useSpan-telemetry-test", {
                    attributes: {
                        "operation.name": "telemetry-tracking"
                    }
                });
                
                Assert.ok(testSpan, "Test span should be created");
                
                const telemetryFunction = () => {
                    // Track some telemetry within the span context
                    this._ai.trackEvent({
                        name: "operation-event",
                        properties: {
                            "event.source": "useSpan-context"
                        }
                    });
                    
                    this._ai.trackMetric({
                        name: "operation.duration",
                        average: 123.45
                    });
                    
                    return "telemetry-tracked";
                };

                // Act
                const result = useSpan(this._ai.core!, testSpan!, telemetryFunction);

                // Assert
                Assert.equal(result, "telemetry-tracked", "Function should complete successfully");
                
                // End the span to trigger trace generation
                testSpan!.end();
                
                // Verify track was called for the span
                Assert.equal(this._trackCalls.length, 3, "Should have one track call from span ending");
                const item = this._trackCalls[2];
                Assert.ok(item.baseData && item.baseData.properties, "Item should have properties");
                Assert.equal("useSpan-telemetry-test", item.baseData.name, "Should include span name in properties");
            }
        });

        this.testCase({
            name: "UseSpan: should handle complex function arguments and return values",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-arguments-test");
                Assert.ok(testSpan, "Test span should be created");
                
                const complexFunction = (
                    _scope: ISpanScope,
                    stringArg: string,
                    numberArg: number,
                    objectArg: { key: string; value: number },
                    arrayArg: string[]
                ) => {
                    return {
                        processedString: stringArg!.toUpperCase(),
                        doubledNumber: numberArg! * 2,
                        extractedValue: objectArg!.value,
                        joinedArray: arrayArg!.join("-"),
                        timestamp: Date.now()
                    };
                };

                const inputObject = { key: "test-key", value: 42 };
                const inputArray = ["item1", "item2", "item3"];

                // Act
                const result = useSpan(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this._ai.core!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    testSpan!,
                    complexFunction,
                    undefined,
                    "hello world",
                    10,
                    inputObject,
                    inputArray
                );

                // Assert
                Assert.equal(result.processedString, "HELLO WORLD", "String should be processed correctly");
                Assert.equal(result.doubledNumber, 20, "Number should be doubled correctly");
                Assert.equal(result.extractedValue, 42, "Object value should be extracted correctly");
                Assert.equal(result.joinedArray, "item1-item2-item3", "Array should be joined correctly");
                Assert.ok(result.timestamp > 0, "Timestamp should be generated");
            }
        });

        this.testCase({
            name: "UseSpan: should handle function with this context binding",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-this-binding-test");
                Assert.ok(testSpan, "Test span should be created");
                
                class TestService {
                    private _serviceId: string;
                    private _multiplier: number;
                    
                    constructor(id: string, multiplier: number) {
                        this._serviceId = id;
                        this._multiplier = multiplier;
                    }
                    
                    public processValue(_scope: ISpanScope, input: number): { serviceId: string; result: number; multiplied: number } {
                        return {
                            serviceId: this._serviceId,
                            result: input + 100,
                            multiplied: input * this._multiplier
                        };
                    }
                }
                
                const service = new TestService("test-service-123", 3);

                // Act
                const result = useSpan(
                    this._ai.core!,
                    testSpan!,
                    service.processValue,
                    service,
                    25
                );

                // Assert
                Assert.equal(result.serviceId, "test-service-123", "Service ID should be preserved via this binding");
                Assert.equal(result.result, 125, "Input should be processed correctly");
                Assert.equal(result.multiplied, 75, "Multiplication should use instance property");
            }
        });

        this.testCase({
            name: "UseSpan: should maintain span context across async-like operations",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-async-like-test", {
                    attributes: {
                        "operation.type": "async-simulation"
                    }
                });
                Assert.ok(testSpan, "Test span should be created");
                
                let spanDuringCallback: IReadableSpan | null = null;
                let callbackExecuted = false;
                
                const asyncLikeFunction = (scope: ISpanScope, callback: (data: string) => void) => {
                    // Simulate async work that completes synchronously in test
                    let currentSpan = scope.span;
                    
                    // Simulate callback execution (would normally be async)
                    setTimeout(() => {
                        spanDuringCallback = this._ai.core!.getActiveSpan();
                        callback("async-data");
                        callbackExecuted = true;
                    }, 0);
                    
                    return currentSpan ? (currentSpan as IReadableSpan).name : "no-span";
                };

                // Act
                let callbackData = "";
                const callback = (data: string) => {
                    callbackData = data;
                };
                
                const result = useSpan(this._ai.core!, testSpan!, asyncLikeFunction, undefined, callback);

                // Assert
                Assert.equal(result, "useSpan-async-like-test", "Function should have access to span name");
                
                // Note: In a real async scenario, the span context wouldn't automatically
                // propagate to the setTimeout callback without additional context management
                // This test validates the synchronous behavior of useSpan
            }
        });

        this.testCase({
            name: "UseSpan: should handle exceptions and preserve span operations",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-exception-test", {
                    attributes: {
                        "test.expects": "exception"
                    }
                });
                Assert.ok(testSpan, "Test span should be created");
                
                const exceptionFunction = () => {
                    // Perform some span operations before throwing
                    const activeSpan = this._ai.core!.getActiveSpan();
                    Assert.ok(activeSpan, "Should have active span before exception");
                    
                    activeSpan!.setAttribute("operation.status", "error");
                    activeSpan!.setStatus({
                        code: eOTelSpanStatusCode.ERROR,
                        message: "Operation failed with test exception"
                    });
                    
                    throw new Error("Test exception for useSpan handling");
                };

                // Act & Assert
                let caughtException: Error | null = null;
                try {
                    useSpan(this._ai.core!, testSpan!, exceptionFunction);
                } catch (error) {
                    caughtException = error as Error;
                }

                Assert.ok(caughtException, "Exception should be thrown and caught");
                Assert.equal(caughtException!.message, "Test exception for useSpan handling", "Exception message should be preserved");
                
                // Verify span is still valid and operations were applied
                Assert.ok(testSpan!.isRecording(), "Span should still be recording after exception");
                const readableSpan = testSpan! as IReadableSpan;
                Assert.ok(!readableSpan.ended, "Span should not be ended by useSpan after exception");
            }
        });

        this.testCase({
            name: "UseSpan: should work with nested span operations and child spans",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const parentSpan = this._ai.startSpan("parent-operation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "operation.name": "parent-process"
                    }
                });
                Assert.ok(parentSpan, "Parent span should be created");
                
                const nestedOperations = () => {
                    // Verify we have the parent span as active
                    const currentActive = this._ai.core!.getActiveSpan();
                    Assert.equal(currentActive, parentSpan, "Parent span should be active");
                    
                    // Create child operations within the parent span context
                    const childSpan1 = this._ai.startSpan("child-operation-1", {
                        attributes: { "child.order": 1 }
                    });
                    childSpan1!.setAttribute("child.status", "completed");
                    childSpan1!.end();
                    
                    const childSpan2 = this._ai.startSpan("child-operation-2", {
                        attributes: { "child.order": 2 }
                    });
                    childSpan2!.setAttribute("child.status", "completed");
                    childSpan2!.end();
                    
                    return "nested-operations-completed";
                };

                // Act
                const result = useSpan(this._ai.core!, parentSpan!, nestedOperations);

                // Assert
                Assert.equal(result, "nested-operations-completed", "Nested operations should complete successfully");
                
                // End parent span to generate telemetry
                parentSpan!.end();
                
                // Should have 3 telemetry items: parent + 2 children
                Assert.equal(this._trackCalls.length, 3, "Should have telemetry for parent and child spans");
                
                // Verify span names in properties
                const spanNames = this._trackCalls.map(item => item.baseData?.name).filter(n => n);
                Assert.ok(spanNames.some(name => name === "parent-operation"), "Should have parent span telemetry");
                Assert.ok(spanNames.some(name => name === "child-operation-1"), "Should have child-1 span telemetry");
                Assert.ok(spanNames.some(name => name === "child-operation-2"), "Should have child-2 span telemetry");
            }
        });

        this.testCase({
            name: "UseSpan: should support different return value types",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-return-types-test");
                Assert.ok(testSpan, "Test span should be created");

                // Test various return types
                const stringResult = useSpan(this._ai.core!, testSpan!, () => "string-result");
                const numberResult = useSpan(this._ai.core!, testSpan!, () => 42.5);
                const booleanResult = useSpan(this._ai.core!, testSpan!, () => true);
                const arrayResult = useSpan(this._ai.core!, testSpan!, () => [1, 2, 3]);
                const objectResult = useSpan(this._ai.core!, testSpan!, () => ({ key: "value", nested: { prop: 123 } }));
                const nullResult = useSpan(this._ai.core!, testSpan!, () => null);
                const undefinedResult = useSpan(this._ai.core!, testSpan!, () => undefined);

                // Assert
                Assert.equal(stringResult, "string-result", "String return should work");
                Assert.equal(numberResult, 42.5, "Number return should work");
                Assert.equal(booleanResult, true, "Boolean return should work");
                Assert.equal(arrayResult.length, 3, "Array return should work");
                Assert.equal(arrayResult[1], 2, "Array elements should be preserved");
                Assert.equal(objectResult.key, "value", "Object properties should be preserved");
                Assert.equal(objectResult.nested.prop, 123, "Nested object properties should be preserved");
                Assert.equal(nullResult, null, "Null return should work");
                Assert.equal(undefinedResult, undefined, "Undefined return should work");
            }
        });

        this.testCase({
            name: "UseSpan: should handle rapid successive calls efficiently",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-performance-test");
                Assert.ok(testSpan, "Test span should be created");
                
                const iterations = 100;
                let totalResult = 0;
                
                // Simple computation function
                const computeFunction = (_scope: ISpanScope, input: number) => {
                    return input * 2 + 1;
                };

                const startTime = Date.now();

                // Act - Multiple rapid useSpan calls
                for (let i = 0; i < iterations; i++) {
                    const result = useSpan(this._ai.core!, testSpan!, computeFunction, undefined, i);
                    totalResult += result;
                }

                const endTime = Date.now();
                const duration = endTime - startTime;

                // Assert
                const expectedTotal = Array.from({length: iterations}, (_, i) => i * 2 + 1).reduce((sum, val) => sum + val, 0);
                Assert.equal(totalResult, expectedTotal, "All computations should be correct");
                
                // Performance assertion - should complete reasonably quickly
                Assert.ok(duration < 1000, `Performance test should complete quickly: ${duration}ms for ${iterations} iterations`);
                
                // Verify span is still valid after many operations
                Assert.ok(testSpan!.isRecording(), "Span should still be recording after multiple useSpan calls");
            }
        });

        this.testCase({
            name: "UseSpan: should integrate with AI telemetry correlation",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const operationSpan = this._ai.startSpan("user-operation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "user.id": "user-123",
                        "operation.type": "data-processing"
                    }
                });
                Assert.ok(operationSpan, "Operation span should be created");
                
                const businessLogicFunction = (_scope: ISpanScope, userId: string, dataType: string) => {
                    // Track multiple telemetry items within span context
                    this._ai.trackEvent({
                        name: "data-processing-started",
                        properties: {
                            "user.id": userId,
                            "data.type": dataType,
                            "processing.stage": "initialization"
                        }
                    });
                    
                    // Simulate some processing steps
                    for (let step = 1; step <= 3; step++) {
                        this._ai.trackMetric({
                            name: "processing.step.duration",
                            average: step * 10.5,
                            properties: {
                                "step.number": step.toString()
                            }
                        });
                    }
                    
                    this._ai.trackEvent({
                        name: "data-processing-completed",
                        properties: {
                            "user.id": userId,
                            "data.type": dataType,
                            "processing.stage": "completion",
                            "steps.completed": "3"
                        }
                    });
                    
                    return {
                        userId: userId,
                        dataType: dataType,
                        stepsCompleted: 3,
                        status: "success"
                    };
                };

                // Act
                const result = useSpan(
                    this._ai.core!,
                    operationSpan!,
                    businessLogicFunction,
                    undefined,
                    "user-123",
                    "customer-data"
                );

                // End the span to generate trace
                operationSpan!.end();

                // Assert
                Assert.equal(result.userId, "user-123", "User ID should be processed correctly");
                Assert.equal(result.dataType, "customer-data", "Data type should be processed correctly");
                Assert.equal(result.stepsCompleted, 3, "All processing steps should be completed");
                Assert.equal(result.status, "success", "Operation should complete successfully");
                
                // Verify span telemetry was generated
                Assert.equal(this._trackCalls.length, 6, "Should have one track call from span ending");
                const spanItem = this._trackCalls[5];
                Assert.ok(spanItem.baseData && spanItem.baseData.properties, "Item should have properties");
                Assert.equal("user-operation", spanItem.baseData.name, "Should include span name");
                
                // Verify span attributes are included in properties
                Assert.equal(spanItem.baseData.properties["user.id"], "user-123", "Span attributes should be included in telemetry");
                Assert.equal(spanItem.baseData.properties["operation.type"], "data-processing", "All span attributes should be preserved");
            }
        });

        this.testCase({
            name: "UseSpan: should handle empty or no-op functions gracefully",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("useSpan-noop-test");
                Assert.ok(testSpan, "Test span should be created");
                
                // Test empty function
                const emptyFunction = () => {};
                
                // Test function that just returns without doing anything
                const noOpFunction = () => {
                    return;
                };
                
                // Test function that returns undefined explicitly
                const undefinedFunction = () => {
                    return undefined;
                };

                // Act
                const emptyResult = useSpan(this._ai.core!, testSpan!, emptyFunction);
                const noOpResult = useSpan(this._ai.core!, testSpan!, noOpFunction);
                const undefinedResult = useSpan(this._ai.core!, testSpan!, undefinedFunction);

                // Assert
                Assert.equal(emptyResult, undefined, "Empty function should return undefined");
                Assert.equal(noOpResult, undefined, "No-op function should return undefined");
                Assert.equal(undefinedResult, undefined, "Undefined function should return undefined");
                
                // Verify span is still valid
                Assert.ok(testSpan!.isRecording(), "Span should still be recording after no-op functions");
            }
        });

        this.testCase({
            name: "UseSpan: should use ISpanScope as 'this' when no thisArg provided",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("usespan-test", {
                    attributes: { "test.id": "useSpan-this-test" }
                });
                
                let capturedThis: any = null;
                let capturedScopeParam: any = null;

                // Act - call useSpan without thisArg (function receives scope as parameter)
                const result = useSpan(this._ai.core, span!, function(this: ISpanScope, scope: ISpanScope, arg1: string) {
                    capturedThis = this;
                    capturedScopeParam = scope;
                    
                    // Verify 'this' is ISpanScope
                    Assert.ok(this.host, "'this.core' should exist");
                    Assert.ok(this.span, "'this.span' should exist");
                    
                    // Verify scope parameter is also ISpanScope
                    Assert.ok(scope.host, "scope.host should exist");
                    Assert.ok(scope.span, "scope.span should exist");
                    
                    return `${arg1}-${scope.span.name}`;
                }, undefined, "result");

                // Assert
                Assert.equal(result, "result-usespan-test", "Function should execute and return result");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.ok(capturedThis.host, "'this.host' should exist");
                Assert.ok(capturedThis.span, "'this.span' should exist");
                Assert.equal(capturedThis.host, this._ai.core, "'this.host' should be the AI core");
                Assert.equal(capturedThis.span, span, "'this.span' should be the passed span");
                
                Assert.ok(capturedScopeParam, "scope parameter should be defined");
                Assert.equal(capturedScopeParam.host, this._ai.core, "scope.host should be the AI core");
                Assert.equal(capturedScopeParam.span, span, "scope.span should be the passed span");
                
                // Both 'this' and scope param should be the same ISpanScope instance
                Assert.equal(capturedThis, capturedScopeParam, "'this' and scope param should be the same ISpanScope instance");

                span!.end();
            }
        });

        this.testCase({
            name: "UseSpan: should use provided thisArg when specified",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("usespan-thisarg-test");
                
                class ServiceClass {
                    public serviceId: string = "service-456";
                    public getData(prefix: string): string {
                        return `${prefix}-${this.serviceId}`;
                    }
                }
                
                const service = new ServiceClass();
                let capturedThis: any = null;
                let capturedScopeParam: any = null;

                // Act - call useSpan with explicit thisArg
                const result = useSpan(this._ai.core, span!, function(this: ServiceClass, scope: ISpanScope) {
                    capturedThis = this;
                    capturedScopeParam = scope;
                    
                    // 'this' should be the service instance
                    Assert.equal(this.serviceId, "service-456", "'this.serviceId' should match");
                    Assert.ok(typeof this.getData === "function", "'this.getData' should be a function");
                    
                    // scope parameter should still be ISpanScope
                    Assert.ok(scope.host, "scope.host should exist");
                    Assert.ok(scope.span, "scope.span should exist");
                    
                    return this.getData("custom");
                }, service);

                // Assert
                Assert.equal(result, "custom-service-456", "Function should execute with custom this context");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.equal(capturedThis, service, "'this' should be the service instance");
                Assert.equal(capturedThis.serviceId, "service-456", "'this.serviceId' should match");
                Assert.ok(!capturedThis.host, "Custom this should not have host property");
                Assert.ok(!capturedThis.span, "Custom this should not have span property");
                
                Assert.ok(capturedScopeParam, "scope parameter should be defined");
                Assert.ok(capturedScopeParam.host, "scope.host should exist even with custom this");
                Assert.ok(capturedScopeParam.span, "scope.span should exist even with custom this");

                span!.end();
            }
        });

        this.testCase({
            name: "UseSpan: scope parameter should provide access to core and span operations",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const span = this._ai.startSpan("scope-operations-test");
                
                // Act - use scope parameter to perform operations
                useSpan(this._ai.core, span!, (scope: ISpanScope) => {
                    // Use scope.span to set attributes
                    scope.span.setAttribute("operation.name", "data-processing");
                    scope.span.setAttribute("operation.step", 1);
                    
                    // Use scope.span to set status
                    scope.span.setStatus({
                        code: 0,
                        message: "Operation successful"
                    });
                    
                    // Use scope.span to get context
                    const spanContext = scope.span.spanContext();
                    Assert.ok(spanContext.traceId, "Should access span context via scope");
                    Assert.ok(spanContext.spanId, "Should access span ID via scope");
                    
                    // Verify span name
                    Assert.equal(scope.span.name, "scope-operations-test", "Span name should be accessible");
                });

                // Assert
                Assert.ok(span, "Span should exist");
                Assert.equal(span!.name, "scope-operations-test", "Span name should match");
                
                span!.end();
                
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                Assert.ok(this._trackCalls[0].baseData?.properties, "Should have properties");
                Assert.equal(this._trackCalls[0].baseData.properties["operation.name"], "data-processing", "Attributes should be preserved");
            }
        });

        this.testCase({
            name: "UseSpan: 'this' binding with nested useSpan calls",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("nested-calls-test");
                
                const outerContext = {
                    contextName: "outer",
                    value: 100
                };

                let outerThisCapture: any = null;
                let innerThisCapture: any = null;
                let ai = this._ai;

                // Act - nested useSpan calls with different thisArg
                useSpan(this._ai.core, span!, function(this: typeof outerContext, outerScope: ISpanScope) {
                    outerThisCapture = this;
                    Assert.equal(this.contextName, "outer", "Outer 'this' should be outer context");
                    Assert.equal(this.value, 100, "Outer 'this.value' should match");
                    
                    const innerSpan = ai.startSpan("inner-nested-span");
                    
                    useSpan(ai.core, innerSpan!, function(this: ISpanScope, innerScope: ISpanScope) {
                        innerThisCapture = this;
                        // Inner call without explicit thisArg - should be ISpanScope
                        Assert.ok(this.host, "Inner 'this' should be ISpanScope");
                        Assert.ok(this.span, "Inner 'this.span' should exist");
                        Assert.equal(this.span.name, "inner-nested-span", "Inner span name should match");
                    });
                    
                    innerSpan!.end();
                }, outerContext);

                // Assert
                Assert.ok(outerThisCapture, "Outer 'this' should be captured");
                Assert.equal(outerThisCapture.contextName, "outer", "Outer context should be preserved");
                
                Assert.ok(innerThisCapture, "Inner 'this' should be captured");
                Assert.ok(innerThisCapture.host, "Inner 'this' should have host");
                Assert.ok(innerThisCapture.span, "Inner 'this' should have span");

                span!.end();
            }
        });

        this.testCase({
            name: "UseSpan: verify scope.restore() is called to restore previous active span",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-span");
                const innerSpan = this._ai.startSpan("inner-span");
                
                let activeSpanBeforeUseSpan: any = null;
                let activeSpanInsideUseSpan: any = null;
                let activeSpanAfterUseSpan: any = null;

                // Act
                activeSpanBeforeUseSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;
                
                useSpan(this._ai.core, innerSpan!, (scope: ISpanScope) => {
                    activeSpanInsideUseSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;
                    Assert.equal(activeSpanInsideUseSpan, innerSpan, "Active span inside useSpan should be inner span");
                });
                
                activeSpanAfterUseSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;

                // Assert
                // Active span should be restored after useSpan completes
                Assert.equal(activeSpanAfterUseSpan, activeSpanBeforeUseSpan, 
                    "Active span should be restored after useSpan completes");

                innerSpan!.end();
                outerSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: trace context should match active span context inside useSpan",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("trace-context-match-test", {
                    attributes: {
                        "test.type": "trace-context-validation"
                    }
                });
                Assert.ok(testSpan, "Test span should be created");

                let traceCtxInsideUseSpan: any = null;
                let spanContextInsideUseSpan: any = null;
                let activeSpanInsideUseSpan: any = null;

                // Act
                useSpan(this._ai.core, testSpan!, (scope: ISpanScope) => {
                    // Get trace context from core
                    traceCtxInsideUseSpan = this._ai.core.getTraceCtx(false);
                    
                    // Get span context from the span
                    spanContextInsideUseSpan = scope.span.spanContext();
                    
                    // Get active span
                    activeSpanInsideUseSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;
                });

                // Assert
                Assert.ok(traceCtxInsideUseSpan, "Trace context should exist inside useSpan");
                Assert.ok(spanContextInsideUseSpan, "Span context should exist");
                Assert.ok(activeSpanInsideUseSpan, "Active span should be set");
                
                // Verify active span matches the useSpan span
                Assert.equal(activeSpanInsideUseSpan, testSpan, "Active span should be the useSpan span");
                
                // Verify trace context matches span context
                Assert.equal(traceCtxInsideUseSpan.traceId, spanContextInsideUseSpan.traceId,
                    "Trace context traceId should match span context traceId");
                Assert.equal(traceCtxInsideUseSpan.spanId, spanContextInsideUseSpan.spanId,
                    "Trace context spanId should match span context spanId");
                Assert.equal(traceCtxInsideUseSpan.traceFlags, spanContextInsideUseSpan.traceFlags,
                    "Trace context traceFlags should match span context traceFlags");

                testSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: trace context updates when switching between nested useSpan calls",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-trace-span");
                const innerSpan = this._ai.startSpan("inner-trace-span");
                
                let outerTraceCtx: any = null;
                let outerSpanCtx: any = null;
                let innerTraceCtx: any = null;
                let innerSpanCtx: any = null;

                // Act
                useSpan(this._ai.core, outerSpan!, (outerScope: ISpanScope) => {
                    outerTraceCtx = this._ai.core.getTraceCtx(false);
                    outerSpanCtx = outerScope.span.spanContext();
                    
                    // Verify outer trace context matches outer span
                    Assert.equal(outerTraceCtx.spanId, outerSpanCtx.spanId,
                        "Outer trace context should match outer span");
                    
                    // Nested useSpan with different span
                    useSpan(this._ai.core, innerSpan!, (innerScope: ISpanScope) => {
                        innerTraceCtx = this._ai.core.getTraceCtx(false);
                        innerSpanCtx = innerScope.span.spanContext();
                        
                        // Verify inner trace context matches inner span
                        Assert.equal(innerTraceCtx.spanId, innerSpanCtx.spanId,
                            "Inner trace context should match inner span");
                        
                        // Verify inner context is different from outer
                        Assert.notEqual(innerTraceCtx.spanId, outerTraceCtx.spanId,
                            "Inner and outer trace contexts should have different spanIds");
                    });
                    
                    // After inner useSpan, verify we're back to outer context
                    const restoredTraceCtx = this._ai.core.getTraceCtx(false);
                    Assert.equal(restoredTraceCtx.spanId, outerSpanCtx.spanId,
                        "Trace context should be restored to outer span after inner useSpan completes");
                });

                outerSpan!.end();
                innerSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: child spans created inside useSpan inherit correct parent context",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-for-child-test");
                
                let childSpanContext: any = null;
                let parentSpanContext: any = null;

                // Act
                useSpan(this._ai.core, parentSpan!, (scope: ISpanScope) => {
                    parentSpanContext = scope.span.spanContext();
                    
                    // Create a child span while parent is active
                    const childSpan = this._ai.startSpan("child-span-in-useSpan");
                    childSpanContext = childSpan!.spanContext();
                    
                    // Verify trace context matches parent
                    const traceCtx = this._ai.core.getTraceCtx(false);
                    Assert.equal(traceCtx.spanId, parentSpanContext.spanId,
                        "Trace context should match parent span inside useSpan");
                    
                    childSpan!.end();
                });

                // Assert
                Assert.ok(childSpanContext, "Child span context should exist");
                Assert.ok(parentSpanContext, "Parent span context should exist");
                
                // Child should have same traceId as parent but different spanId
                Assert.equal(childSpanContext.traceId, parentSpanContext.traceId,
                    "Child span should have same traceId as parent");
                Assert.notEqual(childSpanContext.spanId, parentSpanContext.spanId,
                    "Child span should have different spanId from parent");

                parentSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: trace context is restored after useSpan completes",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("temporary-trace-span");
                
                let traceCtxBefore: any = null;
                let traceCtxInside: any = null;
                let traceCtxAfter: any = null;

                // Act
                traceCtxBefore = this._ai.core.getTraceCtx(false);
                
                useSpan(this._ai.core, testSpan!, () => {
                    traceCtxInside = this._ai.core.getTraceCtx(false);
                });
                
                traceCtxAfter = this._ai.core.getTraceCtx(false);

                // Assert
                Assert.ok(traceCtxBefore, "Trace context should exist before useSpan (created by startSpan)");
                Assert.ok(traceCtxInside, "Trace context should exist inside useSpan");
                Assert.equal(traceCtxInside.spanId, testSpan!.spanContext().spanId,
                    "Trace context inside useSpan should match the test span");
                Assert.ok(traceCtxAfter, "Trace context should exist after useSpan");
                Assert.equal(traceCtxAfter.spanId, traceCtxBefore.spanId,
                    "Trace context should be restored to previous state after useSpan");

                testSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: trace context reflects parent span when useSpan is nested in another active span",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-active-span");
                const provider = this._ai.core.getTraceProvider();
                
                this._ai.setActiveSpan(outerSpan!);
                
                const innerSpan = this._ai.startSpan("inner-usespan-span");
                
                let outerSpanCtx: any = null;
                let traceCtxBeforeUseSpan: any = null;
                let traceCtxInsideUseSpan: any = null;
                let traceCtxAfterUseSpan: any = null;

                // Act
                outerSpanCtx = outerSpan!.spanContext();
                traceCtxBeforeUseSpan = this._ai.core.getTraceCtx(false);
                
                // Verify initial trace context matches outer span
                Assert.equal(traceCtxBeforeUseSpan.spanId, outerSpanCtx.spanId,
                    "Trace context should initially match outer span");
                
                useSpan(this._ai.core, innerSpan!, (scope: ISpanScope) => {
                    traceCtxInsideUseSpan = this._ai.core.getTraceCtx(false);
                    const innerSpanCtx = scope.span.spanContext();
                    
                    // Inside useSpan, trace context should match inner span
                    Assert.equal(traceCtxInsideUseSpan.spanId, innerSpanCtx.spanId,
                        "Trace context inside useSpan should match inner span");
                });
                
                traceCtxAfterUseSpan = this._ai.core.getTraceCtx(false);
                
                // After useSpan, trace context should be restored to outer span
                Assert.equal(traceCtxAfterUseSpan.spanId, outerSpanCtx.spanId,
                    "Trace context should be restored to outer span after useSpan");

                innerSpan!.end();
                outerSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: trace context traceState is accessible inside useSpan",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("tracestate-test-span");
                
                let traceStateInside: any = null;

                // Act
                useSpan(this._ai.core, testSpan!, () => {
                    const traceCtx = this._ai.core.getTraceCtx(false);
                    traceStateInside = traceCtx ? traceCtx.traceState : null;
                });

                // Assert
                Assert.ok(traceStateInside !== undefined,
                    "Trace state should be accessible inside useSpan");

                testSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: span created inside useSpan has parent context matching outer trace context",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-parent-span");
                
                this._ai.setActiveSpan(outerSpan!);
                
                let outerTraceCtx: any = null;
                let innerSpanParentCtx: any = null;
                let innerSpanCreated: any = null;

                // Act
                outerTraceCtx = this._ai.core.getTraceCtx(false);
                
                useSpan(this._ai.core, outerSpan!, (scope: ISpanScope) => {
                    // Create a new span inside useSpan
                    innerSpanCreated = this._ai.startSpan("inner-child-span");
                    
                    // Get the parent context of the newly created span
                    if (innerSpanCreated) {
                        innerSpanParentCtx = innerSpanCreated.parentSpanContext;
                    }
                    
                    innerSpanCreated!.end();
                });

                // Assert
                Assert.ok(outerTraceCtx, "Outer trace context should exist");
                Assert.ok(innerSpanParentCtx, "Inner span should have parent context");
                
                // Verify parent context matches outer trace context
                Assert.equal(innerSpanParentCtx.traceId, outerTraceCtx.traceId,
                    "Inner span parent traceId should match outer trace context traceId");
                Assert.equal(innerSpanParentCtx.spanId, outerTraceCtx.spanId,
                    "Inner span parent spanId should match outer trace context spanId");

                outerSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: span parent context matches trace context when useSpan wraps different span",
            test: () => {
                // Arrange - Create initial trace context
                const contextSpan = this._ai.startSpan("context-span");
                
                this._ai.setActiveSpan(contextSpan!);
                
                const contextTraceCtx = this._ai.core.getTraceCtx(false);
                
                // Create a different span to use in useSpan
                const wrapperSpan = this._ai.startSpan("wrapper-span");
                
                let spanCreatedInCallback: any = null;
                let spanParentCtx: any = null;

                // Act - useSpan with a different span than what's in trace context
                useSpan(this._ai.core, wrapperSpan!, (scope: ISpanScope) => {
                    // The active span is now wrapperSpan
                    // Create a child span - it should have wrapperSpan as parent
                    spanCreatedInCallback = this._ai.startSpan("child-of-wrapper");
                    
                    if (spanCreatedInCallback) {
                        spanParentCtx = spanCreatedInCallback.parentSpanContext;
                    }
                    
                    spanCreatedInCallback!.end();
                });

                // Assert
                Assert.ok(spanParentCtx, "Child span should have parent context");
                
                // Parent should be wrapperSpan (the useSpan span), not contextSpan
                const wrapperSpanCtx = wrapperSpan!.spanContext();
                Assert.equal(spanParentCtx.spanId, wrapperSpanCtx.spanId,
                    "Child span parent should be the wrapper span from useSpan");
                Assert.notEqual(spanParentCtx.spanId, contextTraceCtx.spanId,
                    "Child span parent should NOT be the original context span");

                wrapperSpan!.end();
                contextSpan!.end();
            }
        });

        this.testCase({
            name: "UseSpan: multiple nested spans maintain correct parent-child relationships with trace context",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("root-span");
                
                this._ai.setActiveSpan(rootSpan!);
                
                const rootTraceCtx = this._ai.core.getTraceCtx(false);
                const level1Span = this._ai.startSpan("level1-span");
                
                let level2SpanParent: any = null;
                let level2SpanCtx: any = null;
                let level3SpanParent: any = null;

                // Act - Nested useSpan calls
                useSpan(this._ai.core, level1Span!, (scope1: ISpanScope) => {
                    const level1TraceCtx = this._ai.core.getTraceCtx(false);
                    
                    // Create level2 span - should have level1 as parent
                    const level2Span = this._ai.startSpan("level2-span");
                    if (level2Span) {
                        level2SpanParent = level2Span.parentSpanContext;
                        level2SpanCtx = level2Span.spanContext();
                    }
                    
                    useSpan(this._ai.core, level2Span!, (scope2: ISpanScope) => {
                        const level2TraceCtx = this._ai.core.getTraceCtx(false);
                        
                        // Create level3 span - should have level2 as parent
                        const level3Span = this._ai.startSpan("level3-span");
                        if (level3Span) {
                            level3SpanParent = level3Span.parentSpanContext;
                        }
                        
                        // Verify level3 parent matches level2 trace context
                        Assert.equal(level3SpanParent.spanId, level2TraceCtx.spanId,
                            "Level3 span parent should match level2 trace context");
                        
                        level3Span!.end();
                    });
                    
                    // Verify level2 parent matches level1 trace context
                    Assert.equal(level2SpanParent.spanId, level1TraceCtx.spanId,
                        "Level2 span parent should match level1 trace context");
                    
                    level2Span!.end();
                });

                // Assert
                Assert.ok(level2SpanParent, "Level2 span should have parent context");
                Assert.ok(level2SpanCtx, "Level2 span context should exist");
                Assert.ok(level3SpanParent, "Level3 span should have parent context");
                
                // Verify the chain: root -> level1 -> level2 -> level3
                Assert.equal(level2SpanParent.spanId, level1Span!.spanContext().spanId,
                    "Level2 parent should be level1");
                Assert.equal(level3SpanParent.spanId, level2SpanCtx.spanId,
                    "Level3 parent should be level2");

                level1Span!.end();
                rootSpan!.end();
            }
        });
    }
}