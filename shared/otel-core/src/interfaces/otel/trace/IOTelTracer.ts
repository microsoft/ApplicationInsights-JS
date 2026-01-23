// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "../context/IOTelContext";
import { IOTelSpan } from "./IOTelSpan";
import { IOTelSpanOptions } from "./IOTelSpanOptions";

/**
 * Implementations of the ITracer definition is used to create and manage {@link IOTelSpan} or
 * {@link IReadableSpan} which track a trace.
 * @see {@link IOTelSpan}
 * @see {@link IOTelSpanOptions}
 * @see {@link IOTelContext}
 */
export interface IOTelTracer {
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
    startSpan(name: string, options?: IOTelSpanOptions, context?: IOTelContext): IOTelSpan;
  
    /**
     * Starts a new {@link IOTelSpan} and calls the given function passing it the
     * created span as first argument.
     * Additionally the new span gets set in context and this context is activated
     * for the duration of the function call.
     *
     * @param name - The name of the span
     * @param options - SpanOptions used for span creation
     * @param context - Context to use to extract parent
     * @param fn - function called in the context of the span and receives the newly created span as an argument
     * @returns return value of fn
     * @example
     * ```ts
     *     const something = tracer.startActiveSpan('op', span => {
     *       try {
     *         do some work
     *         span.setStatus({code: SpanStatusCode.OK});
     *         return something;
     *       } catch (err) {
     *         span.setStatus({
     *           code: SpanStatusCode.ERROR,
     *           message: err.message,
     *         });
     *         throw err;
     *       } finally {
     *         span.end();
     *       }
     *     });
     *```
     * @example
     * ```ts
     *     const span = tracer.startActiveSpan('op', span => {
     *       try {
     *         do some work
     *         return span;
     *       } catch (err) {
     *         span.setStatus({
     *           code: SpanStatusCode.ERROR,
     *           message: err.message,
     *         });
     *         throw err;
     *       }
     *     });
     *     do some more work
     *     span.end();
     * ```
     */
    startActiveSpan<F extends (span: IOTelSpan) => unknown>(name: string, fn: F): ReturnType<F>;
    startActiveSpan<F extends (span: IOTelSpan) => unknown>(name: string, options: IOTelSpanOptions,fn: F ): ReturnType<F>;
    startActiveSpan<F extends (span: IOTelSpan) => unknown>(name: string,options: IOTelSpanOptions, context: IOTelContext, fn: F): ReturnType<F>;
  }
  
