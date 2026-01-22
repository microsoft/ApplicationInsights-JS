import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { getGlobal } from "@nevware21/ts-utils";
import { handleAttribError, handleDebug, handleError, handleNotImplemented, handleSpanError, handleWarn } from "../../../../src/internal/otel/commonUtils";
import { IOTelErrorHandlers } from "../../../../src/interfaces/OTel/config/IOTelErrorHandlers";


export class CommonUtilsTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
        // Reset console mocks before each test
        this._resetConsoleMocks();
    }

    public testCleanup() {
        super.testCleanup();
        // Reset console mocks after each test
        this._resetConsoleMocks();
    }

    public registerTests() {
        this.testCase({
            name: "handleAttribError: should call custom attribError handler when provided",
            test: () => {
                // Arrange
                let calledMessage = "";
                let calledKey = "";
                let calledValue: any = null;
                const handlers: IOTelErrorHandlers = {
                    attribError: (message: string, key: string, value: any) => {
                        calledMessage = message;
                        calledKey = key;
                        calledValue = value;
                    }
                };
                const testMessage = "Test error message";
                const testKey = "testKey";
                const testValue = { test: "value" };

                // Act
                handleAttribError(handlers, testMessage, testKey, testValue);

                // Assert
                Assert.ok(calledMessage === testMessage, "Message should match");
                Assert.ok(calledKey === testKey, "Key should match");
                Assert.ok(calledValue === testValue, "Value should match");
            }
        });

        this.testCase({
            name: "handleAttribError: should call handleWarn when no custom attribError handler provided",
            test: () => {
                // Arrange
                let warnCalled = false;
                let warnMessage = "";
                const handlers: IOTelErrorHandlers = {
                    warn: (message: string) => {
                        warnCalled = true;
                        warnMessage = message;
                    }
                };
                const testMessage = "Test error";
                const testKey = "testKey";
                const testValue = "testValue";

                // Act
                handleAttribError(handlers, testMessage, testKey, testValue);

                // Assert
                Assert.ok(warnCalled, "Warn should be called");
                Assert.ok(warnMessage.includes(testMessage), "Warn message should contain original message");
                Assert.ok(warnMessage.includes(testKey), "Warn message should contain key");
                Assert.ok(warnMessage.includes(testValue), "Warn message should contain value");
            }
        });

        this.testCase({
            name: "handleSpanError: should call custom spanError handler when provided",
            test: () => {
                // Arrange
                let calledMessage = "";
                let calledSpanName = "";
                const handlers: IOTelErrorHandlers = {
                    spanError: (message: string, spanName: string) => {
                        calledMessage = message;
                        calledSpanName = spanName;
                    }
                };
                const testMessage = "Span error occurred";
                const testSpanName = "testSpan";

                // Act
                handleSpanError(handlers, testMessage, testSpanName);

                // Assert
                Assert.ok(calledMessage === testMessage, "Message should match");
                Assert.ok(calledSpanName === testSpanName, "Span name should match");
            }
        });

        this.testCase({
            name: "handleSpanError: should call handleWarn when no custom spanError handler provided",
            test: () => {
                // Arrange
                let warnCalled = false;
                let warnMessage = "";
                const handlers: IOTelErrorHandlers = {
                    warn: (message: string) => {
                        warnCalled = true;
                        warnMessage = message;
                    }
                };
                const testMessage = "Span error";
                const testSpanName = "testSpan";

                // Act
                handleSpanError(handlers, testMessage, testSpanName);

                // Assert
                Assert.ok(warnCalled, "Warn should be called");
                Assert.ok(warnMessage.includes(testMessage), "Warn message should contain original message");
                Assert.ok(warnMessage.includes(testSpanName), "Warn message should contain span name");
            }
        });

        this.testCase({
            name: "handleDebug: should call custom debug handler when provided",
            test: () => {
                // Arrange
                let debugCalled = false;
                let debugMessage = "";
                const handlers: IOTelErrorHandlers = {
                    debug: (message: string) => {
                        debugCalled = true;
                        debugMessage = message;
                    }
                };
                const testMessage = "Debug message";

                // Act
                handleDebug(handlers, testMessage);

                // Assert
                Assert.ok(debugCalled, "Debug should be called");
                Assert.ok(debugMessage === testMessage, "Debug message should match");
            }
        });

        this.testCase({
            name: "handleDebug: should use console.log when no custom debug handler provided",
            test: () => {
                // Arrange
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Debug via console";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console.log
                const originalConsole = console;
                const globalObj = (typeof window !== "undefined") ? window : (global || {});
                (globalObj as any).console = {
                    log: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleDebug(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.log should be called");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "handleWarn: should call custom warn handler when provided",
            test: () => {
                // Arrange
                let warnCalled = false;
                let warnMessage = "";
                const handlers: IOTelErrorHandlers = {
                    warn: (message: string) => {
                        warnCalled = true;
                        warnMessage = message;
                    }
                };
                const testMessage = "Warning message";

                // Act
                handleWarn(handlers, testMessage);

                // Assert
                Assert.ok(warnCalled, "Warn should be called");
                Assert.ok(warnMessage === testMessage, "Warn message should match");
            }
        });

        this.testCase({
            name: "handleWarn: should use console.warn when no custom warn handler provided",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Warning via console";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console.warn
                const originalConsole = console;
                (globalObj as any).console = {
                    warn: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleWarn(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.warn should be called");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "handleWarn: should fallback to console.log when console.warn not available",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Warning fallback to log";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console without warn
                const originalConsole = console;
                (globalObj as any).console = {
                    log: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleWarn(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.log should be called as fallback");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "handleError: should call custom error handler when provided",
            test: () => {
                // Arrange
                let errorCalled = false;
                let errorMessage = "";
                const handlers: IOTelErrorHandlers = {
                    error: (message: string) => {
                        errorCalled = true;
                        errorMessage = message;
                    }
                };
                const testMessage = "Error message";

                // Act
                handleError(handlers, testMessage);

                // Assert
                Assert.ok(errorCalled, "Error should be called");
                Assert.ok(errorMessage === testMessage, "Error message should match");
            }
        });

        this.testCase({
            name: "handleError: should fallback to warn handler when no custom error handler provided",
            test: () => {
                // Arrange
                let warnCalled = false;
                let warnMessage = "";
                const handlers: IOTelErrorHandlers = {
                    warn: (message: string) => {
                        warnCalled = true;
                        warnMessage = message;
                    }
                };
                const testMessage = "Error fallback to warn";

                // Act
                handleError(handlers, testMessage);

                // Assert
                Assert.ok(warnCalled, "Warn should be called as fallback");
                Assert.ok(warnMessage === testMessage, "Warn message should match");
            }
        });

        this.testCase({
            name: "handleError: should use console.error when no custom handlers provided",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Error via console";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console.error
                const originalConsole = console;
                (globalObj as any).console = {
                    error: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleError(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.error should be called");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "handleError: should fallback through console methods when preferred not available",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Error fallback chain";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console with only log available
                const originalConsole = console;
                (globalObj as any).console = {
                    log: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleError(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.log should be called as final fallback");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "handleNotImplemented: should call custom notImplemented handler when provided",
            test: () => {
                // Arrange
                let notImplementedCalled = false;
                let notImplementedMessage = "";
                const handlers: IOTelErrorHandlers = {
                    notImplemented: (message: string) => {
                        notImplementedCalled = true;
                        notImplementedMessage = message;
                    }
                };
                const testMessage = "Not implemented feature";

                // Act
                handleNotImplemented(handlers, testMessage);

                // Assert
                Assert.ok(notImplementedCalled, "NotImplemented should be called");
                Assert.ok(notImplementedMessage === testMessage, "NotImplemented message should match");
            }
        });

        this.testCase({
            name: "handleNotImplemented: should use console.error when no custom handler provided",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Not implemented via console";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console.error
                const originalConsole = console;
                (globalObj as any).console = {
                    error: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleNotImplemented(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.error should be called");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "handleNotImplemented: should fallback to console.log when console.error not available",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Not implemented fallback";
                let consoleCalled = false;
                let consoleMessage = "";

                // Mock console with only log available
                const originalConsole = console;
                (globalObj as any).console = {
                    log: (message: string) => {
                        consoleCalled = true;
                        consoleMessage = message;
                    }
                };

                try {
                    // Act
                    handleNotImplemented(handlers, testMessage);

                    // Assert
                    Assert.ok(consoleCalled, "Console.log should be called as fallback");
                    Assert.ok(consoleMessage === testMessage, "Console message should match");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });

        this.testCase({
            name: "Error handlers should handle undefined console gracefully",
            test: () => {
                // Arrange
                const globalObj = getGlobal();
                const handlers: IOTelErrorHandlers = {};
                const testMessage = "Test with no console";
                const originalConsole = console;

                try {
                    // Remove console
                    (globalObj as any).console = undefined;

                    // Act & Assert - should not throw
                    handleDebug(handlers, testMessage);
                    handleWarn(handlers, testMessage);
                    handleError(handlers, testMessage);
                    handleNotImplemented(handlers, testMessage);

                    // If we get here, no exceptions were thrown
                    Assert.ok(true, "All handlers should complete without throwing when console is undefined");
                } finally {
                    // Restore console
                    (globalObj as any).console = originalConsole;
                }
            }
        });
    }

    private _resetConsoleMocks() {
        // Helper to reset any console mocks - implementation depends on your mocking strategy
        // This is a placeholder that might need adjustment based on your test framework
    }
}
