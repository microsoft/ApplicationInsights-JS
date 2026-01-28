// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Interface for telemetry trace context.
 * @deprecated Use the core getTraceCtx method instead to get / set the current trace context, this is required to
 * support distributed tracing and allows the core to manage the trace context.
 */
export interface ITelemetryTrace {
    /**
     * Trace id
     */
    traceID?: string;

    /**
     * Parent id
     */
    parentID?: string;

    /**
     * An integer representation of the W3C TraceContext trace-flags. https://www.w3.org/TR/trace-context/#trace-flags
     */
    traceFlags?: number;

    /**
     * Name
     */
    name?: string;
}
