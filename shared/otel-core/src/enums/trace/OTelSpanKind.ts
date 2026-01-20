// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "@microsoft/applicationinsights-common";

/**
 * The defined set of Span Kinds as defined by the OpenTelemetry.
 */
export const enum eOTelSpanKind {
    /** Default value. Indicates that the span is used internally. */
    INTERNAL = 0,
  
    /**
     * Indicates that the span covers server-side handling of an RPC or other
     * remote request.
     */
    SERVER = 1,
  
    /**
     * Indicates that the span covers the client-side wrapper around an RPC or
     * other remote request.
     */
    CLIENT = 2,
  
    /**
     * Indicates that the span describes producer sending a message to a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */
    PRODUCER = 3,
  
    /**
     * Indicates that the span describes consumer receiving a message from a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */
    CONSUMER = 4,
}

/**
 * Creates an enum style object for the OTelSpanKind enum, providing the enum
 * values as properties of the object as both string and number types.
 * This allows for easy access to the enum values in a more readable format.
 */
export const OTelSpanKind = (/* @__PURE__ */createEnumStyle<typeof eOTelSpanKind>({
    INTERNAL: eOTelSpanKind.INTERNAL,
    SERVER: eOTelSpanKind.SERVER,
    CLIENT: eOTelSpanKind.CLIENT,
    PRODUCER: eOTelSpanKind.PRODUCER,
    CONSUMER: eOTelSpanKind.CONSUMER
}));
  
export type OTelSpanKind = number | eOTelSpanKind;
