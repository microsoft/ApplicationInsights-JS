

export interface IOTelErrorHandlers {
    /**
     * Handle / report an error.
     * When not provided the default is to generally throw an {@link OTelInvalidAttributeError}
     * @param message - the message to report
     * @param key - the key that caused the error
     * @param value - the value that caused the error
     */

    attribError?: (message: string, key: string, value: any) => void;

    /**
     * There was an error with the span.
     * @param message - the message to report
     * @param spanName - the name of the span
     */
    spanError?: (message: string, spanName: string) => void;

    /**
     * Report a debug error
     * @param message - the message to report
     */
    debug?: (message: string) => void;

    /**
     * Report a general wanring, should not be treated as fatal
     * @param message - the message to report
     */
    warn?: (message: string) => void;

    /**
     * Report a general error
     * @param message - the message to report
     */
    error?: (message: string) => void;

    /**
     * A general error handler for not implemented methods.
     * @param message - the message to report
     */
    notImplemented?: (message: string) => void;
}