import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import {
    IReadableSpan, eOTelSpanKind, eOTelSpanStatusCode, useSpan, ITelemetryItem, ISpanScope
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
                const testFunction = () => {
                    capturedActiveSpan = this._ai.core!.activeSpan!();
                    return "context-success";
                };

                // Act
                const result = useSpan(this._ai.core!, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "context-success", "Function should execute and return result");
                Assert.ok(capturedActiveSpan, "Function should have access to active span");
                Assert.equal(capturedActiveSpan, testSpan, "Active span should be the provided test span");
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
                        spanDuringCallback = this._ai.core!.activeSpan!();
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
                    const activeSpan = this._ai.core!.activeSpan!();
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
                    const currentActive = this._ai.core!.activeSpan!();
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
                    Assert.ok(this.core, "'this.core' should exist");
                    Assert.ok(this.span, "'this.span' should exist");
                    
                    // Verify scope parameter is also ISpanScope
                    Assert.ok(scope.core, "scope.core should exist");
                    Assert.ok(scope.span, "scope.span should exist");
                    
                    return `${arg1}-${scope.span.name}`;
                }, undefined, "result");

                // Assert
                Assert.equal(result, "result-usespan-test", "Function should execute and return result");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.ok(capturedThis.core, "'this.core' should exist");
                Assert.ok(capturedThis.span, "'this.span' should exist");
                Assert.equal(capturedThis.core, this._ai.core, "'this.core' should be the AI core");
                Assert.equal(capturedThis.span, span, "'this.span' should be the passed span");
                
                Assert.ok(capturedScopeParam, "scope parameter should be defined");
                Assert.equal(capturedScopeParam.core, this._ai.core, "scope.core should be the AI core");
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
                    Assert.ok(scope.core, "scope.core should exist");
                    Assert.ok(scope.span, "scope.span should exist");
                    
                    return this.getData("custom");
                }, service);

                // Assert
                Assert.equal(result, "custom-service-456", "Function should execute with custom this context");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.equal(capturedThis, service, "'this' should be the service instance");
                Assert.equal(capturedThis.serviceId, "service-456", "'this.serviceId' should match");
                Assert.ok(!capturedThis.core, "Custom this should not have core property");
                Assert.ok(!capturedThis.span, "Custom this should not have span property");
                
                Assert.ok(capturedScopeParam, "scope parameter should be defined");
                Assert.ok(capturedScopeParam.core, "scope.core should exist even with custom this");
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
                        Assert.ok(this.core, "Inner 'this' should be ISpanScope");
                        Assert.ok(this.span, "Inner 'this.span' should exist");
                        Assert.equal(this.span.name, "inner-nested-span", "Inner span name should match");
                    });
                    
                    innerSpan!.end();
                }, outerContext);

                // Assert
                Assert.ok(outerThisCapture, "Outer 'this' should be captured");
                Assert.equal(outerThisCapture.contextName, "outer", "Outer context should be preserved");
                
                Assert.ok(innerThisCapture, "Inner 'this' should be captured");
                Assert.ok(innerThisCapture.core, "Inner 'this' should have core");
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
                activeSpanBeforeUseSpan = this._ai.core.activeSpan ? this._ai.core.activeSpan() : null;
                
                useSpan(this._ai.core, innerSpan!, (scope: ISpanScope) => {
                    activeSpanInsideUseSpan = this._ai.core.activeSpan ? this._ai.core.activeSpan() : null;
                    Assert.equal(activeSpanInsideUseSpan, innerSpan, "Active span inside useSpan should be inner span");
                });
                
                activeSpanAfterUseSpan = this._ai.core.activeSpan ? this._ai.core.activeSpan() : null;

                // Assert
                // Active span should be restored after useSpan completes
                Assert.equal(activeSpanAfterUseSpan, activeSpanBeforeUseSpan, 
                    "Active span should be restored after useSpan completes");

                innerSpan!.end();
                outerSpan!.end();
            }
        });
    }
}