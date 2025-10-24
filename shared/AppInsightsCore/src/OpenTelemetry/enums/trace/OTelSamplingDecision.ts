// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "@microsoft/applicationinsights-common";

/**
 * A sampling decision that determines how a {@link IOTelSpan} will be recorded
 * and collected.
 */
export const enum eOTelSamplingDecision {
    /**
     * `Span.isRecording() === false`, span will not be recorded and all events
     * and attributes will be dropped.
     */
    NOT_RECORD = 0,
    /**
     * `Span.isRecording() === true`, but `Sampled` flag in {@link eW3CTraceFlags}
     * MUST NOT be set.
     */
    RECORD = 1,
    /**
     * `Span.isRecording() === true` AND `Sampled` flag in {@link eW3CTraceFlags}
     * MUST be set.
     */
    RECORD_AND_SAMPLED = 2,
}

export const OTelSamplingDecision = (/* @__PURE__ */createEnumStyle<typeof eOTelSamplingDecision>({
    NOT_RECORD: eOTelSamplingDecision.NOT_RECORD,
    RECORD: eOTelSamplingDecision.RECORD,
    RECORD_AND_SAMPLED: eOTelSamplingDecision.RECORD_AND_SAMPLED
}));
export type OTelSamplingDecision = number | eOTelSamplingDecision;
