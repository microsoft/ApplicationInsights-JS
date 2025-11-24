import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { createPromise, IPromise } from "@nevware21/ts-async";

import { NoopLogger } from "../../../../src/api/noop/noopLogger";
import { IOTelAttributes } from "../../../../src/interfaces/IOTelAttributes";
import { NoopLogRecordProcessor } from "../../../../src/interfaces/logs/IOTelNoopLogRecordProcessor";
import { LoggerProviderSharedState } from "../../../../src/internal/LoggerProviderSharedState";
import { DEFAULT_LOGGER_NAME, LoggerProvider } from "../../../../src/sdk/IOTelLoggerProvider";
import { Logger } from "../../../../src/sdk/IOTelLogger";
import { MultiLogRecordProcessor } from "../../../../src/sdk/IOTelMultiLogRecordProcessor";
import { loadDefaultConfig } from "../../../../src/sdk/config";
import { IOTelResource, OTelRawResourceAttribute } from "../../../../src/interfaces/resources/IOTelResource";

export class IOTelLoggerProviderTests extends AITestClass {
    public testInitialize() {
        super.testInitialize();
        // No global OpenTelemetry APIs are mutated by LoggerProvider, so no global stubs required here.
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {
        this.testCase({
            name: "LoggerProvider: constructor without options should construct an instance",
            test: () => {
                const provider = new LoggerProvider();
                Assert.ok(provider instanceof LoggerProvider, "Should construct a LoggerProvider instance");
            }
        });

        this.testCase({
            name: "LoggerProvider: constructor without options should use noop processor by default",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                Assert.ok(sharedState.activeProcessor instanceof NoopLogRecordProcessor, "Expected the default processor to be NoopLogRecordProcessor");
            }
        });

        this.testCase({
            name: "LoggerProvider: constructor should register provided processors",
            test: () => {
                const logRecordProcessor = new NoopLogRecordProcessor();
                const provider = new LoggerProvider({
                    processors: [logRecordProcessor]
                });
                const sharedState = this._getSharedState(provider);
                const activeProcessor = sharedState.activeProcessor as MultiLogRecordProcessor;
                Assert.ok(activeProcessor instanceof MultiLogRecordProcessor, "Expected MultiLogRecordProcessor to be active when processors are provided");
                Assert.equal(activeProcessor.processors.length, 1, "Should register one processor");
                Assert.equal(activeProcessor.processors[0], logRecordProcessor, "Should use the provided processor instance");
            }
        });

        this.testCase({
            name: "LoggerProvider: constructor should use default resource when not provided",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                const resource = sharedState.resource;
                Assert.ok(!!resource, "Should have a resource available");
                Assert.deepEqual(resource.attributes || {}, {} as IOTelAttributes, "Should default resource attributes to empty object");
            }
        });

        this.testCase({
            name: "LoggerProvider: constructor should honor provided resource",
            test: () => {
                const passedInResource = this._createTestResource({ foo: "bar" });
                const provider = new LoggerProvider({
                    resource: passedInResource
                });
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.resource, passedInResource, "Should use the provided resource instance");
            }
        });

        this.testCase({
            name: "LoggerProvider: constructor should use default forceFlushTimeoutMillis when omitted",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.forceFlushTimeoutMillis, loadDefaultConfig().forceFlushTimeoutMillis, "Should use default forceFlush timeout");
            }
        });

        this.testCase({
            name: "LoggerProvider: logRecordLimits should default values when not provided",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                Assert.deepEqual(sharedState.logRecordLimits, {
                    attributeCountLimit: 128,
                    attributeValueLengthLimit: Infinity
                }, "Should use default logRecord limits");
            }
        });

        this.testCase({
            name: "LoggerProvider: logRecordLimits should respect provided attributeCountLimit",
            test: () => {
                const provider = new LoggerProvider({
                    logRecordLimits: {
                        attributeCountLimit: 100
                    }
                });
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.logRecordLimits.attributeCountLimit, 100, "Should use provided attributeCountLimit");
            }
        });

        this.testCase({
            name: "LoggerProvider: logRecordLimits should respect provided attributeValueLengthLimit",
            test: () => {
                const provider = new LoggerProvider({
                    logRecordLimits: {
                        attributeValueLengthLimit: 10
                    }
                });
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.logRecordLimits.attributeValueLengthLimit, 10, "Should use provided attributeValueLengthLimit");
            }
        });

        this.testCase({
            name: "LoggerProvider: logRecordLimits should allow negative attributeValueLengthLimit",
            test: () => {
                const provider = new LoggerProvider({
                    logRecordLimits: {
                        attributeValueLengthLimit: -10
                    }
                });
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.logRecordLimits.attributeValueLengthLimit, -10, "Should preserve provided negative attributeValueLengthLimit");
            }
        });

        this.testCase({
            name: "LoggerProvider: logRecordLimits should use default attributeValueLengthLimit when omitted",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.logRecordLimits.attributeValueLengthLimit, Infinity, "Should default attributeValueLengthLimit to Infinity");
            }
        });

        this.testCase({
            name: "LoggerProvider: logRecordLimits should use default attributeCountLimit when omitted",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.logRecordLimits.attributeCountLimit, 128, "Should default attributeCountLimit to 128");
            }
        });

        this.testCase({
            name: "LoggerProvider: getLogger should default name when invalid",
            test: () => {
                const provider = new LoggerProvider();
                const logger = provider.getLogger("") as Logger;
                Assert.equal(logger.instrumentationScope.name, DEFAULT_LOGGER_NAME, "Should use default logger name when name is invalid");
            }
        });

        this.testCase({
            name: "LoggerProvider: getLogger should create new logger when name not seen",
            test: () => {
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);
                Assert.equal(sharedState.loggers.size, 0, "Should start with no loggers");
                provider.getLogger("test name");
                Assert.equal(sharedState.loggers.size, 1, "Should register logger for new name");
            }
        });

        this.testCase({
            name: "LoggerProvider: getLogger should create unique loggers per scope",
            test: () => {
                const testName = "test name";
                const testVersion = "test version";
                const testSchemaUrl = "test schema url";
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);

                Assert.equal(sharedState.loggers.size, 0, "Should start with no loggers");
                provider.getLogger(testName);
                Assert.equal(sharedState.loggers.size, 1, "Should add logger for name only");
                provider.getLogger(testName, testVersion);
                Assert.equal(sharedState.loggers.size, 2, "Should add logger for name and version");
                provider.getLogger(testName, testVersion, { schemaUrl: testSchemaUrl });
                Assert.equal(sharedState.loggers.size, 3, "Should add logger for name, version, and schemaUrl");
            }
        });

        this.testCase({
            name: "LoggerProvider: getLogger should reuse logger when scope matches",
            test: () => {
                const testName = "test name";
                const testVersion = "test version";
                const testSchemaUrl = "test schema url";
                const provider = new LoggerProvider();
                const sharedState = this._getSharedState(provider);

                Assert.equal(sharedState.loggers.size, 0, "Should start with no loggers");
                provider.getLogger(testName);
                Assert.equal(sharedState.loggers.size, 1, "Should add first logger");
                const logger1 = provider.getLogger(testName, testVersion, { schemaUrl: testSchemaUrl });
                Assert.equal(sharedState.loggers.size, 2, "Should add scoped logger");
                const logger2 = provider.getLogger(testName, testVersion, { schemaUrl: testSchemaUrl });
                Assert.equal(sharedState.loggers.size, 2, "Should not add duplicate scoped logger");
                Assert.ok(logger2 instanceof Logger, "Should return a Logger instance");
                Assert.equal(logger1, logger2, "Should reuse existing scoped logger");
            }
        });

        this.testCase({
            name: "LoggerProvider: forceFlush should invoke all registered processors",
            test: (): IPromise<void> => {
                const forceFlushStub = this.sandbox.stub(NoopLogRecordProcessor.prototype, "forceFlush").resolves();
                const provider = new LoggerProvider({
                    processors: [new NoopLogRecordProcessor(), new NoopLogRecordProcessor()]
                });

                return createPromise((resolve, reject) => {
                    provider.forceFlush().then(() => {
                        try {
                            Assert.equal(forceFlushStub.callCount, 2, "Should call forceFlush on each processor");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "LoggerProvider: forceFlush should propagate processor errors",
            test: (): IPromise<void> => {
                const forceFlushStub = this.sandbox.stub(NoopLogRecordProcessor.prototype, "forceFlush").rejects("Error");
                const provider = new LoggerProvider({
                    processors: [new NoopLogRecordProcessor(), new NoopLogRecordProcessor()]
                });

                return createPromise((resolve, reject) => {
                    provider.forceFlush().then(() => {
                        reject(new Error("Successful forceFlush not expected"));
                    }).catch(() => {
                        try {
                            Assert.equal(forceFlushStub.callCount, 2, "Should attempt to forceFlush each processor even when errors occur");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
            }
        });

        this.testCase({
            name: "LoggerProvider: shutdown should invoke processor shutdown",
            test: (): IPromise<void> => {
                const processor = new NoopLogRecordProcessor();
                const shutdownStub = this.sandbox.stub(processor, "shutdown").resolves();
                const provider = new LoggerProvider({ processors: [processor] });

                return createPromise((resolve, reject) => {
                    provider.shutdown().then(() => {
                        try {
                            Assert.equal(shutdownStub.callCount, 1, "Should call shutdown on processor once");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "LoggerProvider: shutdown should return noop logger for new requests",
            test: (): IPromise<void> => {
                const provider = new LoggerProvider();
                return createPromise((resolve, reject) => {
                    provider.shutdown().then(() => {
                        try {
                            const logger = provider.getLogger("default", "1.0.0");
                            Assert.ok(logger instanceof NoopLogger, "Logger should be NoopLogger after shutdown");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "LoggerProvider: forceFlush after shutdown should not call processors",
            test: (): IPromise<void> => {
                const logRecordProcessor = new NoopLogRecordProcessor();
                const provider = new LoggerProvider({ processors: [logRecordProcessor] });
                const forceFlushStub = this.sandbox.stub(logRecordProcessor, "forceFlush").resolves();
                const warnStub = this.sandbox.stub(console, "warn");

                return createPromise((resolve, reject) => {
                    provider.shutdown().then(() => {
                        provider.forceFlush().then(() => {
                            try {
                                Assert.equal(forceFlushStub.callCount, 0, "forceFlush should not be called after shutdown");
                                Assert.equal(warnStub.callCount, 1, "Should emit a warning when forceFlush is called post-shutdown");
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }).catch(reject);
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "LoggerProvider: second shutdown should not re-run processor shutdown",
            test: (): IPromise<void> => {
                const logRecordProcessor = new NoopLogRecordProcessor();
                const provider = new LoggerProvider({ processors: [logRecordProcessor] });
                const shutdownStub = this.sandbox.stub(logRecordProcessor, "shutdown").resolves();
                const warnStub = this.sandbox.stub(console, "warn");

                return createPromise((resolve, reject) => {
                    provider.shutdown().then(() => {
                        provider.shutdown().then(() => {
                            try {
                                Assert.equal(shutdownStub.callCount, 1, "Processor shutdown should only be called once");
                                Assert.equal(warnStub.callCount, 1, "Should warn on repeated shutdown calls");
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }).catch(reject);
                    }).catch(reject);
                });
            }
        });
    }

    private _getSharedState(provider: LoggerProvider): LoggerProviderSharedState {
        return (provider as unknown as { _sharedState: LoggerProviderSharedState })._sharedState;
    }

    private _createTestResource(attributes: IOTelAttributes = {} as IOTelAttributes): IOTelResource {
        const resourceAttributes: IOTelAttributes = {} as IOTelAttributes;
        const rawAttributes: OTelRawResourceAttribute[] = [];
        for (const key in attributes) {
            if (Object.prototype.hasOwnProperty.call(attributes, key)) {
                resourceAttributes[key] = attributes[key];
                rawAttributes.push([key, attributes[key]]);
            }
        }

        const resource: IOTelResource = {
            attributes: resourceAttributes,
            merge: () => resource,
            getRawAttributes: () => rawAttributes
        };

        return resource;
    }
}