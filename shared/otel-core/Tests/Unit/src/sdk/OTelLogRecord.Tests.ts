import { AITestClass, Assert } from "@microsoft/ai-test-framework";

import { IOTelLogRecord } from "../../../../src/interfaces/otel/logs/IOTelLogRecord";
import { createLoggerProviderSharedState } from "../../../../src/internal/LoggerProviderSharedState";
import { reconfigureLimits } from "../../../../src/otel/sdk/config";
import { createLogRecord } from "../../../../src/otel/sdk/OTelLogRecord";
import { IOTelLogRecordLimits } from "../../../../src/interfaces/otel/logs/IOTelLogRecordLimits";

const setup = (logRecordLimits?: IOTelLogRecordLimits, data?: IOTelLogRecord) => {
    const instrumentationScope = {
        name: "test name",
        version: "test version",
        schemaUrl: "test schema url"
    };
    const sharedState = createLoggerProviderSharedState(
        undefined as any,
        Infinity,
        reconfigureLimits(logRecordLimits ?? {}),
        []
    );
    const logRecord = createLogRecord(
        sharedState,
        instrumentationScope,
        data ?? {}
    );
    return { logRecord, instrumentationScope };
};

export class OTelLogRecordTests extends AITestClass {
    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {
        this.testCase({
            name: "LogRecord: constructor - should create an instance",
            test: () => {
                const { logRecord } = setup();
                Assert.ok(logRecord && typeof logRecord === "object", "LogRecord should be created");
            }
        });

        this.testCase({
            name: "LogRecord: constructor - should have a default timestamp",
            test: () => {
                const { logRecord } = setup();
                Assert.ok(logRecord.hrTime !== undefined, "hrTime should be defined");
                Assert.ok(logRecord.hrTime[0] > 0 || logRecord.hrTime[1] > 0, "hrTime should be set");
            }
        });

        this.testCase({
            name: "LogRecord: setAttribute - should set an attribute",
            test: () => {
                const { logRecord } = setup();
                const testAttrs = { test: "value" };
                for (const [k, v] of Object.entries(testAttrs)) {
                    logRecord.setAttribute(k, v);
                }
                Assert.equal(logRecord.attributes["test"], "value", "Attribute should be set");
            }
        });

        this.testCase({
            name: "LogRecord: setAttribute - should be able to overwrite attributes",
            test: () => {
                const { logRecord } = setup();
                logRecord.setAttribute("overwrite", "initial value");
                logRecord.setAttribute("overwrite", "overwritten value");
                Assert.equal(logRecord.attributes["overwrite"], "overwritten value", "Attribute should be overwritten");
            }
        });

        this.testCase({
            name: "LogRecord: setAttribute with attributeCountLimit - should remove / drop all remaining values after the number of values exceeds this limit",
            test: () => {
                const { logRecord } = setup({ attributeCountLimit: 100 });
                for (let i = 0; i < 150; i++) {
                    let attributeValue;
                    switch (i % 3) {
                    case 0: {
                        attributeValue = `bar${i}`;
                        break;
                    }
                    case 1: {
                        attributeValue = [`bar${i}`];
                        break;
                    }
                    case 2: {
                        attributeValue = {
                            bar: `bar${i}`
                        };
                        break;
                    }
                    default: {
                        attributeValue = `bar${i}`;
                    }
                    }
                    logRecord.setAttribute(`foo${i}`, attributeValue);
                }
                const { attributes, droppedAttributesCount } = logRecord;
                Assert.equal(Object.keys(attributes).length, 100, "Should have 100 attributes");
                Assert.equal(attributes.foo0, "bar0", "foo0 should be bar0");
                Assert.deepEqual(attributes.foo98, { bar: "bar98" }, "foo98 should match");
                Assert.equal(attributes.foo147, "bar147", "foo147 should be bar147");
                Assert.equal(attributes.foo148, undefined, "foo148 should be undefined");
                Assert.deepEqual(attributes.foo149, { bar: "bar149" }, "foo149 should match");
            }
        });

        this.testCase({
            name: "LogRecord: setAttributes - should be able to set multiple attributes",
            test: () => {
                const { logRecord } = setup();
                const attrs = { attr1: "value1", attr2: "value2" };
                logRecord.setAttributes(attrs as any);
                Assert.equal(logRecord.attributes["attr1"], "value1", "attr1 should be set");
                Assert.equal(logRecord.attributes["attr2"], "value2", "attr2 should be set");
            }
        });

        this.testCase({
            name: "LogRecord: setAttribute with attributeValueLengthLimit - should truncate value which length exceeds this limit",
            test: () => {
                const { logRecord } = setup({ attributeValueLengthLimit: 5 });
                logRecord.setAttribute("attr-with-more-length", "abcdefgh");
                Assert.equal(logRecord.attributes["attr-with-more-length"], "abcde", "Value should be truncated");
            }
        });

        this.testCase({
            name: "LogRecord: should not truncate value which length not exceeds this limit",
            test: () => {
                const { logRecord } = setup({ attributeValueLengthLimit: 5 });
                logRecord.setAttribute("attr-with-less-length", "abc");
                Assert.equal(logRecord.attributes["attr-with-less-length"], "abc", "Value should not be truncated");
            }
        });

        this.testCase({
            name: "LogRecord: should rewrite body directly through the property method",
            test: () => {
                const logRecordData: IOTelLogRecord = {
                    body: "this is a body"
                };
                const { logRecord } = setup(undefined, logRecordData);
                const newBody = "this is a new body";
                logRecord.setBody(newBody);
                Assert.equal(logRecord.body, newBody, "Body should be updated");
            }
        });

        this.testCase({
            name: "LogRecord: should rewrite using the set method",
            test: () => {
                const logRecordData: IOTelLogRecord = {
                    body: "this is a body"
                };
                const { logRecord } = setup(undefined, logRecordData);
                const newBody = "this is a new body";
                logRecord.setBody(newBody);
                Assert.equal(logRecord.body, newBody, "Body should be updated");
            }
        });

        this.testCase({
            name: "LogRecord: should not rewrite directly through the property method after makeReadonly",
            test: () => {
                const logRecordData: IOTelLogRecord = {
                    body: "this is a body"
                };
                const { logRecord } = setup(undefined, logRecordData);
                logRecord._makeReadonly();
                const newBody = "this is a new body";
                logRecord.setBody(newBody);
                Assert.equal(logRecord.body, logRecordData.body, "Body should not be changed after makeReadonly");
            }
        });
    }
}
