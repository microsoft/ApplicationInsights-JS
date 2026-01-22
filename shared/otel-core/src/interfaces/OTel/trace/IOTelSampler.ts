import { OTelSpanKind } from "../../../enums/OTel/trace/OTelSpanKind";
import { IOTelAttributes } from "../IOTelAttributes";
import { IOTelContext } from "../context/IOTelContext";
import { IOTelLink } from "./IOTelLink";
import { IOTelSamplingResult } from "./IOTelSamplingResult";

export interface IOTelSampler {
    /**
     * Checks whether span needs to be created and tracked.
     *
     * @param context - Parent Context which may contain a span.
     * @param traceId - The traceId of the span to be created. It can be different from the traceId
     * in the {@link IOTelSpanContext}. Typically in situations when the span to be created starts a new trace.
     * @param spanName - The name of the span to be created.
     * @param spanKind - The kind of the span to be created.
     * @param attributes - The initial set of Attributes for the Span being constructed.
     * @param links - The collection of links that will be associated with the Span to be created.
     * Typically useful for batch operations.
     * @returns a {@link IOTelSamplingResult}.
     */
    shouldSample(context: IOTelContext, traceId: string, spanName: string, spanKind: OTelSpanKind, attributes: IOTelAttributes, links: IOTelLink[]): IOTelSamplingResult;

    /** Returns the sampler name or short description with the configuration. */
    toString(): string;
}
