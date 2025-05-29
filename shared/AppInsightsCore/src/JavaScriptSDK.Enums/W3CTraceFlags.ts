// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The TelemetryUpdateReason enumeration contains a set of bit-wise values that specify the reason for update request.
 */
export const enum eW3CTraceFlags  {
    /**
     * No sampling decision has been made.
     */
    None = 0,

    /**
     * Represents that the trace has been sampled.
     * @remarks This value is used to indicate that the trace has been sampled.
     */
    Sampled = 1
}
