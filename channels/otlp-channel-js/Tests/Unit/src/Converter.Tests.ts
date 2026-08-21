import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {
    CtxTagKeys, EventDataType, ExceptionDataType, ITelemetryItem, MetricDataType, PageViewDataType, RemoteDependencyDataType,
    RequestDataType, TraceDataType, eSeverityLevel
} from "@microsoft/applicationinsights-core-js";
import { eOtlpSeverityNumber, eOtlpSignal, eOtlpSpanKind, eOtlpStatusCode } from "../../../src/Enums";
import { IOtlpChannelConfig } from "../../../src/Interfaces/IOtlpChannelConfig";
import { IOtlpLogRecord, IOtlpSpan } from "../../../src/Interfaces/IOtlpTypes";
import { IConvertCtx, convertItem, getSignal } from "../../../src/convert/ItemConverter";
import { buildResourceInfo, getResourceKey, getResourceTagKeys } from "../../../src/convert/ResourceBuilder";
import { buildPayload, OtlpBatcher } from "../../../src/OtlpBatcher";

function createCtx(config?: IOtlpChannelConfig): IConvertCtx {
    let theConfig: IOtlpChannelConfig = config || {};
    if (theConfig.piiMode === undefined) {
        theConfig.piiMode = "drop";
    }

    // Retain the converted objects so that the tests can assert against the structure directly
    theConfig.preSerialize = theConfig.preSerialize === undefined ? false : theConfig.preSerialize;

    return {
        config: theConfig,
        resourceTagKeys: getResourceTagKeys(),
        attrOptions: { piiMode: theConfig.piiMode }
    };
}

function getAttr(record: any, key: string): any {
    let attributes = record && record.attributes;
    if (!attributes) {
        return undefined;
    }

    for (let lp = 0; lp < attributes.length; lp++) {
        if (attributes[lp].key === key) {
            return attributes[lp].value;
        }
    }

    return undefined;
}

function attrKeys(record: any): string[] {
    let keys: string[] = [];
    let attributes = (record && record.attributes) || [];
    for (let lp = 0; lp < attributes.length; lp++) {
        keys.push(attributes[lp].key);
    }

    return keys;
}

export class ConverterTests extends AITestClass {

    public registerTests() {

        this.testCase({
            name: "getSignal: routes each baseType to the correct signal",
            test: () => {
                let config: IOtlpChannelConfig = {};
                Assert.equal(eOtlpSignal.Span, getSignal(RequestDataType, config), "A request is a span");
                Assert.equal(eOtlpSignal.Span, getSignal(RemoteDependencyDataType, config), "A dependency is a span");
                Assert.equal(eOtlpSignal.Log, getSignal(TraceDataType, config), "A trace is a log");
                Assert.equal(eOtlpSignal.Log, getSignal(ExceptionDataType, config), "An exception is a log");
                Assert.equal(eOtlpSignal.Log, getSignal(EventDataType, config), "An event is a log");
                Assert.equal(null, getSignal(MetricDataType, config), "A metric is dropped by default");
                Assert.equal(null, getSignal(null, config), "An item with no baseType is dropped");
            }
        });

        this.testCase({
            name: "getSignal: pageViewAs and metricsAsLogs are honoured",
            test: () => {
                Assert.equal(eOtlpSignal.Span, getSignal(PageViewDataType, {}), "A page view defaults to a span");
                Assert.equal(eOtlpSignal.Log, getSignal(PageViewDataType, { pageViewAs: "log" }),
                    "A page view can be configured as a log");
                Assert.equal(eOtlpSignal.Log, getSignal(MetricDataType, { metricsAsLogs: true }),
                    "A metric can be configured as a log");
            }
        });

        this.testCase({
            name: "RequestData converts to a SERVER span",
            test: () => {
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.Request",
                    time: "2021-01-01T00:00:00.000Z",
                    iKey: "key",
                    baseType: RequestDataType,
                    baseData: {
                        id: "051581bf3cb55c13",
                        name: "GET /api/values",
                        url: "https://example.com/api/values",
                        duration: 250,
                        success: true,
                        responseCode: 200,
                        startTime: new Date(1609459200000)
                    },
                    ext: {
                        dt: { traceId: "5b8aa5a2d2c872e8321cf37308d69df2", spanId: "051581bf3cb55c13", traceFlags: 1 }
                    }
                };

                let result = convertItem(item, createCtx(), "1609459200000000000");
                Assert.equal(eOtlpSignal.Span, result.signal, "The item is exported as a span");

                let span = result.record as IOtlpSpan;
                Assert.equal("5b8aa5a2d2c872e8321cf37308d69df2", span.traceId, "The trace id");
                Assert.equal("051581bf3cb55c13", span.spanId, "The span id");
                Assert.equal(eOtlpSpanKind.SERVER, span.kind, "A request is a SERVER span");
                Assert.equal("GET /api/values", span.name, "The span name");
                Assert.equal(1, span.flags, "The trace flags");
                Assert.equal("1609459200000000000", span.startTimeUnixNano, "The start time comes from baseData.startTime");
                Assert.equal("1609459200250000000", span.endTimeUnixNano, "The end time is the start plus the duration");
                Assert.equal(eOtlpStatusCode.OK, span.status.code, "success true maps to OK");

                Assert.deepEqual({ stringValue: "GET" }, getAttr(span, "http.request.method"), "The method is re-derived");
                Assert.deepEqual({ stringValue: "https://example.com/api/values" }, getAttr(span, "url.full"), "The url");
                Assert.deepEqual({ intValue: "200" }, getAttr(span, "http.response.status_code"), "The status code");
            }
        });

        this.testCase({
            name: "RemoteDependencyData converts to a CLIENT span",
            test: () => {
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.RemoteDependency",
                    time: "2021-01-01T00:00:00.000Z",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        id: "051581bf3cb55c13",
                        name: "GET /remote",
                        data: "https://remote.example.com/remote",
                        target: "remote.example.com",
                        type: "Http",
                        duration: 100,
                        success: false,
                        resultCode: 500
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.equal(eOtlpSpanKind.CLIENT, span.kind, "A dependency is a CLIENT span");
                Assert.equal(eOtlpStatusCode.ERROR, span.status.code, "success false maps to ERROR");
                Assert.deepEqual({ stringValue: "remote.example.com" }, getAttr(span, "server.address"), "The target");
                Assert.deepEqual({ stringValue: "https://remote.example.com/remote" }, getAttr(span, "url.full"),
                    "The dependency data carries the url");
                Assert.deepEqual({ intValue: "500" }, getAttr(span, "http.response.status_code"), "The result code");
            }
        });

        this.testCase({
            name: "An InProc dependency converts to an INTERNAL span",
            test: () => {
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: { name: "work", type: "InProc | Microsoft.EventHub", duration: 5 }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.equal(eOtlpSpanKind.INTERNAL, span.kind, "An InProc dependency is INTERNAL");
                Assert.equal(eOtlpStatusCode.UNSET, span.status.code, "An absent success value is UNSET");
            }
        });

        this.testCase({
            name: "A non numeric dependency result code is not reported as an http status",
            test: () => {
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: { name: "call", type: "Grpc", resultCode: "UNAVAILABLE", duration: 5 }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.equal(undefined, getAttr(span, "http.response.status_code"), "It is not an http status");
                Assert.deepEqual({ stringValue: "UNAVAILABLE" }, getAttr(span, "microsoft.result_code"),
                    "It is preserved under the microsoft namespace");
            }
        });

        this.testCase({
            name: "The original OpenTelemetry attributes survive the round trip through baseData.properties",
            test: () => {
                // `createTelemetryItemFromSpan` folds any attribute it does not map explicitly into
                // baseData.properties, so this is where round trip fidelity is recovered.
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        name: "GET /x",
                        duration: 1,
                        properties: {
                            "custom.attribute": "value",
                            "enduser.id": "user-1",
                            "_MS.status.description": "it broke"
                        }
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.deepEqual({ stringValue: "value" }, getAttr(span, "custom.attribute"),
                    "A custom attribute keeps its original key");
                Assert.deepEqual({ stringValue: "user-1" }, getAttr(span, "enduser.id"),
                    "A semantic convention attribute keeps its original key");
                Assert.equal("it broke", span.status.message, "The status description is restored onto the status");
            }
        });

        this.testCase({
            name: "MessageData converts to a log record with the correct severity",
            test: () => {
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.Message",
                    time: "2021-01-01T00:00:00.000Z",
                    baseType: TraceDataType,
                    baseData: { message: "something happened", severityLevel: eSeverityLevel.Warning }
                };

                let result = convertItem(item, createCtx(), "1609459200000000123");
                Assert.equal(eOtlpSignal.Log, result.signal, "The item is exported as a log");

                let record = result.record as IOtlpLogRecord;
                Assert.deepEqual({ stringValue: "something happened" }, record.body, "The message becomes the body");
                Assert.equal(eOtlpSeverityNumber.WARN, record.severityNumber, "The severity number");
                Assert.equal("WARN", record.severityText, "The severity text");
                Assert.equal("1609459200000000000", record.timeUnixNano, "The record time");
                Assert.equal("1609459200000000123", record.observedTimeUnixNano, "The observed time");
            }
        });

        this.testCase({
            name: "Every severity level maps onto the correct OTLP severity number",
            test: () => {
                let check = (level: number, expectedNumber: number, expectedText: string) => {
                    let item: ITelemetryItem = {
                        name: "msg",
                        baseType: TraceDataType,
                        baseData: { message: "m", severityLevel: level }
                    };

                    let record = convertItem(item, createCtx(), "0").record as IOtlpLogRecord;
                    Assert.equal(expectedNumber, record.severityNumber, "Severity number for level " + level);
                    Assert.equal(expectedText, record.severityText, "Severity text for level " + level);
                };

                check(eSeverityLevel.Verbose, eOtlpSeverityNumber.TRACE, "TRACE");
                check(eSeverityLevel.Information, eOtlpSeverityNumber.INFO, "INFO");
                check(eSeverityLevel.Warning, eOtlpSeverityNumber.WARN, "WARN");
                check(eSeverityLevel.Error, eOtlpSeverityNumber.ERROR, "ERROR");
                check(eSeverityLevel.Critical, eOtlpSeverityNumber.FATAL, "FATAL");
            }
        });

        this.testCase({
            name: "ExceptionData maps onto the OpenTelemetry exception attributes",
            test: () => {
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.Exception",
                    baseType: ExceptionDataType,
                    baseData: {
                        exceptions: [{
                            typeName: "TypeError",
                            message: "x is not a function",
                            stack: "TypeError: x is not a function\n    at foo"
                        }]
                    }
                };

                let record = convertItem(item, createCtx(), "0").record as IOtlpLogRecord;
                Assert.equal(eOtlpSeverityNumber.ERROR, record.severityNumber, "An exception defaults to ERROR");
                Assert.deepEqual({ stringValue: "TypeError" }, getAttr(record, "exception.type"), "The exception type");
                Assert.deepEqual({ stringValue: "x is not a function" }, getAttr(record, "exception.message"),
                    "The exception message");
                Assert.deepEqual({ stringValue: "TypeError: x is not a function\n    at foo" },
                    getAttr(record, "exception.stacktrace"), "The stack trace");
                Assert.deepEqual({ stringValue: "x is not a function" }, record.body, "The message becomes the body");
            }
        });

        this.testCase({
            name: "Additional chained exceptions are preserved rather than dropped",
            test: () => {
                let item: ITelemetryItem = {
                    name: "ex",
                    baseType: ExceptionDataType,
                    baseData: {
                        exceptions: [
                            { typeName: "TypeError", message: "outer" },
                            { typeName: "RangeError", message: "inner" }
                        ]
                    }
                };

                let record = convertItem(item, createCtx(), "0").record as IOtlpLogRecord;
                let details: any = getAttr(record, "microsoft.exception.details");
                Assert.ok(!!details, "The additional exceptions are preserved");
                Assert.ok(details.stringValue.indexOf("RangeError") !== -1, "The chained exception is included");
            }
        });

        this.testCase({
            name: "EventData sets eventName and mirrors it as an attribute",
            test: () => {
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.Event",
                    baseType: EventDataType,
                    baseData: { name: "button-clicked", properties: { page: "home" } }
                };

                let record = convertItem(item, createCtx(), "0").record as IOtlpLogRecord;
                Assert.equal("button-clicked", record.eventName, "The event name is set");
                Assert.deepEqual({ stringValue: "button-clicked" }, getAttr(record, "event.name"),
                    "The name is mirrored for collectors that do not support eventName");
                Assert.deepEqual({ stringValue: "home" }, getAttr(record, "page"), "The custom properties are attributes");
            }
        });

        this.testCase({
            name: "The span id embedded in an Application Insights hierarchical id is used, not discarded",
            test: () => {
                // The dependency plugin sets id to "|<traceId>.<spanId>" (ajaxRecord.ts). Generating a
                // new span id here would break the parent/child relationships in the exported trace,
                // because child telemetry references the embedded id as its parent.
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        id: "|26b2820ab2e44659a18c79ed20332849.0680710cdc6940ce.",
                        name: "GET http://example.com/x",
                        type: "Fetch",
                        duration: 20,
                        success: true
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.equal("0680710cdc6940ce", span.spanId, "The embedded span id is used verbatim");
                Assert.equal(undefined, getAttr(span, "microsoft.telemetry_id"),
                    "No id needed to be preserved because none was discarded");
            }
        });

        this.testCase({
            name: "An operation only hierarchical id does not yield a span id",
            test: () => {
                // "|<traceId>." identifies the operation, there is no span id embedded in it, so
                // truncating the trace id into a span id would fabricate a bogus identifier.
                let item: ITelemetryItem = {
                    name: "req",
                    baseType: RequestDataType,
                    baseData: { id: "|26b2820ab2e44659a18c79ed20332849.", name: "GET /x", duration: 1, success: true }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.ok(/^[0-9a-f]{16}$/.test(span.spanId), "A span id was generated");
                Assert.notEqual("26b2820ab2e44659a1", span.spanId, "The trace id was not truncated into a span id");
            }
        });

        this.testCase({
            name: "A dependency target that is an absolute url is split into host, port and url",
            test: () => {
                // The auto collected dependency telemetry sets target to the absolute url
                // (ajaxRecord.ts), but server.address must be the host on its own.
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        id: "051581bf3cb55c13",
                        name: "GET http://localhost:8096/api/products",
                        target: "http://localhost:8096/api/products",
                        type: "Fetch",
                        duration: 18,
                        success: true
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.deepEqual({ stringValue: "localhost" }, getAttr(span, "server.address"),
                    "server.address is the host only");
                Assert.deepEqual({ intValue: "8096" }, getAttr(span, "server.port"), "The port is reported separately");
                Assert.deepEqual({ stringValue: "http://localhost:8096/api/products" }, getAttr(span, "url.full"),
                    "The url is recovered from the target");
            }
        });

        this.testCase({
            name: "A bare host target is used as the server address unchanged",
            test: () => {
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        id: "051581bf3cb55c13", name: "call", target: "remote.example.com",
                        type: "Http", duration: 1, success: true
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.deepEqual({ stringValue: "remote.example.com" }, getAttr(span, "server.address"),
                    "A bare host is unchanged");
                Assert.equal(undefined, getAttr(span, "server.port"), "No port is invented");
            }
        });

        this.testCase({
            name: "An explicit dependency url wins over the one recovered from the target",
            test: () => {
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        id: "051581bf3cb55c13", name: "GET /x",
                        data: "https://explicit.example.com/path",
                        target: "https://target.example.com/other",
                        type: "Http", duration: 1, success: true
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.deepEqual({ stringValue: "https://explicit.example.com/path" }, getAttr(span, "url.full"),
                    "The explicit data url is used");
                Assert.deepEqual({ stringValue: "target.example.com" }, getAttr(span, "server.address"),
                    "The host still comes from the target");
            }
        });

        this.testCase({
            name: "peer.service is the host rather than the full url",
            test: () => {
                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        id: "051581bf3cb55c13", name: "send",
                        target: "amqps://my-hub.servicebus.windows.net/queue",
                        type: "Queue Message", duration: 1, success: true
                    }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                Assert.deepEqual({ stringValue: "my-hub.servicebus.windows.net" }, getAttr(span, "peer.service"),
                    "peer.service is the host");
            }
        });

        this.testCase({
            name: "PageviewData converts to an INTERNAL span by default",
            test: () => {
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.Pageview",
                    baseType: PageViewDataType,
                    baseData: { id: "051581bf3cb55c13", name: "Home", url: "https://example.com/", duration: 1200 }
                };

                let result = convertItem(item, createCtx(), "0");
                Assert.equal(eOtlpSignal.Span, result.signal, "A page view is a span by default");

                let span = result.record as IOtlpSpan;
                Assert.equal(eOtlpSpanKind.INTERNAL, span.kind, "A page view is an INTERNAL span");
                Assert.deepEqual({ stringValue: "https://example.com/" }, getAttr(span, "url.full"), "The page url");
            }
        });

        this.testCase({
            name: "A span always carries a valid traceId and spanId even when the item has neither",
            test: () => {
                // A page view has a page view id rather than a span id, and a page view raised before
                // any operation has started has no operation id either. A span cannot be exported
                // without both identifiers, so they must be generated.
                let item: ITelemetryItem = {
                    name: "Microsoft.ApplicationInsights.Pageview",
                    baseType: PageViewDataType,
                    baseData: { name: "Home", url: "https://example.com/", duration: 10 }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;

                Assert.ok(/^[0-9a-f]{32}$/.test(span.traceId), "A trace id was generated: " + span.traceId);
                Assert.ok(/^[0-9a-f]{16}$/.test(span.spanId), "A span id was generated: " + span.spanId);
            }
        });

        this.testCase({
            name: "A non hex telemetry id is preserved as an attribute when the span id is generated",
            test: () => {
                let item: ITelemetryItem = {
                    name: "pv",
                    baseType: PageViewDataType,
                    baseData: { id: "not-a-span-id", name: "Home", duration: 10 }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;

                Assert.ok(/^[0-9a-f]{16}$/.test(span.spanId), "A valid span id was generated");
                Assert.deepEqual({ stringValue: "not-a-span-id" }, getAttr(span, "microsoft.telemetry_id"),
                    "The original identifier is retained so the span can still be correlated");
            }
        });

        this.testCase({
            name: "An attribute supplied through more than one part of the item is emitted only once",
            test: () => {
                // Application Insights copies the custom properties of an item into both
                // baseData.properties and the Part C data, and a duplicated key has undefined
                // behaviour in OTLP.
                let item: ITelemetryItem = {
                    name: "pv",
                    baseType: PageViewDataType,
                    baseData: {
                        id: "051581bf3cb55c13",
                        name: "Home",
                        duration: 10,
                        properties: { "test.marker": "from-properties" }
                    },
                    data: { "test.marker": "from-part-c" }
                };

                let span = convertItem(item, createCtx(), "0").record as IOtlpSpan;
                let keys = attrKeys(span);

                let count = 0;
                for (let lp = 0; lp < keys.length; lp++) {
                    if (keys[lp] === "test.marker") {
                        count++;
                    }
                }

                Assert.equal(1, count, "The key was emitted exactly once, actual keys: " + keys.join(","));
                Assert.deepEqual({ stringValue: "from-part-c" }, getAttr(span, "test.marker"),
                    "The later source (Part C) won");
            }
        });

        this.testCase({
            name: "No record ever contains a duplicated attribute key",
            test: () => {
                let items: ITelemetryItem[] = [
                    {
                        name: "req", baseType: RequestDataType,
                        baseData: {
                            id: "051581bf3cb55c13", name: "GET /x", duration: 1, success: true,
                            url: "https://example.com/x", properties: { "url.full": "https://example.com/x" }
                        },
                        data: { "url.full": "https://example.com/x" },
                        tags: { "ai.operation.name": "GET /x" }
                    },
                    {
                        name: "msg", baseType: TraceDataType,
                        baseData: { message: "m", properties: { "microsoft.telemetry_type": "spoofed" } }
                    }
                ];

                for (let lp = 0; lp < items.length; lp++) {
                    let record: any = convertItem(items[lp], createCtx(), "0").record;
                    let seen: { [key: string]: number } = {};
                    let attributes = record.attributes || [];

                    for (let a = 0; a < attributes.length; a++) {
                        Assert.ok(!seen[attributes[a].key],
                            "The key '" + attributes[a].key + "' appears only once on item " + lp);
                        seen[attributes[a].key] = 1;
                    }
                }
            }
        });

        this.testCase({
            name: "PageviewData can be converted to a log record instead",
            test: () => {
                let item: ITelemetryItem = {
                    name: "pv",
                    baseType: PageViewDataType,
                    baseData: { id: "1", name: "Home", url: "https://example.com/", duration: 1200 }
                };

                let result = convertItem(item, createCtx({ pageViewAs: "log", preSerialize: false }), "0");
                Assert.equal(eOtlpSignal.Log, result.signal, "A page view can be exported as a log");

                let record = result.record as IOtlpLogRecord;
                Assert.deepEqual({ intValue: "1200" }, getAttr(record, "microsoft.duration_ms"),
                    "The duration is preserved as an integer attribute");
                Assert.deepEqual({ stringValue: "https://example.com/" }, getAttr(record, "url.full"), "The page url");
            }
        });

        this.testCase({
            name: "MetricData is dropped by default and converted when enabled",
            test: () => {
                let item: ITelemetryItem = {
                    name: "metric",
                    baseType: MetricDataType,
                    baseData: { metrics: [{ name: "loadTime", value: 42, count: 1, min: 42, max: 42 }] }
                };

                Assert.equal(null, convertItem(item, createCtx(), "0"), "A metric is dropped by default");

                let result = convertItem(item, createCtx({ metricsAsLogs: true, preSerialize: false }), "0");
                Assert.ok(!!result, "A metric is converted when metricsAsLogs is enabled");

                let record = result.record as IOtlpLogRecord;
                Assert.deepEqual({ stringValue: "loadTime" }, getAttr(record, "microsoft.metric.name"), "The metric name");
                Assert.deepEqual({ intValue: "42" }, getAttr(record, "microsoft.metric.value"), "The metric value");
            }
        });

        this.testCase({
            name: "Tags promoted onto the resource are not repeated on every record",
            test: () => {
                let tags: any = {};
                tags[CtxTagKeys.cloudRole] = "my-service";
                tags[CtxTagKeys.operationName] = "GET /x";

                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m" },
                    tags: tags
                };

                let record = convertItem(item, createCtx(), "0").record as IOtlpLogRecord;
                let keys = attrKeys(record);

                Assert.equal(-1, keys.indexOf(CtxTagKeys.cloudRole),
                    "The cloud role is a resource attribute so it must not be repeated per record");
                Assert.notEqual(-1, keys.indexOf(CtxTagKeys.operationName),
                    "A tag that is not on the resource is still emitted");
            }
        });

        this.testCase({
            name: "Part A extensions are flattened under the microsoft.ext namespace",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m" },
                    ext: {
                        web: { browser: "Chrome", browserVer: "120" },
                        dt: { traceId: "5b8aa5a2d2c872e8321cf37308d69df2" }
                    }
                };

                let record = convertItem(item, createCtx(), "0").record as IOtlpLogRecord;
                Assert.deepEqual({ stringValue: "Chrome" }, getAttr(record, "microsoft.ext.web.browser"),
                    "The web extension is flattened");
                Assert.equal(undefined, getAttr(record, "microsoft.ext.dt.traceId"),
                    "The dt extension is consumed as trace identity rather than duplicated");
                Assert.equal("5b8aa5a2d2c872e8321cf37308d69df2", record.traceId, "The trace id is used directly");
            }
        });

        this.testCase({
            name: "piiMode drop removes a value that the Common Schema marked as PII",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: {
                        message: "m",
                        properties: {
                            email: { value: "user@example.com", kind: 9 },
                            safe: { value: "not-pii", kind: 0 }
                        }
                    }
                };

                let record = convertItem(item, createCtx({ piiMode: "drop", preSerialize: false }), "0").record as IOtlpLogRecord;
                Assert.equal(undefined, getAttr(record, "email"), "A PII marked value is dropped");
                Assert.deepEqual({ stringValue: "not-pii" }, getAttr(record, "safe"),
                    "An unmarked value is unwrapped and kept");
            }
        });

        this.testCase({
            name: "piiMode keep emits the value together with a marker attribute",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m", properties: { email: { value: "user@example.com", kind: 9 } } }
                };

                let record = convertItem(item, createCtx({ piiMode: "keep", preSerialize: false }), "0").record as IOtlpLogRecord;
                Assert.deepEqual({ stringValue: "user@example.com" }, getAttr(record, "email"), "The value is kept");
                Assert.deepEqual({ intValue: "9" }, getAttr(record, "microsoft.pii.email"),
                    "A marker records the value kind so that downstream can scrub it");
            }
        });

        this.testCase({
            name: "piiMode hash replaces the value with a stable hash",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m", properties: { email: { value: "user@example.com", kind: 9 } } }
                };

                let record = convertItem(item, createCtx({ piiMode: "hash", preSerialize: false }), "0").record as IOtlpLogRecord;
                let value: any = getAttr(record, "email");
                Assert.ok(!!value, "The attribute is still present");
                Assert.notEqual("user@example.com", value.stringValue, "The original value is not exported");
            }
        });

        this.testCase({
            name: "preSerialize produces the serialized record rather than the object",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "hello" }
                };

                let result = convertItem(item, createCtx({ preSerialize: true }), "0");
                Assert.equal(undefined, result.record, "The object is not retained");
                Assert.ok(!!result.json, "The serialized record is produced at conversion time");

                let parsed = JSON.parse(result.json);
                Assert.deepEqual({ stringValue: "hello" }, parsed.body, "The serialized record is valid JSON");
            }
        });

        this.testCase({
            name: "The converted record holds no reference to the original telemetry item",
            test: () => {
                // Retaining the item would keep any DOM node or closure it references alive
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "hello" }
                };

                let result = convertItem(item, createCtx({ preSerialize: true }), "0");
                Assert.equal("string", typeof result.json, "Only a string is retained");
                Assert.equal(undefined, (result as any).item, "The item is not referenced");
            }
        });

        this.testCase({
            name: "buildPayload produces a valid OTLP trace export request",
            test: () => {
                let item: ITelemetryItem = {
                    name: "req",
                    baseType: RequestDataType,
                    baseData: { id: "051581bf3cb55c13", name: "GET /x", duration: 10, success: true }
                };

                let batcher = new OtlpBatcher();
                let key = getResourceKey(item);
                let info = buildResourceInfo(item, {}, key, "1.0.0");
                batcher.add(info, convertItem(item, createCtx({ preSerialize: true }), "0"));

                let batches = batcher.takeBatches(100, 0);
                Assert.equal(1, batches.length, "A single batch is produced");

                let payload = JSON.parse(buildPayload(batches[0]));
                Assert.ok(!!payload.resourceSpans, "The payload uses the resourceSpans envelope");
                Assert.equal(1, payload.resourceSpans.length, "One resource");
                Assert.equal(1, payload.resourceSpans[0].scopeSpans.length, "One scope");
                Assert.equal(1, payload.resourceSpans[0].scopeSpans[0].spans.length, "One span");
                Assert.equal("GET /x", payload.resourceSpans[0].scopeSpans[0].spans[0].name, "The span survived");
                Assert.ok(!!payload.resourceSpans[0].resource.attributes, "The resource carries attributes");
            }
        });

        this.testCase({
            name: "buildPayload produces a valid OTLP log export request",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "hello" }
                };

                let batcher = new OtlpBatcher();
                let info = buildResourceInfo(item, {}, getResourceKey(item), "1.0.0");
                batcher.add(info, convertItem(item, createCtx({ preSerialize: true }), "0"));

                let payload = JSON.parse(buildPayload(batcher.takeBatches(100, 0)[0]));
                Assert.ok(!!payload.resourceLogs, "The payload uses the resourceLogs envelope");
                Assert.equal(1, payload.resourceLogs[0].scopeLogs[0].logRecords.length, "One log record");
            }
        });

        this.testCase({
            name: "Batch byte limits include UTF-8 encoding, envelope, and separators",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "unicode \ud83d\ude80 telemetry" }
                };
                let info = buildResourceInfo(item, {}, getResourceKey(item), "1.0.0");
                let converted = convertItem(item, createCtx({ preSerialize: true }), "0");

                let single = new OtlpBatcher();
                single.add(info, converted);
                let maxBytes = new Blob([buildPayload(single.takeBatches(100, 0)[0])]).size;

                let pair = new OtlpBatcher();
                pair.add(info, converted);
                pair.add(info, converted);
                let batches = pair.takeBatches(100, maxBytes);

                Assert.equal(2, batches.length, "The second UTF-8 record exceeded the complete payload limit");
                for (let lp = 0; lp < batches.length; lp++) {
                    Assert.ok(new Blob([buildPayload(batches[lp])]).size <= maxBytes,
                        "The encoded payload stays within the configured byte limit");
                }
            }
        });

        this.testCase({
            name: "Spans and logs are exported as separate batches",
            test: () => {
                let span: ITelemetryItem = {
                    name: "req",
                    baseType: RequestDataType,
                    baseData: { id: "051581bf3cb55c13", name: "GET /x", duration: 1, success: true }
                };
                let log: ITelemetryItem = { name: "msg", baseType: TraceDataType, baseData: { message: "hello" } };

                let batcher = new OtlpBatcher();
                let ctx = createCtx({ preSerialize: true });
                batcher.add(buildResourceInfo(span, {}, getResourceKey(span), "1.0.0"), convertItem(span, ctx, "0"));
                batcher.add(buildResourceInfo(log, {}, getResourceKey(log), "1.0.0"), convertItem(log, ctx, "0"));

                Assert.equal(2, batcher.count(), "Both records are buffered");

                let batches = batcher.takeBatches(100, 0);
                Assert.equal(2, batches.length, "The two signals cannot share a request so they are separate batches");
                Assert.equal(0, batcher.count(), "Taking the batches empties the buffer");
            }
        });

        this.testCase({
            name: "buildResourceInfo maps the context tags onto resource attributes",
            test: () => {
                let tags: any = {};
                tags[CtxTagKeys.cloudRole] = "my-service";
                tags[CtxTagKeys.cloudRoleInstance] = "instance-1";
                tags[CtxTagKeys.applicationVersion] = "2.0.0";

                let item: ITelemetryItem = { name: "msg", iKey: "the-key", tags: tags };
                let info = buildResourceInfo(item, {}, getResourceKey(item), "1.0.0");

                Assert.deepEqual({ stringValue: "my-service" }, getAttr(info.resource, "service.name"), "service.name");
                Assert.deepEqual({ stringValue: "instance-1" }, getAttr(info.resource, "service.instance.id"),
                    "service.instance.id");
                Assert.deepEqual({ stringValue: "2.0.0" }, getAttr(info.resource, "service.version"), "service.version");
                Assert.deepEqual({ stringValue: "webjs" }, getAttr(info.resource, "telemetry.sdk.language"),
                    "telemetry.sdk.language");
                Assert.equal(undefined, getAttr(info.resource, "microsoft.instrumentation_key"),
                    "The instrumentation key is not included by default");
                Assert.equal(info.resourceJson, JSON.stringify(info.resource), "The resource is pre-serialized");
            }
        });

        this.testCase({
            name: "resourceAttributes override the derived values without duplicating the key",
            test: () => {
                let tags: any = {};
                tags[CtxTagKeys.cloudRole] = "derived";

                let item: ITelemetryItem = { name: "msg", tags: tags };
                let info = buildResourceInfo(item, { resourceAttributes: { "service.name": "override" } },
                    getResourceKey(item), "1.0.0");

                Assert.deepEqual({ stringValue: "override" }, getAttr(info.resource, "service.name"),
                    "The user supplied value wins");

                let count = 0;
                for (let lp = 0; lp < info.resource.attributes.length; lp++) {
                    if (info.resource.attributes[lp].key === "service.name") {
                        count++;
                    }
                }
                Assert.equal(1, count, "A duplicate attribute key has undefined behaviour in OTLP so must not occur");
            }
        });

        this.testCase({
            name: "Items with the same context share a resource key",
            test: () => {
                let tags: any = {};
                tags[CtxTagKeys.cloudRole] = "my-service";

                let first: ITelemetryItem = { name: "a", iKey: "k", tags: tags };
                let second: ITelemetryItem = { name: "b", iKey: "k", tags: tags };
                let other: ITelemetryItem = { name: "c", iKey: "different", tags: tags };

                Assert.equal(getResourceKey(first), getResourceKey(second), "The same context produces the same key");
                Assert.notEqual(getResourceKey(first), getResourceKey(other), "A different iKey produces a different key");
            }
        });
    }
}
