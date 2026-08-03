// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * OTLP/JSON wire types.
 *
 * These interfaces model the JSON encoding of the OpenTelemetry Protocol (OTLP) as described by
 * https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
 *
 * Notable JSON encoding rules that these types encode:
 * - `int64` / `uint64` fields are represented as decimal **strings** (not numbers) so that values
 *   larger than `Number.MAX_SAFE_INTEGER` survive the round trip.
 * - `bytes` fields (`traceId` / `spanId`) are represented as **lowercase hex** strings. This is a
 *   deliberate deviation from the standard proto3 JSON mapping which would use base64.
 * - Enumerations are represented as their numeric values.
 */

/**
 * A single attribute value. This models the OTLP `AnyValue` message which is a `oneof`, so exactly
 * one of the members should be populated.
 */
export interface IOtlpAnyValue {
    stringValue?: string;
    boolValue?: boolean;
    /**
     * A 64bit integer encoded as a decimal string.
     */
    intValue?: string;
    doubleValue?: number;
    arrayValue?: IOtlpArrayValue;
    kvlistValue?: IOtlpKeyValueList;
    /**
     * A byte array encoded as a base64 string.
     */
    bytesValue?: string;
}

export interface IOtlpArrayValue {
    values: IOtlpAnyValue[];
}

export interface IOtlpKeyValueList {
    values: IOtlpKeyValue[];
}

/**
 * A single key / value attribute pair.
 */
export interface IOtlpKeyValue {
    key: string;
    value: IOtlpAnyValue;
}

/**
 * Identifies the entity producing the telemetry.
 */
export interface IOtlpResource {
    attributes?: IOtlpKeyValue[];
    droppedAttributesCount?: number;
}

/**
 * Identifies the instrumentation library / scope that produced the telemetry.
 */
export interface IOtlpInstrumentationScope {
    name?: string;
    version?: string;
    attributes?: IOtlpKeyValue[];
    droppedAttributesCount?: number;
}

/**
 * The status of a span.
 */
export interface IOtlpStatus {
    message?: string;
    /**
     * 0 = UNSET, 1 = OK, 2 = ERROR
     */
    code?: number;
}

/**
 * A timestamped event recorded on a span.
 */
export interface IOtlpSpanEvent {
    timeUnixNano?: string;
    name?: string;
    attributes?: IOtlpKeyValue[];
    droppedAttributesCount?: number;
}

/**
 * A pointer from the current span to another span.
 */
export interface IOtlpSpanLink {
    traceId?: string;
    spanId?: string;
    traceState?: string;
    attributes?: IOtlpKeyValue[];
    droppedAttributesCount?: number;
    flags?: number;
}

/**
 * A single OTLP span.
 */
export interface IOtlpSpan {
    /**
     * 32 lowercase hex characters (16 bytes).
     */
    traceId?: string;
    /**
     * 16 lowercase hex characters (8 bytes).
     */
    spanId?: string;
    traceState?: string;
    parentSpanId?: string;
    flags?: number;
    name?: string;
    /**
     * See {@link eOtlpSpanKind}
     */
    kind?: number;
    /**
     * Nanoseconds since the unix epoch encoded as a decimal string.
     */
    startTimeUnixNano?: string;
    /**
     * Nanoseconds since the unix epoch encoded as a decimal string.
     */
    endTimeUnixNano?: string;
    attributes?: IOtlpKeyValue[];
    droppedAttributesCount?: number;
    events?: IOtlpSpanEvent[];
    droppedEventsCount?: number;
    links?: IOtlpSpanLink[];
    droppedLinksCount?: number;
    status?: IOtlpStatus;
}

/**
 * A single OTLP log record.
 */
export interface IOtlpLogRecord {
    /**
     * Nanoseconds since the unix epoch encoded as a decimal string.
     */
    timeUnixNano?: string;
    /**
     * Nanoseconds since the unix epoch encoded as a decimal string, identifying when the record was
     * observed by the collection system.
     */
    observedTimeUnixNano?: string;
    /**
     * See {@link eOtlpSeverityNumber}
     */
    severityNumber?: number;
    severityText?: string;
    body?: IOtlpAnyValue;
    attributes?: IOtlpKeyValue[];
    droppedAttributesCount?: number;
    flags?: number;
    traceId?: string;
    spanId?: string;
    /**
     * The name that identifies the class / type of this event. Added in a later revision of the OTLP
     * specification, so a mirrored attribute is also emitted for collectors that do not support it.
     */
    eventName?: string;
}

export interface IOtlpScopeSpans {
    scope?: IOtlpInstrumentationScope;
    spans?: IOtlpSpan[];
    schemaUrl?: string;
}

export interface IOtlpResourceSpans {
    resource?: IOtlpResource;
    scopeSpans?: IOtlpScopeSpans[];
    schemaUrl?: string;
}

export interface IOtlpScopeLogs {
    scope?: IOtlpInstrumentationScope;
    logRecords?: IOtlpLogRecord[];
    schemaUrl?: string;
}

export interface IOtlpResourceLogs {
    resource?: IOtlpResource;
    scopeLogs?: IOtlpScopeLogs[];
    schemaUrl?: string;
}

/**
 * The body of a POST to the OTLP `/v1/traces` endpoint.
 */
export interface IOtlpTraceExportRequest {
    resourceSpans: IOtlpResourceSpans[];
}

/**
 * The body of a POST to the OTLP `/v1/logs` endpoint.
 */
export interface IOtlpLogExportRequest {
    resourceLogs: IOtlpResourceLogs[];
}

/**
 * Reported by a collector when it accepted a request but rejected some of the records it contained.
 * Requests that report a partial success must NOT be retried.
 */
export interface IOtlpPartialSuccess {
    rejectedSpans?: number | string;
    rejectedLogRecords?: number | string;
    rejectedDataPoints?: number | string;
    errorMessage?: string;
}

export interface IOtlpExportResponse {
    partialSuccess?: IOtlpPartialSuccess;
}
