import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { createPromise, IPromise } from "@nevware21/ts-async";

import { IOTelContext } from "../../../../src/interfaces/context/IOTelContext";
import { IOTelLogRecordProcessor } from "../../../../src/interfaces/logs/IOTelLogRecordProcessor";
import { IOTelSdkLogRecord } from "../../../../src/interfaces/logs/IOTelSdkLogRecord";
import { LoggerProvider } from "../../../../src/sdk/IOTelLoggerProvider";
import { MultiLogRecordProcessor } from "../../../../src/sdk/IOTelMultiLogRecordProcessor";
import { loadDefaultConfig } from "../../../../src/sdk/config";

class TestProcessor implements IOTelLogRecordProcessor {
    public logRecords: IOTelSdkLogRecord[] = [];
    private _forceFlushCalls: number = 0;
    private _shutdownCalls: number = 0;

    public get forceFlushCalls(): number {
        return this._forceFlushCalls;
    }

    public get shutdownCalls(): number {
        return this._shutdownCalls;
    }

    public forceFlush(): Promise<void> {
        this._forceFlushCalls++;
        return Promise.resolve();
    }

    public onEmit(logRecord: IOTelSdkLogRecord, _context?: IOTelContext): void {
        this.logRecords.push(logRecord);
    }

    public shutdown(): Promise<void> {
        this._shutdownCalls++;
        this.logRecords = [];
        return Promise.resolve();
    }
}

const setup = (processors?: IOTelLogRecordProcessor[]) => {
    const { forceFlushTimeoutMillis } = loadDefaultConfig();
    const multiProcessor = new MultiLogRecordProcessor(
        processors || [],
        forceFlushTimeoutMillis
    );
    return { multiProcessor, forceFlushTimeoutMillis };
};

export class IOTelMultiLogRecordProcessorTests extends AITestClass {
    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {
        this.testCase({
            name: "MultiLogRecordProcessor: constructor - should create an instance",
            test: () => {
                const { multiProcessor } = setup();
                Assert.ok(multiProcessor instanceof MultiLogRecordProcessor, "Should create MultiLogRecordProcessor instance");
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: onEmit - should no-op when no processors registered",
            test: () => {
                const { multiProcessor } = setup();
                const provider = new LoggerProvider({ processors: [multiProcessor] });
                const logger = provider.getLogger("default");
                logger.emit({ body: "message" });
                Assert.ok(true, "Emit should not throw when no processors registered");
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: onEmit - should forward to single processor",
            test: () => {
                const processor = new TestProcessor();
                const { multiProcessor } = setup([processor]);
                const provider = new LoggerProvider({ processors: [multiProcessor] });
                const logger = provider.getLogger("default");
                Assert.equal(processor.logRecords.length, 0, "Processor should start with no records");
                logger.emit({ body: "one" });
                Assert.equal(processor.logRecords.length, 1, "Processor should receive emitted record");
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: onEmit - should forward to multiple processors",
            test: (): IPromise<void> => {
                const processor1 = new TestProcessor();
                const processor2 = new TestProcessor();
                const { multiProcessor } = setup([processor1, processor2]);
                const provider = new LoggerProvider({ processors: [multiProcessor] });
                const logger = provider.getLogger("default");

                Assert.equal(processor1.logRecords.length, 0, "Processor1 should start empty");
                Assert.equal(processor2.logRecords.length, 0, "Processor2 should start empty");

                logger.emit({ body: "one" });
                Assert.equal(processor1.logRecords.length, 1, "Processor1 should receive record");
                Assert.equal(processor2.logRecords.length, 1, "Processor2 should receive record");

                return createPromise((resolve, reject) => {
                    multiProcessor.shutdown().then(() => {
                        try {
                            Assert.equal(processor1.logRecords.length, 0, "Processor1 should clear records on shutdown");
                            Assert.equal(processor2.logRecords.length, 0, "Processor2 should clear records on shutdown");
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: forceFlush - should flush all processors",
            test: (): IPromise<void> => {
                const processor = new TestProcessor();
                const flushSpy = this.sandbox.spy(processor, "forceFlush");
                const { multiProcessor } = setup([processor]);

                return createPromise((resolve, reject) => {
                    multiProcessor.forceFlush().then(() => {
                        try {
                            Assert.equal(flushSpy.callCount, 1, "Processor forceFlush should be called once");
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: forceFlush - should wait for all processors",
            test: (): IPromise<void> => {
                const processor1 = new TestProcessor();
                const processor2 = new TestProcessor();
                const flushSpy1 = this.sandbox.stub(processor1, "forceFlush").callsFake(() => {
                    (processor1 as any)._forceFlushCalls++;
                    return Promise.resolve();
                });
                const flushSpy2 = this.sandbox.stub(processor2, "forceFlush").callsFake(() => {
                    (processor2 as any)._forceFlushCalls++;
                    return Promise.resolve();
                });
                const { multiProcessor } = setup([processor1, processor2]);

                return createPromise((resolve, reject) => {
                    multiProcessor.forceFlush().then(() => {
                        try {
                            Assert.equal(flushSpy1.callCount, 1, "Processor1 forceFlush should be awaited");
                            Assert.equal(flushSpy2.callCount, 1, "Processor2 forceFlush should be awaited");
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: forceFlush - should reject when a processor times out",
            useFakeTimers: true,
            test: (): IPromise<void> => {
                const { multiProcessor, forceFlushTimeoutMillis } = setup([
                    {
                        forceFlush: () => new Promise<void>((resolve) => {
                            setTimeout(() => resolve(), forceFlushTimeoutMillis + 1000);
                        }),
                        onEmit: () => {},
                        shutdown: () => Promise.resolve()
                    },
                    new TestProcessor()
                ]);

                const flushPromise = multiProcessor.forceFlush();
                this.clock.tick(forceFlushTimeoutMillis + 1000);

                return createPromise((resolve, reject) => {
                    flushPromise.then(() => {
                        reject(new Error("Expected forceFlush to timeout"));
                    }).catch((error) => {
                        try {
                            Assert.ok(!!error, "forceFlush should reject on timeout");
                            resolve();
                        } catch (caught) {
                            reject(caught);
                        }
                    });
                });
            }
        });

        this.testCase({
            name: "MultiLogRecordProcessor: shutdown - should forward shutdown to processors",
            test: (): IPromise<void> => {
                const processor1 = new TestProcessor();
                const processor2 = new TestProcessor();
                const { multiProcessor } = setup([processor1, processor2]);
                const provider = new LoggerProvider({ processors: [multiProcessor] });
                const logger = provider.getLogger("default");

                logger.emit({ body: "one" });
                Assert.equal(processor1.logRecords.length, 1, "Processor1 should receive record before shutdown");
                Assert.equal(processor2.logRecords.length, 1, "Processor2 should receive record before shutdown");

                return createPromise((resolve, reject) => {
                    provider.shutdown().then(() => {
                        try {
                            Assert.equal(processor1.logRecords.length, 0, "Processor1 should clear records after provider shutdown");
                            Assert.equal(processor2.logRecords.length, 0, "Processor2 should clear records after provider shutdown");
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }).catch(reject);
                });
            }
        });
    }
}