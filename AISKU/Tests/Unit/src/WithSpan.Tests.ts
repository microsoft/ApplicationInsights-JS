import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { 
    IReadableSpan, eOTelSpanKind, eOTelSpanStatusCode, withSpan, ITelemetryItem, ISpanScope
} from "@microsoft/applicationinsights-core-js";
export class WithSpanTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${WithSpanTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    
    // Track calls to track for validation
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "WithSpanTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: WithSpanTests._connectionString,
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
            console.error('Failed to initialize WithSpan tests: ' + e);
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
            name: "WithSpan: withSpan should be available as exported function",
            test: () => {
                // Verify that withSpan is available as an import
                Assert.ok(typeof withSpan === 'function', "withSpan should be available as exported function");
            }
        });

        this.testCase({
            name: "WithSpan: should execute function within span context",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-context-test", {
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
                const result = withSpan(this._ai.core!, testSpan!, testFunction);

                // Assert
                Assert.equal(result, "context-success", "Function should execute and return result");
                Assert.ok(capturedActiveSpan, "Function should have access to active span");
                Assert.equal(capturedActiveSpan, testSpan, "Active span should be the provided test span");
            }
        });

        this.testCase({
            name: "WithSpan: should work with telemetry tracking inside span context",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const testSpan = this._ai.startSpan("withSpan-telemetry-test", {
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
                            "event.source": "withSpan-context"
                        }
                    });
                    
                    this._ai.trackMetric({
                        name: "operation.duration",
                        average: 123.45
                    });
                    
                    return "telemetry-tracked";
                };

                // Act
                const result = withSpan(this._ai.core!, testSpan!, telemetryFunction);

                // Assert
                Assert.equal(result, "telemetry-tracked", "Function should complete successfully");
                
                // End the span to trigger trace generation
                testSpan!.end();
                
                // Verify track was called for the span
                Assert.equal(this._trackCalls.length, 3, "Should have one track call from span ending");
                const item = this._trackCalls[2];
                Assert.ok(item.baseData && item.baseData.properties, "Item should have properties");
                Assert.equal("withSpan-telemetry-test", item.baseData.name, "Should include span name in properties");
            }
        });

        this.testCase({
            name: "WithSpan: should handle complex function arguments and return values",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-arguments-test");
                Assert.ok(testSpan, "Test span should be created");
                
                const complexFunction = (
                    stringArg: string, 
                    numberArg: number, 
                    objectArg: { key: string; value: number },
                    arrayArg: string[]
                ) => {
                    return {
                        processedString: stringArg.toUpperCase(),
                        doubledNumber: numberArg * 2,
                        extractedValue: objectArg.value,
                        joinedArray: arrayArg.join('-'),
                        timestamp: Date.now()
                    };
                };

                const inputObject = { key: "test-key", value: 42 };
                const inputArray = ["item1", "item2", "item3"];

                // Act
                const result = withSpan(
                    this._ai.core!, 
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
            name: "WithSpan: should handle function with this context binding",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-this-binding-test");
                Assert.ok(testSpan, "Test span should be created");
                
                class TestService {
                    private _serviceId: string;
                    private _multiplier: number;
                    
                    constructor(id: string, multiplier: number) {
                        this._serviceId = id;
                        this._multiplier = multiplier;
                    }
                    
                    public processValue(input: number): { serviceId: string; result: number; multiplied: number } {
                        return {
                            serviceId: this._serviceId,
                            result: input + 100,
                            multiplied: input * this._multiplier
                        };
                    }
                }
                
                const service = new TestService("test-service-123", 3);

                // Act
                const result = withSpan(
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
            name: "WithSpan: should maintain span context across async-like operations",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-async-like-test", {
                    attributes: {
                        "operation.type": "async-simulation"
                    }
                });
                Assert.ok(testSpan, "Test span should be created");
                
                let spanDuringCallback: IReadableSpan | null = null;
                let callbackExecuted = false;
                
                const asyncLikeFunction = (callback: (data: string) => void) => {
                    // Simulate async work that completes synchronously in test
                    const currentSpan = this._ai.core!.activeSpan!();
                    
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
                
                const result = withSpan(this._ai.core!, testSpan!, asyncLikeFunction, undefined, callback);

                // Assert
                Assert.equal(result, "withSpan-async-like-test", "Function should have access to span name");
                
                // Note: In a real async scenario, the span context wouldn't automatically 
                // propagate to the setTimeout callback without additional context management
                // This test validates the synchronous behavior of withSpan
            }
        });

        this.testCase({
            name: "WithSpan: should handle exceptions and preserve span operations",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-exception-test", {
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
                    
                    throw new Error("Test exception for withSpan handling");
                };

                // Act & Assert
                let caughtException: Error | null = null;
                try {
                    withSpan(this._ai.core!, testSpan!, exceptionFunction);
                } catch (error) {
                    caughtException = error as Error;
                }

                Assert.ok(caughtException, "Exception should be thrown and caught");
                Assert.equal(caughtException!.message, "Test exception for withSpan handling", "Exception message should be preserved");
                
                // Verify span is still valid and operations were applied
                Assert.ok(testSpan!.isRecording(), "Span should still be recording after exception");
                const readableSpan = testSpan! as IReadableSpan;
                Assert.ok(!readableSpan.ended, "Span should not be ended by withSpan after exception");
            }
        });

        this.testCase({
            name: "WithSpan: should work with nested span operations and child spans",
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
                const result = withSpan(this._ai.core!, parentSpan!, nestedOperations);

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
            name: "WithSpan: should support different return value types",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-return-types-test");
                Assert.ok(testSpan, "Test span should be created");

                // Test various return types
                const stringResult = withSpan(this._ai.core!, testSpan!, () => "string-result");
                const numberResult = withSpan(this._ai.core!, testSpan!, () => 42.5);
                const booleanResult = withSpan(this._ai.core!, testSpan!, () => true);
                const arrayResult = withSpan(this._ai.core!, testSpan!, () => [1, 2, 3]);
                const objectResult = withSpan(this._ai.core!, testSpan!, () => ({ key: "value", nested: { prop: 123 } }));
                const nullResult = withSpan(this._ai.core!, testSpan!, () => null);
                const undefinedResult = withSpan(this._ai.core!, testSpan!, () => undefined);

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
            name: "WithSpan: should handle rapid successive calls efficiently",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-performance-test");
                Assert.ok(testSpan, "Test span should be created");
                
                const iterations = 100;
                let totalResult = 0;
                
                // Simple computation function
                const computeFunction = (input: number) => {
                    return input * 2 + 1;
                };

                const startTime = Date.now();

                // Act - Multiple rapid withSpan calls
                for (let i = 0; i < iterations; i++) {
                    const result = withSpan(this._ai.core!, testSpan!, computeFunction, undefined, i);
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
                Assert.ok(testSpan!.isRecording(), "Span should still be recording after multiple withSpan calls");
            }
        });

        this.testCase({
            name: "WithSpan: should integrate with AI telemetry correlation",
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
                
                const businessLogicFunction = (userId: string, dataType: string) => {
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
                const result = withSpan(
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
            name: "WithSpan: should handle empty or no-op functions gracefully",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("withSpan-noop-test");
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
                const emptyResult = withSpan(this._ai.core!, testSpan!, emptyFunction);
                const noOpResult = withSpan(this._ai.core!, testSpan!, noOpFunction);
                const undefinedResult = withSpan(this._ai.core!, testSpan!, undefinedFunction);

                // Assert
                Assert.equal(emptyResult, undefined, "Empty function should return undefined");
                Assert.equal(noOpResult, undefined, "No-op function should return undefined");
                Assert.equal(undefinedResult, undefined, "Undefined function should return undefined");
                
                // Verify span is still valid
                Assert.ok(testSpan!.isRecording(), "Span should still be recording after no-op functions");
            }
        });

        this.testCase({
            name: "WithSpan: should use ISpanScope as 'this' when no thisArg provided",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("test-span", {
                    attributes: { "test.id": "withSpan-this-test" }
                });
                
                let capturedThis: any = null;
                let capturedCore: any = null;
                let capturedSpan: any = null;

                // Act - call withSpan without thisArg
                const result = withSpan(this._ai.core, span!, function(this: ISpanScope, arg1: string, arg2: number) {
                    capturedThis = this;
                    capturedCore = this.core;
                    capturedSpan = this.span;
                    return `${arg1}-${arg2}`;
                }, undefined, "test", 42);

                // Assert
                Assert.equal(result, "test-42", "Function should execute and return result");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.ok(capturedThis.core, "'this.core' should exist");
                Assert.ok(capturedThis.span, "'this.span' should exist");
                Assert.equal(capturedCore, this._ai.core, "'this.core' should be the AI core");
                Assert.equal(capturedSpan, span, "'this.span' should be the passed span");
                Assert.equal(capturedThis.span.name, "test-span", "'this.span.name' should match");

                span!.end();
            }
        });

        this.testCase({
            name: "WithSpan: should use provided thisArg when specified",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("test-span-thisarg");
                
                const customContext = {
                    contextId: "custom-123",
                    multiplier: 10
                };
                
                let capturedThis: any = null;

                // Act - call withSpan with explicit thisArg
                const result = withSpan(this._ai.core, span!, function(this: typeof customContext, arg1: number) {
                    capturedThis = this;
                    return arg1 * this.multiplier;
                }, customContext, 5);

                // Assert
                Assert.equal(result, 50, "Function should execute with custom this context");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.equal(capturedThis, customContext, "'this' should be the custom context");
                Assert.equal(capturedThis.contextId, "custom-123", "'this.contextId' should match");
                Assert.equal(capturedThis.multiplier, 10, "'this.multiplier' should match");
                Assert.ok(!capturedThis.core, "Custom this should not have core property");
                Assert.ok(!capturedThis.span, "Custom this should not have span property");

                span!.end();
            }
        });

        this.testCase({
            name: "WithSpan: arrow functions should not override 'this' binding",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("arrow-function-test");
                
                // Act - arrow functions capture their lexical 'this'
                const result = withSpan(this._ai.core, span!, (arg: string) => {
                    // Arrow function - 'this' is lexically bound to the test class instance
                    Assert.ok(this._ai, "Arrow function should have access to test class 'this'");
                    return `arrow-${arg}`;
                }, undefined, "result");

                // Assert
                Assert.equal(result, "arrow-result", "Arrow function should execute correctly");
                Assert.ok(this._ai, "Test class instance should still be accessible");

                span!.end();
            }
        });

        this.testCase({
            name: "WithSpan: verify ISpanScope.restore() is called to restore previous active span",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-span");
                const innerSpan = this._ai.startSpan("inner-span");
                
                let activeSpanBeforeWithSpan: any = null;
                let activeSpanInsideWithSpan: any = null;
                let activeSpanAfterWithSpan: any = null;

                // Act
                activeSpanBeforeWithSpan = this._ai.core.activeSpan ? this._ai.core.activeSpan() : null;
                
                withSpan(this._ai.core, innerSpan!, () => {
                    activeSpanInsideWithSpan = this._ai.core.activeSpan ? this._ai.core.activeSpan() : null;
                    Assert.equal(activeSpanInsideWithSpan, innerSpan, "Active span inside withSpan should be inner span");
                });
                
                activeSpanAfterWithSpan = this._ai.core.activeSpan ? this._ai.core.activeSpan() : null;

                // Assert
                // Active span should be restored after withSpan completes
                Assert.equal(activeSpanAfterWithSpan, activeSpanBeforeWithSpan, 
                    "Active span should be restored after withSpan completes");

                innerSpan!.end();
                outerSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: 'this' binding with nested withSpan calls",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-withspan");
                const innerSpan = this._ai.startSpan("inner-withspan");
                
                const outerContext = {
                    contextName: "outer",
                    value: 100
                };

                let outerThisCapture: any = null;
                let innerThisCapture: any = null;
                let ai = this._ai;

                // Act - nested withSpan calls with different thisArg
                withSpan(ai.core, outerSpan!, function(this: typeof outerContext, arg: number) {
                    outerThisCapture = this;
                    Assert.equal(this.contextName, "outer", "Outer 'this' should be outer context");
                    Assert.equal(this.value, 100, "Outer 'this.value' should match");
                    
                    withSpan(ai.core, innerSpan!, function(this: ISpanScope) {
                        innerThisCapture = this;
                        // Inner call without explicit thisArg - should be ISpanScope
                        Assert.ok(this.core, "Inner 'this' should be ISpanScope");
                        Assert.ok(this.span, "Inner 'this.span' should exist");
                        Assert.equal(this.span.name, "inner-withspan", "Inner span name should match");
                    });
                    
                    return arg * this.value;
                }, outerContext, 2);

                // Assert
                Assert.ok(outerThisCapture, "Outer 'this' should be captured");
                Assert.equal(outerThisCapture.contextName, "outer", "Outer context should be preserved");
                
                Assert.ok(innerThisCapture, "Inner 'this' should be captured");
                Assert.ok(innerThisCapture.core, "Inner 'this' should have core");
                Assert.ok(innerThisCapture.span, "Inner 'this' should have span");

                innerSpan!.end();
                outerSpan!.end();
            }
        });
    }
}