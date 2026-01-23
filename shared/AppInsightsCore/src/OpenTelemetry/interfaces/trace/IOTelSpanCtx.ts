import { IDistributedTraceContext } from "../../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { IOTelApi } from "../IOTelApi";
import { IOTelAttributes } from "../IOTelAttributes";
import { OTelException } from "../IOTelException";
import { OTelTimeInput } from "../IOTelHrTime";
import { IReadableSpan } from "./IReadableSpan";

/**
 * The context to use for creating a Span
 */
export interface IOTelSpanCtx {
    /**
     * The current {@link IOTelApi} instance that is being used.
     */
    api: IOTelApi;

    // /**
    //  * The current {@link IOTelResource} instance to use for this Span Context
    //  */
    // resource: IOTelResource;
    
    // /**
    //  * The current {@link IOTelInstrumentationScope} instrumentationScope instance to
    //  * use for this Span Context
    //  */
    // instrumentationScope: IOTelInstrumentationScope;

    // /**
    //  * The context for the current instance (not currently used)
    //  */
    // context?: IOTelContext;
    
    /*
     * The current {@link IDistributedTraceContext} instance to associated with the span
     * used to create the span.
     */
    spanContext: IDistributedTraceContext;

    /**
     * Identifies the user provided start time of the span
     */
    startTime?: OTelTimeInput;

    parentSpanContext?: IDistributedTraceContext;
    
    attributes?: IOTelAttributes;

    // links?: IOTelLink[];

    isRecording?: boolean;

    /**
     * When the span ends this callback will be called to process the specified Span and end it
     * @param span - The span to end
     * @param endTime - The end time of the span
     * @param duration - The duration of the span
     * @returns
     */
    onEnd?: (span: IReadableSpan) => void;

    /**
     * When an exception is recorded via the span's recordException API this callback will be called
     * to process the exception. Unlike the OpenTelemetry spec this callback also provides the span instance
     * to allow implementations to associate the exception with the span as needed.
     * It is also called immediately when recordException is called rather than waiting until the span ends.
     * @param exception - The exception to process
     * @param time - The time the exception occurred
     * @param span - The span associated with the exception
     * @returns
     */
    onException?: (exception: OTelException, time?: OTelTimeInput, span?: IReadableSpan) => void;
}
