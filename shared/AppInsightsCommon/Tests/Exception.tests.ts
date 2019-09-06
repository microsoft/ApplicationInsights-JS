/// <reference path="./TestFramework/Common.ts" />

import { Exception } from "../src/applicationinsights-common"
import { DiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { IExceptionInternal, IExceptionDetailsInternal, IExceptionStackFrameInternal } from "../src/Interfaces/IExceptionTelemetry";
import { _ExceptionDetails, _StackFrame } from "../src/Telemetry/Exception";

export class ExceptionTests extends TestClass {
    logger = new DiagnosticLogger();

    public testInitialize() {
        this.clock.reset();
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
                const exceptionDetails = new _ExceptionDetails(this.logger, new Error("test error"));
                Assert.ok(exceptionDetails, "ExceptionDetails instance is created");

                const exceptionDetailsInterface: IExceptionDetailsInternal = exceptionDetails.toInterface();
                Assert.deepEqual(exceptionDetails.id, exceptionDetailsInterface.id);
                Assert.deepEqual(exceptionDetails.outerId, exceptionDetailsInterface.outerId);
                Assert.deepEqual(exceptionDetails.typeName, exceptionDetailsInterface.typeName);
                Assert.deepEqual(exceptionDetails.message, exceptionDetailsInterface.message);
                Assert.deepEqual(exceptionDetails.hasFullStack, exceptionDetailsInterface.hasFullStack);
                Assert.deepEqual(exceptionDetails.stack, exceptionDetailsInterface.stack);
                Assert.deepEqual(exceptionDetails.parsedStack && exceptionDetails.parsedStack.map((frame: _StackFrame) => frame.toInterface()), exceptionDetailsInterface.parsedStack);

                const exceptionDetailsConverted = _ExceptionDetails.CreateFromInterface(this.logger, exceptionDetailsInterface);
                Assert.deepEqual(exceptionDetails, exceptionDetailsConverted);
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
                const stackFrame = new _StackFrame(stack.split("\n")[0], 0);
                Assert.ok(stackFrame, "StackFrame instance is created");

                const stackFrameInterface: IExceptionStackFrameInternal = stackFrame.toInterface();
                Assert.deepEqual(stackFrame.level, stackFrameInterface.level);
                Assert.deepEqual(stackFrame.method, stackFrameInterface.method);
                Assert.deepEqual(stackFrame.assembly, stackFrameInterface.assembly);
                Assert.deepEqual(stackFrame.fileName, stackFrameInterface.fileName);
                Assert.deepEqual(stackFrame.line, stackFrameInterface.line);

                // var stackFrameConverted = _StackFrame.CreateFromInterface(stackFrameInterface);
                // Assert.deepEqual(stackFrame, stackFrameConverted);
            }
        });
    }
}