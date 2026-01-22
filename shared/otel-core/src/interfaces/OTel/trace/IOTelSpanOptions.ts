import { OTelSpanKind } from "../../../enums/OTel/trace/OTelSpanKind";
import { IOTelAttributes } from "../IOTelAttributes";
import { OTelTimeInput } from "../time";
import { IOTelLink } from "./IOTelLink";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) SpanOptions
 * type. Where SpanOptions are options that can be used to configure a span.
 */
export interface IOTelSpanOptions {
    /**
     * The SpanKind of a span
     * @default {@link eOTelSpanKind.INTERNAL}
     */
    kind?: OTelSpanKind;
  
    /** A span's attributes */
    attributes?: IOTelAttributes;
  
    /** {@link IOTelLink}s span to other spans */
    links?: IOTelLink[];
  
    /** A manually specified start time for the created `Span` object. */
    startTime?: OTelTimeInput;
  
    /** The new span should be a root span. (Ignore parent from context). */
    root?: boolean;
}
