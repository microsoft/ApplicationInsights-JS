// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IDistributedTraceContext {

    /**
     * Returns the current name of the page
     */
    getName(): string;

    /**
     * Sets the current name of the page
     * @param pageName
     */
    setName(pageName: string): void;

    /**
     * Returns the unique identifier for a trace. All requests / spans from the same trace share the same traceId.
     * Must be read from incoming headers or generated according to the W3C TraceContext specification,
     * in a hex representation of 16-byte array. A.k.a. trace-id, TraceID or Distributed TraceID
     */
    getTraceId(): string;

    /**
     * Set the unique identifier for a trace. All requests / spans from the same trace share the same traceId.
     * Must be conform to the W3C TraceContext specification, in a hex representation of 16-byte array.
     * A.k.a. trace-id, TraceID or Distributed TraceID https://www.w3.org/TR/trace-context/#trace-id
     */
    setTraceId(newValue: string): void;

    /**
     * Self-generated 8-bytes identifier of the incoming request. Must be a hex representation of 8-byte array.
     * Also know as the parentId, used to link requests together
     */
    getSpanId(): string;

    /**
     * Self-generated 8-bytes identifier of the incoming request. Must be a hex representation of 8-byte array.
     * Also know as the parentId, used to link requests together
     * https://www.w3.org/TR/trace-context/#parent-id
     */
    setSpanId(newValue: string): void;

    /**
     * An integer representation of the W3C TraceContext trace-flags.
     */
    getTraceFlags(): number | undefined;

    /**
     * https://www.w3.org/TR/trace-context/#trace-flags
     * @param newValue
     */
    setTraceFlags(newValue?: number): void;
}
