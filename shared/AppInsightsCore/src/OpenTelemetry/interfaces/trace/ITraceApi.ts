import { IDistributedTraceContext } from "../../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { IOTelTracer } from "./IOTelTracer";
import { IOTelTracerOptions } from "./IOTelTracerProvider";
import { IReadableSpan } from "./IReadableSpan";

/**
 * ITraceApi provides an interface definition which is simular to the OpenTelemetry TraceAPI
 */
export interface ITraceApi {
    /**
     * Returns a Tracer, creating one if one with the given name and version
     * if one has not already created.
     *
     * @param name - The name of the tracer or instrumentation library.
     * @param version - The version of the tracer or instrumentation library.
     * @param options - The options of the tracer or instrumentation library.
     * @returns Tracer A Tracer with the given name and version
     */
    getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;

    /**
     * Wrap the given {@link IDistributedTraceContext} in a new non-recording {@link IReadableSpan}
     *
     * @param spanContext - The {@link IDistributedTraceContext} to be wrapped
     * @returns a new non-recording {@link IReadableSpan} with the provided context
     */
    wrapSpanContext(spanContext: IDistributedTraceContext): IReadableSpan;

    /**
     * Returns true if this {@link IDistributedTraceContext} is valid.
     * @return true if this {@link IDistributedTraceContext} is valid.
     */
    isSpanContextValid(spanContext: IDistributedTraceContext): boolean;

    /**
     * Gets the span from the current context, if one exists.
     */
    getActiveSpan(): IReadableSpan | undefined | null;

    /**
     * Set or clear the current active span.
     * @param span 
     */
    setActiveSpan(span: IReadableSpan | undefined | null): void;
}
