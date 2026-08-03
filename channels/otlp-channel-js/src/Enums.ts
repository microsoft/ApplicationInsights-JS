// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "@microsoft/applicationinsights-core-js";

/**
 * Identifies which OTLP signal a telemetry item is exported as.
 */
export const enum eOtlpSignal {
    /**
     * The item is exported as an OTLP Span to the `/v1/traces` endpoint.
     */
    Span = 0,

    /**
     * The item is exported as an OTLP LogRecord to the `/v1/logs` endpoint.
     */
    Log = 1
}

export const OtlpSignal = (/* @__PURE__ */ createEnumStyle<typeof eOtlpSignal>({
    Span: eOtlpSignal.Span,
    Log: eOtlpSignal.Log
}));
export type OtlpSignal = number | eOtlpSignal;

/**
 * The OTLP `SpanKind` enumeration values.
 */
export const enum eOtlpSpanKind {
    UNSPECIFIED = 0,
    INTERNAL = 1,
    SERVER = 2,
    CLIENT = 3,
    PRODUCER = 4,
    CONSUMER = 5
}

export const OtlpSpanKind = (/* @__PURE__ */ createEnumStyle<typeof eOtlpSpanKind>({
    UNSPECIFIED: eOtlpSpanKind.UNSPECIFIED,
    INTERNAL: eOtlpSpanKind.INTERNAL,
    SERVER: eOtlpSpanKind.SERVER,
    CLIENT: eOtlpSpanKind.CLIENT,
    PRODUCER: eOtlpSpanKind.PRODUCER,
    CONSUMER: eOtlpSpanKind.CONSUMER
}));
export type OtlpSpanKind = number | eOtlpSpanKind;

/**
 * The OTLP `StatusCode` enumeration values.
 */
export const enum eOtlpStatusCode {
    UNSET = 0,
    OK = 1,
    ERROR = 2
}

export const OtlpStatusCode = (/* @__PURE__ */ createEnumStyle<typeof eOtlpStatusCode>({
    UNSET: eOtlpStatusCode.UNSET,
    OK: eOtlpStatusCode.OK,
    ERROR: eOtlpStatusCode.ERROR
}));
export type OtlpStatusCode = number | eOtlpStatusCode;

/**
 * The subset of the OTLP `SeverityNumber` enumeration that the Application Insights severity levels
 * map onto.
 */
export const enum eOtlpSeverityNumber {
    UNSPECIFIED = 0,
    TRACE = 1,
    DEBUG = 5,
    INFO = 9,
    WARN = 13,
    ERROR = 17,
    FATAL = 21
}

export const OtlpSeverityNumber = (/* @__PURE__ */ createEnumStyle<typeof eOtlpSeverityNumber>({
    UNSPECIFIED: eOtlpSeverityNumber.UNSPECIFIED,
    TRACE: eOtlpSeverityNumber.TRACE,
    DEBUG: eOtlpSeverityNumber.DEBUG,
    INFO: eOtlpSeverityNumber.INFO,
    WARN: eOtlpSeverityNumber.WARN,
    ERROR: eOtlpSeverityNumber.ERROR,
    FATAL: eOtlpSeverityNumber.FATAL
}));
export type OtlpSeverityNumber = number | eOtlpSeverityNumber;
