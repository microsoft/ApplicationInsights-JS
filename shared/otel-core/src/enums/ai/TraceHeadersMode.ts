// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Controls how the SDK should look for trace headers (traceparent/tracestate) from the initial page load
 * The values are bitwise OR'd together to allow for multiple values to be set at once.
 * @since 3.4.0
 */
export const enum eTraceHeadersMode {
    /**
     * Don't look for any trace headers
     */
    None = 0x00,

    /**
     * Look for traceparent header/meta tag
     */
    TraceParent = 0x01,

    /**
     * Look for tracestate header/meta tag
     */
    TraceState = 0x02,

    /**
     * Look for both traceparent and tracestate headers/meta tags
     */
    All = 0x03
}
