import {
    IOTelAttributes, IOTelContext, IOTelInstrumentationScope, IOTelLink, IOTelResource, IOTelSpanContext, IReadableSpan, OTelTimeInput
} from "@microsoft/applicationinsights-core-js";
import { IOTelApi } from "../IOtelApi";

/**
 * The context to use for creating a Span
 */
export interface IOTelSpanCtx {
    /**
     * The current {@link IOTelApi} instance that is being used.
     */
    api: IOTelApi;

    /**
     * The current {@link IOTelResource} instance to use for this Span Context
     */
    resource: IOTelResource;
    
    /**
     * The current {@link IOTelInstrumentationScope} instrumentationScope instance to
     * use for this Span Context
     */
    instrumentationScope: IOTelInstrumentationScope;

    /**
     * The context for the current instance
     */
    context: IOTelContext;
    
    /*
     * The current {@link IOTelSpanContext} instance to associated with the span
     * used to create the span.
     */
    spanContext: IOTelSpanContext;

    /**
     * Identifies the user provided start time of the span
     */
    startTime?: OTelTimeInput;

    parentSpanContext?: IOTelSpanContext;
    
    attributes?: IOTelAttributes;

    links?: IOTelLink[]

    isRecording?: boolean;

    /**
     * When the span ends this callback will be called to process the specified Span and end it
     * @param span - The span to end
     * @param endTime - The end time of the span
     * @param duration - The duration of the span
     * @returns
     */
    onEnd?: (span: IReadableSpan) => void;
}
