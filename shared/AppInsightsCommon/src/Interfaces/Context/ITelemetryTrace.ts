// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
