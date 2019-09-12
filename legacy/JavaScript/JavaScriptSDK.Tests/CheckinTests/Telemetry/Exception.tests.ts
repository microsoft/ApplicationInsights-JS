/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../TestFramework/ContractTestHelper.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/Exception.ts" />
/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts" />
class ExceptionTelemetryTests extends ContractTestHelper {

    private exception;

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.Exception(new Error("test error")), "ExceptionTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        this.testCase({
            name: name + "Exceptions array is initialized in constructor",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Exception(new Error("test error"));

                Assert.ok(telemetry.exceptions, "exceptions were initialized by the constructor");
                Assert.equal(telemetry.exceptions.length, 1, "incorrect number of exceptions");
            }
        });

        this.testCase({
            name: name + "Exception is initialized with undefined severityLevel",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Exception(new Error("test error"), "HA");
                Assert.equal(undefined, telemetry.severityLevel, "Exception shouldn't have severity level by default");
            }
        });

        this.testCase({
            name: name + "User can override severityLevel",
            test: () => {
                var level = AI.SeverityLevel.Critical;
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Exception(new Error("test error"), null, null, level);
                Assert.equal(level, telemetry.severityLevel, "Exception has proper severity level");
            }
        });

        this.testCase({
            name: name + "Exception stack is limited to 32kb",
            test: () => {
                // setup
                var testError = {
                    name: "Error",
                    message: "Test - stack is too large",
                    stack: "Error: testMaxSize"
                }

                var rawStackFrame = "\nat function" + i + " (http://myScript.js:" + i + ":20)";
                var maxSize = 32 * 1024;
                for (var i = 0; i < maxSize; i++) {
                    testError.stack += rawStackFrame;
                }

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Exception(testError);
                var exception = telemetry.exceptions[0];

                // verify unparsed stack is truncated
                Assert.ok(exception.stack.length === maxSize, "max size was applied to raw stack");

                // verify parsed stack is truncated
                var fullStr = JSON.stringify(exception);
                var postSerializedException = JSON.parse(fullStr);
                var parsedStackStr = JSON.stringify(postSerializedException.parsedStack);
                Assert.ok(parsedStackStr.length <= maxSize, "parsed stack was truncated");
            }
        });

        this.testCase({
            name: name + "ExceptionTelemetry captures required data from input Error object",
            test: () => {
                var testErrors = [
                    {
                        name: "Error",
                        message: "chrome formatted error",
                        stack: "\
Error: testmessage1\n\
    at new PageViewPerformanceData (http://myScript.js:10:20)\n\
    at new PageViewPerformanceTelemetry (http://myScript.js:30:40)\n\
    at http://myScript.js:40:50\n\
    at myFunction (http://myScript.js:60:70)\n\
    at <anonymous>:80:90"
                    }, {
                        name: "Error",
                        message: "firefox formatted error",
                        stack: "\
PageViewPerformanceData@http://myScript.js:10:20\n\
PageViewPerformanceTelemetry@http://myScript.js:30:40\n\
@http://myScript.js:40:50\n\
myFunction@http://myScript.js:60:70\n\
@anonymous debugger eval code:80:90"
                    }, {
                        name: "Error",
                        message: "ie formatted error",
                        stack: "\
Error: testmessage2\n\
    at PageViewPerformanceData (http://myScript.js:10:20)\n\
    at PageViewPerformanceTelemetry (http://myScript.js:30:40)\n\
    at http://myScript.js:40:50\n\
    at myFunction (http://myScript.js:60:70)\n\
    at anonymous function (http://myScript.js:80:90)"
                    }
                ];

                var fuzzyStringMatch = (a, b) => {
                    if (typeof a === "number") {
                        return a === b ? 1 : 0;
                    } else if (a === b) {
                        return 1;
                    } else {
                        var map = {};
                        for (var i = 1; i < a.length; i++) {
                            map[a[i - 1] + a[i]] = true;
                        }

                        var matches = 0;
                        for (i = 1; i < b.length; i++) {
                            if (map[b[i - 1] + b[i]]) {
                                matches++;
                            }
                        }

                        var len = Math.max(a.length, b.length) || 1;
                        return matches / len;
                    }
                }

                var test = (first, second) => {
                    Assert.ok(first.hasFullStack, first.message + " has full stack");
                    Assert.ok(second.hasFullStack, second.message + " has full stack");
                    Assert.equal(first.parsedStack.length, second.parsedStack.length, first.message + " stack length matches " + second.message);

                    // -1 to skip the last field which contains anonymous stack frame which varies widely between browsers
                    for (var i = 0; i < first.parsedStack.length - 1; i++) {
                        var fields = ["method", "line", "fileName", "level"];
                        var matchLevel = [0.7, 1, 0.7, 1];
                        while (fields.length) {
                            var field = fields.pop();
                            var requiredMatch = matchLevel.pop();
                            var similarity = fuzzyStringMatch(first.parsedStack[i][field], second.parsedStack[i][field]);
                            Assert.ok(similarity >= requiredMatch, field + " matches between: (" + first.message + ") and (" + second.message + ") by " + Math.round(similarity * 10000) / 100 + "%  ---  [" + first.parsedStack[i][field] + "]  vs.  [" + second.parsedStack[i][field] + "]");
                        }
                    }
                };

                var getFrame = (testError) => {
                    var telemetry = new Microsoft.ApplicationInsights.Telemetry.Exception(testError);
                    return telemetry.exceptions[0];
                };

                var chrome = getFrame(testErrors[0]);
                var firefox = getFrame(testErrors[1]);
                var ie = getFrame(testErrors[2]);

                test(chrome, firefox);
                test(chrome, ie);
                test(firefox, chrome);
                test(firefox, ie);
                test(ie, chrome);
                test(ie, firefox);
            }
        });

        this.testCase({
            name: "CreateSimpleException returns Exception instance with specified properties",
            test: () => {
                var expectedMessage = "Test Message";
                var expectedTypeName = "Test Type Name";
                var expectedDetails = "Test Details";
                var expectedAssembly = "Test Assembly";
                var expectedFileName = "Test File Name";
                var expectedLineNumber = 42;

                var actual = Microsoft.ApplicationInsights.Telemetry.Exception.CreateSimpleException(expectedMessage, expectedTypeName, expectedAssembly, expectedFileName, expectedDetails, expectedLineNumber);

                Assert.equal(expectedMessage, actual.exceptions[0].message);
                Assert.equal(expectedTypeName, actual.exceptions[0].typeName);
                Assert.equal(expectedDetails, actual.exceptions[0].stack);
                Assert.equal(true, actual.exceptions[0].hasFullStack);
                Assert.equal(undefined, actual.exceptions[0].parsedStack);
            }
        });

        this.testCase({
            name: "Stack trace with no method serializes as <no_method>",
            test: () => {
                // Act
                var sut = new Microsoft.ApplicationInsights.Telemetry._StackFrame("    at http://myScript.js:40:50", 1);

                // Verify
                Assert.equal("<no_method>", sut.method);
            }
        });
    }
}
new ExceptionTelemetryTests().registerTests();
