// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDistributedTraceContext } from "../../..";
import { IDistributedTraceInit } from "../../ai/IDistributedTraceContext";
import { ISpanScope } from "../../ai/ITraceProvider";
import { IOTelContext } from "../context/IOTelContext";
import { IOTelSpan } from "./IOTelSpan";
import { IOTelSpanContext } from "./IOTelSpanContext";
import { IOTelTracer } from "./IOTelTracer";
import { IOTelTracerOptions } from "./IOTelTracerOptions";
import { IOTelTracerProvider } from "./IOTelTracerProvider";
import { IReadableSpan } from "./IReadableSpan";

/**
 * ITraceApi provides an interface definition which is simular to the OpenTelemetry TraceAPI
 */
export interface ITraceApi {
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
     * Wrap the given {@link IDistributedTraceContext} in a new non-recording {@link IReadableSpan}
     *
     * @param spanContext - The {@link IDistributedTraceContext} to be wrapped
     * @returns a new non-recording {@link IReadableSpan} with the provided context
     */
    wrapSpanContext(spanContext: IDistributedTraceContext | IDistributedTraceInit | IOTelSpanContext): IReadableSpan;

    /**
     * Returns true if this {@link IDistributedTraceContext} is valid.
     * @return true if this {@link IDistributedTraceContext} is valid.
     */
    isSpanContextValid(spanContext: IDistributedTraceContext | IDistributedTraceInit | IOTelSpanContext): boolean;

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
    getSpan(context: IOTelContext): IReadableSpan | undefined;
  
    /**
     * Gets the span from the current context, if one exists.
     */
    getActiveSpan(): IReadableSpan | undefined | null;
  
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
    getSpanContext(context: IOTelContext): IDistributedTraceContext | undefined

    /**
     * Set the span on a context
     *
     * @param context - The {@link IOTelContext} to use as parent
     * @param span - The {@link IOTelSpan} to set as the active span for the context
     */
    setSpan(context: IOTelContext, span: IOTelSpan): IOTelContext;
    
    /**
     * Set or clear the current active span.
     * @param span - The span to set as the active span, or null/undefined to clear the active span.
     * @return An ISpanScope instance returned by the host, or void if there is no defined host.
     */
    setActiveSpan(span: IReadableSpan | undefined | null): ISpanScope | undefined | null;
}
