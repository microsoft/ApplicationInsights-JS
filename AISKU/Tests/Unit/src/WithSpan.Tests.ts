import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { 
    IReadableSpan, eOTelSpanKind, eOTelSpanStatusCode, withSpan, ITelemetryItem, ISpanScope, ITraceHost
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
                    capturedActiveSpan = this._ai.core!.getActiveSpan();
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
                    const currentSpan = this._ai.core!.getActiveSpan();
                    
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
                    const activeSpan = this._ai.core!.getActiveSpan();
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
                let capturedHost: ITraceHost | null = null;
                let capturedSpan: any = null;

                // Act - call withSpan without thisArg
                const result = withSpan(this._ai.core, span!, function(this: ISpanScope, arg1: string, arg2: number) {
                    capturedThis = this;
                    capturedHost = this.host;
                    capturedSpan = this.span;
                    return `${arg1}-${arg2}`;
                }, undefined, "test", 42);

                // Assert
                Assert.equal(result, "test-42", "Function should execute and return result");
                Assert.ok(capturedThis, "'this' should be defined");
                Assert.ok(capturedThis.host, "'this.host' should exist");
                Assert.ok(capturedThis.span, "'this.span' should exist");
                Assert.equal(capturedHost, this._ai.core, "'this.host' should be the AI core");
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
                activeSpanBeforeWithSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;
                
                withSpan(this._ai.core, innerSpan!, () => {
                    activeSpanInsideWithSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;
                    Assert.equal(activeSpanInsideWithSpan, innerSpan, "Active span inside withSpan should be inner span");
                });
                
                activeSpanAfterWithSpan = this._ai.core.getActiveSpan ? this._ai.core.getActiveSpan() : null;

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
                        Assert.ok(this.host, "Inner 'this' should be ISpanScope");
                        Assert.ok(this.span, "Inner 'this.span' should exist");
                        Assert.equal(this.span.name, "inner-withspan", "Inner span name should match");
                    });
                    
                    return arg * this.value;
                }, outerContext, 2);

                // Assert
                Assert.ok(outerThisCapture, "Outer 'this' should be captured");
                Assert.equal(outerThisCapture.contextName, "outer", "Outer context should be preserved");
                
                Assert.ok(innerThisCapture, "Inner 'this' should be captured");
                Assert.ok(innerThisCapture.host, "Inner 'this' should have host");
                Assert.ok(innerThisCapture.span, "Inner 'this' should have span");

                innerSpan!.end();
                outerSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: trace context should match active span context inside withSpan",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("trace-context-match-test", {
                    attributes: {
                        "test.type": "trace-context-validation"
                    }
                });
                Assert.ok(testSpan, "Test span should be created");

                let traceCtxInsideWithSpan: any = null;
                let spanContextInsideWithSpan: any = null;
                let activeSpanInsideWithSpan: any = null;

                // Act
                withSpan(this._ai.core, testSpan!, function(this: ISpanScope) {
                    // Get trace context from core
                    traceCtxInsideWithSpan = this.host.getTraceCtx(false);
                    
                    // Get span context from the span
                    spanContextInsideWithSpan = this.span.spanContext();
                    
                    // Get active span
                    activeSpanInsideWithSpan = this.host.getActiveSpan ? this.host.getActiveSpan() : null;
                });

                // Assert
                Assert.ok(traceCtxInsideWithSpan, "Trace context should exist inside withSpan");
                Assert.ok(spanContextInsideWithSpan, "Span context should exist");
                Assert.ok(activeSpanInsideWithSpan, "Active span should be set");
                
                // Verify active span matches the withSpan span
                Assert.equal(activeSpanInsideWithSpan, testSpan, "Active span should be the withSpan span");
                
                // Verify trace context matches span context
                Assert.equal(traceCtxInsideWithSpan.traceId, spanContextInsideWithSpan.traceId,
                    "Trace context traceId should match span context traceId");
                Assert.equal(traceCtxInsideWithSpan.spanId, spanContextInsideWithSpan.spanId,
                    "Trace context spanId should match span context spanId");
                Assert.equal(traceCtxInsideWithSpan.traceFlags, spanContextInsideWithSpan.traceFlags,
                    "Trace context traceFlags should match span context traceFlags");

                testSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: trace context updates when switching between nested withSpan calls",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-trace-span");
                const innerSpan = this._ai.startSpan("inner-trace-span");
                
                let outerTraceCtx: any = null;
                let outerSpanCtx: any = null;
                let innerTraceCtx: any = null;
                let innerSpanCtx: any = null;
                let ai = this._ai;

                // Act
                withSpan(ai.core, outerSpan!, function(this: ISpanScope) {
                    outerTraceCtx = this.host.getTraceCtx(false);
                    outerSpanCtx = this.span.spanContext();
                    
                    // Verify outer trace context matches outer span
                    Assert.equal(outerTraceCtx.spanId, outerSpanCtx.spanId,
                        "Outer trace context should match outer span");
                    
                    // Nested withSpan with different span
                    withSpan(ai.core, innerSpan!, function(this: ISpanScope) {
                        innerTraceCtx = this.host.getTraceCtx(false);
                        innerSpanCtx = this.span.spanContext();
                        
                        // Verify inner trace context matches inner span
                        Assert.equal(innerTraceCtx.spanId, innerSpanCtx.spanId,
                            "Inner trace context should match inner span");
                        
                        // Verify inner context is different from outer
                        Assert.notEqual(innerTraceCtx.spanId, outerTraceCtx.spanId,
                            "Inner and outer trace contexts should have different spanIds");
                    });
                    
                    // After inner withSpan, verify we're back to outer context
                    const restoredTraceCtx = this.host.getTraceCtx(false);
                    Assert.equal(restoredTraceCtx.spanId, outerSpanCtx.spanId,
                        "Trace context should be restored to outer span after inner withSpan completes");
                });

                outerSpan!.end();
                innerSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: child spans created inside withSpan inherit correct parent context",
            test: () => {
                // Arrange
                const parentSpan = this._ai.startSpan("parent-for-child-test");
                let ai = this._ai;
                
                let childSpanContext: any = null;
                let parentSpanContext: any = null;

                // Act
                withSpan(ai.core, parentSpan!, function(this: ISpanScope) {
                    parentSpanContext = this.span.spanContext();
                    
                    // Create a child span while parent is active
                    const childSpan = ai.startSpan("child-span-in-withSpan");
                    childSpanContext = childSpan!.spanContext();
                    
                    // Verify trace context matches parent
                    const traceCtx = this.host.getTraceCtx(false);
                    Assert.equal(traceCtx.spanId, parentSpanContext.spanId,
                        "Trace context should match parent span inside withSpan");
                    
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
            name: "WithSpan: trace context is restored after withSpan completes",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("temporary-trace-span");
                
                let traceCtxBefore: any = null;
                let traceCtxInside: any = null;
                let traceCtxAfter: any = null;
                let ai = this._ai;

                // Act
                traceCtxBefore = this._ai.core.getTraceCtx(false);
                
                withSpan(ai.core, testSpan!, function(this: ISpanScope) {
                    traceCtxInside = this.host.getTraceCtx(false);
                });
                
                traceCtxAfter = this._ai.core.getTraceCtx(false);

                // Assert
                Assert.ok(traceCtxBefore, "Trace context should exist before withSpan (created by startSpan)");
                Assert.ok(traceCtxInside, "Trace context should exist inside withSpan");
                Assert.equal(traceCtxInside.spanId, testSpan!.spanContext().spanId,
                    "Trace context inside withSpan should match the test span");
                Assert.ok(traceCtxAfter, "Trace context should exist after withSpan");
                Assert.equal(traceCtxAfter.spanId, traceCtxBefore.spanId,
                    "Trace context should be restored to previous state after withSpan");

                testSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: trace context reflects parent span when withSpan is nested in another active span",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-active-span");
                
                this._ai.setActiveSpan(outerSpan!);
                
                const innerSpan = this._ai.startSpan("inner-withspan-span");
                let ai = this._ai;
                
                let outerSpanCtx: any = null;
                let traceCtxBeforeWithSpan: any = null;
                let traceCtxInsideWithSpan: any = null;
                let traceCtxAfterWithSpan: any = null;

                // Act
                outerSpanCtx = outerSpan!.spanContext();
                traceCtxBeforeWithSpan = this._ai.core.getTraceCtx(false);
                
                // Verify initial trace context matches outer span
                Assert.equal(traceCtxBeforeWithSpan.spanId, outerSpanCtx.spanId,
                    "Trace context should initially match outer span");
                
                withSpan(ai.core, innerSpan!, function(this: ISpanScope) {
                    traceCtxInsideWithSpan = this.host.getTraceCtx(false);
                    const innerSpanCtx = this.span.spanContext();
                    
                    // Inside withSpan, trace context should match inner span
                    Assert.equal(traceCtxInsideWithSpan.spanId, innerSpanCtx.spanId,
                        "Trace context inside withSpan should match inner span");
                });
                
                traceCtxAfterWithSpan = this._ai.core.getTraceCtx(false);
                
                // After withSpan, trace context should be restored to outer span
                Assert.equal(traceCtxAfterWithSpan.spanId, outerSpanCtx.spanId,
                    "Trace context should be restored to outer span after withSpan");

                innerSpan!.end();
                outerSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: trace context traceState is accessible inside withSpan",
            test: () => {
                // Arrange
                const testSpan = this._ai.startSpan("tracestate-test-span");
                let ai = this._ai;
                
                let traceStateInside: any = null;

                // Act
                withSpan(ai.core, testSpan!, function(this: ISpanScope) {
                    const traceCtx = this.host.getTraceCtx(false);
                    traceStateInside = traceCtx ? traceCtx.traceState : null;
                });

                // Assert
                Assert.ok(traceStateInside !== undefined,
                    "Trace state should be accessible inside withSpan");

                testSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: span created inside withSpan has parent context matching outer trace context",
            test: () => {
                // Arrange
                const outerSpan = this._ai.startSpan("outer-parent-span");
                
                this._ai.setActiveSpan(outerSpan!);
                
                let outerTraceCtx: any = null;
                let innerSpanParentCtx: any = null;
                let innerSpanCreated: any = null;
                let ai = this._ai;

                // Act
                outerTraceCtx = this._ai.core.getTraceCtx(false);
                
                withSpan(ai.core, outerSpan!, function(this: ISpanScope) {
                    // Create a new span inside withSpan
                    innerSpanCreated = ai.startSpan("inner-child-span");
                    
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
            name: "WithSpan: span parent context matches trace context when withSpan wraps different span",
            test: () => {
                // Arrange - Create initial trace context
                const contextSpan = this._ai.startSpan("context-span");
                
                this._ai.setActiveSpan(contextSpan!);
                
                const contextTraceCtx = this._ai.core.getTraceCtx(false);
                
                // Create a different span to use in withSpan
                const wrapperSpan = this._ai.startSpan("wrapper-span");
                
                let spanCreatedInCallback: any = null;
                let spanParentCtx: any = null;
                let ai = this._ai;

                // Act - withSpan with a different span than what's in trace context
                withSpan(ai.core, wrapperSpan!, function(this: ISpanScope) {
                    // The active span is now wrapperSpan
                    // Create a child span - it should have wrapperSpan as parent
                    spanCreatedInCallback = ai.startSpan("child-of-wrapper");
                    
                    if (spanCreatedInCallback) {
                        spanParentCtx = spanCreatedInCallback.parentSpanContext;
                    }
                    
                    spanCreatedInCallback!.end();
                });

                // Assert
                Assert.ok(spanParentCtx, "Child span should have parent context");
                
                // Parent should be wrapperSpan (the withSpan span), not contextSpan
                const wrapperSpanCtx = wrapperSpan!.spanContext();
                Assert.equal(spanParentCtx.spanId, wrapperSpanCtx.spanId,
                    "Child span parent should be the wrapper span from withSpan");
                Assert.notEqual(spanParentCtx.spanId, contextTraceCtx.spanId,
                    "Child span parent should NOT be the original context span");

                wrapperSpan!.end();
                contextSpan!.end();
            }
        });

        this.testCase({
            name: "WithSpan: multiple nested spans maintain correct parent-child relationships with trace context",
            test: () => {
                // Arrange
                const rootSpan = this._ai.startSpan("root-span");
                
                this._ai.setActiveSpan(rootSpan!);
                
                const level1Span = this._ai.startSpan("level1-span");
                
                let level2SpanParent: any = null;
                let level2SpanCtx: any = null;
                let level3SpanParent: any = null;
                let ai = this._ai;

                // Act - Nested withSpan calls
                withSpan(ai.core, level1Span!, function(this: ISpanScope) {
                    const level1TraceCtx = this.host.getTraceCtx(false);
                    
                    // Create level2 span - should have level1 as parent
                    const level2Span = ai.startSpan("level2-span");
                    if (level2Span) {
                        level2SpanParent = level2Span.parentSpanContext;
                        level2SpanCtx = level2Span.spanContext();
                    }
                    
                    withSpan(ai.core, level2Span!, function(this: ISpanScope) {
                        const level2TraceCtx = this.host.getTraceCtx(false);
                        
                        // Create level3 span - should have level2 as parent
                        const level3Span = ai.startSpan("level3-span");
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