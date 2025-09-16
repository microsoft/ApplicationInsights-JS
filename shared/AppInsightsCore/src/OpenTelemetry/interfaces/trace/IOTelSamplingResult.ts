import { OTelSamplingDecision } from "../../enums/trace/OTelSamplingDecision";
import { IOTelAttributes } from "../IOTelAttributes";
import { IOTelTraceState } from "./IOTelTraceState";

/**
 * A sampling result contains a decision for a {@link IOTelSpan} and additional
 * attributes the sampler would like to added to the Span.
 */
export interface IOTelSamplingResult {
    /**
     * A sampling decision, refer to {@link eOTelSamplingDecision} for details.
     */
    decision: OTelSamplingDecision;
    
    /**
     * The list of attributes returned by SamplingResult MUST be immutable.
     * Caller may call {@link IOTelSampler}.shouldSample any number of times and
     * can safely cache the returned value.
     */
    attributes?: Readonly<IOTelAttributes>;

    /**
     * A {@link IOTelTraceState} that will be associated with the {@link IOTelSpan} through
     * the new {@link IOTelSpanContext}. Samplers SHOULD return the TraceState from
     * the passed-in {@link IOTelContext} if they do not intend to change it. Leaving
     * the value undefined will also leave the TraceState unchanged.
     */
    traceState?: IOTelTraceState;
  }