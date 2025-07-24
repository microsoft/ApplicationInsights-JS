// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "../../../JavaScriptSDK.Enums/EnumHelperFuncs";
import { IOTelAttributes } from "../IOTelAttributes";
import { OTelTimeInput } from "../IOTelHrTime";

/**
 * Span kind describes the relationship between the Span, its parents, and its children.
 */
export const enum eOTelSpanKind {
    /**
     * Default value. Indicates that the span is used internally.
     */
    INTERNAL = 0,

    /**
     * Indicates that the span covers server-side handling of an RPC or other
     * remote network request.
     */
    SERVER = 1,

    /**
     * Indicates that the span covers the client-side wrapper around an RPC or
     * other remote network request.
     */
    CLIENT = 2,

    /**
     * Indicates that the span describes producer sending a message to a broker.
     * Unlike client and  server, there is usually no direct critical path latency
     * relationship between producer and consumer spans.
     */
    PRODUCER = 3,

    /**
     * Indicates that the span describes consumer receiving a message from a broker.
     * Unlike client and  server, there is usually no direct critical path latency
     * relationship between producer and consumer spans.
     */
    CONSUMER = 4,
}

/**
 * Span kind instance for accessing enum values.
 */
export const OTelSpanKind = (/* @__PURE__ */ createEnumStyle<typeof eOTelSpanKind>({
    INTERNAL: eOTelSpanKind.INTERNAL,
    SERVER: eOTelSpanKind.SERVER,
    CLIENT: eOTelSpanKind.CLIENT,
    PRODUCER: eOTelSpanKind.PRODUCER,
    CONSUMER: eOTelSpanKind.CONSUMER
}));
/**
 * Span kind describes the relationship between the Span, its parents, and its children.
 */
export type OTelSpanKind = number | eOTelSpanKind;

/**
 * Options for creating a span.
 */
export interface IOTelSpanOptions {
    /**
     * The SpanKind of a span
     * @default {@link OTelSpanKind.INTERNAL}
     */
    kind?: OTelSpanKind;

    /**
     * A span's attributes
     */
    attributes?: IOTelAttributes;

    /** A manually specified start time for the created `Span` object. */
    startTime?: OTelTimeInput;
  
    /** The new span should be a root span. (Ignore parent from context). */
    root?: boolean;

    /** Specify whether the span should be a recording span, default is true */
    recording?: boolean;
}
