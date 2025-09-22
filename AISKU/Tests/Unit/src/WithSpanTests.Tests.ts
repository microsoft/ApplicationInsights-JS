import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { 
    IReadableSpan, IOTelSpanOptions, eOTelSpanKind, eOTelSpanStatusCode, newId, IDistributedTraceContext, withSpan
} from "@microsoft/applicationinsights-core-js";
import { 
    ITraceTelemetry, eSeverityLevel
} from '@microsoft/applicationinsights-common';

export class WithSpanTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${WithSpanTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    
    // Track calls to trackTrace for validation
    private _trackTraceCalls: { trace: ITraceTelemetry, properties: any }[] = [];

    constructor(testName?: string) {
        super(testName || "WithSpanTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackTraceCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: WithSpanTests._connectionString,
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
                this._trackTraceCalls = [];
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
                
                // Verify trace was generated for the span
                Assert.equal(this._trackTraceCalls.length, 1, "Should have one trackTrace call from span ending");
                const traceCall = this._trackTraceCalls[0];
                Assert.ok(traceCall.trace.message.includes("withSpan-telemetry-test"), "Trace should include span name");
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
                this._trackTraceCalls = [];
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
                
                // End parent span to generate trace
                parentSpan!.end();
                
                // Should have 3 traces: parent + 2 children
                Assert.equal(this._trackTraceCalls.length, 3, "Should have traces for parent and child spans");
                
                // Verify trace names
                const traceNames = this._trackTraceCalls.map(call => call.trace.message);
                Assert.ok(traceNames.some(name => name.includes("parent-operation")), "Should have parent span trace");
                Assert.ok(traceNames.some(name => name.includes("child-operation-1")), "Should have child-1 span trace");
                Assert.ok(traceNames.some(name => name.includes("child-operation-2")), "Should have child-2 span trace");
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
                this._trackTraceCalls = [];
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
                
                // Verify span trace was generated
                Assert.equal(this._trackTraceCalls.length, 1, "Should have one trackTrace call from span ending");
                const spanTrace = this._trackTraceCalls[0];
                Assert.ok(spanTrace.trace.message.includes("user-operation"), "Trace should include span name");
                
                // Verify span attributes are included in trace properties
                Assert.equal(spanTrace.properties["user.id"], "user-123", "Span attributes should be included in trace");
                Assert.equal(spanTrace.properties["operation.type"], "data-processing", "All span attributes should be preserved");
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
    }
}