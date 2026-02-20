// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDistributedTraceInit } from "../../ai/IDistributedTraceContext";

/**
 * A SpanContext represents the portion of a {@link IOTelSpan} which must be
 * serialized and propagated along side of a {@link IOTelBaggage}.
 */
export interface IOTelSpanContext extends IDistributedTraceInit {

    /**
     * Trace flags to propagate.
     *
     * It is represented as 1 byte (bitmap). Bit to represent whether trace is
     * sampled or not. When set, the least significant bit documents that the
     * caller may have recorded trace data. A caller who does not record trace
     * data out-of-band leaves this flag unset.
     *
     * see {@link eW3CTraceFlags} for valid flag values.
     */
    traceFlags: number;
}
