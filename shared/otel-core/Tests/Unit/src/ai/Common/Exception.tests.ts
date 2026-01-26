import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { LoggingSeverity, _InternalMessageId } from "../../../../../src/enums/ai/LoggingEnums";
import { DataSanitizerValues, Exception } from "../../../../../src/index"
import { IDiagnosticLogger, IInternalLogMessage } from "../../../../../src/interfaces/ai/IDiagnosticLogger";
import { IExceptionInternal, IExceptionDetailsInternal, IExceptionStackFrameInternal } from "../../../../../src/interfaces/ai/IExceptionTelemetry";
import { _createExceptionDetails, _createExDetailsFromInterface, _extractStackFrame, _parsedFrameToInterface, _IParsedStackFrame } from "../../../../../src/telemetry/ai/Exception";
import { IStackFrame } from "../../../../../src/interfaces/ai/contracts/IStackFrame";

class TestDiagnosticLogger implements IDiagnosticLogger {
    public queue: IInternalLogMessage[];
    private _consoleLevel: number;

    constructor(consoleLevel?: number) {
        this.queue = [];
        this._consoleLevel = (consoleLevel !== undefined ? consoleLevel : 0);
    }

    // Lightweight logger to satisfy IDiagnosticLogger contract for tests only
    public consoleLoggingLevel(): number {
        return this._consoleLevel;
    }

    public throwInternal(_severity: LoggingSeverity, messageId: _InternalMessageId, message: string): void {
        this.queue.push({ message, messageId });
    }

    public warnToConsole(_message: string): void {
        // Intentionally left blank for test usage
    }

    public resetInternalMessageCount(): void {
        this.queue.length = 0;
    }

    public logInternalMessage(_severity: LoggingSeverity, message: IInternalLogMessage): void {
        this.queue.push(message);
    }
}

function _checkExpectedFrame(expectedFrame: IStackFrame, actualFrame: IStackFrame,  index: number) {
    Assert.equal(expectedFrame.assembly, actualFrame.assembly, index + ") Assembly is not as expected");
    Assert.equal(expectedFrame.fileName, actualFrame.fileName, index + ") FileName is not as expected");
    Assert.equal(expectedFrame.line, actualFrame.line, index + ") Line is not as expected");
    Assert.equal(expectedFrame.method, actualFrame.method, index + ") Method is not as expected");
    Assert.equal(expectedFrame.level, actualFrame.level, index + ") Level is not as expected");    
}

export class ExceptionTests extends AITestClass {
    logger = new TestDiagnosticLogger();

    public testInitialize() {
    }

    public testCleanup() {}

    public registerTests() {
        this.testCase({
            name: "Exception: Exception can be exported to interface format",
            test: () => {
                const exception = new Exception(this.logger, new Error("test error"));
                Assert.ok(exception, "Exception is created");

                const exceptionInterface: IExceptionInternal = exception.toInterface();
                Assert.deepEqual(exception.id, exceptionInterface.id);
                Assert.deepEqual(exception.problemGroup, exceptionInterface.problemGroup);
                Assert.deepEqual("4.0", exceptionInterface.ver, "Default format expects CS4.0");
                Assert.deepEqual(2, exception.ver, "Breeze format expects CS2.0");
                Assert.deepEqual(exception.isManual, exceptionInterface.isManual);
                Assert.deepEqual(exception.exceptions.map((exception: any) => exception.toInterface()), exceptionInterface.exceptions);
                Assert.deepEqual(exception.severityLevel, exceptionInterface.severityLevel);
                Assert.deepEqual(exception.properties, exceptionInterface.properties);
                Assert.deepEqual(exception.measurements, exceptionInterface.measurements);

                const exceptionConverted = Exception.CreateFromInterface(this.logger, exceptionInterface);
                Assert.deepEqual(exception, exceptionConverted);
            }
        });

        this.testCase({
            name: "ExceptionDetails: ExceptionDetails can be exported to interface format",
            test: () => {
                try {
                    const exceptionDetails = _createExceptionDetails(this.logger, new Error("test error"));
                    Assert.ok(exceptionDetails, "ExceptionDetails instance is created");
    
                    const exceptionDetailsInterface: IExceptionDetailsInternal = exceptionDetails.toInterface();
                    Assert.deepEqual(exceptionDetails.id, exceptionDetailsInterface.id);
                    Assert.deepEqual(exceptionDetails.outerId, exceptionDetailsInterface.outerId);
                    Assert.deepEqual(exceptionDetails.typeName, exceptionDetailsInterface.typeName);
                    Assert.deepEqual(exceptionDetails.message, exceptionDetailsInterface.message);
                    Assert.deepEqual(exceptionDetails.hasFullStack, exceptionDetailsInterface.hasFullStack);
                    Assert.deepEqual(exceptionDetails.stack, exceptionDetailsInterface.stack);
                    Assert.deepEqual(exceptionDetails.parsedStack && exceptionDetails.parsedStack.map((frame: any) => _parsedFrameToInterface(frame)), exceptionDetailsInterface.parsedStack);
    
                    const exceptionDetailsConverted = _createExDetailsFromInterface(this.logger, exceptionDetailsInterface);
                    Assert.deepEqual(exceptionDetails, exceptionDetailsConverted);
                } catch (e: any) {
                    console.log(e.stack);
                    console.log(e.toString());
                    Assert.ok(false, e.toString());
                }
            }
        });

        this.testCase({
            name: "ExceptionDetails: ExceptionDetails assembly fields will be truncated",
            test: () => {
                try {
                    // const define
                    const MAX_STRING_LENGTH = DataSanitizerValues.MAX_STRING_LENGTH;
                    const messageLong = new Array(MAX_STRING_LENGTH + 10).join("abc");

                    const messageFollowRegex = "at functionName (a.js:1:1)"
                    const longMessageFollowRegex = messageFollowRegex.replace("functionName", messageLong)

                    let errObj = {
                        reason:{
                            message: "message",
                            stack: longMessageFollowRegex + "\n" + longMessageFollowRegex + "\n" + longMessageFollowRegex
                        }
                    };

                    let exception = Exception.CreateAutoException("message",
                        "url",
                        9,
                        0,
                        errObj
                    );
                    const exceptionDetails = _createExceptionDetails(this.logger, exception);
                    
                    for (let i = 0; i < exceptionDetails.parsedStack.length; i++) {
                        Assert.equal(MAX_STRING_LENGTH, exceptionDetails.parsedStack[i].assembly.length);
                    }
                } catch (e: any) {
                    console.log(e.stack);
                    console.log(e.toString());
                    Assert.ok(false, e.toString());
                }
            }
        });

        this.testCase({
            name: "ExceptionDetails: ExceptionDetails filename fields will be truncated",
            test: () => {
                try {
                    // const define
                    const MAX_STRING_LENGTH = DataSanitizerValues.MAX_STRING_LENGTH;
                    const messageLong = new Array(MAX_STRING_LENGTH + 10).join("abc");

                    const messageFollowRegex = "at functionName (a.js:1:1)"
                    const longMessageFollowRegex = messageFollowRegex.replace("a.js", messageLong)

                    let errObj = {
                        reason:{
                            message: "message",
                            stack: longMessageFollowRegex + "\n" + longMessageFollowRegex + "\n" + longMessageFollowRegex
                        }
                    };

                    let exception = Exception.CreateAutoException("message",
                        "url",
                        9,
                        0,
                        errObj
                    );
                    const exceptionDetails = _createExceptionDetails(this.logger, exception);
                    
                    for (let i = 0; i < exceptionDetails.parsedStack.length; i++) {
                        Assert.equal(MAX_STRING_LENGTH, exceptionDetails.parsedStack[i].fileName.length);
                    }
                } catch (e: any) {
                    console.log(e.stack);
                    console.log(e.toString());
                    Assert.ok(false, e.toString());
                }
            }
        });

        this.testCase({
            name: "StackFrame: StackFrame can be exported to interface format",
            test: () => {
                const error = new Error("hello");
                const stack = error.stack;
                if (!stack) {
                    Assert.ok(true);
                    return;
                }
                const stackFrame = _extractStackFrame(stack.split("\n")[0], 0);
                Assert.ok(stackFrame, "StackFrame instance is created");

                const stackFrameInterface: IExceptionStackFrameInternal = _parsedFrameToInterface(stackFrame!);
                Assert.deepEqual(stackFrame!.level, stackFrameInterface.level);
                Assert.deepEqual(stackFrame!.method, stackFrameInterface.method);
                Assert.deepEqual(stackFrame!.assembly, stackFrameInterface.assembly);
                Assert.deepEqual(stackFrame!.fileName, stackFrameInterface.fileName);
                Assert.deepEqual(stackFrame!.line, stackFrameInterface.line);
            }
        });

        this.testCase({
            name: "StackFrame: ErrorStack can be exported from reason object of errorObj",
            test: () => {
                let errObj = {
                    reason:{
                        message: "message",
                        stack: "TypeError: undefined\n at Function.assign(<file>)"
                    }
                };
                let errDetail = {
                    src: "TypeError: undefined\n at Function.assign(<file>)",
                    obj:["TypeError: undefined"," at Function.assign(<file>)"]
                };
                let exception = Exception.CreateAutoException("message",
                    "url",
                    9,
                    0,
                    errObj
                );

                Assert.ok(exception.stackDetails);
                Assert.deepEqual(exception.stackDetails, errDetail);
            }
        });

        this.testCase({
            name: "StackFrame: Validate different stack formats",
            test:() => {
                let errObj = {
                    reason:{
                        message: "Test_Error_Throwing_Inside_UseCallback",
                        stack: "Error: Test_Error_Throwing_Inside_UseCallback\n" +
                            "at http://localhost:3000/static/js/main.206f4846.js:2:296748\n" +                      // Anonymous function with no function name attribution (firefox/ios)
                            "at Object.Re (http://localhost:3000/static/js/main.206f4846.js:2:16814)\n" +           // With class.function attribution
                            "at je (http://localhost:3000/static/js/main.206f4846.js:2:16968)\n" +                  // With function name attribution
                            "at Object.<anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:42819)\n" +  // With Object.<anonymous> attribution
                            "at Object.<anonymous> (../localfile.js:2:1234)\n" +                                    // With Object.<anonymous> attribution and local file                  
                            "at (anonymous) @ VM60:1\n" +                                                           // With (anonymous) attribution            
                            "at [native code]\n" +                                                                  // With [native code] attribution
                            "at (at eval at <anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:296748), <anonymous>:1:1)\n" + // With eval attribution
                            "at Object.eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)\n" +        // With eval attribution
                            "at eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)\n" +               // With eval attribution
                            "at eval (webpack-internal:///./src/App.tsx:1:1)\n" +                                   // With eval attribution
                            "at [arguments not available])@file://localhost/stacktrace.js:21\n" +                   // With arguments not available attribution
                            "at file://C:/Temp/stacktrace.js:27:1\n" +                                              // With file://localhost attribution
                            " Line 21 of linked script file://localhost/C:/Temp/stacktrace.js\n" +                  // With Line 21 of linked script attribution
                            " Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748\n" + // With Line 11 of inline#1 script attribution
                            " Line 68 of inline#2 script in file://localhost/teststack.html\n" +                    // With Line 68 of inline#2 script attribution
                            "at Function.Module._load (module.js:407:3)\n" +
                            " at Function.Module.runMain (module.js:575:10)\n"+ 
                            " at startup (node.js:159:18)\n" +
                            "at Global code (http://example.com/stacktrace.js:11:1)\n" +
                            "at Object.Module._extensions..js (module.js:550:10)\n" +
                            "   at c@http://example.com/stacktrace.js:9:3\n" +
                            "   at b@http://example.com/stacktrace.js:6:3\n" +
                            "   at a@http://example.com/stacktrace.js:3:3\n" +
                            "http://localhost:3000/static/js/main.206f4846.js:2:296748\n" +                      // Anonymous function with no function name attribution (firefox/ios)
                            "   c@http://example.com/stacktrace.js:9:3\n" +
                            "   b@http://example.com/stacktrace.js:6:3\n" +
                            "   a@http://example.com/stacktrace.js:3:3\n" +
                            "  at Object.testMethod (http://localhost:9001/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:53058:48)"
                    }
                };

                const expectedParsedStack: IStackFrame[] = [
                    { level: 0, method: "<no_method>", assembly: "at http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 1, method: "Object.Re", assembly: "at Object.Re (http://localhost:3000/static/js/main.206f4846.js:2:16814)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 2, method: "je", assembly: "at je (http://localhost:3000/static/js/main.206f4846.js:2:16968)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 3, method: "Object.<anonymous>", assembly: "at Object.<anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:42819)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 4, method: "Object.<anonymous>", assembly: "at Object.<anonymous> (../localfile.js:2:1234)", fileName: "../localfile.js", line: 2 },
                    { level: 5, method: "<anonymous>", assembly: "at (anonymous) @ VM60:1", fileName: "VM60", line: 1 },
                    { level: 6, method: "<no_method>", assembly: "at [native code]", fileName: "", line: 0 },
                    { level: 7, method: "<no_method>", assembly: "at (at eval at <anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:296748), <anonymous>:1:1)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 8, method: "Object.eval", assembly: "at Object.eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 9, method: "eval", assembly: "at eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 10, method: "eval", assembly: "at eval (webpack-internal:///./src/App.tsx:1:1)", fileName: "webpack-internal:///./src/App.tsx", line: 1 },
                    { level: 11, method: "<no_method>", assembly: "at [arguments not available])@file://localhost/stacktrace.js:21", fileName: "file://localhost/stacktrace.js", line: 21 },
                    { level: 12, method: "<no_method>", assembly: "at file://C:/Temp/stacktrace.js:27:1", fileName: "file://C:/Temp/stacktrace.js", line: 27 },
                    { level: 13, method: "<no_method>", assembly: "Line 21 of linked script file://localhost/C:/Temp/stacktrace.js", fileName: "file://localhost/C:/Temp/stacktrace.js", line: 0 },
                    { level: 14, method: "<no_method>", assembly: "Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 15, method: "<no_method>", assembly: "Line 68 of inline#2 script in file://localhost/teststack.html", fileName: "file://localhost/teststack.html", line: 0 },
                    { level: 16, method: "Function.Module._load", assembly: "at Function.Module._load (module.js:407:3)", fileName: "module.js", line: 407 },
                    { level: 17, method: "Function.Module.runMain", assembly: "at Function.Module.runMain (module.js:575:10)", fileName: "module.js", line: 575 },
                    { level: 18, method: "startup", assembly: "at startup (node.js:159:18)", fileName: "node.js", line: 159 },
                    { level: 19, method: "<no_method>", assembly: "at Global code (http://example.com/stacktrace.js:11:1)", fileName: "http://example.com/stacktrace.js", line: 11 },
                    { level: 20, method: "Object.Module._extensions..js", assembly: "at Object.Module._extensions..js (module.js:550:10)", fileName: "module.js", line: 550 },
                    { level: 21, method: "c", assembly: "at c@http://example.com/stacktrace.js:9:3", fileName: "http://example.com/stacktrace.js", line: 9 },
                    { level: 22, method: "b", assembly: "at b@http://example.com/stacktrace.js:6:3", fileName: "http://example.com/stacktrace.js", line: 6 },
                    { level: 23, method: "a", assembly: "at a@http://example.com/stacktrace.js:3:3", fileName: "http://example.com/stacktrace.js", line: 3 },
                    { level: 24, method: "<no_method>", assembly: "http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 },
                    { level: 25, method: "c", assembly: "c@http://example.com/stacktrace.js:9:3", fileName: "http://example.com/stacktrace.js", line: 9 },
                    { level: 26, method: "b", assembly: "b@http://example.com/stacktrace.js:6:3", fileName: "http://example.com/stacktrace.js", line: 6 },
                    { level: 27, method: "a", assembly: "a@http://example.com/stacktrace.js:3:3", fileName: "http://example.com/stacktrace.js", line: 3 },
                    { level: 28, method: "Object.testMethod", assembly: "at Object.testMethod (http://localhost:9001/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:53058:48)", fileName: "http://localhost:9001/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js", line: 53058 }
                ];

                let exception = Exception.CreateAutoException("message",
                    "url",
                    9,
                    0,
                    errObj
                );

                Assert.ok(exception.stackDetails);
                Assert.equal(exception.stackDetails?.src, errObj.reason.stack);
                Assert.equal(exception.stackDetails?.obj.length, 30);

                const exceptionDetails = _createExceptionDetails(this.logger, exception);
                Assert.equal(exceptionDetails.stack, errObj.reason.stack);
                Assert.equal(exceptionDetails.parsedStack.length, 29);
                for (let lp = 0; lp < exceptionDetails.parsedStack.length; lp++) {
                    _checkExpectedFrame(expectedParsedStack[lp], exceptionDetails.parsedStack[lp], lp);
                }
            }
        });

        this.testCase({
            name: "StackFrame: Validate individual different stack formatting",
            test:() => {
                let testStacks: Array<{src: string, frame: IStackFrame }> = [
                    { 
                        src: "at http://localhost:3000/static/js/main.206f4846.js:2:296748",                // Anonymous function with no function name attribution (firefox/ios)
                        frame: { level: 0, method: "<no_method>", assembly: "at http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at Object.Re (http://localhost:3000/static/js/main.206f4846.js:2:16814)",     // With class.function attribution
                        frame: { level: 0, method: "Object.Re", assembly: "at Object.Re (http://localhost:3000/static/js/main.206f4846.js:2:16814)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at je (http://localhost:3000/static/js/main.206f4846.js:2:16968)",            // With function name attribution
                        frame: { level: 0, method: "je", assembly: "at je (http://localhost:3000/static/js/main.206f4846.js:2:16968)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at Object.<anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:42819)",  // With Object.<anonymous> attribution
                        frame: { level: 0, method: "Object.<anonymous>", assembly: "at Object.<anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:42819)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at Object.<anonymous> (../localfile.js:2:1234)",                                    // With Object.<anonymous> attribution and local file
                        frame: { level: 0, method: "Object.<anonymous>", assembly: "at Object.<anonymous> (../localfile.js:2:1234)", fileName: "../localfile.js", line: 2 }
                    },
                    {
                        src: "at (anonymous) @ VM60:1",                                                           // With (anonymous) attribution
                        frame: { level: 0, method: "<anonymous>", assembly: "at (anonymous) @ VM60:1", fileName: "VM60", line: 1 }
                    },
                    {
                        src: "at [native code]",                                                                  // With [native code] attribution
                        frame: { level: 0, method: "<no_method>", assembly: "at [native code]", fileName: "", line: 0 }
                    },
                    {
                        src: "at (at eval at <anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:296748), <anonymous>:1:1)", // With eval attribution
                        frame: { level: 0, method: "<no_method>", assembly: "at (at eval at <anonymous> (http://localhost:3000/static/js/main.206f4846.js:2:296748), <anonymous>:1:1)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at Object.eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)",        // With eval attribution
                        frame: { level: 0, method: "Object.eval", assembly: "at Object.eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)",               // With eval attribution
                        frame: { level: 0, method: "eval", assembly: "at eval (http://localhost:3000/static/js/main.206f4846.js:2:296748)", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "at eval (webpack-internal:///./src/App.tsx:1:1)",                                   // With eval attribution
                        frame: { level: 0, method: "eval", assembly: "at eval (webpack-internal:///./src/App.tsx:1:1)", fileName: "webpack-internal:///./src/App.tsx", line: 1 }
                    },
                    {
                        src: "at [arguments not available])@file://localhost/stacktrace.js:21",                   // With arguments not available attribution
                        frame: { level: 0, method: "<no_method>", assembly: "at [arguments not available])@file://localhost/stacktrace.js:21", fileName: "file://localhost/stacktrace.js", line: 21 }
                    },
                    {
                        src: "at file://C:/Temp/stacktrace.js:27:1",                                              // With file://localhost attribution
                        frame: { level: 0, method: "<no_method>", assembly: "at file://C:/Temp/stacktrace.js:27:1", fileName: "file://C:/Temp/stacktrace.js", line: 27 }
                    },
                    {
                        src: " Line 21 of linked script file://localhost/C:/Temp/stacktrace.js",                  // With Line 21 of linked script attribution
                        frame: { level: 0, method: "<no_method>", assembly: "Line 21 of linked script file://localhost/C:/Temp/stacktrace.js", fileName: "file://localhost/C:/Temp/stacktrace.js", line: 0 }
                    },
                    {
                        src: " Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748", // With Line 11 of inline#1 script attribution
                        frame: { level: 0, method: "<no_method>", assembly: "Line 11 of inline#1 script in http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: " Line 68 of inline#2 script in file://localhost/teststack.html",                    // With Line 68 of inline#2 script attribution
                        frame: { level: 0, method: "<no_method>", assembly: "Line 68 of inline#2 script in file://localhost/teststack.html", fileName: "file://localhost/teststack.html", line: 0 }
                    },
                    {
                        src: "at Function.Module._load (module.js:407:3)",
                        frame: { level: 0, method: "Function.Module._load", assembly: "at Function.Module._load (module.js:407:3)", fileName: "module.js", line: 407 }
                    },
                    {
                        src: " at Function.Module.runMain (module.js:575:10)",
                        frame: { level: 0, method: "Function.Module.runMain", assembly: "at Function.Module.runMain (module.js:575:10)", fileName: "module.js", line: 575 }
                    },
                    {
                        src: " at startup (node.js:159:18)",
                        frame: { level: 0, method: "startup", assembly: "at startup (node.js:159:18)", fileName: "node.js", line: 159 }
                    },
                    {
                        src: "at Global code (http://example.com/stacktrace.js:11:1)",
                        frame: { level: 0, method: "<no_method>", assembly: "at Global code (http://example.com/stacktrace.js:11:1)", fileName: "http://example.com/stacktrace.js", line: 11 }
                    },
                    {
                        src: "at Object.Module._extensions..js (module.js:550:10)",
                        frame: { level: 0, method: "Object.Module._extensions..js", assembly: "at Object.Module._extensions..js (module.js:550:10)", fileName: "module.js", line: 550 }
                    },
                    {
                        src: "   at c@http://example.com/stacktrace.js:9:3",
                        frame: { level: 0, method: "c", assembly: "at c@http://example.com/stacktrace.js:9:3", fileName: "http://example.com/stacktrace.js", line: 9 }
                    },
                    {
                        src: "   at b@http://example.com/stacktrace.js:6:3",
                        frame: { level: 0, method: "b", assembly: "at b@http://example.com/stacktrace.js:6:3", fileName: "http://example.com/stacktrace.js", line: 6 }
                    },
                    {
                        src: "   at a@http://example.com/stacktrace.js:3:3",
                        frame: { level: 0, method: "a", assembly: "at a@http://example.com/stacktrace.js:3:3", fileName: "http://example.com/stacktrace.js", line: 3 }
                    },
                    {
                        src: "http://localhost:3000/static/js/main.206f4846.js:2:296748",                      // Anonymous function with no function name attribution (firefox/ios)
                        frame: { level: 0, method: "<no_method>", assembly: "http://localhost:3000/static/js/main.206f4846.js:2:296748", fileName: "http://localhost:3000/static/js/main.206f4846.js", line: 2 }
                    },
                    {
                        src: "   c@http://example.com/stacktrace.js:9:3",
                        frame: { level: 0, method: "c", assembly: "c@http://example.com/stacktrace.js:9:3", fileName: "http://example.com/stacktrace.js", line: 9 }
                    },
                    {
                        src: "   b@http://example.com/stacktrace.js:6:3",
                        frame: { level: 0, method: "b", assembly: "b@http://example.com/stacktrace.js:6:3", fileName: "http://example.com/stacktrace.js", line: 6 }
                    },
                    {
                        src: "   a@http://example.com/stacktrace.js:3:3",
                        frame: { level: 0, method: "a", assembly: "a@http://example.com/stacktrace.js:3:3", fileName: "http://example.com/stacktrace.js", line: 3 }
                    },
                    {
                        src: "  at Object.testMethod (http://localhost:9001/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:53058:48)",
                        frame: { level: 0, method: "Object.testMethod", assembly: "at Object.testMethod (http://localhost:9001/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:53058:48)", fileName: "http://localhost:9001/shared/AppInsightsCommon/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js", line: 53058 }
                    }
                ];

                for (let lp = 0; lp < testStacks.length; lp++) {
                    let stackFrame = _extractStackFrame(testStacks[lp].src, 0);
                    _checkExpectedFrame(testStacks[lp].frame, stackFrame!, lp);
                }
            }
        });

        this.testCase({
            name: "StackFrame: Standard Chrome exception stack",
            test:() => {
                let errObj = {
                    reason:{
                        message: "TypeError: Cannot read property 'b' of undefined",
                        stack: "TypeError: Cannot read property 'b' of undefined\n" +
                                "  at ApplicationInsightsTests.<anonymous> (http://localhost:9001/AISKU/Tests/Unit/dist/aiskuunittests.tests.js:4578:40)\n" +
                                "  at trigger_1 (http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:52923:59)\n" +
                                "  at Object.testMethod (http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:52964:21)\n" +
                                "  at runTest (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2725:35)\n" +
                                "  at Test.run (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2708:9)\n" +
                                "  at http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2972:16\n" +
                                "  at processTaskQueue (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2293:26)\n" +
                                "  at http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2297:13"
                    }
                };
                let errDetail = {
                    src: errObj.reason.stack,
                    obj:[
                        "TypeError: Cannot read property 'b' of undefined",
                        "at ApplicationInsightsTests.<anonymous> (http://localhost:9001/AISKU/Tests/Unit/dist/aiskuunittests.tests.js:4578:40)",
                        "at trigger_1 (http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:52923:59)",
                        "at Object.testMethod (http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:52964:21)",
                        "at runTest (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2725:35)",
                        "at Test.run (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2708:9)",
                        "at http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2972:16",
                        "at processTaskQueue (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2293:26)",
                        "at http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2297:13"
                    ]
                };
                let exception = Exception.CreateAutoException("message",
                    "url",
                    9,
                    0,
                    errObj
                );

                Assert.ok(exception.stackDetails);

                const expectedParsedStack: IStackFrame[] = [
                    { level: 0, method: "ApplicationInsightsTests.<anonymous>", assembly: "at ApplicationInsightsTests.<anonymous> (http://localhost:9001/AISKU/Tests/Unit/dist/aiskuunittests.tests.js:4578:40)", fileName: "http://localhost:9001/AISKU/Tests/Unit/dist/aiskuunittests.tests.js", line: 4578 },
                    { level: 1, method: "trigger_1", assembly: "at trigger_1 (http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:52923:59)", fileName: "http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js", line: 52923 },
                    { level: 2, method: "Object.testMethod", assembly: "at Object.testMethod (http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js:52964:21)", fileName: "http://localhost:9001/AISKU/node_modules/@microsoft/ai-test-framework/dist/es5/ai-test-framework.js", line: 52964 },
                    { level: 3, method: "runTest", assembly: "at runTest (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2725:35)", fileName: "http://localhost:9001/common/Tests/External/qunit-2.9.3.js", line: 2725 },
                    { level: 4, method: "Test.run", assembly: "at Test.run (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2708:9)", fileName: "http://localhost:9001/common/Tests/External/qunit-2.9.3.js", line: 2708 },
                    { level: 5, method: "<no_method>", assembly: "at http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2972:16", fileName: "http://localhost:9001/common/Tests/External/qunit-2.9.3.js", line: 2972 },
                    { level: 6, method: "processTaskQueue", assembly: "at processTaskQueue (http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2293:26)", fileName: "http://localhost:9001/common/Tests/External/qunit-2.9.3.js", line: 2293 },
                    { level: 7, method: "<no_method>", assembly: "at http://localhost:9001/common/Tests/External/qunit-2.9.3.js:2297:13", fileName: "http://localhost:9001/common/Tests/External/qunit-2.9.3.js", line: 2297 }
                ];

                const exceptionDetails = _createExceptionDetails(this.logger, exception);
                Assert.equal(exceptionDetails.stack, errObj.reason.stack);
                Assert.equal(exceptionDetails.parsedStack.length, 8);
                for (let lp = 0; lp < exceptionDetails.parsedStack.length; lp++) {
                    _checkExpectedFrame(expectedParsedStack[lp], exceptionDetails.parsedStack[lp], lp);
                }                
            }
        });

        this.testCase({
            name: "StackFrame: handle multiple line message stack",
            test:() => {
                let errObj = {
                    reason:{
                        message: "Error: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n" +
                            "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
                            "2. You might be breaking the Rules of Hooks\n" +
                            "3. You might have more than one copy of React in the same app\n",
                        stack: "Error: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n" +
                            "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
                            "2. You might be breaking the Rules of Hooks\n" +
                            "3. You might have more than one copy of React in the same app\n" +
                            "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.\n" +
                            "    at Object.throwInvalidHookError (https://localhost:44365/static/js/bundle.js:201419:13)\n" +
                            "    at useContext (https://localhost:44365/static/js/bundle.js:222943:25)\n" +
                            "    at useTenantContext (https://localhost:44365/static/js/bundle.js:5430:68)\n" +
                            "    at https://localhost:44365/static/js/bundle.js:4337:72\n" +
                            "    at _ZoneDelegate.invoke (https://localhost:44365/static/js/bundle.js:227675:158)\n" +
                            "    at ZoneImpl.run (https://localhost:44365/static/js/bundle.js:227446:35)\n" +
                            "    at https://localhost:44365/static/js/bundle.js:229764:30\n" +
                            "    at _ZoneDelegate.invokeTask (https://localhost:44365/static/js/bundle.js:227700:171)\n" +
                            "    at ZoneImpl.runTask (https://localhost:44365/static/js/bundle.js:227499:37)\n" +
                            "    at ZoneImpl.patchRunTask (https://localhost:44365/static/js/bundle.js:144112:27)"
                    }
                };

                const expectedParsedStack: IStackFrame[] = [
                    { level: 0, method: "Object.throwInvalidHookError", assembly: "at Object.throwInvalidHookError (https://localhost:44365/static/js/bundle.js:201419:13)", fileName: "https://localhost:44365/static/js/bundle.js", line: 201419 },
                    { level: 1, method: "useContext", assembly: "at useContext (https://localhost:44365/static/js/bundle.js:222943:25)", fileName: "https://localhost:44365/static/js/bundle.js", line: 222943 },
                    { level: 2, method: "useTenantContext", assembly: "at useTenantContext (https://localhost:44365/static/js/bundle.js:5430:68)", fileName: "https://localhost:44365/static/js/bundle.js", line: 5430 },
                    { level: 3, method: "<no_method>", assembly: "at https://localhost:44365/static/js/bundle.js:4337:72", fileName: "https://localhost:44365/static/js/bundle.js", line: 4337 },
                    { level: 4, method: "_ZoneDelegate.invoke", assembly: "at _ZoneDelegate.invoke (https://localhost:44365/static/js/bundle.js:227675:158)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227675 },
                    { level: 5, method: "ZoneImpl.run", assembly: "at ZoneImpl.run (https://localhost:44365/static/js/bundle.js:227446:35)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227446 },
                    { level: 6, method: "<no_method>", assembly: "at https://localhost:44365/static/js/bundle.js:229764:30", fileName: "https://localhost:44365/static/js/bundle.js", line: 229764 },
                    { level: 7, method: "_ZoneDelegate.invokeTask", assembly: "at _ZoneDelegate.invokeTask (https://localhost:44365/static/js/bundle.js:227700:171)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227700 },
                    { level: 8, method: "ZoneImpl.runTask", assembly: "at ZoneImpl.runTask (https://localhost:44365/static/js/bundle.js:227499:37)", fileName: "https://localhost:44365/static/js/bundle.js", line: 227499 },
                    { level: 9, method: "ZoneImpl.patchRunTask", assembly: "at ZoneImpl.patchRunTask (https://localhost:44365/static/js/bundle.js:144112:27)", fileName: "https://localhost:44365/static/js/bundle.js", line: 144112 }
                ];

                let exception = Exception.CreateAutoException("message",
                    "url",
                    9,
                    0,
                    errObj
                );

                Assert.ok(exception.stackDetails);
                Assert.equal(exception.stackDetails?.src, errObj.reason.stack);
                Assert.equal(exception.stackDetails?.obj.length, 15);

                const exceptionDetails = _createExceptionDetails(this.logger, exception);
                Assert.equal(exceptionDetails.stack, errObj.reason.stack);
                Assert.equal(exceptionDetails.parsedStack.length, 10);
                for (let lp = 0; lp < exceptionDetails.parsedStack.length; lp++) {
                    _checkExpectedFrame(expectedParsedStack[lp], exceptionDetails.parsedStack[lp], lp);
                }
            }
        });
    }
}
