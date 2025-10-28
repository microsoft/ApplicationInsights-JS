/**
* Controls how the SDK should look for trace headers (traceparent/tracestate) from the initial page load
* The values are bitwise OR'd together to allow for multiple values to be set at once.
* @since 3.4.0
*/
export declare const enum eTraceHeadersMode {
    /**
     * Don't look for any trace headers
     */
    None = 0,
    /**
     * Look for traceparent header/meta tag
     */
    TraceParent = 1,
    /**
     * Look for tracestate header/meta tag
     */
    TraceState = 2,
    /**
     * Look for both traceparent and tracestate headers/meta tags
     */
    All = 3
}
