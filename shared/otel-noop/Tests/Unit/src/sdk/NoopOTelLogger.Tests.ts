import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {
    createLoggerProvider,
    IOTelLogger,
    IOTelInstrumentationScope,
    isFunction
} from "@microsoft/otel-core-js";
import { createNoopLogRecordProcessor } from "../../../../src/api/logger/noopLogRecordProcessor";

// *************************************
// Note: NOOP implementations should only rely on otel-core-js for the interfaces and NONE of the implementation code.
// As this project MUST function in es5 mode while otel-core-js does not.
// *************************************


// W3C TraceFlags - Sampled = 1
const eW3CTraceFlags_Sampled = 1;

type LoggerWithScope = IOTelLogger & { instrumentationScope: IOTelInstrumentationScope };

export class NoopOTelLoggerTests extends AITestClass {
    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    // private setup() {
    //     const logProcessor = createNoopLogRecordProcessor();
    //     const provider = createLoggerProvider({
    //         processors: [logProcessor]
    //     });
    //     const logger = provider.getLogger("test name", "test version", {
    //         schemaUrl: "test schema url"
    //     }) as LoggerWithScope;
    //     return { logger, logProcessor, provider };
    // }

    public registerTests() {
        this.testCase({
            name: "Logger: factory returns logger instance",
            test: () => {
                const logProcessor = createNoopLogRecordProcessor();

                Assert.ok(logProcessor, "Should return an instance of log processor");
                Assert.ok(isFunction(logProcessor.onEmit), "Log processor should have onEmit function");
                Assert.ok(isFunction(logProcessor.forceFlush), "Log processor should have forceFlush function");
                Assert.ok(isFunction(logProcessor.shutdown), "Log processor should have shutdown function");
            }
        });

        // this.testCase({
        //     name: "Logger: factory returns logger instance",
        //     test: () => {
        //         const logProcessor = createNoopLogRecordProcessor();
        //         const provider = createLoggerProvider({ processors: [logProcessor] });
        //         const sharedState = provider._sharedState;
        //         const scope: IOTelInstrumentationScope = {
        //             name: "test name",
        //             version: "test version",
        //             schemaUrl: "test schema url"
        //         };
        //         const logger = createLogger(scope, sharedState) as LoggerWithScope;
        //         Assert.equal(logger.instrumentationScope.name, "test name", "Should set instrumentation scope name");
        //         Assert.equal(logger.instrumentationScope.version, "test version", "Should set instrumentation scope version");
        //         Assert.equal(typeof logger.emit, "function", "Should expose emit implementation");
        //     }
        // });

        // this.testCase({
        //     name: "Logger: should emit a logRecord instance",
        //     test: () => {
        //         const { logger, logProcessor } = this.setup();
        //         const callSpy = this.sandbox.spy(logProcessor, "onEmit");
        //         logger.emit({
        //             body: "test log body"
        //         });
        //         Assert.ok(callSpy.called, "onEmit should be called");
        //         callSpy.restore();
        //     }
        // });

        // this.testCase({
        //     name: "Logger: should make log record instance readonly after emit it",
        //     test: () => {
        //         const { logger, logProcessor } = this.setup();
        //         let readonlyCalled = false;
        //         this.sandbox.stub(logProcessor, "onEmit").callsFake((logRecord) => {
        //             const originalMakeReadonly = logRecord._makeReadonly;
        //             logRecord._makeReadonly = () => {
        //                 readonlyCalled = true;
        //                 originalMakeReadonly.call(logRecord);
        //             };
        //         });
        //         logger.emit({
        //             body: "test log body"
        //         });
        //         Assert.ok(readonlyCalled, "_makeReadonly should be called");
        //     }
        // });

        // this.testCase({
        //     name: "Logger: should emit with current Context",
        //     test: () => {
        //         const { logger, logProcessor } = this.setup();
        //         const callSpy = this.sandbox.spy(logProcessor, "onEmit");
        //         logger.emit({
        //             body: "test log body"
        //         });
        //         const contextManager = createContextManager();
        //         const currentContext = contextManager.active();
        //         Assert.ok(callSpy.called, "onEmit should be called");
        //         Assert.equal(callSpy.args[0][1], currentContext, "Should emit with current context");
        //         callSpy.restore();
        //     }
        // });

        // this.testCase({
        //     name: "Logger: should emit with Context specified in LogRecord",
        //     test: () => {
        //         const { logger, logProcessor } = this.setup();
        //         const spanContext: IOTelSpanContext = {
        //             traceId: "d4cda95b652f4a1592b449d5929fda1b",
        //             spanId: "6e0c63257de34c92",
        //             traceFlags: eW3CTraceFlags_Sampled
        //         };
        //         const ROOT_CONTEXT = createContext(null as unknown as IOTelApi);
        //         const activeContext = setContextSpanContext(ROOT_CONTEXT, spanContext);
        //         const logRecordData: IOTelLogRecord = {
        //             context: activeContext
        //         };

        //         const callSpy = this.sandbox.spy(logProcessor, "onEmit");
        //         logger.emit(logRecordData);
        //         Assert.ok(callSpy.called, "onEmit should be called");
        //         Assert.equal(callSpy.args[0][1], activeContext, "Should emit with specified context");
        //         callSpy.restore();
        //     }
        // });
    }
}