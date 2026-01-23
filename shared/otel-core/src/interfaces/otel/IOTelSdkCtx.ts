// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "./context/IOTelContext";
import { IOTelSpanOptions } from "./trace/IOTelSpanOptions";
import { IOTelTracer } from "./trace/IOTelTracer";
import { IOTelTracerOptions } from "./trace/IOTelTracerOptions";
import { IReadableSpan } from "./trace/IReadableSpan";

/**
 * The context for the current IOTelSdk instance and it's configuration
 */
export interface IOTelSdkCtx {
    /**
     * The current {@link IOTelApi} instance that is being used.
     */
    //api: IOTelApi;

    /**
     * The current {@link IOTelContext} for the current IOTelSdk instance
     */
    context: IOTelContext;

    // -------------------------------------------------
    // Trace Support
    // -------------------------------------------------

    /**
     * Returns a Tracer, creating one if one with the given name and version is
     * not already created. This may return
     * - The same Tracer instance if one has already been created with the same name and version
     * - A new Tracer instance if one has not already been created with the same name and version
     * - A non-operational Tracer if the provider is not operational
     *
     * @param name - The name of the tracer or instrumentation library.
     * @param version - The version of the tracer or instrumentation library.
     * @param options - The options of the tracer or instrumentation library.
     * @returns Tracer A Tracer with the given name and version
     */
    getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;

    /**
     * Starts a new {@link IOTelSpan}. Start the span without setting it on context.
     *
     * This method do NOT modify the current Context.
     *
     * @param name - The name of the span
     * @param options - SpanOptions used for span creation
     * @param context - Context to use to extract parent
     * @returns Span The newly created span
     * @example
     *     const span = tracer.startSpan('op');
     *     span.setAttribute('key', 'value');
     *     span.end();
     */
    startSpan: (name: string, options?: IOTelSpanOptions, context?: IOTelContext) => IReadableSpan;
}
