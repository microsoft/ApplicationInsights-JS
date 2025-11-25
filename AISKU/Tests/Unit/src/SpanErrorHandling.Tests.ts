import { AITestClass, Assert } from '@microsoft/ai-test-framework';
import { ApplicationInsights } from '../../../src/applicationinsights-web';
import { IReadableSpan, eOTelSpanStatusCode, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

export class SpanErrorHandlingTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${SpanErrorHandlingTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "SpanErrorHandlingTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: SpanErrorHandlingTests._connectionString,
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
        this.addInvalidSpanNameTests();
        this.addInvalidAttributeTests();
        this.addNullUndefinedInputTests();
        this.addInvalidParentContextTests();
        this.addInvalidOptionsTests();
        this.addEdgeCaseTests();
    }

    private addInvalidSpanNameTests(): void {
        this.testCase({
            name: "SpanName: empty string name should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("");
                    span?.end();
                }, "Empty string name should not throw");
            }
        });

        this.testCase({
            name: "SpanName: null name should handle gracefully",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan(null as any);
                    span?.end();
                }, "Null name should not throw");
            }
        });

        this.testCase({
            name: "SpanName: undefined name should handle gracefully",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan(undefined as any);
                    span?.end();
                }, "Undefined name should not throw");
            }
        });

        this.testCase({
            name: "SpanName: very long name should be accepted",
            test: () => {
                // Arrange
                const longName = "a".repeat(10000);

                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan(longName);
                    Assert.ok(span, "Should create span with long name");
                    span?.end();
                }, "Very long name should not throw");
            }
        });

        this.testCase({
            name: "SpanName: special characters in name should be accepted",
            test: () => {
                // Arrange
                const specialNames = [
                    "span-with-dashes",
                    "span_with_underscores",
                    "span.with.dots",
                    "span/with/slashes",
                    "span:with:colons",
                    "span@with@at",
                    "span#with#hash",
                    "span$with$dollar"
                ];

                // Act & Assert
                specialNames.forEach(name => {
                    Assert.doesNotThrow(() => {
                        const span = this._ai.startSpan(name);
                        span?.end();
                    }, `Special character name '${name}' should not throw`);
                });
            }
        });
    }

    private addInvalidAttributeTests(): void {
        this.testCase({
            name: "Attributes: null attribute value should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-attribute-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("nullable.attr", null);
                }, "Setting null attribute should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: undefined attribute value should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("undefined-attribute-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("undefined.attr", undefined);
                }, "Setting undefined attribute should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: empty string attribute key should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("empty-key-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("", "value");
                }, "Empty string key should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: null attribute key should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-key-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute(null as any, "value");
                }, "Null key should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: undefined attribute key should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("undefined-key-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute(undefined as any, "value");
                }, "Undefined key should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: invalid attribute value types should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("invalid-type-test");

                // Act & Assert - Test various invalid types
                Assert.doesNotThrow(() => {
                    span?.setAttribute("object.attr", { nested: "object" } as any);
                    span?.setAttribute("array.attr", [1, 2, 3] as any);
                    span?.setAttribute("function.attr", (() => {}) as any);
                    span?.setAttribute("symbol.attr", Symbol("test") as any);
                }, "Invalid attribute types should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: setAttributes with null should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("setAttributes-null-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttributes(null as any);
                }, "setAttributes with null should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: setAttributes with undefined should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("setAttributes-undefined-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttributes(undefined as any);
                }, "setAttributes with undefined should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "Attributes: setAttributes with invalid object should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("setAttributes-invalid-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttributes({
                        "valid": "value",
                        "null.value": null,
                        "undefined.value": undefined,
                        "object.value": { nested: "obj" } as any
                    });
                }, "setAttributes with mixed valid/invalid should not throw");

                // Cleanup
                span?.end();
            }
        });
    }

    private addNullUndefinedInputTests(): void {
        this.testCase({
            name: "NullUndefined: startSpan with null options should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("null-options-test", null as any);
                    span?.end();
                }, "Null options should not throw");
            }
        });

        this.testCase({
            name: "NullUndefined: startSpan with undefined options should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("undefined-options-test", undefined);
                    span?.end();
                }, "Undefined options should not throw");
            }
        });

        this.testCase({
            name: "NullUndefined: setStatus with null should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-status-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setStatus(null as any);
                }, "setStatus with null should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "NullUndefined: setStatus with undefined should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("undefined-status-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setStatus(undefined as any);
                }, "setStatus with undefined should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "NullUndefined: updateName with null should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-name-update-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.updateName(null as any);
                }, "updateName with null should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "NullUndefined: updateName with undefined should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("undefined-name-update-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.updateName(undefined as any);
                }, "updateName with undefined should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "NullUndefined: end with null time should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-end-time-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.end(null as any);
                }, "end with null time should not throw");
            }
        });

        this.testCase({
            name: "NullUndefined: end with undefined time should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("undefined-end-time-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.end(undefined);
                }, "end with undefined time should not throw");
            }
        });

        this.testCase({
            name: "NullUndefined: recordException with null should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("null-exception-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.recordException(null as any);
                }, "recordException with null should not throw");

                // Cleanup
                span?.end();
            }
        });

        this.testCase({
            name: "NullUndefined: recordException with undefined should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("undefined-exception-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.recordException(undefined as any);
                }, "recordException with undefined should not throw");

                // Cleanup
                span?.end();
            }
        });
    }

    private addInvalidParentContextTests(): void {
        this.testCase({
            name: "ParentContext: null parent context should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("null-parent-test", undefined, null as any);
                    span?.end();
                }, "Null parent context should not throw");
            }
        });

        this.testCase({
            name: "ParentContext: undefined parent context should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("undefined-parent-test", undefined, undefined);
                    span?.end();
                }, "Undefined parent context should not throw");
            }
        });

        this.testCase({
            name: "ParentContext: invalid parent context object should not throw",
            test: () => {
                // Arrange - Create invalid context objects
                const invalidContexts = [
                    {},
                    { traceId: "invalid" },
                    { spanId: "invalid" },
                    { traceId: "", spanId: "" },
                    { traceId: "123", spanId: "456" } // Too short
                ];

                // Act & Assert
                invalidContexts.forEach((ctx, index) => {
                    Assert.doesNotThrow(() => {
                        const span = this._ai.startSpan(`invalid-context-${index}`, undefined, ctx as any);
                        span?.end();
                    }, `Invalid context ${index} should not throw`);
                });
            }
        });

        this.testCase({
            name: "ParentContext: parent context with missing fields should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("missing-fields-test", undefined, {
                        traceId: "12345678901234567890123456789012"
                        // Missing spanId and traceFlags
                    } as any);
                    span?.end();
                }, "Parent context with missing fields should not throw");
            }
        });

        this.testCase({
            name: "ParentContext: parent context with wrong types should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("wrong-types-test", undefined, {
                        traceId: 123456789, // Should be string
                        spanId: 987654321, // Should be string
                        traceFlags: "invalid" // Should be number
                    } as any);
                    span?.end();
                }, "Parent context with wrong types should not throw");
            }
        });
    }

    private addInvalidOptionsTests(): void {
        this.testCase({
            name: "Options: invalid kind value should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("invalid-kind-test", {
                        kind: 999 as any // Invalid kind value
                    });
                    span?.end();
                }, "Invalid kind value should not throw");
            }
        });

        this.testCase({
            name: "Options: negative kind value should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("negative-kind-test", {
                        kind: -1 as any
                    });
                    span?.end();
                }, "Negative kind value should not throw");
            }
        });

        this.testCase({
            name: "Options: null attributes in options should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("null-attrs-options-test", {
                        attributes: null as any
                    });
                    span?.end();
                }, "Null attributes in options should not throw");
            }
        });

        this.testCase({
            name: "Options: undefined attributes in options should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("undefined-attrs-options-test", {
                        attributes: undefined
                    });
                    span?.end();
                }, "Undefined attributes in options should not throw");
            }
        });

        this.testCase({
            name: "Options: invalid startTime should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("invalid-starttime-test", {
                        startTime: "invalid" as any
                    });
                    span?.end();
                }, "Invalid startTime should not throw");
            }
        });

        this.testCase({
            name: "Options: negative startTime should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("negative-starttime-test", {
                        startTime: -1000
                    });
                    span?.end();
                }, "Negative startTime should not throw");
            }
        });

        this.testCase({
            name: "Options: future startTime should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("future-starttime-test", {
                        startTime: Date.now() + 1000000
                    });
                    span?.end();
                }, "Future startTime should not throw");
            }
        });

        this.testCase({
            name: "Options: multiple invalid options should not throw",
            test: () => {
                // Act & Assert
                Assert.doesNotThrow(() => {
                    const span = this._ai.startSpan("multi-invalid-options-test", {
                        kind: -999 as any,
                        attributes: null as any,
                        startTime: "invalid" as any,
                        recording: "maybe" as any,
                        root: "yes" as any
                    } as any);
                    span?.end();
                }, "Multiple invalid options should not throw");
            }
        });
    }

    private addEdgeCaseTests(): void {
        this.testCase({
            name: "EdgeCase: operations on null span should not throw",
            test: () => {
                // Arrange - Force null span (though SDK shouldn't return null)
                const span: IReadableSpan | null = null;

                // Act & Assert - All operations should be safe
                Assert.doesNotThrow(() => {
                    span?.setAttribute("key", "value");
                    span?.setAttributes({ "key": "value" });
                    span?.setStatus({ code: eOTelSpanStatusCode.OK });
                    span?.updateName("new-name");
                    span?.end();
                    span?.recordException(new Error("test"));
                }, "Operations on null span should not throw");
            }
        });

        this.testCase({
            name: "EdgeCase: extremely large attribute count should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("large-attr-count-test");
                const largeAttrs: any = {};
                for (let i = 0; i < 1000; i++) {
                    largeAttrs[`attr_${i}`] = `value_${i}`;
                }

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttributes(largeAttrs);
                    span?.end();
                }, "Large attribute count should not throw");
            }
        });

        this.testCase({
            name: "EdgeCase: very long attribute values should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("long-attr-value-test");
                const longValue = "x".repeat(100000);

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("long.attr", longValue);
                    span?.end();
                }, "Very long attribute values should not throw");
            }
        });

        this.testCase({
            name: "EdgeCase: rapid successive operations should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("rapid-ops-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    for (let i = 0; i < 100; i++) {
                        span?.setAttribute(`rapid_${i}`, i);
                        span?.setStatus({ code: eOTelSpanStatusCode.OK });
                        span?.updateName(`name_${i}`);
                    }
                    span?.end();
                }, "Rapid successive operations should not throw");
            }
        });

        this.testCase({
            name: "EdgeCase: mixed valid and invalid operations should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("mixed-ops-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("valid", "value");
                    span?.setAttribute(null as any, "invalid-key");
                    span?.setAttribute("another.valid", 123);
                    span?.setAttribute("", "empty-key");
                    span?.setAttributes({ "good": "attr", "bad": null });
                    span?.setStatus({ code: eOTelSpanStatusCode.OK });
                    span?.updateName(null as any);
                    span?.updateName("valid-name");
                    span?.end();
                }, "Mixed valid and invalid operations should not throw");
            }
        });

        this.testCase({
            name: "EdgeCase: special Unicode characters should not throw",
            test: () => {
                // Arrange
                const unicodeStrings = [
                    "Hello 世界",
                    "Emoji 😀🎉",
                    "RTL العربية",
                    "Combined ñ é ü",
                    "Zero-width\u200B\u200Ccharacters"
                ];

                // Act & Assert
                unicodeStrings.forEach((str, index) => {
                    Assert.doesNotThrow(() => {
                        const span = this._ai.startSpan(str);
                        span?.setAttribute("unicode.attr", str);
                        span?.updateName(`unicode_${index}_${str}`);
                        span?.end();
                    }, `Unicode string ${index} should not throw`);
                });
            }
        });

        this.testCase({
            name: "EdgeCase: circular reference in error should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("circular-error-test");
                const circularError: any = new Error("Circular test");
                circularError.self = circularError; // Create circular reference

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.recordException(circularError);
                    span?.end();
                }, "Circular reference in error should not throw");
            }
        });

        this.testCase({
            name: "EdgeCase: NaN and Infinity values should not throw",
            test: () => {
                // Arrange
                const span = this._ai.startSpan("special-numbers-test");

                // Act & Assert
                Assert.doesNotThrow(() => {
                    span?.setAttribute("nan.value", NaN as any);
                    span?.setAttribute("infinity.value", Infinity as any);
                    span?.setAttribute("neg.infinity.value", -Infinity as any);
                    span?.end();
                }, "NaN and Infinity values should not throw");
            }
        });
    }
}
