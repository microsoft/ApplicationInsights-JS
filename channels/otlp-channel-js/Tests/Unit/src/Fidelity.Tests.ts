import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {
    CtxTagKeys, EventDataType, ExceptionDataType, ITelemetryItem, MetricDataType, PageViewDataType,
    PageViewPerformanceDataType, RemoteDependencyDataType, RequestDataType, TraceDataType
} from "@microsoft/applicationinsights-core-js";
import { IOtlpChannelConfig } from "../../../src/Interfaces/IOtlpChannelConfig";
import { IConvertCtx, convertItem } from "../../../src/convert/ItemConverter";
import { buildResourceInfo, getResourceKey, getResourceTagKeys } from "../../../src/convert/ResourceBuilder";

/**
 * Verifies that the FULL semantic model of both Application Insights and 1DS Common Schema telemetry
 * survives conversion to OTLP.
 *
 * The approach is deliberately blunt: build an item with every documented field of a contract set to
 * a unique sentinel value, convert it, flatten every value that appears anywhere in the resulting
 * OTLP record (and its resource), and assert that every sentinel is present somewhere.
 *
 * A field that goes missing is data loss. A field that is intentionally not carried must be listed in
 * the test's `deliberatelyDropped` set, so that every omission is a conscious, reviewed decision
 * rather than an accident.
 */

function createCtx(config?: IOtlpChannelConfig): IConvertCtx {
    let theConfig: IOtlpChannelConfig = config || {};
    theConfig.piiMode = theConfig.piiMode || "keep";
    theConfig.preSerialize = false;
    theConfig.metricsAsLogs = theConfig.metricsAsLogs === undefined ? true : theConfig.metricsAsLogs;

    return {
        config: theConfig,
        resourceTagKeys: getResourceTagKeys(),
        attrOptions: { piiMode: theConfig.piiMode }
    };
}

/**
 * Recursively collects every primitive value found in the object into a string array.
 */
function collectValues(value: any, into: string[]): string[] {
    if (value === null || value === undefined) {
        return into;
    }

    if (typeof value === "object") {
        for (let key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                // Keys matter too, a value can be preserved as an attribute key
                into.push("" + key);
                collectValues(value[key], into);
            }
        }

        return into;
    }

    into.push("" + value);

    return into;
}

/**
 * Converts an item and returns every value present in the resulting record plus its resource.
 */
function convertAndFlatten(item: ITelemetryItem, ctx: IConvertCtx): string[] {
    let result = convertItem(item, ctx, "1700000000000000000");
    Assert.ok(!!result, "The item produced a record");

    let values: string[] = [];
    collectValues(result.record, values);

    let info = buildResourceInfo(item, ctx.config, getResourceKey(item), "1.0.0");
    collectValues(info.resource, values);
    collectValues(info.scope, values);

    return values;
}

function assertPreserved(values: string[], expected: { [field: string]: any },
        deliberatelyDropped: string[], label: string) {

    let missing: string[] = [];

    for (let field in expected) {
        if (!Object.prototype.hasOwnProperty.call(expected, field)) {
            continue;
        }

        if (deliberatelyDropped.indexOf(field) !== -1) {
            continue;
        }

        let sentinel = "" + expected[field];
        if (values.indexOf(sentinel) === -1) {
            missing.push(field + " (sentinel '" + sentinel + "')");
        }
    }

    Assert.equal(0, missing.length,
        label + " preserved every field. Missing: " + missing.join(", "));
}

export class FidelityTests extends AITestClass {

    public registerTests() {

        // -----------------------------------------------------------------------------------
        // Application Insights contracts
        // -----------------------------------------------------------------------------------

        this.testCase({
            name: "Fidelity: RemoteDependencyData preserves every contract field",
            test: () => {
                // IRemoteDependencyData: ver, name, id, resultCode, duration, success, data, target,
                // type, properties, measurements
                let fields = {
                    name: "GET /dep-name-sentinel",
                    id: "051581bf3cb55c13",
                    resultCode: "418",
                    data: "https://data-sentinel.example.com/path",
                    target: "target-sentinel.example.com",
                    type: "type-sentinel"
                };

                let item: ITelemetryItem = {
                    name: "dep",
                    baseType: RemoteDependencyDataType,
                    baseData: {
                        ver: 2,
                        name: fields.name,
                        id: fields.id,
                        resultCode: fields.resultCode,
                        duration: 1234,
                        success: false,
                        data: fields.data,
                        target: fields.target,
                        type: fields.type,
                        properties: { "prop-key-sentinel": "prop-value-sentinel" },
                        measurements: { "measure-key-sentinel": 99 }
                    }
                };

                let values = convertAndFlatten(item, createCtx());

                assertPreserved(values, fields, [], "RemoteDependencyData");
                Assert.notEqual(-1, values.indexOf("prop-value-sentinel"), "custom property preserved");
                Assert.notEqual(-1, values.indexOf("99"), "custom measurement preserved");

                // The duration is carried by the span end time rather than by an attribute
                let span: any = convertItem(item, createCtx(), "0").record;
                let deltaNanos = Number(span.endTimeUnixNano.substring(6)) -
                    Number(span.startTimeUnixNano.substring(6));
                Assert.equal(1234 * 1e6, deltaNanos, "The duration is reflected in the span end time");
            }
        });

        this.testCase({
            name: "Fidelity: RequestData preserves every contract field including source",
            test: () => {
                // IRequestData: ver, id, name, duration, success, responseCode, source, url,
                // properties, measurements
                let fields = {
                    id: "051581bf3cb55c13",
                    name: "GET /request-name-sentinel",
                    responseCode: "503",
                    source: "source-sentinel",
                    url: "https://url-sentinel.example.com/path"
                };

                let item: ITelemetryItem = {
                    name: "req",
                    baseType: RequestDataType,
                    baseData: {
                        ver: 2,
                        id: fields.id,
                        name: fields.name,
                        duration: 55,
                        success: true,
                        responseCode: fields.responseCode,
                        source: fields.source,
                        url: fields.url,
                        properties: { "req-prop-sentinel": "req-prop-value-sentinel" },
                        measurements: { "req-measure-sentinel": 7 }
                    }
                };

                let values = convertAndFlatten(item, createCtx());

                assertPreserved(values, fields, [], "RequestData");
                Assert.notEqual(-1, values.indexOf("req-prop-value-sentinel"), "custom property preserved");
            }
        });

        this.testCase({
            name: "Fidelity: PageviewData preserves every contract field",
            test: () => {
                // IPageViewData extends IEventData: url, duration, id + name, properties, measurements
                let fields = {
                    id: "pageview-id-sentinel",
                    name: "page-name-sentinel",
                    url: "https://page-url-sentinel.example.com/"
                };

                let item: ITelemetryItem = {
                    name: "pv",
                    baseType: PageViewDataType,
                    baseData: {
                        ver: 2,
                        id: fields.id,
                        name: fields.name,
                        url: fields.url,
                        duration: 4321,
                        properties: { "pv-prop-sentinel": "pv-prop-value-sentinel" },
                        measurements: { "pv-measure-sentinel": 3 }
                    }
                };

                let values = convertAndFlatten(item, createCtx());

                assertPreserved(values, fields, [], "PageviewData");
                Assert.notEqual(-1, values.indexOf("pv-prop-value-sentinel"), "custom property preserved");
            }
        });

        this.testCase({
            name: "Fidelity: PageviewPerformanceData preserves every contract field",
            test: () => {
                // IPageViewPerfData extends IPageViewData: perfTotal, networkConnect, sentRequest,
                // receivedResponse, domProcessing + url, duration, id + name, properties, measurements
                //
                // This is the case that regressed: id, url and duration were listed as consumed but
                // were only mapped for PageviewData, so they were silently lost here.
                let fields = {
                    id: "perf-id-sentinel",
                    name: "perf-name-sentinel",
                    url: "https://perf-url-sentinel.example.com/",
                    perfTotal: "perf-total-sentinel",
                    networkConnect: "network-connect-sentinel",
                    sentRequest: "sent-request-sentinel",
                    receivedResponse: "received-response-sentinel",
                    domProcessing: "dom-processing-sentinel"
                };

                let item: ITelemetryItem = {
                    name: "pvp",
                    baseType: PageViewPerformanceDataType,
                    baseData: {
                        ver: 2,
                        id: fields.id,
                        name: fields.name,
                        url: fields.url,
                        duration: "00:00:01.500",
                        perfTotal: fields.perfTotal,
                        networkConnect: fields.networkConnect,
                        sentRequest: fields.sentRequest,
                        receivedResponse: fields.receivedResponse,
                        domProcessing: fields.domProcessing,
                        properties: { "perf-prop-sentinel": "perf-prop-value-sentinel" },
                        measurements: { "perf-measure-sentinel": 11 }
                    }
                };

                let values = convertAndFlatten(item, createCtx());

                assertPreserved(values, fields, [], "PageviewPerformanceData");
                Assert.notEqual(-1, values.indexOf("1500"), "The duration was parsed and preserved in ms");
            }
        });

        this.testCase({
            name: "Fidelity: ExceptionData preserves every IExceptionDetails and IStackFrame field",
            test: () => {
                // IExceptionDetails: id, outerId, typeName, message, hasFullStack, stack, parsedStack
                // IStackFrame: level, method, assembly, fileName, line
                let fields = {
                    typeName: "TypeName-sentinel",
                    message: "message-sentinel",
                    id: 42,
                    outerId: 24
                };

                let item: ITelemetryItem = {
                    name: "ex",
                    baseType: ExceptionDataType,
                    baseData: {
                        ver: 2,
                        severityLevel: 3,
                        exceptions: [{
                            id: fields.id,
                            outerId: fields.outerId,
                            typeName: fields.typeName,
                            message: fields.message,
                            hasFullStack: false,
                            parsedStack: [{
                                level: 0,
                                method: "method-sentinel",
                                assembly: "assembly-sentinel",
                                fileName: "file-name-sentinel",
                                line: 1234
                            }]
                        }],
                        properties: { "ex-prop-sentinel": "ex-prop-value-sentinel" }
                    }
                };

                let values = convertAndFlatten(item, createCtx());
                let joined = values.join("\n");

                assertPreserved(values, fields, [], "ExceptionData");

                // The reconstructed stack must retain the frame detail
                Assert.notEqual(-1, joined.indexOf("method-sentinel"), "stack frame method preserved");
                Assert.notEqual(-1, joined.indexOf("file-name-sentinel"), "stack frame fileName preserved");
                Assert.notEqual(-1, joined.indexOf("1234"), "stack frame line preserved");
                Assert.notEqual(-1, values.indexOf("microsoft.exception.has_full_stack"),
                    "hasFullStack is preserved rather than dropped");
            }
        });

        this.testCase({
            name: "Fidelity: a chained exception is fully preserved",
            test: () => {
                let item: ITelemetryItem = {
                    name: "ex",
                    baseType: ExceptionDataType,
                    baseData: {
                        exceptions: [
                            { typeName: "Outer", message: "outer-message-sentinel" },
                            { typeName: "InnerType-sentinel", message: "inner-message-sentinel" }
                        ]
                    }
                };

                let joined = convertAndFlatten(item, createCtx()).join("\n");

                Assert.notEqual(-1, joined.indexOf("InnerType-sentinel"), "the chained exception type survives");
                Assert.notEqual(-1, joined.indexOf("inner-message-sentinel"), "the chained message survives");
            }
        });

        this.testCase({
            name: "Fidelity: MetricData preserves every IDataPoint field",
            test: () => {
                // IDataPoint: name, kind, value, count, min, max, stdDev
                let fields = {
                    name: "metric-name-sentinel",
                    kind: 1,
                    value: 12.5,
                    count: 33,
                    min: 3,
                    max: 44,
                    stdDev: 5
                };

                let item: ITelemetryItem = {
                    name: "metric",
                    baseType: MetricDataType,
                    baseData: {
                        ver: 2,
                        metrics: [fields],
                        properties: { "metric-prop-sentinel": "metric-prop-value-sentinel" }
                    }
                };

                let values = convertAndFlatten(item, createCtx({ metricsAsLogs: true }));

                assertPreserved(values, fields, [], "MetricData");
            }
        });

        this.testCase({
            name: "Fidelity: MessageData and EventData preserve every contract field",
            test: () => {
                let message: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: {
                        ver: 2,
                        message: "message-body-sentinel",
                        severityLevel: 2,
                        properties: { "msg-prop-sentinel": "msg-prop-value-sentinel" },
                        measurements: { "msg-measure-sentinel": 5 }
                    }
                };

                let messageValues = convertAndFlatten(message, createCtx());
                Assert.notEqual(-1, messageValues.indexOf("message-body-sentinel"), "message preserved");
                Assert.notEqual(-1, messageValues.indexOf("WARN"), "severity preserved");
                Assert.notEqual(-1, messageValues.indexOf("msg-prop-value-sentinel"), "property preserved");

                let event: ITelemetryItem = {
                    name: "evt",
                    baseType: EventDataType,
                    baseData: {
                        ver: 2,
                        name: "event-name-sentinel",
                        properties: { "evt-prop-sentinel": "evt-prop-value-sentinel" },
                        measurements: { "evt-measure-sentinel": 6 }
                    }
                };

                let eventValues = convertAndFlatten(event, createCtx());
                Assert.notEqual(-1, eventValues.indexOf("event-name-sentinel"), "event name preserved");
                Assert.notEqual(-1, eventValues.indexOf("evt-prop-value-sentinel"), "property preserved");
            }
        });

        // -----------------------------------------------------------------------------------
        // Context tags -- the full ContextTagKeys surface
        // -----------------------------------------------------------------------------------

        this.testCase({
            name: "Fidelity: every context tag is either promoted to the resource or kept as an attribute",
            test: () => {
                let tags: any = {};
                let expected: any = {};

                // Populate every documented context tag with a unique sentinel
                let tagNames = [
                    "applicationVersion", "applicationBuild", "applicationTypeId", "applicationId",
                    "applicationLayer", "deviceId", "deviceIp", "deviceLanguage", "deviceLocale",
                    "deviceModel", "deviceFriendlyName", "deviceNetwork", "deviceNetworkName",
                    "deviceOEMName", "deviceOS", "deviceOSVersion", "deviceRoleInstance",
                    "deviceRoleName", "deviceScreenResolution", "deviceType", "deviceMachineName",
                    "deviceVMName", "deviceBrowser", "deviceBrowserVersion", "locationIp",
                    "locationCountry", "locationProvince", "locationCity", "operationId",
                    "operationName", "operationParentId", "operationRootId", "operationSyntheticSource",
                    "operationCorrelationVector", "sessionId", "sessionIsFirst", "sessionIsNew",
                    "userAccountAcquisitionDate", "userAccountId", "userAgent", "userId",
                    "userStoreRegion", "userAuthUserId", "userAnonymousUserAcquisitionDate",
                    "userAuthenticatedUserAcquisitionDate", "cloudName", "cloudRole", "cloudRoleVer",
                    "cloudRoleInstance", "cloudEnvironment", "cloudLocation", "cloudDeploymentUnit",
                    "internalNodeName", "internalSdkVersion", "internalAgentVersion", "internalSnippet",
                    "internalSdkSrc"
                ];

                for (let lp = 0; lp < tagNames.length; lp++) {
                    let key = (CtxTagKeys as any)[tagNames[lp]];
                    if (!key) {
                        continue;
                    }

                    // operationId / operationParentId must stay valid ids so they can be used as the
                    // trace and span identity
                    let sentinel: string;
                    if (tagNames[lp] === "operationId") {
                        sentinel = "5b8aa5a2d2c872e8321cf37308d69df2";
                    } else if (tagNames[lp] === "operationParentId") {
                        sentinel = "051581bf3cb55c13";
                    } else {
                        sentinel = "tag-" + tagNames[lp] + "-sentinel";
                    }

                    tags[key] = sentinel;
                    expected[tagNames[lp]] = sentinel;
                }

                let item: ITelemetryItem = {
                    name: "msg",
                    iKey: "the-key",
                    baseType: TraceDataType,
                    baseData: { message: "m" },
                    tags: tags
                };

                let values = convertAndFlatten(item, createCtx());

                assertPreserved(values, expected, [], "Context tags");
            }
        });

        this.testCase({
            name: "Fidelity: an arbitrary non-standard tag is preserved",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m" },
                    tags: { "my.custom.tag": "custom-tag-value-sentinel" } as any
                };

                let values = convertAndFlatten(item, createCtx());
                Assert.notEqual(-1, values.indexOf("custom-tag-value-sentinel"), "custom tag preserved");
                Assert.notEqual(-1, values.indexOf("my.custom.tag"), "custom tag key preserved");
            }
        });

        // -----------------------------------------------------------------------------------
        // 1DS Common Schema
        // -----------------------------------------------------------------------------------

        this.testCase({
            name: "Fidelity: every Part A extension subtree is preserved",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m" },
                    ext: {
                        user: { id: "ext-user-id-sentinel", localId: "ext-user-localid-sentinel" },
                        device: { id: "ext-device-id-sentinel", deviceClass: "ext-device-class-sentinel" },
                        os: { name: "ext-os-name-sentinel", ver: "ext-os-ver-sentinel" },
                        app: { sesId: "ext-app-sesid-sentinel", ver: "ext-app-ver-sentinel" },
                        web: { browser: "ext-web-browser-sentinel", browserVer: "ext-web-browserver-sentinel" },
                        trace: { traceID: "5b8aa5a2d2c872e8321cf37308d69df2", parentID: "051581bf3cb55c13",
                            name: "ext-trace-name-sentinel" },
                        session: { id: "ext-session-id-sentinel" },
                        sdk: { ver: "ext-sdk-ver-sentinel", seq: 7 },
                        loc: { tz: "ext-loc-tz-sentinel" },
                        cloud: { role: "ext-cloud-role-sentinel" },
                        intweb: { msfpc: "ext-intweb-msfpc-sentinel" }
                    }
                };

                let values = convertAndFlatten(item, createCtx());

                let expected = {
                    userId: "ext-user-id-sentinel",
                    userLocalId: "ext-user-localid-sentinel",
                    deviceId: "ext-device-id-sentinel",
                    deviceClass: "ext-device-class-sentinel",
                    osName: "ext-os-name-sentinel",
                    osVer: "ext-os-ver-sentinel",
                    appSesId: "ext-app-sesid-sentinel",
                    appVer: "ext-app-ver-sentinel",
                    webBrowser: "ext-web-browser-sentinel",
                    webBrowserVer: "ext-web-browserver-sentinel",
                    traceName: "ext-trace-name-sentinel",
                    sessionId: "ext-session-id-sentinel",
                    sdkVer: "ext-sdk-ver-sentinel",
                    sdkSeq: 7,
                    locTz: "ext-loc-tz-sentinel",
                    cloudRole: "ext-cloud-role-sentinel",
                    intwebMsfpc: "ext-intweb-msfpc-sentinel"
                };

                assertPreserved(values, expected, [], "Part A extensions");
            }
        });

        this.testCase({
            name: "Fidelity: Part C data is preserved",
            test: () => {
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m" },
                    data: { "part-c-key-sentinel": "part-c-value-sentinel" }
                };

                let values = convertAndFlatten(item, createCtx());
                Assert.notEqual(-1, values.indexOf("part-c-value-sentinel"), "Part C value preserved");
                Assert.notEqual(-1, values.indexOf("part-c-key-sentinel"), "Part C key preserved");
            }
        });

        this.testCase({
            name: "Fidelity: every Common Schema propertyType is converted using its declared type",
            test: () => {
                // eEventPropertyType: String=1, Int32=2, UInt32=3, Int64=4, UInt64=5, Double=6,
                // Bool=7, Guid=8, DateTime=9
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: {
                        message: "m",
                        properties: {
                            asString: { value: "a-string", propertyType: 1 },
                            asInt32: { value: "12345", propertyType: 2 },
                            asUInt32: { value: "54321", propertyType: 3 },
                            asInt64: { value: "9007199254740993", propertyType: 4 },
                            asUInt64: { value: "18446744073709551615", propertyType: 5 },
                            asDouble: { value: "1.5", propertyType: 6 },
                            asBool: { value: "true", propertyType: 7 },
                            asGuid: { value: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", propertyType: 8 },
                            asDateTime: { value: "2021-01-01T00:00:00.000Z", propertyType: 9 }
                        }
                    }
                };

                let record: any = convertItem(item, createCtx(), "1700000000000000000").record;
                let byKey: any = {};
                for (let lp = 0; lp < record.attributes.length; lp++) {
                    byKey[record.attributes[lp].key] = record.attributes[lp].value;
                }

                Assert.deepEqual({ stringValue: "a-string" }, byKey.asString, "String stays a string");
                Assert.deepEqual({ intValue: "12345" }, byKey.asInt32, "Int32 becomes an intValue");
                Assert.deepEqual({ intValue: "54321" }, byKey.asUInt32, "UInt32 becomes an intValue");
                Assert.deepEqual({ intValue: "9007199254740993" }, byKey.asInt64,
                    "An Int64 beyond MAX_SAFE_INTEGER keeps every digit");
                Assert.deepEqual({ intValue: "18446744073709551615" }, byKey.asUInt64,
                    "A UInt64 keeps every digit");
                Assert.deepEqual({ doubleValue: 1.5 }, byKey.asDouble, "Double becomes a doubleValue");
                Assert.deepEqual({ boolValue: true }, byKey.asBool, "Bool becomes a boolValue");
                Assert.deepEqual({ stringValue: "3f2504e0-4f89-11d3-9a0c-0305e82c3301" }, byKey.asGuid,
                    "A guid stays a string");
                Assert.deepEqual({ stringValue: "2021-01-01T00:00:00.000Z" }, byKey.asDateTime,
                    "A datetime stays a string");
            }
        });

        this.testCase({
            name: "Fidelity: every Common Schema value kind is handled",
            test: () => {
                // eValueKind: NotSet = 0, Pii_* = 1..15, CustomerContent_GenericContent = 32
                let kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 32];
                let properties: any = {};
                for (let lp = 0; lp < kinds.length; lp++) {
                    properties["kind" + kinds[lp]] = { value: "value-" + kinds[lp], kind: kinds[lp] };
                }

                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m", properties: properties }
                };

                // drop mode: everything marked (kind > 0) must be absent, kind 0 must be present
                let dropped: any = convertItem(item, createCtx({ piiMode: "drop" }), "0").record;
                let droppedKeys: string[] = [];
                for (let lp = 0; lp < (dropped.attributes || []).length; lp++) {
                    droppedKeys.push(dropped.attributes[lp].key);
                }

                Assert.notEqual(-1, droppedKeys.indexOf("kind0"), "An unmarked value is kept");
                for (let lp = 0; lp < kinds.length; lp++) {
                    if (kinds[lp] === 0) {
                        continue;
                    }

                    Assert.equal(-1, droppedKeys.indexOf("kind" + kinds[lp]),
                        "Value kind " + kinds[lp] + " is dropped in drop mode");
                }

                // keep mode: every marked value present, each with its marker
                let kept: any = convertItem(item, createCtx({ piiMode: "keep" }), "0").record;
                let keptKeys: string[] = [];
                for (let lp = 0; lp < (kept.attributes || []).length; lp++) {
                    keptKeys.push(kept.attributes[lp].key);
                }

                for (let lp = 0; lp < kinds.length; lp++) {
                    // Pii_DropValue (15) is always dropped, whatever the mode, so it is asserted
                    // separately by its own test rather than here.
                    if (kinds[lp] === 15) {
                        Assert.equal(-1, keptKeys.indexOf("kind15"),
                            "Pii_DropValue is dropped even in keep mode");
                        continue;
                    }

                    Assert.notEqual(-1, keptKeys.indexOf("kind" + kinds[lp]),
                        "Value kind " + kinds[lp] + " is present in keep mode");

                    if (kinds[lp] > 0) {
                        Assert.notEqual(-1, keptKeys.indexOf("microsoft.pii.kind" + kinds[lp]),
                            "Value kind " + kinds[lp] + " carries a PII marker");
                    }
                }
            }
        });

        this.testCase({
            name: "Fidelity: a PII marked value never leaks in drop or hash mode",
            test: () => {
                let secret = "user@secret-sentinel.example.com";
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m", properties: { email: { value: secret, kind: 9 } } }
                };

                let droppedJson = JSON.stringify(convertItem(item, createCtx({ piiMode: "drop" }), "0").record);
                Assert.equal(-1, droppedJson.indexOf(secret), "The value does not appear anywhere in drop mode");

                let hashedJson = JSON.stringify(convertItem(item, createCtx({ piiMode: "hash" }), "0").record);
                Assert.equal(-1, hashedJson.indexOf(secret), "The value does not appear anywhere in hash mode");
            }
        });

        this.testCase({
            name: "Fidelity: an unrecognised baseType is exported rather than dropped",
            test: () => {
                let item: ITelemetryItem = {
                    name: "custom",
                    baseType: "SomeFutureDataType",
                    baseData: { customField: "future-value-sentinel" }
                };

                let values = convertAndFlatten(item, createCtx());
                Assert.notEqual(-1, values.indexOf("future-value-sentinel"),
                    "An unknown type still carries its data");
                Assert.notEqual(-1, values.indexOf("SomeFutureDataType"),
                    "The original baseType is recorded");
            }
        });

        this.testCase({
            name: "Fidelity: a native Common Schema OTelSpan is exported as a SPAN, not a log",
            test: () => {
                // The core produces baseType "OTelSpan" (Ms.Web.Span) for a native span. Routing it to
                // a log record would destroy kind, parentage, status and trace state.
                let item: ITelemetryItem = {
                    name: "Ms.Web.Span",
                    baseType: "OTelSpan",
                    baseData: {
                        name: "otel-span-name-sentinel",
                        kind: 2,                       // eOTelSpanKind.CLIENT
                        startTime: "2021-01-01T00:00:00.000Z",
                        duration: 250,
                        success: true,
                        parentId: "051581bf3cb55c13",
                        traceState: "vendor=trace-state-sentinel",
                        statusMessage: "status-message-sentinel",
                        httpMethod: "GET",
                        httpUrl: "https://otel-url-sentinel.example.com:8443/path",
                        httpStatusCode: 201,
                        dbSystem: "db-system-sentinel",
                        dbStatement: "db-statement-sentinel",
                        rpcSystem: "rpc-system-sentinel"
                    },
                    ext: { dt: { traceId: "5b8aa5a2d2c872e8321cf37308d69df2", spanId: "00f067aa0ba902b7" } }
                };

                let result = convertItem(item, createCtx(), "0");
                Assert.equal(0, result.signal, "An OTelSpan is exported as a span");

                let span: any = result.record;
                Assert.equal("otel-span-name-sentinel", span.name, "The span name");
                Assert.equal("00f067aa0ba902b7", span.spanId, "The span id");
                Assert.equal("051581bf3cb55c13", span.parentSpanId, "The parent span id");
                Assert.equal("vendor=trace-state-sentinel", span.traceState, "The trace state");
                Assert.equal("status-message-sentinel", span.status.message, "The status message");

                // eOTelSpanKind.CLIENT is 2, but OTLP SpanKind CLIENT is 3
                Assert.equal(3, span.kind,
                    "The span kind is translated, not copied (the two enumerations differ by one)");

                let values = collectValues(span, []);
                let expected = {
                    httpUrl: "https://otel-url-sentinel.example.com:8443/path",
                    dbSystem: "db-system-sentinel",
                    dbStatement: "db-statement-sentinel",
                    rpcSystem: "rpc-system-sentinel"
                };
                assertPreserved(values, expected, [], "OTelSpan Part B");
            }
        });

        this.testCase({
            name: "Fidelity: every SDK span kind maps to the correct OTLP span kind",
            test: () => {
                // eOTelSpanKind INTERNAL(0) SERVER(1) CLIENT(2) PRODUCER(3) CONSUMER(4)
                // OTLP SpanKind  INTERNAL(1) SERVER(2) CLIENT(3) PRODUCER(4) CONSUMER(5)
                let expected = [1, 2, 3, 4, 5];

                for (let sdkKind = 0; sdkKind <= 4; sdkKind++) {
                    let item: ITelemetryItem = {
                        name: "Ms.Web.Span",
                        baseType: "OTelSpan",
                        baseData: { name: "s", kind: sdkKind, duration: 1, success: true }
                    };

                    let span: any = convertItem(item, createCtx(), "0").record;
                    Assert.equal(expected[sdkKind], span.kind,
                        "SDK kind " + sdkKind + " maps to OTLP kind " + expected[sdkKind]);
                }
            }
        });

        this.testCase({
            name: "Fidelity: Pii_DropValue is always dropped, whatever the configured mode",
            test: () => {
                // eValueKind.Pii_DropValue = 15 documents itself as "Drops the value altogether,
                // rather than hashing", so it must override the configured piiMode.
                let secret = "drop-me-sentinel";
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { message: "m", properties: { mustDrop: { value: secret, kind: 15 } } }
                };

                let modes: any[] = ["drop", "keep", "hash"];
                for (let lp = 0; lp < modes.length; lp++) {
                    let json = JSON.stringify(convertItem(item, createCtx({ piiMode: modes[lp] }), "0").record);
                    Assert.equal(-1, json.indexOf(secret),
                        "Pii_DropValue is not exported in '" + modes[lp] + "' mode");
                    Assert.equal(-1, json.indexOf("mustDrop"),
                        "The attribute itself is absent in '" + modes[lp] + "' mode");
                }
            }
        });

        this.testCase({
            name: "Fidelity: a PII value nested inside another property does not leak",
            test: () => {
                // A nested IEventProperty never reaches the top level resolver, so without explicit
                // handling it would be serialized verbatim by the AnyValue conversion.
                let secret = "nested-secret-sentinel";
                let item: ITelemetryItem = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: {
                        message: "m",
                        properties: {
                            outer: {
                                safe: "safe-value",
                                inner: { value: secret, kind: 9 },
                                deeper: { level2: { value: "deep-secret-sentinel", kind: 9 } }
                            }
                        }
                    }
                };

                let droppedJson = JSON.stringify(convertItem(item, createCtx({ piiMode: "drop" }), "0").record);
                Assert.equal(-1, droppedJson.indexOf(secret), "A nested PII value is dropped");
                Assert.equal(-1, droppedJson.indexOf("deep-secret-sentinel"),
                    "A PII value nested two levels down is dropped");
                Assert.notEqual(-1, droppedJson.indexOf("safe-value"), "The unmarked sibling survives");

                let hashedJson = JSON.stringify(convertItem(item, createCtx({ piiMode: "hash" }), "0").record);
                Assert.equal(-1, hashedJson.indexOf(secret), "A nested PII value is hashed, not emitted");
            }
        });

        this.testCase({
            name: "Fidelity: the documented deliberate omissions are the only omissions",
            test: () => {
                // These item level members are transport / routing hints rather than telemetry, and
                // are intentionally not exported. Listing them here makes the decision explicit.
                let item: any = {
                    name: "msg",
                    baseType: TraceDataType,
                    baseData: { ver: 2, message: "m" },
                    ver: "4.0",
                    latency: 3,
                    persistence: 2,
                    sync: 1,
                    timings: { processTelemetryStart: { aisku: 1 } }
                };

                let record: any = convertItem(item, createCtx(), "0").record;
                let json = JSON.stringify(record);

                // Documented as deliberately dropped: they describe how the SDK should route the
                // event, not what happened in the application.
                Assert.equal(-1, json.indexOf("\"microsoft.latency\""), "latency is a routing hint, not exported");
                Assert.equal(-1, json.indexOf("\"microsoft.persistence\""), "persistence is a routing hint");
                Assert.equal(-1, json.indexOf("\"microsoft.sync\""), "sync is a routing hint");
                Assert.equal(-1, json.indexOf("\"microsoft.timings\""), "timings are SDK internal");

                // But the actual telemetry is still there
                Assert.notEqual(-1, json.indexOf("\"m\""), "the message itself is exported");
            }
        });
    }
}
