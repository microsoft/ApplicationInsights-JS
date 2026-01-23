import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { getGlobal } from "@nevware21/ts-utils";
import { 
    handleAttribError, handleSpanError, handleDebug, handleWarn, handleError, handleNotImplemented
} from "../../../../src/OpenTelemetry/helpers/handleErrors";
import { getUrl, getHttpUrl } from "../../../../src/OpenTelemetry/helpers/common";
import { createAttributeContainer } from "../../../../src/OpenTelemetry/attribute/attributeContainer";
import { IOTelErrorHandlers } from "../../../../src/OpenTelemetry/interfaces/config/IOTelErrorHandlers";
import { IOTelConfig } from "../../../../src/OpenTelemetry/interfaces/config/IOTelConfig";

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

        this.addGetUrlTests();
        this.addGetHttpUrlTests();
    }

    private addGetHttpUrlTests(): void {
        this.testCase({
            name: "getHttpUrl: should return undefined when container is null",
            test: () => {
                // Act
                const result = getHttpUrl(null as any);

                // Assert
                Assert.equal(result, undefined, "Should return undefined for null container");
            }
        });

        this.testCase({
            name: "getHttpUrl: should return undefined when container is undefined",
            test: () => {
                // Act
                const result = getHttpUrl(undefined as any);

                // Assert
                Assert.equal(result, undefined, "Should return undefined for undefined container");
            }
        });

        this.testCase({
            name: "getHttpUrl: should return value from url.full (stable semantic convention)",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.full", "https://example.com/api/users?id=123");

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, "https://example.com/api/users?id=123", "Should return value from url.full");
            }
        });

        this.testCase({
            name: "getHttpUrl: should return value from http.url (legacy semantic convention)",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.url", "https://legacy.example.com/endpoint");

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, "https://legacy.example.com/endpoint", "Should return value from http.url");
            }
        });

        this.testCase({
            name: "getHttpUrl: should prefer url.full over http.url when both present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.full", "https://stable.example.com/path");
                container.set("http.url", "https://legacy.example.com/path");

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, "https://stable.example.com/path", "Should prefer url.full over http.url");
            }
        });

        this.testCase({
            name: "getHttpUrl: should return undefined when neither attribute is present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.scheme", "https");
                container.set("server.address", "example.com");

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, undefined, "Should return undefined when neither url.full nor http.url is present");
            }
        });

        this.testCase({
            name: "getHttpUrl: should handle empty string values",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.full", "");

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, undefined, "Should return empty string when url.full is empty");
            }
        });

        this.testCase({
            name: "getHttpUrl: should handle numeric values",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.full", 12345);

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, 12345, "Should return numeric value as-is");
            }
        });

        this.testCase({
            name: "getHttpUrl: should handle boolean values",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.full", true);

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, true, "Should return boolean value as-is");
            }
        });

        this.testCase({
            name: "getHttpUrl: should handle URLs with special characters",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                const urlWithSpecialChars = "https://example.com/api/search?q=hello%20world&filter=%7B%22type%22%3A%22test%22%7D";
                container.set("url.full", urlWithSpecialChars);

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, urlWithSpecialChars, "Should handle URLs with encoded special characters");
            }
        });

        this.testCase({
            name: "getHttpUrl: should handle relative URLs",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.url", "/api/users");

                // Act
                const result = getHttpUrl(container);

                // Assert
                Assert.equal(result, "/api/users", "Should handle relative URLs");
            }
        });
    }

    private addGetUrlTests(): void {
        this.testCase({
            name: "getUrl: should return empty string when container is null",
            test: () => {
                // Act
                const result = getUrl(null as any);

                // Assert
                Assert.equal(result, "", "Should return empty string for null container");
            }
        });

        this.testCase({
            name: "getUrl: should return empty string when container is undefined",
            test: () => {
                // Act
                const result = getUrl(undefined as any);

                // Assert
                Assert.equal(result, "", "Should return empty string for undefined container");
            }
        });

        this.testCase({
            name: "getUrl: should return empty string when no httpMethod is present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("url.full", "https://example.com/path");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "", "Should return empty string when httpMethod is missing");
            }
        });

        this.testCase({
            name: "getUrl: should return url from url.full (stable semantic convention)",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.full", "https://example.com/api/users");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://example.com/api/users", "Should return url from url.full");
            }
        });

        this.testCase({
            name: "getUrl: should return url from http.url (legacy semantic convention)",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.method", "POST");
                container.set("http.url", "https://api.example.com/data");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://api.example.com/data", "Should return url from http.url");
            }
        });

        this.testCase({
            name: "getUrl: should prefer url.full over http.url when both present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.full", "https://stable.example.com/path");
                container.set("http.url", "https://legacy.example.com/path");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://stable.example.com/path", "Should prefer url.full over http.url");
            }
        });

        this.testCase({
            name: "getUrl: should construct url from httpScheme, httpHost, and httpTarget",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "https");
                container.set("server.address", "example.com");
                container.set("url.path", "/api/users");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://example.com/api/users", "Should construct url from scheme, host, and path");
            }
        });

        this.testCase({
            name: "getUrl: should construct url from legacy http attributes",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.method", "POST");
                container.set("http.scheme", "http");
                container.set("http.host", "localhost:8080");
                container.set("http.target", "/api/data?id=123");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "http://localhost:8080/api/data?id=123", "Should construct url from legacy http attributes");
            }
        });

        this.testCase({
            name: "getUrl: should use url.query when url.path is not present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "https");
                container.set("server.address", "example.com");
                container.set("url.query", "?q=search");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://example.com?q=search", "Should use url.query when url.path not present");
            }
        });

        this.testCase({
            name: "getUrl: should construct url with netPeerName and netPeerPort when httpHost not present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.method", "GET");
                container.set("http.scheme", "http");
                container.set("net.peer.name", "api.service.local");
                container.set("net.peer.port", 8080);
                container.set("http.target", "/health");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "http://api.service.local:8080/health", "Should construct url with netPeerName and port");
            }
        });

        this.testCase({
            name: "getUrl: should construct url with client.address (stable) for netPeerName",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "https");
                container.set("client.address", "service.example.com");
                container.set("client.port", 443);
                container.set("url.path", "/api");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://service.example.com:443/api", "Should use client.address for peer name");
            }
        });

        this.testCase({
            name: "getUrl: should construct url with netPeerIp when netPeerName not present",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.method", "GET");
                container.set("http.scheme", "http");
                container.set("net.peer.ip", "192.168.1.100");
                container.set("net.peer.port", 3000);
                container.set("http.target", "/endpoint");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "http://192.168.1.100:3000/endpoint", "Should construct url with IP address and port");
            }
        });

        this.testCase({
            name: "getUrl: should use network.peer.address (stable) for peer IP",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "POST");
                container.set("url.scheme", "https");
                container.set("network.peer.address", "10.0.0.5");
                container.set("server.port", 8443);
                container.set("url.path", "/data");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://10.0.0.5:8443/data", "Should use network.peer.address for IP");
            }
        });

        this.testCase({
            name: "getUrl: should return empty string when scheme and target present but no host/peer info",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "https");
                container.set("url.path", "/api/users");
                // No host, no peer name, no peer IP

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "", "Should return empty string when no host information available");
            }
        });

        this.testCase({
            name: "getUrl: should return empty string when scheme present but target missing",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "https");
                container.set("server.address", "example.com");
                // No target/path/query

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "", "Should return empty string when target is missing");
            }
        });

        this.testCase({
            name: "getUrl: should handle IPv6 addresses",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.method", "GET");
                container.set("http.scheme", "http");
                container.set("net.peer.ip", "::1");
                container.set("net.peer.port", 8080);
                container.set("http.target", "/api");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "http://::1:8080/api", "Should handle IPv6 addresses");
            }
        });

        this.testCase({
            name: "getUrl: should prefer server.port over other port attributes",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "https");
                container.set("client.address", "example.com");
                container.set("server.port", 9000);
                container.set("client.port", 8000);
                container.set("net.peer.port", 7000);
                container.set("url.path", "/api");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://example.com:8000/api", "Should prefer server.port");
            }
        });

        this.testCase({
            name: "getUrl: should handle Unix socket paths in network.peer.address",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.request.method", "GET");
                container.set("url.scheme", "http");
                container.set("network.peer.address", "/tmp/my.sock");
                container.set("server.port", 80);
                container.set("url.path", "/status");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "http:///tmp/my.sock:80/status", "Should handle Unix socket paths");
            }
        });

        this.testCase({
            name: "getUrl: should construct url with path containing query parameters",
            test: () => {
                // Arrange
                const otelCfg: IOTelConfig = {};
                const container = createAttributeContainer(otelCfg, "test");
                container.set("http.method", "GET");
                container.set("http.scheme", "https");
                container.set("http.host", "api.example.com");
                container.set("http.target", "/search?q=test&page=1");

                // Act
                const result = getUrl(container);

                // Assert
                Assert.equal(result, "https://api.example.com/search?q=test&page=1", "Should handle target with query parameters");
            }
        });
    }

    private _resetConsoleMocks() {
        // Helper to reset any console mocks - implementation depends on your mocking strategy
        // This is a placeholder that might need adjustment based on your test framework
    }
}
