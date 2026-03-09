import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { createPromise, IPromise } from "@nevware21/ts-async";

import { createOTelWebSdk } from "../../../../src/otel/sdk/OTelWebSdk";
import { IOTelWebSdkConfig } from "../../../../src/interfaces/otel/config/IOTelWebSdkConfig";
import { IOTelWebSdk } from "../../../../src/interfaces/otel/IOTelWebSdk";
import { IOTelErrorHandlers } from "../../../../src/interfaces/otel/config/IOTelErrorHandlers";
import { IOTelResource, OTelRawResourceAttribute } from "../../../../src/interfaces/otel/resources/IOTelResource";
import { IOTelContextManager } from "../../../../src/interfaces/otel/context/IOTelContextManager";
import { IOTelIdGenerator } from "../../../../src/interfaces/otel/trace/IOTelIdGenerator";
import { IOTelSampler } from "../../../../src/interfaces/otel/trace/IOTelSampler";
import { IOTelLogRecordProcessor } from "../../../../src/interfaces/otel/logs/IOTelLogRecordProcessor";
import { IOTelAttributes } from "../../../../src/interfaces/otel/IOTelAttributes";
import { createResolvedPromise } from "@nevware21/ts-async";
import { createContext } from "../../../../src/otel/api/context/context";
import { eOTelSamplingDecision } from "../../../../src/enums/otel/OTelSamplingDecision";
import { eOTelSpanKind } from "../../../../src/enums/otel/OTelSpanKind";
import { eW3CTraceFlags } from "../../../../src/enums/W3CTraceFlags";
import { IOTelSamplingResult } from "../../../../src/interfaces/otel/trace/IOTelSamplingResult";
import { createContextManager } from "../../../../src/otel/api/context/contextManager";
import { IReadableSpan } from "../../../../src/interfaces/otel/trace/IReadableSpan";

export class OTelWebSdkTests extends AITestClass {
    private _sdk: IOTelWebSdk | null = null;

    public testInitialize() {
        super.testInitialize();
        this._sdk = null;
    }

    public testCleanup() {
        if (this._sdk) {
            this._sdk.shutdown();
            this._sdk = null;
        }
        super.testCleanup();
    }

    public registerTests() {
        this._registerConstructionTests();
        this._registerValidationTests();
        this._registerTracerTests();
        this._registerSpanCreationTests();
        this._registerStartActiveSpanTests();
        this._registerSamplingTests();
        this._registerLoggerTests();
        this._registerShutdownTests();
        this._registerForceFlushTests();
        this._registerConfigTests();
    }

    private _registerConstructionTests(): void {
        this.testCase({
            name: "OTelWebSdk: createOTelWebSdk should create an instance with valid config",
            test: () => {
                let config = this._createValidConfig();
                this._sdk = createOTelWebSdk(config);
                Assert.ok(this._sdk, "SDK instance should be created");
                Assert.equal(typeof this._sdk.getTracer, "function", "Should have getTracer method");
                Assert.equal(typeof this._sdk.getLogger, "function", "Should have getLogger method");
                Assert.equal(typeof this._sdk.forceFlush, "function", "Should have forceFlush method");
                Assert.equal(typeof this._sdk.shutdown, "function", "Should have shutdown method");
                Assert.equal(typeof this._sdk.getConfig, "function", "Should have getConfig method");
            }
        });

        this.testCase({
            name: "OTelWebSdk: should support multiple independent instances",
            test: () => {
                let config1 = this._createValidConfig();
                let config2 = this._createValidConfig();
                let sdk1 = createOTelWebSdk(config1);
                let sdk2 = createOTelWebSdk(config2);

                Assert.ok(sdk1, "First SDK instance should be created");
                Assert.ok(sdk2, "Second SDK instance should be created");
                Assert.notEqual(sdk1, sdk2, "SDK instances should be different objects");

                // Each can provide independent tracers
                let tracer1 = sdk1.getTracer("service-a");
                let tracer2 = sdk2.getTracer("service-b");
                Assert.ok(tracer1, "First SDK should provide a tracer");
                Assert.ok(tracer2, "Second SDK should provide a tracer");

                sdk1.shutdown();
                sdk2.shutdown();
            }
        });
    }

    private _registerValidationTests(): void {
        this.testCase({
            name: "OTelWebSdk: should call error handler when resource is missing",
            test: () => {
                let errorCalled = false;
                let config = this._createValidConfig();
                config.errorHandlers = {
                    error: function (msg) {
                        errorCalled = true;
                    }
                };
                (config as any).resource = null;
                this._sdk = createOTelWebSdk(config);
                Assert.ok(errorCalled, "Error handler should be called for missing resource");
            }
        });

        this.testCase({
            name: "OTelWebSdk: should call error handler when contextManager is missing",
            test: () => {
                let errorCalled = false;
                let config = this._createValidConfig();
                config.errorHandlers = {
                    error: function (msg) {
                        errorCalled = true;
                    }
                };
                (config as any).contextManager = null;
                this._sdk = createOTelWebSdk(config);
                Assert.ok(errorCalled, "Error handler should be called for missing contextManager");
            }
        });

        this.testCase({
            name: "OTelWebSdk: should call error handler when idGenerator is missing",
            test: () => {
                let errorCalled = false;
                let config = this._createValidConfig();
                config.errorHandlers = {
                    error: function (msg) {
                        errorCalled = true;
                    }
                };
                (config as any).idGenerator = null;
                this._sdk = createOTelWebSdk(config);
                Assert.ok(errorCalled, "Error handler should be called for missing idGenerator");
            }
        });

        this.testCase({
            name: "OTelWebSdk: should call error handler when sampler is missing",
            test: () => {
                let errorCalled = false;
                let config = this._createValidConfig();
                config.errorHandlers = {
                    error: function (msg) {
                        errorCalled = true;
                    }
                };
                (config as any).sampler = null;
                this._sdk = createOTelWebSdk(config);
                Assert.ok(errorCalled, "Error handler should be called for missing sampler");
            }
        });

        this.testCase({
            name: "OTelWebSdk: should call error handler when performanceNow is missing",
            test: () => {
                let errorCalled = false;
                let config = this._createValidConfig();
                config.errorHandlers = {
                    error: function (msg) {
                        errorCalled = true;
                    }
                };
                (config as any).performanceNow = null;
                this._sdk = createOTelWebSdk(config);
                Assert.ok(errorCalled, "Error handler should be called for missing performanceNow");
            }
        });

        this.testCase({
            name: "OTelWebSdk: should warn when errorHandlers are missing",
            test: () => {
                let warnCalled = false;
                let origWarn = console.warn;
                console.warn = function () {
                    warnCalled = true;
                };
                try {
                    let config = this._createValidConfig();
                    (config as any).errorHandlers = null;
                    this._sdk = createOTelWebSdk(config);
                    Assert.ok(warnCalled, "Should warn about missing errorHandlers");
                } finally {
                    console.warn = origWarn;
                }
            }
        });
    }

    private _registerTracerTests(): void {
        this.testCase({
            name: "OTelWebSdk: getTracer should return a tracer instance",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                Assert.ok(tracer, "Should return a tracer");
                Assert.equal(typeof tracer.startSpan, "function", "Tracer should have startSpan method");
                Assert.equal(typeof tracer.startActiveSpan, "function", "Tracer should have startActiveSpan method");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getTracer should cache tracers by name",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer1 = this._sdk.getTracer("test-tracer");
                let tracer2 = this._sdk.getTracer("test-tracer");
                Assert.equal(tracer1, tracer2, "Same name should return same tracer instance");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getTracer should cache tracers by name and version",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer1 = this._sdk.getTracer("test-tracer", "1.0.0");
                let tracer2 = this._sdk.getTracer("test-tracer", "1.0.0");
                let tracer3 = this._sdk.getTracer("test-tracer", "2.0.0");
                Assert.equal(tracer1, tracer2, "Same name and version should return same tracer instance");
                Assert.notEqual(tracer1, tracer3, "Different versions should return different tracer instances");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getTracer should return different tracers for different names",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer1 = this._sdk.getTracer("service-a");
                let tracer2 = this._sdk.getTracer("service-b");
                Assert.notEqual(tracer1, tracer2, "Different names should return different tracer instances");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getTracer should handle schemaUrl in options",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer1 = this._sdk.getTracer("test-tracer", "1.0.0", { schemaUrl: "https://example.com/v1" });
                let tracer2 = this._sdk.getTracer("test-tracer", "1.0.0", { schemaUrl: "https://example.com/v2" });
                let tracer3 = this._sdk.getTracer("test-tracer", "1.0.0", { schemaUrl: "https://example.com/v1" });
                Assert.notEqual(tracer1, tracer2, "Different schemaUrls should return different tracers");
                Assert.equal(tracer1, tracer3, "Same schemaUrl should return same tracer");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getTracer should use 'unknown' for empty name",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("");
                Assert.ok(tracer, "Should return a tracer even for empty name");
            }
        });
    }

    private _registerSpanCreationTests(): void {
        this.testCase({
            name: "OTelWebSdk: startSpan should create a functional span",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer", "1.0.0");
                let result = tracer.startSpan("test-operation");
                Assert.ok(result, "startSpan should return a span (not null)");

                let span = result as IReadableSpan;
                Assert.equal(span.name, "test-operation", "Span name should match");
                Assert.equal(typeof span.spanContext, "function", "Span should have spanContext method");
                Assert.equal(typeof span.setAttribute, "function", "Span should have setAttribute method");
                Assert.equal(typeof span.setAttributes, "function", "Span should have setAttributes method");
                Assert.equal(typeof span.setStatus, "function", "Span should have setStatus method");
                Assert.equal(typeof span.end, "function", "Span should have end method");
                Assert.equal(typeof span.isRecording, "function", "Span should have isRecording method");
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should generate valid trace and span IDs",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                let spanContext = span.spanContext();
                Assert.ok(spanContext, "Span should have a spanContext");
                Assert.ok(spanContext.traceId, "Span context should have a traceId");
                Assert.ok(spanContext.spanId, "Span context should have a spanId");
                Assert.equal(spanContext.traceId.length, 32, "traceId should be 32 hex chars");
                Assert.equal(spanContext.spanId.length, 16, "spanId should be 16 hex chars");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should create recording spans with AlwaysOn sampler",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.ok(span.isRecording(), "Span should be recording with AlwaysOn sampler");
                Assert.equal(span.spanContext().traceFlags, eW3CTraceFlags.Sampled, "Trace flags should indicate sampled");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should set span kind from options",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation", {
                    kind: eOTelSpanKind.CLIENT
                }) as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.equal(span.kind, eOTelSpanKind.CLIENT, "Span kind should match options");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should default to INTERNAL span kind",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.equal(span.kind, eOTelSpanKind.INTERNAL, "Default span kind should be INTERNAL");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should set attributes from options",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation", {
                    attributes: { "key1": "value1", "key2": 42 }
                }) as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.ok(span.attributes, "Span should have attributes");
                Assert.equal(span.attributes["key1"], "value1", "Should have key1 attribute");
                Assert.equal(span.attributes["key2"], 42, "Should have key2 attribute");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should support setAttribute after creation",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                span.setAttribute("dynamic.key", "dynamic.value");
                Assert.equal(span.attributes["dynamic.key"], "dynamic.value", "Should have dynamically set attribute");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should create different spans with different IDs",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span1 = tracer.startSpan("operation-1") as IReadableSpan;
                let span2 = tracer.startSpan("operation-2") as IReadableSpan;
                Assert.ok(span1, "Span 1 should not be null");
                Assert.ok(span2, "Span 2 should not be null");

                Assert.notEqual(
                    span1.spanContext().spanId,
                    span2.spanContext().spanId,
                    "Different spans should have different spanIds"
                );

                span1.end();
                span2.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan with root option should create new trace",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span1 = tracer.startSpan("root-1") as IReadableSpan;
                let span2 = tracer.startSpan("root-2", { root: true }) as IReadableSpan;
                Assert.ok(span1, "Span 1 should not be null");
                Assert.ok(span2, "Span 2 should not be null");

                // Both are root spans (no active context), so they both get new traceIds
                let traceId1 = span1.spanContext().traceId;
                let traceId2 = span2.spanContext().traceId;

                Assert.ok(traceId1, "First span should have a traceId");
                Assert.ok(traceId2, "Second span should have a traceId");
                Assert.notEqual(traceId1, traceId2, "Root spans should have different traceIds");

                span1.end();
                span2.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: span end should mark span as ended",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.ok(span.isRecording(), "Span should be recording before end");
                Assert.ok(!span.ended, "Span should not be ended before end()");

                span.end();

                Assert.ok(!span.isRecording(), "Span should not be recording after end");
                Assert.ok(span.ended, "Span should be ended after end()");
            }
        });

        this.testCase({
            name: "OTelWebSdk: startSpan should return null after shutdown",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        try {
                            let tracer = sdk.getTracer("test");
                            let span = tracer.startSpan("test-span");
                            Assert.equal(span, null, "startSpan after shutdown should return null");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });
    }

    private _registerStartActiveSpanTests(): void {
        this.testCase({
            name: "OTelWebSdk: startActiveSpan should execute callback with span",
            test: () => {
                let config = this._createValidConfig();
                config.contextManager = createContextManager();
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let callbackExecuted = false;

                tracer.startActiveSpan("active-operation", function (span) {
                    callbackExecuted = true;
                    Assert.ok(span, "Callback should receive a span");
                    let readable = span as IReadableSpan;
                    Assert.equal(readable.name, "active-operation", "Span name should match");
                    Assert.ok(span.isRecording(), "Span should be recording");
                    span.end();
                });

                Assert.ok(callbackExecuted, "Callback should have been executed");
            }
        });

        this.testCase({
            name: "OTelWebSdk: startActiveSpan should return callback result",
            test: () => {
                let config = this._createValidConfig();
                config.contextManager = createContextManager();
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");

                let result = tracer.startActiveSpan("active-operation", function (span) {
                    span.end();
                    return 42;
                });

                Assert.equal(result, 42, "Should return the callback result");
            }
        });

        this.testCase({
            name: "OTelWebSdk: startActiveSpan with options should pass options to span",
            test: () => {
                let config = this._createValidConfig();
                config.contextManager = createContextManager();
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");

                tracer.startActiveSpan("active-operation", { kind: eOTelSpanKind.SERVER }, function (span) {
                    let readable = span as IReadableSpan;
                    Assert.equal(readable.kind, eOTelSpanKind.SERVER, "Span should have the specified kind");
                    span.end();
                });
            }
        });

        this.testCase({
            name: "OTelWebSdk: startActiveSpan should set span as parent for nested spans",
            test: () => {
                let config = this._createValidConfig();
                config.contextManager = createContextManager();
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let parentTraceId: string = "";
                let childTraceId: string = "";
                let childParentSpanId: string = "";
                let parentSpanId: string = "";

                tracer.startActiveSpan("parent-operation", function (parentSpan) {
                    parentTraceId = parentSpan.spanContext().traceId;
                    parentSpanId = parentSpan.spanContext().spanId;

                    // Create a child span while parent is active
                    let childResult = tracer.startSpan("child-operation");
                    Assert.ok(childResult, "Child span should not be null");
                    let childSpan = childResult as IReadableSpan;
                    childTraceId = childSpan.spanContext().traceId;
                    childParentSpanId = childSpan.parentSpanId || "";

                    childSpan.end();
                    parentSpan.end();
                });

                Assert.equal(childTraceId, parentTraceId, "Child should inherit parent's traceId");
                Assert.equal(childParentSpanId, parentSpanId, "Child's parentSpanId should be parent's spanId");
            }
        });

        this.testCase({
            name: "OTelWebSdk: nested startActiveSpan should create proper hierarchy",
            test: () => {
                let config = this._createValidConfig();
                config.contextManager = createContextManager();
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let grandparentSpanId: string = "";
                let parentSpanId: string = "";
                let childParentSpanId: string = "";
                let traceId: string = "";

                tracer.startActiveSpan("grandparent", function (gp) {
                    traceId = gp.spanContext().traceId;
                    grandparentSpanId = gp.spanContext().spanId;

                    tracer.startActiveSpan("parent", function (parent) {
                        let parentReadable = parent as IReadableSpan;
                        parentSpanId = parent.spanContext().spanId;
                        Assert.equal(
                            parent.spanContext().traceId, traceId,
                            "Parent should share grandparent's traceId"
                        );
                        Assert.equal(
                            parentReadable.parentSpanId, grandparentSpanId,
                            "Parent's parentSpanId should be grandparent's spanId"
                        );

                        let childResult = tracer.startSpan("child");
                        Assert.ok(childResult, "Child span should not be null");
                        let child = childResult as IReadableSpan;
                        childParentSpanId = child.parentSpanId || "";
                        Assert.equal(
                            child.spanContext().traceId, traceId,
                            "Child should share the same traceId"
                        );

                        child.end();
                        parent.end();
                    });

                    gp.end();
                });

                Assert.equal(childParentSpanId, parentSpanId, "Child's parent should be the active parent span");
            }
        });
    }

    private _registerSamplingTests(): void {
        this.testCase({
            name: "OTelWebSdk: NOT_RECORD sampler should create non-recording spans",
            test: () => {
                let config = this._createValidConfig();
                config.sampler = {
                    shouldSample: function (): IOTelSamplingResult {
                        return { decision: eOTelSamplingDecision.NOT_RECORD };
                    },
                    toString: function () { return "NeverSampler"; }
                };
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should still be created (non-recording)");

                Assert.ok(!span.isRecording(), "Span should NOT be recording with NOT_RECORD decision");
                Assert.equal(span.spanContext().traceFlags, eW3CTraceFlags.None, "Trace flags should be None");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: RECORD sampler should create recording but not sampled spans",
            test: () => {
                let config = this._createValidConfig();
                config.sampler = {
                    shouldSample: function (): IOTelSamplingResult {
                        return { decision: eOTelSamplingDecision.RECORD };
                    },
                    toString: function () { return "RecordOnlySampler"; }
                };
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.ok(span.isRecording(), "Span should be recording with RECORD decision");
                Assert.equal(span.spanContext().traceFlags, eW3CTraceFlags.None, "Trace flags should be None (not sampled)");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: RECORD_AND_SAMPLED sampler should create sampled spans",
            test: () => {
                let config = this._createValidConfig();
                config.sampler = {
                    shouldSample: function (): IOTelSamplingResult {
                        return { decision: eOTelSamplingDecision.RECORD_AND_SAMPLED };
                    },
                    toString: function () { return "AlwaysOnSampler"; }
                };
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation") as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.ok(span.isRecording(), "Span should be recording");
                Assert.equal(span.spanContext().traceFlags, eW3CTraceFlags.Sampled, "Trace flags should indicate sampled");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: sampler should receive span name and kind",
            test: () => {
                let receivedSpanName: string = "";
                let receivedSpanKind: number = -1;
                let config = this._createValidConfig();
                config.sampler = {
                    shouldSample: function (_ctx: any, _traceId: string, spanName: string, spanKind: number): IOTelSamplingResult {
                        receivedSpanName = spanName;
                        receivedSpanKind = spanKind;
                        return { decision: eOTelSamplingDecision.RECORD_AND_SAMPLED };
                    },
                    toString: function () { return "TestSampler"; }
                };
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("my-operation", { kind: eOTelSpanKind.SERVER }) as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.equal(receivedSpanName, "my-operation", "Sampler should receive the span name");
                Assert.equal(receivedSpanKind, eOTelSpanKind.SERVER, "Sampler should receive the span kind");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: sampler-provided attributes should be merged into span",
            test: () => {
                let config = this._createValidConfig();
                config.sampler = {
                    shouldSample: function (): IOTelSamplingResult {
                        return {
                            decision: eOTelSamplingDecision.RECORD_AND_SAMPLED,
                            attributes: { "sampler.key": "sampler.value" }
                        };
                    },
                    toString: function () { return "AttributeSampler"; }
                };
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation", {
                    attributes: { "user.key": "user.value" }
                }) as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.equal(span.attributes["sampler.key"], "sampler.value", "Should include sampler attribute");
                Assert.equal(span.attributes["user.key"], "user.value", "Should include user attribute");

                span.end();
            }
        });

        this.testCase({
            name: "OTelWebSdk: user attributes should override sampler attributes",
            test: () => {
                let config = this._createValidConfig();
                config.sampler = {
                    shouldSample: function (): IOTelSamplingResult {
                        return {
                            decision: eOTelSamplingDecision.RECORD_AND_SAMPLED,
                            attributes: { "shared.key": "sampler-wins" }
                        };
                    },
                    toString: function () { return "OverrideSampler"; }
                };
                this._sdk = createOTelWebSdk(config);
                let tracer = this._sdk.getTracer("test-tracer");
                let span = tracer.startSpan("test-operation", {
                    attributes: { "shared.key": "user-wins" }
                }) as IReadableSpan;
                Assert.ok(span, "Span should not be null");

                Assert.equal(span.attributes["shared.key"], "user-wins", "User attributes should override sampler attributes");

                span.end();
            }
        });
    }

    private _registerLoggerTests(): void {
        this.testCase({
            name: "OTelWebSdk: getLogger should return a logger instance",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let logger = this._sdk.getLogger("test-logger");
                Assert.ok(logger, "Should return a logger");
                Assert.equal(typeof logger.emit, "function", "Logger should have emit method");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getLogger should return loggers from the logger provider",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let logger1 = this._sdk.getLogger("test-logger", "1.0.0");
                let logger2 = this._sdk.getLogger("test-logger", "1.0.0");
                Assert.ok(logger1, "Should return first logger");
                Assert.ok(logger2, "Should return second logger");
                Assert.equal(logger1, logger2, "Same name and version should return same logger");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getLogger should return different loggers for different names",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let logger1 = this._sdk.getLogger("logger-a");
                let logger2 = this._sdk.getLogger("logger-b");
                Assert.ok(logger1, "First logger should exist");
                Assert.ok(logger2, "Second logger should exist");
                Assert.notEqual(logger1, logger2, "Different names should return different loggers");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getLogger should not throw when calling emit",
            test: () => {
                this._sdk = createOTelWebSdk(this._createValidConfig());
                let logger = this._sdk.getLogger("test-logger");
                let threw = false;
                try {
                    logger.emit({ body: "test message" });
                } catch (e) {
                    threw = true;
                }
                Assert.ok(!threw, "emit should not throw");
            }
        });
    }

    private _registerShutdownTests(): void {
        this.testCase({
            name: "OTelWebSdk: shutdown should resolve successfully",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        try {
                            Assert.ok(true, "Shutdown should resolve successfully");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "OTelWebSdk: getTracer after shutdown should return no-op tracer",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        try {
                            let tracer = sdk.getTracer("test");
                            Assert.ok(tracer, "Should return a tracer (no-op) after shutdown");
                            Assert.equal(typeof tracer.startSpan, "function", "No-op tracer should have startSpan");
                            Assert.equal(typeof tracer.startActiveSpan, "function", "No-op tracer should have startActiveSpan");
                            // Verify the no-op tracer returns null for startSpan
                            let span = tracer.startSpan("test-span");
                            Assert.equal(span, null, "No-op tracer startSpan should return null");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "OTelWebSdk: getLogger after shutdown should return no-op logger",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        try {
                            let logger = sdk.getLogger("test");
                            Assert.ok(logger, "Should return a logger (no-op) after shutdown");
                            // Verify the no-op logger does not throw
                            let threw = false;
                            try {
                                logger.emit({ body: "after shutdown" });
                            } catch (e) {
                                threw = true;
                            }
                            Assert.ok(!threw, "No-op logger emit should not throw");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "OTelWebSdk: second shutdown should resolve without error",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        sdk.shutdown().then(function () {
                            try {
                                Assert.ok(true, "Second shutdown should resolve successfully");
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
            name: "OTelWebSdk: shutdown should warn on second call",
            test: (): IPromise<void> => {
                let warnCalled = false;
                let config = this._createValidConfig();
                config.errorHandlers = {
                    warn: function () {
                        warnCalled = true;
                    }
                };
                let sdk = createOTelWebSdk(config);
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        sdk.shutdown().then(function () {
                            try {
                                Assert.ok(warnCalled, "Should warn on second shutdown call");
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

    private _registerForceFlushTests(): void {
        this.testCase({
            name: "OTelWebSdk: forceFlush should resolve successfully",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.forceFlush().then(function () {
                        try {
                            Assert.ok(true, "forceFlush should resolve successfully");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });

        this.testCase({
            name: "OTelWebSdk: forceFlush after shutdown should not throw",
            test: (): IPromise<void> => {
                let sdk = createOTelWebSdk(this._createValidConfig());
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.shutdown().then(function () {
                        sdk.forceFlush().then(function () {
                            try {
                                Assert.ok(true, "forceFlush after shutdown should resolve");
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
            name: "OTelWebSdk: forceFlush with log processors should invoke processor flush",
            test: (): IPromise<void> => {
                let flushCalled = false;
                let processor = this._createMockLogProcessor();
                processor.forceFlush = function () {
                    flushCalled = true;
                    return createResolvedPromise(undefined);
                };
                let config = this._createValidConfig();
                config.logProcessors = [processor];
                let sdk = createOTelWebSdk(config);
                this._sdk = sdk;
                return createPromise(function (resolve, reject) {
                    sdk.forceFlush().then(function () {
                        try {
                            Assert.ok(flushCalled, "forceFlush should invoke processor forceFlush");
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    }).catch(reject);
                });
            }
        });
    }

    private _registerConfigTests(): void {
        this.testCase({
            name: "OTelWebSdk: getConfig should return the config object",
            test: () => {
                let config = this._createValidConfig();
                this._sdk = createOTelWebSdk(config);
                let returnedConfig = this._sdk.getConfig();
                Assert.ok(returnedConfig, "getConfig should return a config object");
                Assert.equal(returnedConfig.resource, config.resource, "Config resource should match");
                Assert.equal(returnedConfig.contextManager, config.contextManager, "Config contextManager should match");
                Assert.equal(returnedConfig.idGenerator, config.idGenerator, "Config idGenerator should match");
                Assert.equal(returnedConfig.sampler, config.sampler, "Config sampler should match");
                Assert.equal(returnedConfig.performanceNow, config.performanceNow, "Config performanceNow should match");
            }
        });

        this.testCase({
            name: "OTelWebSdk: getConfig should return same config reference (not a copy)",
            test: () => {
                let config = this._createValidConfig();
                this._sdk = createOTelWebSdk(config);
                let returnedConfig = this._sdk.getConfig();
                Assert.equal(returnedConfig, config, "getConfig should return the same config reference");
            }
        });
    }

    // =============================
    // Helper methods
    // =============================

    private _createValidConfig(): IOTelWebSdkConfig {
        return {
            resource: this._createMockResource(),
            errorHandlers: this._createMockErrorHandlers(),
            contextManager: this._createMockContextManager(),
            idGenerator: this._createMockIdGenerator(),
            sampler: this._createMockSampler(),
            performanceNow: function () { return Date.now(); },
            logProcessors: []
        };
    }

    private _createMockResource(): IOTelResource {
        let rawAttributes: OTelRawResourceAttribute[] = [
            ["service.name", "test-service"],
            ["service.version", "1.0.0"]
        ];

        let resource: IOTelResource = {
            attributes: { "service.name": "test-service", "service.version": "1.0.0" } as IOTelAttributes,
            merge: function (other: IOTelResource) {
                return resource;
            },
            getRawAttributes: function () {
                return rawAttributes;
            }
        };

        return resource;
    }

    private _createMockErrorHandlers(): IOTelErrorHandlers {
        return {
            error: function (_msg: string) { /* noop */ },
            warn: function (_msg: string) { /* noop */ },
            debug: function (_msg: string) { /* noop */ }
        };
    }

    private _createMockContextManager(): IOTelContextManager {
        return {
            active: function () { return null as any; },
            with: function (context: any, fn: any, thisArg?: any): any {
                return fn.apply(thisArg, []);
            },
            bind: function <T>(context: any, target: T): T {
                return target;
            },
            enable: function () { return this; },
            disable: function () { return this; }
        } as IOTelContextManager;
    }

    private _createMockIdGenerator(): IOTelIdGenerator {
        let traceCounter = 0;
        let spanCounter = 0;
        return {
            generateTraceId: function () {
                traceCounter++;
                // 32 hex chars
                let hex = traceCounter.toString(16);
                while (hex.length < 32) {
                    hex = "0" + hex;
                }
                return hex;
            },
            generateSpanId: function () {
                spanCounter++;
                // 16 hex chars
                let hex = spanCounter.toString(16);
                while (hex.length < 16) {
                    hex = "0" + hex;
                }
                return hex;
            }
        };
    }

    private _createMockSampler(): IOTelSampler {
        return {
            shouldSample: function (): IOTelSamplingResult {
                return {
                    decision: eOTelSamplingDecision.RECORD_AND_SAMPLED
                };
            },
            toString: function () {
                return "AlwaysOnSampler";
            }
        };
    }

    private _createMockLogProcessor(): IOTelLogRecordProcessor {
        return {
            onEmit: function () { /* noop */ },
            forceFlush: function () { return createResolvedPromise(undefined); },
            shutdown: function () { return createResolvedPromise(undefined); }
        };
    }
}
