import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { LoggerProvider } from "../../../../src/sdk/IOTelLoggerProvider";
import { NoopLogRecordProcessor } from "../../../../src/interfaces/logs/IOTelNoopLogRecordProcessor";
import { IOTelLogRecordImpl } from "../../../../src/sdk/IOTelLogRecordImpl";
import { createContext } from "../../../../src/api/context/context";
import { Logger } from "../../../../src/sdk/IOTelLogger";
import { IOTelLogRecord } from "../../../../src/interfaces/logs/IOTelLogRecord";
import { IOTelSpanContext } from "../../../../src/interfaces/trace/IOTelSpanContext";
import { eW3CTraceFlags } from "@microsoft/applicationinsights-common";
import { createContextManager } from "../../../../src/api/context/contextManager";
import { setContextSpanContext } from "../../../../src/api/trace/utils";

export class IOTelLoggerTests extends AITestClass {
    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    private setup() {
        const logProcessor = new NoopLogRecordProcessor();
        const provider = new LoggerProvider({
            processors: [logProcessor]
        });
        const logger = provider.getLogger("test name", "test version", {
            schemaUrl: "test schema url"
        }) as Logger;
        return { logger, logProcessor };
    }

    public registerTests() {
        
        this.testCase({
            name: "Logger: constructor",
            test: () => {
                const { logger } = this.setup();
                Assert.ok(logger instanceof Logger, "Should create a Logger instance");
            }
        });

        this.testCase({
            name: "Logger: should emit a logRecord instance",
            test: () => {
                const { logger, logProcessor } = this.setup();
                const callSpy = this.sandbox.spy(logProcessor, "onEmit");
                logger.emit({
                    body: "test log body"
                });
                Assert.ok(callSpy.called, "onEmit should be called");
                callSpy.restore();
            }
        });

        this.testCase({
            name: "Logger: should make log record instance readonly after emit it",
            test: () => {
                const { logger } = this.setup();
                const makeOnlySpy = this.sandbox.spy(IOTelLogRecordImpl.prototype, "_makeReadonly");
                logger.emit({
                    body: "test log body"
                });
                Assert.ok(makeOnlySpy.called, "_makeReadonly should be called");
                makeOnlySpy.restore();
            }
        });

        this.testCase({
            name: "Logger: should emit with current Context",
            test: () => {
                const { logger, logProcessor } = this.setup();
                const callSpy = this.sandbox.spy(logProcessor, "onEmit");
                logger.emit({
                    body: "test log body"
                });
                const contextManager = createContextManager();
                const currentContext = contextManager.active();
                Assert.ok(callSpy.called, "onEmit should be called");
                Assert.equal(callSpy.args[0][1], currentContext, "Should emit with current context");
                callSpy.restore();
            }
        });

        this.testCase({
            name: "Logger: should emit with Context specified in LogRecord",
            test: () => {
                const { logger, logProcessor } = this.setup();
                const spanContext: IOTelSpanContext = {
                    traceId: "d4cda95b652f4a1592b449d5929fda1b",
                    spanId: "6e0c63257de34c92",
                    traceFlags: eW3CTraceFlags.Sampled
                };
                const ROOT_CONTEXT = createContext();
                const activeContext = setContextSpanContext(ROOT_CONTEXT, spanContext);
                const logRecordData: IOTelLogRecord = {
                    context: activeContext
                };

                const callSpy = this.sandbox.spy(logProcessor, "onEmit");
                logger.emit(logRecordData);
                Assert.ok(callSpy.called, "onEmit should be called");
                Assert.equal(callSpy.args[0][1], activeContext, "Should emit with specified context");
                callSpy.restore();
            }
        });
    }
}