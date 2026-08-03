// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export { OtlpChannel } from "./OtlpChannel";
export { IOtlpChannelConfig, OtlpPageViewMode, OtlpPiiMode } from "./Interfaces/IOtlpChannelConfig";
export {
    IOtlpAnyValue, IOtlpArrayValue, IOtlpExportResponse, IOtlpInstrumentationScope, IOtlpKeyValue, IOtlpKeyValueList,
    IOtlpLogExportRequest, IOtlpLogRecord, IOtlpPartialSuccess, IOtlpResource, IOtlpResourceLogs, IOtlpResourceSpans,
    IOtlpScopeLogs, IOtlpScopeSpans, IOtlpSpan, IOtlpSpanEvent, IOtlpSpanLink, IOtlpStatus, IOtlpTraceExportRequest
} from "./Interfaces/IOtlpTypes";
export {
    OtlpSeverityNumber, OtlpSignal, OtlpSpanKind, OtlpStatusCode, eOtlpSeverityNumber, eOtlpSignal, eOtlpSpanKind, eOtlpStatusCode
} from "./Enums";
export { IOtlpBatch, OtlpBatcher, buildPayload } from "./OtlpBatcher";
export { IOtlpSendResult, OtlpHttpSender, getEndpointUrl, getRetryDelay, parsePartialSuccess } from "./OtlpHttpSender";
export { IConvertCtx, IKeyMap, IOtlpRecord, convertItem, getSignal } from "./convert/ItemConverter";
export { IOtlpResourceInfo, IResourceTagMap, buildResourceInfo, getResourceKey, getResourceTagKeys } from "./convert/ResourceBuilder";
export {
    IAttrOptions, IAttributeWriter, addAttribute, addAttributes, createAttributeWriter, hashValue, safeStringify, toAnyValue
} from "./convert/AttributeBuilder";
export {
    extractSpanId, generateSpanId, generateTraceId, normalizeSpanId, normalizeTraceId, parseTarget
} from "./convert/IdUtils";
export {
    addMillisToUnixNanoStr, epochMillisToUnixNanoStr, hrTimeToUnixNanoStr, parseDurationMs, toEpochMillis
} from "./convert/TimeUtils";
