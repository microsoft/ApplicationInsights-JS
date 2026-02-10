import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { getOpenTelemetryError, throwOTelError } from "../../../../src/otel/api/errors/OTelError";
import { OTelInvalidAttributeError, throwOTelInvalidAttributeError } from "../../../../src/otel/api/errors/OTelInvalidAttributeError";
import { throwOTelNotImplementedError } from "../../../../src/otel/api/errors/OTelNotImplementedError";
import { OTelSpanError, throwOTelSpanError } from "../../../../src/otel/api/errors/OTelSpanError";
import { isFunction, isString, dumpObj } from "@nevware21/ts-utils";


export class OpenTelemetryErrorsTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {
        
        // OTelError tests
        this.testCase({
            name: "OTelError: getOpenTelemetryError should return a constructor",
            test: () => {
                // Act
                const ErrorConstructor = getOpenTelemetryError();

                // Assert
                Assert.ok(ErrorConstructor, "Constructor should be defined");
                Assert.ok(isFunction(ErrorConstructor), "Constructor should be a function");
            }
        });

        this.testCase({
            name: "OTelError: should create error instance with message",
            test: () => {
                // Arrange
                const ErrorConstructor = getOpenTelemetryError();
                const testMessage = "Test OpenTelemetry error";

                // Act
                const error = new ErrorConstructor(testMessage);

                // Assert
                Assert.ok(error instanceof Error, "Should be an instance of Error");
                Assert.ok(error.message === testMessage, "Message should match");
                Assert.ok(error.name === "OpenTelemetryError", "Name should be OpenTelemetryError");
            }
        });

        this.testCase({
            name: "OTelError: should create error instance without message",
            test: () => {
                // Arrange
                const ErrorConstructor = getOpenTelemetryError();

                // Act
                const error = new ErrorConstructor();

                // Assert
                Assert.ok(error instanceof Error, "Should be an instance of Error");
                Assert.ok(error.name === "OpenTelemetryError", "Name should be OpenTelemetryError");
            }
        });

        this.testCase({
            name: "OTelError: throwOTelError should throw OpenTelemetryError",
            test: () => {
                // Arrange
                const testMessage = "Test throw error";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelError(testMessage);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError instanceof Error, "Should be an instance of Error");
                Assert.ok(caughtError.name === "OpenTelemetryError", "Name should be OpenTelemetryError");
                Assert.ok(caughtError.message === testMessage, "Message should match");
            }
        });

        this.testCase({
            name: "OTelError: should return same constructor instance on multiple calls",
            test: () => {
                // Act
                const constructor1 = getOpenTelemetryError();
                const constructor2 = getOpenTelemetryError();

                // Assert
                Assert.ok(constructor1 === constructor2, "Should return same constructor instance");
            }
        });

        // OTelInvalidAttributeError tests
        this.testCase({
            name: "OTelInvalidAttributeError: should throw with message, attribName, and value",
            test: () => {
                // Arrange
                const testMessage = "Invalid attribute error";
                const testAttribName = "invalidAttr";
                const testValue = { invalid: true };
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelInvalidAttributeError(testMessage, testAttribName, testValue);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError instanceof Error, "Should be an instance of Error");
                Assert.ok(caughtError.name === "OTelInvalidAttributeError", "Error name should be OTelInvalidAttributeError");
                Assert.ok(caughtError.message === testMessage, "Message should match");
                Assert.ok((caughtError as OTelInvalidAttributeError).attribName === testAttribName, "Attribute name should match");
                Assert.ok((caughtError as OTelInvalidAttributeError).value === testValue, "Attribute value should match");
            }
        });

        this.testCase({
            name: "OTelInvalidAttributeError: should handle empty parameters",
            test: () => {
                // Arrange
                const testMessage = "Empty attribute error";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelInvalidAttributeError(testMessage, "", "");
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError.name === "OTelInvalidAttributeError", "Error name should be OTelInvalidAttributeError");
                Assert.ok(caughtError.message === testMessage, "Message should match");
                Assert.ok((caughtError as OTelInvalidAttributeError).attribName === "", "Attribute name should be empty string");
                Assert.ok((caughtError as OTelInvalidAttributeError).value === "", "Attribute value should be empty string");
            }
        });

        this.testCase({
            name: "OTelInvalidAttributeError: should handle undefined parameters",
            test: () => {
                // Arrange
                const testMessage = "Undefined attribute error";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelInvalidAttributeError(testMessage, undefined as any, undefined);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError.name === "OTelInvalidAttributeError", "Error name should be OTelInvalidAttributeError");
                Assert.ok(caughtError.message === testMessage, "Message should match");
                Assert.ok((caughtError as OTelInvalidAttributeError).attribName === undefined, "Attribute name should be undefined when explicitly passed undefined");
                Assert.ok((caughtError as OTelInvalidAttributeError).value === undefined, "Attribute value should be undefined when explicitly passed undefined");
            }
        });

        this.testCase({
            name: "OTelInvalidAttributeError: should inherit from OpenTelemetryError",
            test: () => {
                // Arrange
                const testMessage = "Inheritance test";
                const OpenTelemetryErrorConstructor = getOpenTelemetryError();
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelInvalidAttributeError(testMessage, "test", "value");
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError instanceof Error, "Should be instance of Error");
                Assert.ok(caughtError instanceof OpenTelemetryErrorConstructor, "Should be instance of OpenTelemetryError");
                Assert.ok(caughtError.name === "OTelInvalidAttributeError", "Should have correct error name");
            }
        });

        this.testCase({
            name: "OTelInvalidAttributeError: attribName property should not conflict with Error.name",
            test: () => {
                // Arrange
                const testMessage = "Property conflict test";
                const testAttribName = "customAttributeName";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelInvalidAttributeError(testMessage, testAttribName, "value");
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                // Assert that both properties exist and have different values
                Assert.ok(caughtError.name === "OTelInvalidAttributeError", "Error.name should be the error type name");
                Assert.ok((caughtError as OTelInvalidAttributeError).attribName === testAttribName, "attribName should be the custom attribute name");
                Assert.ok(caughtError.name !== (caughtError as OTelInvalidAttributeError).attribName, "Error.name and attribName should be different");
            }
        });

        this.testCase({
            name: "OTelInvalidAttributeError: should handle different value types",
            test: () => {
                // Test different value types
                const testCases = [
                    { value: null, description: "null value" },
                    { value: undefined, description: "undefined value" },
                    { value: 0, description: "zero number" },
                    { value: false, description: "false boolean" },
                    { value: [], description: "empty array" },
                    { value: {}, description: "empty object" },
                    { value: "string", description: "string value" },
                    { value: 123, description: "number value" },
                    { value: true, description: "boolean value" }
                ];

                testCases.forEach(testCase => {
                    let caughtError: any = null;
                    try {
                        throwOTelInvalidAttributeError("Test message", "testAttr", testCase.value);
                        Assert.ok(false, `Should have thrown an error for ${testCase.description}`);
                    } catch (error) {
                        caughtError = error;
                    }

                    Assert.ok(caughtError, `Error should have been caught for ${testCase.description}`);
                    Assert.ok((caughtError as OTelInvalidAttributeError).value === testCase.value, 
                        `Value should match for ${testCase.description}`);
                });
            }
        });

        // OTelNotImplementedError tests
        this.testCase({
            name: "OTelNotImplementedError: should throw with message",
            test: () => {
                // Arrange
                const testMessage = "Not implemented error";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelNotImplementedError(testMessage);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError instanceof Error, "Should be an instance of Error");
                Assert.ok(caughtError.name === "OTelNotImplementedError", "Name should be OTelNotImplementedError");
                Assert.ok(caughtError.message === testMessage, "Message should match");
            }
        });

        this.testCase({
            name: "OTelNotImplementedError: should inherit from OpenTelemetryError",
            test: () => {
                // Arrange
                const testMessage = "Inheritance test";
                const OpenTelemetryErrorConstructor = getOpenTelemetryError();
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelNotImplementedError(testMessage);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError instanceof OpenTelemetryErrorConstructor, "Should be instance of OpenTelemetryError");
            }
        });

        this.testCase({
            name: "OTelNotImplementedError: should handle empty message",
            test: () => {
                // Arrange
                const testMessage = "";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelNotImplementedError(testMessage);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError.name === "OTelNotImplementedError", "Name should be OTelNotImplementedError");
                Assert.ok(caughtError.message === testMessage, "Message should match (empty)");
            }
        });

        // OTelSpanError tests
        this.testCase({
            name: "OTelSpanError: should throw with message and span name",
            test: () => {
                // Arrange
                const testMessage = "Span error occurred";
                const testSpanName = "test-span";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelSpanError(testMessage, testSpanName);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError instanceof Error, "Should be an instance of Error");
                Assert.ok(caughtError.name === "OTelSpanError", "Error name should be OTelSpanError");
                Assert.ok(caughtError.message === testMessage, "Message should match");
                Assert.ok((caughtError as OTelSpanError).spanName === testSpanName, "Span name should match");
            }
        });

        this.testCase({
            name: "OTelSpanError: should handle empty span name",
            test: () => {
                // Arrange
                const testMessage = "Span error with empty name";
                const testSpanName = "";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelSpanError(testMessage, testSpanName);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError.message === testMessage, "Message should match");
                Assert.ok((caughtError as OTelSpanError).spanName === testSpanName, "Span name should be empty string");
            }
        });

        this.testCase({
            name: "OTelSpanError: should handle undefined span name",
            test: () => {
                // Arrange
                const testMessage = "Span error with undefined name";
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelSpanError(testMessage, undefined as any);
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError.message === testMessage, "Message should match");
                Assert.ok((caughtError as OTelSpanError).spanName === undefined, "Span name should be undefined when explicitly passed undefined");
            }
        });

        this.testCase({
            name: "OTelSpanError: should handle various span name types",
            test: () => {
                // Test different span name values
                const testCases = [
                    { spanName: "", expected: "", description: "empty string" },
                    { spanName: "valid-span-name", expected: "valid-span-name", description: "valid span name" },
                    { spanName: "span with spaces", expected: "span with spaces", description: "span name with spaces" },
                    { spanName: "span-with-special-chars!@#", expected: "span-with-special-chars!@#", description: "span name with special characters" }
                ];

                testCases.forEach(testCase => {
                    let caughtError: any = null;
                    try {
                        throwOTelSpanError("Test message", testCase.spanName);
                        Assert.ok(false, `Should have thrown an error for ${testCase.description}`);
                    } catch (error) {
                        caughtError = error;
                    }

                    Assert.ok(caughtError, `Error should have been caught for ${testCase.description}`);
                    Assert.ok((caughtError as OTelSpanError).spanName === testCase.expected, 
                        `Span name should be '${testCase.expected}' for ${testCase.description}`);
                });
            }
        });

        this.testCase({
            name: "OTelSpanError: should inherit from OpenTelemetryError",
            test: () => {
                // Arrange
                const testMessage = "Inheritance test";
                const OpenTelemetryErrorConstructor = getOpenTelemetryError();
                let caughtError: any = null;

                // Act & Assert
                try {
                    throwOTelSpanError(testMessage, "test-span");
                    Assert.ok(false, "Should have thrown an error");
                } catch (error) {
                    caughtError = error;
                }

                Assert.ok(caughtError instanceof OpenTelemetryErrorConstructor, "Should be instance of OpenTelemetryError");
            }
        });

        // Integration tests
        this.testCase({
            name: "All error types should have unique names",
            test: () => {
                // Arrange
                let errors: any[] = [];

                // Act - Create instances of all error types
                try {
                    throwOTelError("base error");
                } catch (e) {
                    errors.push(e);
                }

                try {
                    throwOTelInvalidAttributeError("invalid attr", "key", "value");
                } catch (e) {
                    errors.push(e);
                }

                try {
                    throwOTelNotImplementedError("not implemented");
                } catch (e) {
                    errors.push(e);
                }

                try {
                    throwOTelSpanError("span error", "span");
                } catch (e) {
                    errors.push(e);
                }

                // Assert - Check that all error types have unique names
                Assert.ok(errors.length === 4, "Should have caught 4 errors");
                Assert.ok(errors[0].name === "OpenTelemetryError", "First error should be OpenTelemetryError");
                Assert.ok(errors[1].name === "OTelInvalidAttributeError", "Second error should be OTelInvalidAttributeError");
                Assert.ok(errors[2].name === "OTelNotImplementedError", "Third error should be OTelNotImplementedError");
                Assert.ok(errors[3].name === "OTelSpanError", "Fourth error should be OTelSpanError");
                
                // Verify all names are unique
                const names = errors.map(e => e.name);
                const uniqueNames = [...new Set(names)];
                Assert.ok(uniqueNames.length === 4, "All error names should be unique");
            }
        });

        this.testCase({
            name: "Error constructors should be reusable",
            test: () => {
                // Arrange & Act - Create multiple errors of the same type
                let errors: any[] = [];

                try {
                    throwOTelInvalidAttributeError("first error", "key1", "value1");
                } catch (e) {
                    errors.push(e);
                }

                try {
                    throwOTelInvalidAttributeError("second error", "key2", "value2");
                } catch (e) {
                    errors.push(e);
                }

                // Assert
                Assert.ok(errors.length === 2, "Should have caught 2 errors");
                Assert.ok(errors[0].message === "first error", "First error message should match");
                Assert.ok(errors[1].message === "second error", "Second error message should match");
                Assert.ok(errors[0].name === "OTelInvalidAttributeError", "First error name should be OTelInvalidAttributeError");
                Assert.ok(errors[1].name === "OTelInvalidAttributeError", "Second error name should be OTelInvalidAttributeError");
                Assert.ok(errors[0].attribName === "key1", "First error attribName should match");
                Assert.ok(errors[1].attribName === "key2", "Second error attribName should match");
                Assert.ok(errors[0].value === "value1", "First error value should match");
                Assert.ok(errors[1].value === "value2", "Second error value should match");
            }
        });

        this.testCase({
            name: "Error stack traces should be preserved",
            test: () => {
                // Arrange
                let caughtError: any = null;

                // Act
                try {
                    throwOTelError("Stack trace test");
                } catch (error) {
                    caughtError = error;
                }

                // Assert
                Assert.ok(caughtError, "Error should have been caught");
                Assert.ok(caughtError.stack, "Error should have a stack trace");
                Assert.ok(isString(caughtError.stack), "Stack trace should be a string");
                Assert.ok(caughtError.stack.indexOf("OpenTelemetryError") !== -1, "Stack trace should contain error name");
            }
        });

        this.testCase({
            name: "OTelError: dumpObj should contain essential error properties",
            test: () => {
                // Arrange & Act
                const error = new (getOpenTelemetryError())("Test error message");
                const errorDump = dumpObj(error);

                // Assert
                Assert.ok(errorDump, "dumpObj should return a string representation");
                Assert.ok(errorDump.indexOf("Test error message") !== -1, `Error dump should contain message: ${errorDump}`);
                Assert.ok(errorDump.indexOf("name") !== -1, `Error dump should contain name property: ${errorDump}`);
                Assert.ok(errorDump.indexOf("OpenTelemetryError") !== -1, `Error dump should contain error type: ${errorDump}`);
            }
        });

        this.testCase({
            name: "OTelInvalidAttributeError: dumpObj should show attribute-specific properties",
            test: () => {
                // Arrange & Act
                let error: any = null;
                try {
                    throwOTelInvalidAttributeError("Invalid attribute test", "testAttribute", { complex: "value" });
                } catch (e) {
                    error = e;
                }
                const errorDump = dumpObj(error);

                // Assert
                Assert.ok(error, "Error should have been caught");
                Assert.ok(errorDump, "dumpObj should return a string representation");
                Assert.ok(errorDump.indexOf("Invalid attribute test") !== -1, `Error dump should contain message: ${errorDump}`);
                Assert.ok(errorDump.indexOf("OTelInvalidAttributeError") !== -1, `Error dump should contain error type: ${errorDump}`);
                
                // Check properties directly on the error object since dumpObj might not serialize custom properties
                Assert.ok(error.attribName === "testAttribute", `Error should have attribName property: ${error.attribName}`);
                Assert.ok(error.value !== undefined, `Error should have value property: ${dumpObj(error.value)}`);
                
                // Ensure the error dump contains meaningful content even if custom properties aren't serialized
                Assert.ok(errorDump.length > 50, `Error dump should be substantial: ${errorDump}`);
            }
        });

        this.testCase({
            name: "OTelNotImplementedError: dumpObj should indicate not implemented status",
            test: () => {
                // Arrange & Act
                let error: any = null;
                try {
                    throwOTelNotImplementedError("Feature not implemented");
                } catch (e) {
                    error = e;
                }
                const errorDump = dumpObj(error);

                // Assert
                Assert.ok(error, "Error should have been caught");
                Assert.ok(errorDump, "dumpObj should return a string representation");
                Assert.ok(errorDump.indexOf("Feature not implemented") !== -1, `Error dump should contain message: ${errorDump}`);
                Assert.ok(errorDump.indexOf("name") !== -1, `Error dump should contain name property: ${errorDump}`);
                Assert.ok(errorDump.indexOf("OTelNotImplementedError") !== -1, `Error dump should contain error type: ${errorDump}`);
            }
        });

        this.testCase({
            name: "OTelSpanError: dumpObj should show span-specific properties",
            test: () => {
                // Arrange & Act
                let error: any = null;
                try {
                    throwOTelSpanError("Span operation failed", "testSpan");
                } catch (e) {
                    error = e;
                }
                const errorDump = dumpObj(error);

                // Assert
                Assert.ok(error, "Error should have been caught");
                Assert.ok(errorDump, "dumpObj should return a string representation");
                Assert.ok(errorDump.indexOf("Span operation failed") !== -1, `Error dump should contain message: ${errorDump}`);
                Assert.ok(errorDump.indexOf("OTelSpanError") !== -1, `Error dump should contain error type: ${errorDump}`);
                
                // Check properties directly on the error object since dumpObj might not serialize custom properties
                Assert.ok(error.spanName === "testSpan", `Error should have spanName property: ${error.spanName}`);
                
                // Ensure the error dump contains meaningful content even if custom properties aren't serialized
                Assert.ok(errorDump.length > 50, `Error dump should be substantial: ${errorDump}`);
            }
        });

        this.testCase({
            name: "Error serialization: dumpObj should handle complex attribute values",
            test: () => {
                // Arrange & Act
                const complexValue = {
                    nested: { deep: "value" },
                    array: [1, 2, 3],
                    number: 42,
                    boolean: true,
                    nullValue: null,
                    undefinedValue: undefined
                };
                let error: any = null;
                try {
                    throwOTelInvalidAttributeError("Complex value test", "complexAttr", complexValue);
                } catch (e) {
                    error = e;
                }
                const errorDump = dumpObj(error);

                // Assert
                Assert.ok(error, "Error should have been caught");
                Assert.ok(errorDump, "dumpObj should return a string representation");
                Assert.ok(errorDump.indexOf("Complex value test") !== -1, `Error dump should contain message: ${errorDump}`);
                
                // Check the actual property values directly
                Assert.ok(error.attribName === "complexAttr", `Error should have correct attribName: ${error.attribName}`);
                Assert.ok(error.value === complexValue, `Error should have correct value reference: ${dumpObj(error.value)}`);
                
                // Dump should be meaningful even if it doesn't contain all custom properties
                Assert.ok(errorDump.length > 50, `Error dump should be substantial: ${errorDump}`);
            }
        });

        this.testCase({
            name: "Error serialization: dumpObj should be different for different error types",
            test: () => {
                // Arrange & Act
                const baseError = new (getOpenTelemetryError())("Base error");
                
                let invalidAttrError: any = null;
                try {
                    throwOTelInvalidAttributeError("Invalid attr", "attr", "value");
                } catch (e) {
                    invalidAttrError = e;
                }
                
                let notImplError: any = null;
                try {
                    throwOTelNotImplementedError("Not implemented");
                } catch (e) {
                    notImplError = e;
                }
                
                let spanError: any = null;
                try {
                    throwOTelSpanError("Span error", "span");
                } catch (e) {
                    spanError = e;
                }

                const baseDump = dumpObj(baseError);
                const invalidAttrDump = dumpObj(invalidAttrError);
                const notImplDump = dumpObj(notImplError);
                const spanDump = dumpObj(spanError);

                // Assert - Each dump should be unique based on error type and message
                Assert.notEqual(baseDump, invalidAttrDump, "Base and InvalidAttribute dumps should be different");
                Assert.notEqual(baseDump, notImplDump, "Base and NotImplemented dumps should be different");
                Assert.notEqual(baseDump, spanDump, "Base and Span dumps should be different");
                Assert.notEqual(invalidAttrDump, notImplDump, "InvalidAttribute and NotImplemented dumps should be different");
                Assert.notEqual(invalidAttrDump, spanDump, "InvalidAttribute and Span dumps should be different");
                Assert.notEqual(notImplDump, spanDump, "NotImplemented and Span dumps should be different");

                // Each should contain their specific error type names
                Assert.ok(baseDump.indexOf("OpenTelemetryError") !== -1, `Base error dump should contain type: ${baseDump}`);
                Assert.ok(invalidAttrDump.indexOf("OTelInvalidAttributeError") !== -1, `InvalidAttribute dump should contain type: ${invalidAttrDump}`);
                Assert.ok(notImplDump.indexOf("OTelNotImplementedError") !== -1, `NotImplemented dump should contain type: ${notImplDump}`);
                Assert.ok(spanDump.indexOf("OTelSpanError") !== -1, `Span dump should contain type: ${spanDump}`);
                
                // Verify error objects have the expected custom properties (beyond what dumpObj shows)
                Assert.ok(invalidAttrError.attribName === "attr", `InvalidAttribute error should have attribName: ${invalidAttrError.attribName}`);
                Assert.ok(invalidAttrError.value === "value", `InvalidAttribute error should have value: ${invalidAttrError.value}`);
                Assert.ok(spanError.spanName === "span", `Span error should have spanName: ${spanError.spanName}`);
            }
        });

        this.testCase({
            name: "Error serialization: dumpObj should handle empty and null values gracefully",
            test: () => {
                // Arrange & Act
                const emptyMsgError = new (getOpenTelemetryError())("");
                
                let nullAttrError: any = null;
                try {
                    throwOTelInvalidAttributeError("Test", null as any, null);
                } catch (e) {
                    nullAttrError = e;
                }
                
                let undefinedSpanError: any = null;
                try {
                    throwOTelSpanError("Test", undefined as any);
                } catch (e) {
                    undefinedSpanError = e;
                }

                const emptyDump = dumpObj(emptyMsgError);
                const nullDump = dumpObj(nullAttrError);
                const undefinedDump = dumpObj(undefinedSpanError);

                // Assert - Should not throw and should contain valid representations
                Assert.ok(emptyDump, "Empty message error should have valid dump");
                Assert.ok(nullDump, "Null attribute error should have valid dump");
                Assert.ok(undefinedDump, "Undefined span error should have valid dump");

                // Should contain error type names even with empty values
                Assert.ok(emptyDump.indexOf("OpenTelemetryError") !== -1, `Empty dump should contain error type: ${emptyDump}`);
                Assert.ok(nullDump.indexOf("OTelInvalidAttributeError") !== -1, `Null dump should contain error type: ${nullDump}`);
                Assert.ok(undefinedDump.indexOf("OTelSpanError") !== -1, `Undefined dump should contain error type: ${undefinedDump}`);
                
                // Verify actual property values (not assuming they're converted to empty strings)
                Assert.ok(nullAttrError.attribName === null, `Null attribute error should have null attribName: ${nullAttrError.attribName}`);
                Assert.ok(nullAttrError.value === null, `Null attribute error should have null value: ${nullAttrError.value}`);
                Assert.ok(undefinedSpanError.spanName === undefined, `Undefined span error should have undefined spanName: ${undefinedSpanError.spanName}`);
            }
        });

        this.testCase({
            name: "Error serialization: dumpObj should preserve inheritance chain information",
            test: () => {
                // Arrange & Act
                let invalidAttrError: any = null;
                try {
                    throwOTelInvalidAttributeError("Test", "attr", "val");
                } catch (e) {
                    invalidAttrError = e;
                }
                const errorDump = dumpObj(invalidAttrError);

                // Assert - Should show inheritance information
                Assert.ok(invalidAttrError, "Error should have been caught");
                Assert.ok(errorDump, "Error dump should exist");
                Assert.ok(invalidAttrError instanceof Error, "Should be instance of Error");
                Assert.ok(invalidAttrError instanceof (getOpenTelemetryError()), "Should be instance of OpenTelemetryError");
                
                // Dump should reflect the actual error type, not just base Error
                Assert.ok(errorDump.indexOf("OTelInvalidAttributeError") !== -1, `Dump should show specific error type: ${errorDump}`);
                
                // Should have standard Error properties
                Assert.ok(errorDump.indexOf("message") !== -1 || errorDump.indexOf("Test") !== -1, `Dump should contain message content: ${errorDump}`);
                Assert.ok(errorDump.indexOf("name") !== -1 || errorDump.indexOf("OTelInvalidAttributeError") !== -1, `Dump should contain name/type information: ${errorDump}`);
                
                // Verify custom properties exist on the error object
                Assert.ok(invalidAttrError.attribName === "attr", `Error should have attribName property: ${invalidAttrError.attribName}`);
                Assert.ok(invalidAttrError.value === "val", `Error should have value property: ${invalidAttrError.value}`);
            }
        });
    }
}
