import { IOTelContext } from "../context/IOTelContext";
import { IOTelSpan } from "./IOTelSpan";
import { IOTelSpanContext } from "./IOTelSpanContext";
import { IOTelTracer } from "./IOTelTracer";
import { IOTelTracerOptions } from "./IOTelTracerOptions";
import { IOTelTracerProvider } from "./IOTelTracerProvider";

/**
 * IOTelTraceApi provides an interface definition for the OpenTelemetry TraceAPI
 */
export interface IOTelTraceApi {
    /**
     * Set the current global tracer for the current API instance.
     * @param provider - The {@link IOTelTracerProvider} to be set as the global tracer provider for this API instance
     *
     * @returns true if the tracer provider was successfully registered, else false
     */
    setGlobalTracerProvider(provider: IOTelTracerProvider): boolean;

    /**
     * Returns the global tracer provider for this API instance.
     */
    getTracerProvider(): IOTelTracerProvider;

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
     * Remove the global tracer provider from this API instance
     */
    disable(): void;

    /**
     * Wrap the given {@link IOTelSpanContext} in a new non-recording {@link IOTelSpan}
     *
     * @param spanContext - The {@link IOTelSpanContext} to be wrapped
     * @returns a new non-recording {@link IOTelSpan} with the provided context
     */
    wrapSpanContext(spanContext: IOTelSpanContext): IOTelSpan;

    /**
     * Returns true if this {@link IOTelSpanContext} is valid.
     * @return true if this {@link IOTelSpanContext} is valid.
     */
    isSpanContextValid(spanContext: IOTelSpanContext): boolean;

    /**
     * Remove current span stored in the context
     *
     * @param context - The {@link IOTelContext} to delete span from
     */
    deleteSpan(context: IOTelContext): IOTelContext;

    /**
     * Return the span if one exists
     *
     * @param context - The {@link IOTelContext} to get span from
     */
    getSpan(context: IOTelContext): IOTelSpan | undefined;
  
    /**
     * Gets the span from the current context, if one exists.
     */
    getActiveSpan(): IOTelSpan | undefined;
  
    /**
     * Wrap span context in a NoopSpan and set as span in a new
     * context
     *
     * @param context - The {@link IOTelContext} to set active span on
     * @param spanContext - The {@link IOTelSpanContext} to be wrapped
     */
    setSpanContext(context: IOTelContext, spanContext: IOTelSpanContext): IOTelContext;
  
    /**
     * Get the span context of the span if it exists.
     *
     * @param context - The {@Link IOTelContext} to get values from
     */
    getSpanContext(context: IOTelContext): IOTelSpanContext | undefined

    /**
     * Set the span on a context
     *
     * @param context - The {@link IOTelContext} to use as parent
     * @param span - The {@link IOTelSpan} to set as the active span for the context
     */
    setSpan(context: IOTelContext, span: IOTelSpan): IOTelContext;
}
