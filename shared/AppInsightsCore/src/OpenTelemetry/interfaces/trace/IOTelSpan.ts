// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IAttributeContainer, IDistributedTraceContext } from "../../../applicationinsights-core-js";
import { IOTelAttributes, OTelAttributeValue } from "../IOTelAttributes";
import { OTelException } from "../IOTelException";
import { OTelTimeInput } from "../IOTelHrTime";
import { IOTelSpanStatus } from "./IOTelSpanStatus";

/**
 * Provides an OpenTelemetry compatible interface for spans conforming to the OpenTelemetry API specification (v1.9.0).
 * 
 * A span represents an operation within a trace and is the fundamental unit of work in distributed tracing.
 * Spans can be thought of as a grouping mechanism for a set of operations that are executed as part of
 * a single logical unit of work, providing timing information and contextual data about the operation.
 * 
 * Spans form a tree structure within a trace, with a single root span that may have zero or more child spans,
 * which in turn may have their own children. This hierarchical structure allows for detailed analysis of
 * complex, multi-step operations across distributed systems.
 * 
 * @since 3.4.0
 * 
 * @remarks
 * - All spans created by this library implement the ISpan interface and extend the IReadableSpan interface
 * - Spans should be ended by calling `end()` when the operation completes
 * - Once ended, spans should generally not be used for further operations
 * - Spans automatically track timing information from creation to end
 * 
 * @example
 * ```typescript
 * // Basic span usage
 * const span = tracer.startSpan('user-authentication');
 * span.setAttribute('user.id', '12345');
 * span.setAttribute('auth.method', 'oauth2');
 * 
 * try {
 *   const result = await authenticateUser();
 *   span.setStatus({ code: SpanStatusCode.OK });
 *   span.setAttribute('auth.success', true);
 * } catch (error) {
 *   span.recordException(error);
 *   span.setStatus({ 
 *     code: SpanStatusCode.ERROR, 
 *     message: 'Authentication failed' 
 *   });
 * } finally {
 *   span.end();
 * }
 * ```
 */
export interface IOTelSpan {
    /**
     * Returns the span context object associated with this span.
     *
     * The span context is an immutable, serializable identifier that uniquely identifies
     * this span within a trace. It contains the trace ID, span ID, and trace flags that
     * can be used to create new child spans or propagate trace context across process boundaries.
     *
     * The returned span context remains valid even after the span has ended, making it
     * useful for asynchronous operations and cross-service communication.
     *
     * @returns The immutable span context associated with this span
     *
     * @remarks
     * - The span context is the primary mechanism for trace propagation
     * - Context can be serialized and transmitted across network boundaries
     * - Contains trace ID (unique to the entire trace) and span ID (unique to this span)
     *
     * @example
     * ```typescript
     * const span = tracer.startSpan('parent-operation');
     * const spanContext = span.spanContext();
     *
     * // Use context to create child spans in other parts of the system
     * const childSpan = tracer.startSpan('child-operation', {
     *   parent: spanContext
     * });
     *
     * // Context can be serialized for cross-service propagation
     * const traceId = spanContext.traceId;
     * const spanId = spanContext.spanId;
     * ```
     */
    spanContext(): IDistributedTraceContext;
  
    /**
     * Sets a single attribute on the span with the specified key and value.
     * 
     * Attributes provide contextual information about the operation represented by the span.
     * They are key-value pairs that help with filtering, grouping, and understanding spans
     * in trace analysis tools. Attributes should represent meaningful properties of the operation.
     * 
     * @param key - The attribute key, should be descriptive and follow naming conventions
     * @param value - The attribute value; null or undefined values are invalid and result in undefined behavior
     * 
     * @returns This span instance for method chaining
     * 
     * @remarks
     * - Attribute keys should follow semantic conventions when available
     * - Common attributes include service.name, http.method, db.statement, etc.
     * - Setting null or undefined values is invalid and may cause unexpected behavior
     * - Attributes set after span creation don't affect sampling decisions
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('http-request');
     * 
     * // Set individual attributes with descriptive keys
     * span.setAttribute('http.method', 'POST')
     *     .setAttribute('http.url', 'https://api.example.com/users')
     *     .setAttribute('http.status_code', 201)
     *     .setAttribute('user.id', '12345')
     *     .setAttribute('request.size', 1024);
     * ```
     */
    setAttribute(key: string, value: OTelAttributeValue): this;
  
    /**
     * Sets multiple attributes on the span at once using an attributes object.
     * 
     * This method allows efficient batch setting of multiple attributes in a single call.
     * All attributes in the provided object will be added to the span, supplementing any
     * existing attributes (duplicate keys will be overwritten).
     * 
     * @param attributes - An object containing key-value pairs to set as span attributes
     * 
     * @returns This span instance for method chaining
     * 
     * @remarks
     * - Null or undefined attribute values are invalid and will result in undefined behavior
     * - More efficient than multiple `setAttribute` calls for bulk operations
     * - Existing attributes with the same keys will be overwritten
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('database-query');
     * 
     * // Set multiple attributes efficiently
     * span.setAttributes({
     *   'db.system': 'postgresql',
     *   'db.name': 'user_database',
     *   'db.table': 'users',
     *   'db.operation': 'SELECT',
     *   'db.rows_affected': 5,
     *   'query.duration_ms': 15.7
     * });
     * ```
     */
    setAttributes(attributes: IOTelAttributes): this;
  
    /**
     * The {@link IAttributeContainer | attribute container} associated with this span, providing
     * advanced attribute management capabilities. Rather than using the {@link IReadableSpan#attributes}
     * directly which returns a readonly {@link IOTelAttributes} map that is a snapshot of the attributes at
     * the time of access, the attribute container offers methods to get, set, delete, and iterate over attributes
     * with fine-grained control.
     * It is recommended that you only access the {@link IReadableSpan#attributes} property sparingly due to the
     * performance cost of taking a snapshot of all attributes.
     */
    readonly attribContainer: IAttributeContainer;

    // /**
    //  * Adds an event to the span with optional attributes and timestamp.
    //  * 
    //  * **Note: This method is currently not implemented and events will be dropped.**
    //  * 
    //  * Events represent significant points in time during the span's execution.
    //  * They provide additional context about what happened during the operation,
    //  * such as cache hits/misses, validation steps, or other notable occurrences.
    //  * 
    //  * @param name - The name of the event, should be descriptive of what occurred
    //  * @param attributesOrStartTime - Event attributes object, or start time if third parameter is undefined
    //  * @param startTime - Optional start time of the event; if not provided, current time is used
    //  * 
    //  * @returns This span instance for method chaining
    //  * 
    //  * @remarks
    //  * - **Current implementation drops events - not yet supported**
    //  * - Events are timestamped occurrences within a span's lifecycle
    //  * - Useful for marking significant points like cache hits, retries, or validation steps
    //  * - Should not be used for high-frequency events due to performance impact
    //  * 
    //  * @example
    //  * ```typescript
    //  * const span = tracer.startSpan('user-registration');
    //  * 
    //  * // Add events to mark significant points
    //  * span.addEvent('validation.started')
    //  *     .addEvent('validation.completed', { 
    //  *       'validation.result': 'success',
    //  *       'validation.duration_ms': 23 
    //  *     })
    //  *     .addEvent('database.save.started')
    //  *     .addEvent('database.save.completed', {
    //  *       'db.rows_affected': 1
    //  *     });
    //  * ```
    //  */
    // addEvent(name: string, attributesOrStartTime?: IOTelAttributes | OTelTimeInput, startTime?: OTelTimeInput): this;
  
    // /**
    //  * Adds a single link to the span connecting it to another span.
    //  * 
    //  * **Note: This method is currently not implemented and links will be dropped.**
    //  * 
    //  * Links establish relationships between spans that are not in a typical parent-child
    //  * relationship. They are useful for connecting spans across different traces or
    //  * for representing batch operations where multiple spans are related but not nested.
    //  * 
    //  * @param link - The link object containing span context and optional attributes
    //  * 
    //  * @returns This span instance for method chaining
    //  * 
    //  * @remarks
    //  * - **Current implementation drops links - not yet supported**
    //  * - Links added after span creation do not affect sampling decisions
    //  * - Prefer adding links during span creation when possible
    //  * - Useful for batch operations, fan-out scenarios, or cross-trace relationships
    //  * 
    //  * @example
    //  * ```typescript
    //  * const span = tracer.startSpan('batch-processor');
    //  * 
    //  * // Link to related spans from a batch operation
    //  * span.addLink({
    //  *   context: relatedSpan.spanContext(),
    //  *   attributes: {
    //  *     'link.type': 'batch_item',
    //  *     'batch.index': 1
    //  *   }
    //  * });
    //  * ```
    //  */
    // addLink(link: IOTelLink): this;

    // /**
    //  * Adds multiple links to the span in a single operation.
    //  * 
    //  * **Note: This method is currently not implemented and links will be dropped.**
    //  * 
    //  * This is an efficient way to establish multiple relationships between this span
    //  * and other spans. Particularly useful for batch operations, fan-out scenarios,
    //  * or when a single operation needs to reference multiple related operations.
    //  * 
    //  * @param links - An array of link objects to add to the span
    //  * 
    //  * @returns This span instance for method chaining
    //  * 
    //  * @remarks
    //  * - **Current implementation drops links - not yet supported**
    //  * - More efficient than multiple `addLink` calls for bulk operations
    //  * - Links added after span creation do not affect sampling decisions
    //  * - Consider span creation time linking for sampling-sensitive scenarios
    //  * 
    //  * @example
    //  * ```typescript
    //  * const span = tracer.startSpan('aggregate-results');
    //  * 
    //  * // Link to multiple related spans from parallel operations
    //  * span.addLinks([
    //  *   {
    //  *     context: span1.spanContext(),
    //  *     attributes: { 'operation.type': 'data_fetch', 'source': 'database' }
    //  *   },
    //  *   {
    //  *     context: span2.spanContext(), 
    //  *     attributes: { 'operation.type': 'data_fetch', 'source': 'cache' }
    //  *   },
    //  *   {
    //  *     context: span3.spanContext(),
    //  *     attributes: { 'operation.type': 'data_transform', 'stage': 'preprocessing' }
    //  *   }
    //  * ]);
    //  * ```
    //  */
    // addLinks(links: IOTelLink[]): this;

    /**
     * Sets the status of the span to indicate the success or failure of the operation.
     * 
     * The span status provides a standardized way to indicate whether the operation
     * completed successfully, encountered an error, or is in an unknown state.
     * This status is used by observability tools to provide meaningful insights
     * about system health and operation outcomes.
     * 
     * @param status - The status object containing code and optional message
     * 
     * @returns This span instance for method chaining
     * 
     * @remarks
     * - Default status is UNSET until explicitly set
     * - Setting status overrides any previous status values
     * - ERROR status should be accompanied by a descriptive message when possible
     * - Status should reflect the final outcome of the operation
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('payment-processing');
     * 
     * try {
     *   const result = await processPayment(paymentData);
     *   
     *   // Indicate successful completion
     *   span.setStatus({ 
     *     code: SpanStatusCode.OK 
     *   });
     *   
     * } catch (error) {
     *   // Indicate operation failed
     *   span.setStatus({ 
     *     code: SpanStatusCode.ERROR, 
     *     message: 'Payment processing failed: ' + error.message 
     *   });
     *   
     *   span.recordException(error);
     * }
     * ```
     */
    setStatus(status: IOTelSpanStatus): this;
  
    /**
     * Updates the name of the span, overriding the name provided during creation.
     * 
     * Span names should be descriptive and represent the operation being performed.
     * Updating the name can be useful when the operation's scope becomes clearer
     * during execution, or when implementing generic spans that need specific naming
     * based on runtime conditions.
     * 
     * @param name - The new name for the span, should be descriptive of the operation
     * 
     * @returns This span instance for method chaining
     * 
     * @remarks
     * - Name updates may affect sampling behavior depending on implementation
     * - Choose names that are meaningful but not too specific to avoid cardinality issues
     * - Follow naming conventions consistent with your observability strategy
     * - Consider the impact on existing traces and dashboards when changing names
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('generic-operation');
     * 
     * // Update name based on runtime determination
     * if (operationType === 'user-registration') {
     *   span.updateName('user-registration');
     *   span.setAttribute('operation.type', 'registration');
     * } else if (operationType === 'user-login') {
     *   span.updateName('user-authentication');
     *   span.setAttribute('operation.type', 'authentication');
     * }
     * ```
     */
    updateName(name: string): this;
  
    /**
     * Marks the end of the span's execution and records the end timestamp.
     * 
     * This method finalizes the span and makes it available for export to tracing systems.
     * Once ended, the span should not be used for further operations. The span's duration
     * is calculated from its start time to the end time provided or current time.
     * 
     * @param endTime - Optional end time; if not provided, current time is used
     * 
     * @remarks
     * - This method does NOT return `this` to discourage chaining after span completion
     * - Ending a span has no effect on child spans, which may continue running
     * - Child spans can be ended independently after their parent has ended
     * - The span becomes eligible for export once ended
     * - Calling end() multiple times has no additional effect
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('file-processing');
     * 
     * try {
     *   // Perform the operation
     *   const result = await processFile(filePath);
     *   
     *   // Record success
     *   span.setStatus({ code: SpanStatusCode.OK });
     *   span.setAttribute('file.size', result.size);
     *   
     * } catch (error) {
     *   span.recordException(error);
     *   span.setStatus({ 
     *     code: SpanStatusCode.ERROR, 
     *     message: error.message 
     *   });
     * } finally {
     *   // Always end the span
     *   span.end();
     *   // Don't use span after this point
     * }
     * 
     * // Custom end time example
     * const customEndTime = Date.now() * 1000000; // nanoseconds
     * span.end(customEndTime);
     * ```
     */
    end(endTime?: OTelTimeInput): void;
  
    /**
     * Returns whether this span is actively recording information.
     * 
     * A recording span accepts and stores attributes, events, status, and other span data.
     * Non-recording spans (typically due to sampling decisions) may ignore operations
     * like setAttribute() to optimize performance. This method allows conditional
     * logic to avoid expensive operations on non-recording spans.
     * 
     * @returns True if the span is actively recording information, false otherwise
     * 
     * @remarks
     * - Recording status is typically determined at span creation time
     * - Non-recording spans still provide valid span context for propagation
     * - Use this check to avoid expensive attribute calculations for non-recording spans
     * - Recording status remains constant throughout the span's lifetime
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('data-processing');
     * 
     * // Only perform expensive operations if span is recording
     * if (span.isRecording()) {
     *   const metadata = await expensiveMetadataCalculation();
     *   span.setAttributes({
     *     'process.metadata': JSON.stringify(metadata),
     *     'process.complexity': metadata.complexity,
     *     'process.estimated_duration': metadata.estimatedMs
     *   });
     * }
     * 
     * // Always safe to set basic attributes
     * span.setAttribute('process.started', true);
     * ```
     */
    isRecording(): boolean;
  
    /**
     * Records an exception as a span event with automatic error status handling.
     * 
     * This method captures exception information and automatically creates a span event
     * with standardized exception attributes. It's the recommended way to handle errors
     * within spans, providing consistent error reporting across the application.
     * 
     * @param exception - The exception to record; accepts string messages or Error objects
     * @param time - Optional timestamp for when the exception occurred; defaults to current time
     * 
     * @remarks
     * - Automatically extracts exception type, message, and stack trace when available
     * - Creates a standardized span event with exception details
     * - Does NOT automatically set span status to ERROR - call setStatus() explicitly if needed
     * - Exception events are useful for debugging and error analysis
     * 
     * @example
     * ```typescript
     * const span = tracer.startSpan('risky-operation');
     * 
     * try {
     *   await performRiskyOperation();
     *   span.setStatus({ code: SpanStatusCode.OK });
     *   
     * } catch (error) {
     *   // Record the exception details
     *   span.recordException(error);
     *   
     *   // Explicitly set error status
     *   span.setStatus({ 
     *     code: SpanStatusCode.ERROR, 
     *     message: 'Operation failed due to: ' + error.message 
     *   });
     *   
     *   // Re-throw if needed
     *   throw error;
     * } finally {
     *   span.end();
     * }
     * 
     * // Recording string exceptions
     * span.recordException('Custom error message occurred');
     * 
     * // Recording with custom timestamp
     * const errorTime = Date.now() * 1000000; // nanoseconds
     * span.recordException(error, errorTime);
     * ```
     */
    recordException(exception: OTelException, time?: OTelTimeInput): void;
}
