// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelSpanKind } from "../../../enums/otel/OTelSpanKind";
import { OTelTimeInput } from "../../IOTelHrTime";
import { IOTelAttributes } from "../IOTelAttributes";
import { IOTelLink } from "./IOTelLink";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) SpanOptions
 * type. Where SpanOptions are options that can be used to configure a span.
 */
export interface IOTelSpanOptions {
    /**
     * The SpanKind of a span of this span, this is used to specify
     * the relationship between the span and its parent span.
     * @see {@link eOTelSpanKind} for possible values.
     * @default eOTelSpanKind.INTERNAL
     */
    kind?: OTelSpanKind;

    /**
     * A span's attributes
     */
    attributes?: IOTelAttributes;
  
    /** {@link IOTelLink}s span to other spans */
    links?: IOTelLink[];
  
    /** A manually specified start time for the created `Span` object. */
    startTime?: OTelTimeInput;
  
    /** The new span should be a root span. (Ignore parent from context). */
    root?: boolean;

    /** Specify whether the span should be a recording span, default is true */
    recording?: boolean;
}
