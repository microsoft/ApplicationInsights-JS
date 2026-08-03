// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    CtxTagKeys, EventDataType, ExceptionDataType, ITelemetryItem, MetricDataType, PageViewDataType, PageViewPerformanceDataType,
    RemoteDependencyDataType, RequestDataType, TraceDataType, eSeverityLevel
} from "@microsoft/applicationinsights-core-js";
import { arrForEach, isArray, isNullOrUndefined, isNumber, isString, objForEachKey, strLower, strStartsWith } from "@nevware21/ts-utils";
import { eOtlpSeverityNumber, eOtlpSignal, eOtlpSpanKind, eOtlpStatusCode } from "../Enums";
import { IOtlpChannelConfig } from "../Interfaces/IOtlpChannelConfig";
import { IOtlpLogRecord, IOtlpSpan } from "../Interfaces/IOtlpTypes";
import {
    ATTR_DB_STATEMENT, ATTR_DB_SYSTEM, ATTR_EVENT_NAME, ATTR_EXCEPTION_MESSAGE, ATTR_EXCEPTION_STACKTRACE, ATTR_EXCEPTION_TYPE,
    ATTR_HTTP_REQUEST_METHOD, ATTR_HTTP_RESPONSE_STATUS_CODE, ATTR_PEER_SERVICE, ATTR_RPC_SYSTEM, ATTR_SERVER_ADDRESS, ATTR_SERVER_PORT,
    ATTR_URL_FULL, EXT_DT, EXT_METADATA, EXT_TRACE, MS_EXT_PREFIX, MS_PREFIX
} from "../InternalConstants";
import { IAttrOptions, IAttributeWriter, addAttribute, addAttributes, createAttributeWriter, safeStringify } from "./AttributeBuilder";
import { extractSpanId, generateSpanId, generateTraceId, normalizeSpanId, normalizeTraceId, parseTarget } from "./IdUtils";
import { addMillisToUnixNanoStr, epochMillisToUnixNanoStr, parseDurationMs, toEpochMillis } from "./TimeUtils";

/**
 * A map of keys that should be skipped when copying values.
 */
export interface IKeyMap {
    [key: string]: number;
}

/**
 * The result of converting a single telemetry item.
 */
export interface IOtlpRecord {
    /**
     * Which OTLP signal (and therefore which endpoint and envelope) this record belongs to.
     */
    signal: eOtlpSignal;

    /**
     * The converted record, only populated when the channel is not pre-serializing.
     */
    record?: IOtlpSpan | IOtlpLogRecord;

    /**
     * The serialized record, populated when the channel is pre-serializing.
     */
    json?: string;
}

/**
 * The context supplied to the converter, created once per configuration rather than per item.
 */
export interface IConvertCtx {
    config: IOtlpChannelConfig;

    /**
     * The tag keys that have been promoted onto the resource and so must not be repeated on every
     * record.
     */
    resourceTagKeys: IKeyMap;

    attrOptions: IAttrOptions;
}

/**
 * The `baseData` members that are mapped explicitly for a span and therefore must not be repeated as
 * a `microsoft.*` attribute.
 */
const _consumedSpanFields: IKeyMap = {
    name: 1, id: 1, duration: 1, success: 1, startTime: 1, properties: 1, measurements: 1,
    ver: 1, responseCode: 1, resultCode: 1, url: 1, target: 1, data: 1, type: 1
};

/**
 * The `baseData` members that are mapped explicitly for a log record.
 */
const _consumedLogFields: IKeyMap = {
    name: 1, message: 1, severityLevel: 1, properties: 1, measurements: 1, ver: 1,
    exceptions: 1, metrics: 1, startTime: 1, id: 1, duration: 1, url: 1
};

/**
 * The Part A extensions that are consumed directly rather than being flattened into attributes.
 */
const _consumedExts: IKeyMap = {};
_consumedExts[EXT_DT] = 1;
_consumedExts[EXT_METADATA] = 1;

const METHOD_NAME_REGEX = /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|TRACE|CONNECT)\s+(\S*)/;
const IN_PROC = "InProc";
const MS_STATUS_DESCRIPTION = "_MS.status.description";

/**
 * The `baseType` used by the 1DS Common Schema for a native OpenTelemetry span
 * (`Ms.Web.Span`), produced by `createExtendedTelemetryItemFromSpan` in the core.
 */
export const OTelSpanDataType = "OTelSpan";

/**
 * The Part B members of an `OTelSpan` that are mapped explicitly.
 */
const _consumedOTelSpanFields: IKeyMap = {
    name: 1, kind: 1, startTime: 1, duration: 1, success: 1, parentId: 1, traceState: 1,
    statusMessage: 1, httpMethod: 1, httpUrl: 1, httpStatusCode: 1, dbSystem: 1, dbStatement: 1,
    rpcSystem: 1, properties: 1, measurements: 1, ver: 1
};

/**
 * Translates the SDK's span kind into the OTLP `SpanKind`.
 *
 * @remarks
 * These two enumerations are NOT the same. The SDK's `eOTelSpanKind` starts at `INTERNAL = 0`
 * whereas the OTLP `SpanKind` reserves 0 for `UNSPECIFIED` and starts at `INTERNAL = 1`. Copying the
 * value across unchanged would shift every span kind by one, silently turning every INTERNAL span
 * into UNSPECIFIED, every SERVER span into INTERNAL and so on.
 *
 * @param sdkKind - The `eOTelSpanKind` value carried by the telemetry.
 * @returns The equivalent OTLP `SpanKind`.
 */
export function toOtlpSpanKind(sdkKind: any): eOtlpSpanKind {
    if (!isNumber(sdkKind) || sdkKind < 0 || sdkKind > 4) {
        return eOtlpSpanKind.INTERNAL;
    }

    // eOTelSpanKind INTERNAL(0) SERVER(1) CLIENT(2) PRODUCER(3) CONSUMER(4)
    // OTLP SpanKind  INTERNAL(1) SERVER(2) CLIENT(3) PRODUCER(4) CONSUMER(5)
    return (sdkKind + 1) as eOtlpSpanKind;
}

/**
 * Maps a `baseType` onto the OTLP signal that carries it.
 * @param baseType - The `baseType` of the telemetry item.
 * @param config - The channel configuration.
 * @returns The signal to export the item as, or `null` when the item should be ignored.
 */
export function getSignal(baseType: string, config: IOtlpChannelConfig): eOtlpSignal | null {
    if (baseType === RequestDataType || baseType === RemoteDependencyDataType ||
            baseType === OTelSpanDataType) {
        return eOtlpSignal.Span;
    }

    if (baseType === PageViewDataType) {
        return config.pageViewAs === "log" ? eOtlpSignal.Log : eOtlpSignal.Span;
    }

    if (baseType === TraceDataType || baseType === ExceptionDataType || baseType === EventDataType ||
            baseType === PageViewPerformanceDataType) {
        return eOtlpSignal.Log;
    }

    if (baseType === MetricDataType) {
        // The OTLP metrics signal is not supported yet, optionally represent them as log records so
        // that the data is not silently lost.
        return config.metricsAsLogs ? eOtlpSignal.Log : null;
    }

    // An unrecognised type is still more useful as a log record than it is dropped
    return baseType ? eOtlpSignal.Log : null;
}

function _tag(item: ITelemetryItem, key: string): any {
    let tags = item.tags;
    return tags ? tags[key] : undefined;
}

function _getExt(item: ITelemetryItem, name: string): any {
    let ext = item.ext;
    return (ext ? ext[name] : null) || {};
}

/**
 * Resolves the start time of the item as a `timeUnixNano` decimal string.
 */
function _getStartTime(item: ITelemetryItem, baseData: any): string {
    // `createTelemetryItemFromSpan` records the true span start on the baseData which is more
    // accurate than the item time (the time at which the item was processed).
    let millis = toEpochMillis(baseData ? baseData.startTime : null);
    if (isNullOrUndefined(millis)) {
        millis = toEpochMillis(item.time);
    }

    if (isNullOrUndefined(millis)) {
        millis = (new Date()).getTime();
    }

    return epochMillisToUnixNanoStr(millis);
}

/**
 * Adds the attributes that are common to both signals, applying the documented precedence: unmapped
 * Part B fields, Part B properties, Part B measurements, Part C, the Part A extensions and finally
 * any tag that was not promoted onto the resource.
 *
 * @remarks
 * The writer replaces (rather than repeats) a key that has already been written, so where the same
 * custom property appears in more than one of these sources -- which Application Insights routinely
 * does for `baseData.properties` and Part C -- only a single attribute is emitted.
 */
function _addCommonAttributes(writer: IAttributeWriter, item: ITelemetryItem, baseData: any,
        consumed: IKeyMap, ctx: IConvertCtx): void {

    if (baseData) {
        // 1. Any baseData member that was not mapped explicitly
        objForEachKey(baseData, (key, value) => {
            if (consumed[key]) {
                return;
            }

            addAttribute(writer, MS_PREFIX + key, value);
        });

        // 2. The custom properties. For items created from a span these carry the original
        //    OpenTelemetry attributes, so they are emitted using their original keys.
        addAttributes(writer, baseData.properties);

        // 3. The custom measurements
        addAttributes(writer, baseData.measurements);
    }

    // 4. Part C
    addAttributes(writer, item.data);

    // 5. The Part A extensions, flattened
    let ext = item.ext;
    if (ext) {
        objForEachKey(ext, (extName, extValue) => {
            if (_consumedExts[extName] || !extValue) {
                return;
            }

            addAttributes(writer, extValue, MS_EXT_PREFIX + extName + ".");
        });
    }

    // 6. Any tag that was not promoted onto the resource
    addAttributes(writer, item.tags, null, ctx.resourceTagKeys);
}

function _isSqlType(dependencyType: string): boolean {
    let lowered = strLower(dependencyType);
    return lowered.indexOf("sql") !== -1 || lowered === "mysql" || lowered === "postgresql" || lowered === "mongodb";
}

function _convertSpan(item: ITelemetryItem, ctx: IConvertCtx): IOtlpSpan {
    let baseData = item.baseData || {};
    let baseType = item.baseType;
    let dt = _getExt(item, EXT_DT);
    let traceExt = _getExt(item, EXT_TRACE);
    let isRequest = baseType === RequestDataType;
    let isPageView = baseType === PageViewDataType;

    let span: IOtlpSpan = {};

    // Both identifiers are required by the OpenTelemetry specification, so where the telemetry does
    // not carry a usable value (a page view has a page view id rather than a span id, for example)
    // one is generated rather than exporting an invalid span.
    span.traceId = normalizeTraceId(dt.traceId || traceExt.traceID || _tag(item, CtxTagKeys.operationId)) ||
        generateTraceId();

    let spanId = normalizeSpanId(dt.spanId) || extractSpanId(baseData.id);
    let generatedSpanId = false;
    if (!spanId) {
        spanId = generateSpanId();
        generatedSpanId = true;
    }
    span.spanId = spanId;

    let parentSpanId = normalizeSpanId(traceExt.parentID || _tag(item, CtxTagKeys.operationParentId));
    // A span cannot be its own parent, which happens when the operation parent id has been set to
    // the id of this span
    if (parentSpanId && parentSpanId !== spanId) {
        span.parentSpanId = parentSpanId;
    }

    if (isNumber(dt.traceFlags)) {
        span.flags = dt.traceFlags;
    }

    span.name = baseData.name || item.name;

    let dependencyType = isString(baseData.type) ? baseData.type : "";
    let isOTelSpan = baseType === OTelSpanDataType;

    if (isOTelSpan) {
        // A native Common Schema span already carries its own kind, translated because the two
        // enumerations do not share the same numbering (see toOtlpSpanKind).
        span.kind = toOtlpSpanKind(baseData.kind);
    } else if (isRequest) {
        span.kind = eOtlpSpanKind.SERVER;
    } else if (isPageView || strStartsWith(dependencyType, IN_PROC)) {
        span.kind = eOtlpSpanKind.INTERNAL;
    } else {
        span.kind = eOtlpSpanKind.CLIENT;
    }

    if (isOTelSpan) {
        let otelParent = normalizeSpanId(baseData.parentId);
        if (otelParent && otelParent !== spanId) {
            span.parentSpanId = otelParent;
        }

        if (baseData.traceState) {
            span.traceState = baseData.traceState;
        }
    }

    let startUnixNano = _getStartTime(item, baseData);
    span.startTimeUnixNano = startUnixNano;
    span.endTimeUnixNano = addMillisToUnixNanoStr(startUnixNano, parseDurationMs(baseData.duration));

    let success = baseData.success;
    let status: any = {
        code: success === false ? eOtlpStatusCode.ERROR : (success === true ? eOtlpStatusCode.OK : eOtlpStatusCode.UNSET)
    };

    let properties = baseData.properties;
    let statusMessage = baseData.statusMessage || (properties ? properties[MS_STATUS_DESCRIPTION] : null);
    if (statusMessage) {
        status.message = statusMessage;
    }
    span.status = status;

    let writer = createAttributeWriter(ctx.attrOptions);

    if (generatedSpanId && baseData.id) {
        // Retain whatever identifier the telemetry did carry so that the exported span can still be
        // correlated back to the original Application Insights item.
        addAttribute(writer, MS_PREFIX + "telemetry_id", baseData.id);
    }

    if (isOTelSpan) {
        // A native Common Schema span carries the semantic values in dedicated Part B members
        addAttribute(writer, ATTR_HTTP_REQUEST_METHOD, baseData.httpMethod);
        addAttribute(writer, ATTR_URL_FULL, baseData.httpUrl);
        addAttribute(writer, ATTR_DB_SYSTEM, baseData.dbSystem);
        addAttribute(writer, ATTR_DB_STATEMENT, baseData.dbStatement);
        addAttribute(writer, ATTR_RPC_SYSTEM, baseData.rpcSystem);

        if (!isNullOrUndefined(baseData.httpStatusCode) && baseData.httpStatusCode !== "") {
            let httpStatus = +baseData.httpStatusCode;
            addAttribute(writer, isNaN(httpStatus) ? MS_PREFIX + "http_status_code" : ATTR_HTTP_RESPONSE_STATUS_CODE,
                isNaN(httpStatus) ? baseData.httpStatusCode : httpStatus);
        }

        let otelUrl = parseTarget(baseData.httpUrl);
        addAttribute(writer, ATTR_SERVER_ADDRESS, otelUrl.host);
        addAttribute(writer, ATTR_SERVER_PORT, otelUrl.port);

        _addCommonAttributes(writer, item, baseData, _consumedOTelSpanFields, ctx);

        if (writer.attrs.length) {
            span.attributes = writer.attrs;
        }

        return span;
    }

    // Re-derive the semantic convention attributes that `createTelemetryItemFromSpan` folded into
    // the dedicated baseData fields.
    let name = baseData.name;
    if (isString(name)) {
        let matches = METHOD_NAME_REGEX.exec(name);
        if (matches) {
            addAttribute(writer, ATTR_HTTP_REQUEST_METHOD, matches[1]);
        }
    }

    // The automatically collected dependency telemetry puts the absolute url in `target`, but the
    // semantic conventions require the host on its own with the port reported separately.
    let target = parseTarget(baseData.target);

    // An explicitly supplied url always wins over the one recovered from the target
    let fullUrl = (isRequest || isPageView ? baseData.url : (baseData.data || baseData.url)) || target.url;
    addAttribute(writer, ATTR_URL_FULL, fullUrl);
    addAttribute(writer, ATTR_SERVER_ADDRESS, target.host);
    addAttribute(writer, ATTR_SERVER_PORT, target.port);

    let responseCode = isRequest ? baseData.responseCode : baseData.resultCode;
    if (!isNullOrUndefined(responseCode) && responseCode !== "") {
        // A dependency result code is not always numeric, it may carry a gRPC or database status
        let numeric = +responseCode;
        if (isNaN(numeric)) {
            addAttribute(writer, MS_PREFIX + "result_code", responseCode);
        } else {
            addAttribute(writer, ATTR_HTTP_RESPONSE_STATUS_CODE, numeric);
        }
    }

    if (dependencyType) {
        addAttribute(writer, MS_PREFIX + "dependency.type", dependencyType);

        if (_isSqlType(dependencyType)) {
            addAttribute(writer, ATTR_DB_SYSTEM, dependencyType);
            addAttribute(writer, ATTR_DB_STATEMENT, baseData.data);
        } else if (!strStartsWith(dependencyType, "Http") && target.host) {
            addAttribute(writer, ATTR_PEER_SERVICE, target.host);
        }
    }

    if (isPageView) {
        addAttribute(writer, MS_PREFIX + "page_view.id", baseData.id);
    }

    // The Part B and Common Schema schema versions, which would otherwise be lost
    addAttribute(writer, MS_PREFIX + "telemetry_type", baseType);
    addAttribute(writer, MS_PREFIX + "schema_version", baseData.ver);
    addAttribute(writer, MS_PREFIX + "common_schema.version", (item as any).ver);

    _addCommonAttributes(writer, item, baseData, _consumedSpanFields, ctx);

    if (writer.attrs.length) {
        span.attributes = writer.attrs;
    }

    return span;
}

function _getSeverity(severityLevel: any, isException: boolean): number {
    if (isNullOrUndefined(severityLevel)) {
        return isException ? eOtlpSeverityNumber.ERROR : eOtlpSeverityNumber.INFO;
    }

    switch (+severityLevel) {
    case eSeverityLevel.Verbose:
        return eOtlpSeverityNumber.TRACE;
    case eSeverityLevel.Information:
        return eOtlpSeverityNumber.INFO;
    case eSeverityLevel.Warning:
        return eOtlpSeverityNumber.WARN;
    case eSeverityLevel.Error:
        return eOtlpSeverityNumber.ERROR;
    case eSeverityLevel.Critical:
        return eOtlpSeverityNumber.FATAL;
    }

    return isException ? eOtlpSeverityNumber.ERROR : eOtlpSeverityNumber.INFO;
}

function _getSeverityText(severityNumber: number): string {
    switch (severityNumber) {
    case eOtlpSeverityNumber.TRACE:
        return "TRACE";
    case eOtlpSeverityNumber.DEBUG:
        return "DEBUG";
    case eOtlpSeverityNumber.WARN:
        return "WARN";
    case eOtlpSeverityNumber.ERROR:
        return "ERROR";
    case eOtlpSeverityNumber.FATAL:
        return "FATAL";
    }

    return "INFO";
}

function _getStack(exception: any): string {
    if (!exception) {
        return null;
    }

    if (exception.stack) {
        return exception.stack;
    }

    let parsedStack = exception.parsedStack;
    if (isArray(parsedStack)) {
        // Reconstruct a conventional stack trace. Every IStackFrame member is included so that the
        // structured frame can be read back out of the string.
        let lines: string[] = [];
        arrForEach(parsedStack, (frame) => {
            if (!frame) {
                return;
            }

            let location = frame.fileName || "";
            if (!isNullOrUndefined(frame.line)) {
                location += ":" + frame.line;
            }

            let method = frame.method || frame.assembly || "<anonymous>";
            lines.push("   at " + method + (location ? " (" + location + ")" : ""));
        });

        return lines.join("\n");
    }

    return null;
}

function _addMetrics(writer: IAttributeWriter, baseData: any): void {
    let metrics = baseData.metrics;
    if (!isArray(metrics)) {
        return;
    }

    arrForEach(metrics, (metric, idx) => {
        if (!metric) {
            return;
        }

        let prefix = MS_PREFIX + "metric." + (idx === 0 ? "" : idx + ".");
        addAttribute(writer, prefix + "name", metric.name);
        addAttribute(writer, prefix + "value", metric.value);
        addAttribute(writer, prefix + "count", metric.count);
        addAttribute(writer, prefix + "min", metric.min);
        addAttribute(writer, prefix + "max", metric.max);
        addAttribute(writer, prefix + "stdDev", metric.stdDev);
        // eDataPointType: 0 = Measurement, 1 = Aggregation
        addAttribute(writer, prefix + "kind", metric.kind);
        addAttribute(writer, prefix + "ns", metric.ns);
    });
}

function _convertLog(item: ITelemetryItem, ctx: IConvertCtx, observedUnixNano: string): IOtlpLogRecord {
    let baseData = item.baseData || {};
    let baseType = item.baseType;
    let dt = _getExt(item, EXT_DT);
    let traceExt = _getExt(item, EXT_TRACE);
    let isException = baseType === ExceptionDataType;
    let isEvent = baseType === EventDataType;

    let record: IOtlpLogRecord = {};

    record.timeUnixNano = _getStartTime(item, baseData);
    record.observedTimeUnixNano = observedUnixNano;

    let severityNumber = _getSeverity(baseData.severityLevel, isException);
    record.severityNumber = severityNumber;
    record.severityText = _getSeverityText(severityNumber);

    // Unlike a span, a log record that is not associated with a trace simply omits the identifiers
    let traceId = normalizeTraceId(dt.traceId || traceExt.traceID || _tag(item, CtxTagKeys.operationId));
    if (traceId) {
        record.traceId = traceId;
    }

    // A log record is associated with the span that was active when it was created, which is the
    // operation parent rather than an id of its own.
    let spanId = normalizeSpanId(dt.spanId || traceExt.parentID || _tag(item, CtxTagKeys.operationParentId));
    if (spanId) {
        record.spanId = spanId;
    }

    if (isNumber(dt.traceFlags)) {
        record.flags = dt.traceFlags;
    }

    let writer = createAttributeWriter(ctx.attrOptions);

    if (isException) {
        let exceptions = baseData.exceptions;
        if (isArray(exceptions) && exceptions.length) {
            let first = exceptions[0] || {};
            addAttribute(writer, ATTR_EXCEPTION_TYPE, first.typeName);
            addAttribute(writer, ATTR_EXCEPTION_MESSAGE, first.message);
            addAttribute(writer, ATTR_EXCEPTION_STACKTRACE, _getStack(first));

            // The remaining IExceptionDetails members have no semantic convention equivalent, so they
            // are preserved rather than dropped
            addAttribute(writer, MS_PREFIX + "exception.id", first.id);
            addAttribute(writer, MS_PREFIX + "exception.outer_id", first.outerId);
            if (!isNullOrUndefined(first.hasFullStack)) {
                addAttribute(writer, MS_PREFIX + "exception.has_full_stack", !!first.hasFullStack);
                // The OpenTelemetry convention for a trimmed stack
                addAttribute(writer, MS_PREFIX + "exception.stack_truncated", !first.hasFullStack);
            }

            if (first.message) {
                record.body = { stringValue: first.message };
            }

            // Nothing is dropped silently, any additional chained exception detail is preserved
            if (exceptions.length > 1) {
                addAttribute(writer, MS_PREFIX + "exception.details", safeStringify(exceptions));
            }
        }
    } else if (isEvent) {
        let eventName = baseData.name || item.name;
        if (eventName) {
            record.eventName = eventName;
            // `eventName` was only added to OTLP relatively recently, mirror it as an attribute so
            // that older collectors still receive the name.
            addAttribute(writer, ATTR_EVENT_NAME, eventName);
        }
    } else {
        let message = baseData.message;
        if (isNullOrUndefined(message)) {
            message = baseData.name || item.name;
        }

        if (!isNullOrUndefined(message) && message !== "") {
            record.body = { stringValue: isString(message) ? message : safeStringify(message) };
        }
    }

    if (baseType === MetricDataType) {
        _addMetrics(writer, baseData);
    }

    // These are carried by more than just a page view (a page view performance item has all three),
    // so they are mapped for every log record rather than only for PageviewData.
    addAttribute(writer, ATTR_URL_FULL, baseData.url);

    if (!isNullOrUndefined(baseData.duration)) {
        addAttribute(writer, MS_PREFIX + "duration_ms", parseDurationMs(baseData.duration));
    }

    if (baseData.id) {
        addAttribute(writer, MS_PREFIX + (baseType === PageViewDataType ? "page_view.id" : "telemetry_id"),
            baseData.id);
    }

    addAttribute(writer, MS_PREFIX + "telemetry_type", baseType);
    // The Part B and Common Schema schema versions, which would otherwise be lost
    addAttribute(writer, MS_PREFIX + "schema_version", baseData.ver);
    addAttribute(writer, MS_PREFIX + "common_schema.version", (item as any).ver);

    _addCommonAttributes(writer, item, baseData, _consumedLogFields, ctx);

    if (writer.attrs.length) {
        record.attributes = writer.attrs;
    }

    return record;
}

/**
 * Converts a telemetry item into its final OTLP representation.
 *
 * @remarks
 * This runs on the `processTelemetry` path, once per item. All of the mapping, attribute
 * construction and (when `preSerialize` is enabled) JSON serialization happens here so that sending
 * a batch performs no conversion work at all.
 *
 * @param item - The telemetry item to convert.
 * @param ctx - The conversion context, created once per configuration.
 * @param observedUnixNano - The time the item was received, as a `timeUnixNano` decimal string.
 * @returns The converted record, or `null` when the item is not exportable.
 */
export function convertItem(item: ITelemetryItem, ctx: IConvertCtx, observedUnixNano: string): IOtlpRecord | null {
    if (!item) {
        return null;
    }

    let signal = getSignal(item.baseType, ctx.config);
    if (isNullOrUndefined(signal)) {
        return null;
    }

    let record: IOtlpSpan | IOtlpLogRecord = signal === eOtlpSignal.Span ?
        _convertSpan(item, ctx) :
        _convertLog(item, ctx, observedUnixNano);

    let result: IOtlpRecord = { signal: signal };
    if (ctx.config.preSerialize === false) {
        result.record = record;
    } else {
        result.json = JSON.stringify(record);
    }

    return result;
}
