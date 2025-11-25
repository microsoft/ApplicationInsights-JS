

/**
 * Configuration interface for OpenTelemetry error handling callbacks.
 * Provides hooks to customize how different types of errors and diagnostic
 * messages are handled within the OpenTelemetry system.
 * 
 * @example
 * ```typescript
 * const errorHandlers: IOTelErrorHandlers = {
 *   attribError: (message, key, value) => {
 *     console.warn(`Attribute error for ${key}:`, message);
 *   },
 *   spanError: (message, spanName) => {
 *     logger.error(`Span ${spanName} error:`, message);
 *   },
 *   warn: (message) => {
 *     logger.warn(message);
 *   },
 *   error: (message) => {
 *     logger.error(message);
 *   }
 * };
 * ```
 * 
 * @remarks
 * If handlers are not provided, default behavior will be used:
 * - `attribError`: Throws an `OTelInvalidAttributeError`
 * - `spanError`: Logs to console or calls warn handler
 * - `debug`: Logs to console.log
 * - `warn`: Logs to console.warn
 * - `error`: Logs to console.error
 * - `notImplemented`: Logs to console.error
 * 
 * @since 3.4.0
 */
export interface IOTelErrorHandlers {
    /**
     * Handles attribute-related errors, such as invalid attribute values or keys.
     * Called when an attribute operation fails validation or processing.
     * 
     * @param message - Descriptive error message explaining what went wrong
     * @param key - The attribute key that caused the error
     * @param value - The attribute value that caused the error (may be of any type)
     * 
     * @remarks
     * Common scenarios that trigger this handler:
     * - Invalid attribute key format
     * - Attribute value exceeds length limits
     * - Unsupported attribute value type
     * - Attribute count exceeds limits
     * 
     * @default Throws an `OTelInvalidAttributeError`
     * 
     * @example
     * ```typescript
     * attribError: (message, key, value) => {
     *   metrics.increment('otel.attribute.errors', { key, type: typeof value });
     *   logger.warn(`Attribute ${key} rejected: ${message}`);
     * }
     * ```
     */
    attribError?: (message: string, key: string, value: any) => void;

    /**
     * Handles span-related errors that occur during span operations.
     * Called when a span operation fails or encounters an unexpected condition.
     * 
     * @param message - Descriptive error message explaining the span error
     * @param spanName - The name of the span that encountered the error
     * 
     * @remarks
     * Common scenarios that trigger this handler:
     * - Span operation called on an ended span
     * - Invalid span configuration
     * - Span processor errors
     * - Context propagation failures
     * 
     * @default Logs to console or calls the warn handler
     * 
     * @example
     * ```typescript
     * spanError: (message, spanName) => {
     *   metrics.increment('otel.span.errors', { span_name: spanName });
     *   logger.error(`Span operation failed for "${spanName}": ${message}`);
     * }
     * ```
     */
    spanError?: (message: string, spanName: string) => void;

    /**
     * Handles debug-level diagnostic messages.
     * Used for detailed troubleshooting information that is typically
     * only relevant during development or when diagnosing issues.
     * 
     * @param message - Debug message to be handled
     * 
     * @remarks
     * Debug messages are typically:
     * - Verbose operational details
     * - Internal state information
     * - Performance metrics
     * - Development-time diagnostics
     * 
     * @default Logs to console.log
     * 
     * @example
     * ```typescript
     * debug: (message) => {
     *   if (process.env.NODE_ENV === 'development') {
     *     console.debug('[OTel Debug]', message);
     *   }
     * }
     * ```
     */
    debug?: (message: string) => void;

    /**
     * Handles warning-level messages for non-fatal issues.
     * Used for conditions that are unusual but don't prevent continued operation.
     * 
     * @param message - Warning message to be handled
     * 
     * @remarks
     * Warning scenarios include:
     * - Configuration issues that fall back to defaults
     * - Performance degradation
     * - Deprecated API usage
     * - Resource limit approaches
     * 
     * @default Logs to console.warn
     * 
     * @example
     * ```typescript
     * warn: (message) => {
     *   logger.warn('[OTel Warning]', message);
     *   metrics.increment('otel.warnings');
     * }
     * ```
     */
    warn?: (message: string) => void;

    /**
     * Handles general error conditions that may affect functionality.
     * Used for significant errors that should be investigated but may not be fatal.
     * 
     * @param message - Error message to be handled
     * 
     * @remarks
     * Error scenarios include:
     * - Failed network requests
     * - Configuration validation failures
     * - Resource allocation failures
     * - Unexpected runtime conditions
     * 
     * @default Logs to console.error
     * 
     * @example
     * ```typescript
     * error: (message) => {
     *   logger.error('[OTel Error]', message);
     *   errorReporting.captureException(new Error(message));
     * }
     * ```
     */
    error?: (message: string) => void;

    /**
     * Handles errors related to unimplemented functionality.
     * Called when a method or feature is not yet implemented or is intentionally
     * disabled in the current configuration.
     * 
     * @param message - Message describing the unimplemented functionality
     * 
     * @remarks
     * Common scenarios:
     * - Placeholder methods that haven't been implemented
     * - Features disabled in the current build
     * - Platform-specific functionality not available
     * - Optional features not included in the configuration
     * 
     * @default Logs to console.error
     * 
     * @example
     * ```typescript
     * notImplemented: (message) => {
     *   logger.warn(`[OTel Not Implemented] ${message}`);
     *   if (process.env.NODE_ENV === 'development') {
     *     console.trace('Not implemented method called');
     *   }
     * }
     * ```
     */
    notImplemented?: (message: string) => void;
}
