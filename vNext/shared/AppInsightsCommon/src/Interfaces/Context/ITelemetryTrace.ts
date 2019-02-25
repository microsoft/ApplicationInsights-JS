// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface ITelemetryTrace {
    /**
     * Trace id
     */
    traceID: string;

    /**
     * Parent id
     */
    parentID: string;

    /**
     * Trace state
     */
    traceState?: ITraceState;
}

export interface ITraceState {
}