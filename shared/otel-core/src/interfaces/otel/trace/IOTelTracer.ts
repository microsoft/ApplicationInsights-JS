// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "../context/IOTelContext";
import { IOTelSpan } from "./IOTelSpan";
import { IOTelSpanOptions } from "./IOTelSpanOptions";
import { IReadableSpan } from "./IReadableSpan";

/**
 * OpenTelemetry tracer interface for creating and managing spans within a trace.
 *
 * A tracer is responsible for creating spans that represent units of work within a distributed system.
 * Each tracer is typically associated with a specific instrumentation library or component,
 * allowing for fine-grained control over how different parts of an application generate telemetry.
 *
 * @example
 * ```typescript
 * // Get a tracer instance
 * const tracer = otelApi.getTracer('my-service');
 *
 * // Create a simple span
 * const span = tracer.startSpan('database-query');
 * span.setAttribute('db.operation', 'SELECT');
 * span.end();
 *
 * // Create an active span with automatic context management
 * tracer.startActiveSpan('process-request', (span) => {
 *   span.setAttribute('request.id', '12345');
 *
 *   // Any spans created within this block will be children of this span
 *   processRequest();
 *
 *   span.end();
 * });
 * ```
 *
 * @see {@link IReadableSpan} - Interface for individual spans
 * @see {@link IOTelSpanOptions} - Configuration options for span creation
 * @see {@link IOTelContext}
 *
 * @since 3.4.0
 */
export interface IOTelTracer {
    /**
     * Creates and starts a new span without setting it as the active span in the current context.
     *
     * This method creates a span but does NOT modify the current execution context.
     * The caller is responsible for managing the span's lifecycle, including calling `end()`
     * when the operation completes.
     *
     * @param name - The name of the span, should be descriptive of the operation being traced
     * @param options - Optional configuration for span creation (parent context, attributes, etc.)
     * @param context - Optional context to use for extracting the parent span; if not provided, uses current context
     *
     * @returns The newly created span, or null if span creation failed
     *
     * @remarks
     * - The returned span must be manually ended by calling `span.end()`
     * - This span will not automatically become the parent for spans created in nested operations
     * - Use `startActiveSpan` if you want automatic context management
     *
     * @example
     * ```typescript
     * const span = tracer.startSpan('database-operation');
     * if (span) {
     *   try {
     *     span.setAttribute('db.table', 'users');
     *     span.setAttribute('db.operation', 'SELECT');
     *
     *     // Perform database operation
     *     const result = await db.query('SELECT * FROM users');
     *
     *     span.setAttributes({
     *       'db.rows_affected': result.length,
     *       'operation.success': true
     *     });
     *   } catch (error) {
     *     span.setStatus({
     *       code: SpanStatusCode.ERROR,
     *       message: error.message
     *     });
     *     span.recordException(error);
     *   } finally {
     *     span.end(); // Always end the span
     *   }
     * }
     * ```
     */
    startSpan(name: string, options?: IOTelSpanOptions): IReadableSpan | null;

    /**
     * Creates and starts a new span, sets it as the active span in the current context,
     * and executes a provided function within this context.
     *
     * This method creates a span, makes it active during the execution of the provided
     * function, and automatically ends the span when the function completes (or throws).
     * This provides automatic span lifecycle management and context propagation.
     *
     * @param name - The name of the span, should be descriptive of the operation being traced
     * @param options - Optional configuration for span creation (parent context, attributes, etc.)
     * @param fn - The function to execute within the span's active context
     *
     * @returns The result of executing the provided function
     *
     * @remarks
     * - The span is automatically ended when the function completes or throws an exception
     * - The span becomes the active parent for any spans created within the function
     * - If the function throws an error, the span status is automatically set to ERROR
     * - This is the recommended method for most tracing scenarios due to automatic lifecycle management
     * - Multiple overloads available for different parameter combinations
     *
     * @example
     * ```typescript
     * // Synchronous operation with just name and function
     * const result = tracer.startActiveSpan('user-service', (span) => {
     *   span.setAttribute('operation', 'get-user-details');
     *   return { user: getUserData(), timestamp: new Date().toISOString() };
     * });
     *
     * // With options
     * const result2 = tracer.startActiveSpan('database-query',
     *   { attributes: { 'db.table': 'users' } },
     *   (span) => {
     *     span.setAttribute('db.operation', 'SELECT');
     *     return database.getUser('123');
     *   }
     * );
     *
     * // With full context control
     * const result3 = tracer.startActiveSpan('external-api',
     *   { attributes: { 'service.name': 'payment-api' } },
     *   currentContext,
     *   async (span) => {
     *     try {
     *       const response = await fetch('/api/payment');
     *       span.setAttributes({
     *         'http.status_code': response.status,
     *         'operation.success': response.ok
     *       });
     *       return response.json();
     *     } catch (error) {
     *       span.setAttribute('error.type', error.constructor.name);
     *       throw error; // Error automatically recorded
     *     }
     *   }
     * );
     * ```
     */
    startActiveSpan<F extends (span: IOTelSpan | IReadableSpan) => unknown>(name: string, fn: F): ReturnType<F>;
    startActiveSpan<F extends (span: IOTelSpan | IReadableSpan) => unknown>(name: string, options: IOTelSpanOptions,fn: F ): ReturnType<F>;
    startActiveSpan<F extends (span: IOTelSpan | IReadableSpan) => unknown>(name: string,options: IOTelSpanOptions, context: IOTelContext, fn: F): ReturnType<F>;
  }
  
