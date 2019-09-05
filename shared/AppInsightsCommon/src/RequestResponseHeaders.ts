// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class RequestHeaders {
    /**
     * Request-Context header
     */
    public static requestContextHeader = "Request-Context";

    /**
     * Target instrumentation header that is added to the response and retrieved by the
     * calling application when processing incoming responses.
     */
    public static requestContextTargetKey = "appId";

    /**
     * Request-Context appId format
     */
    public static requestContextAppIdFormat = "appId=cid-v1:";

    /**
     * Request-Id header
     */
    public static requestIdHeader = "Request-Id";

    /**
     * W3C distributed tracing protocol header
     */
    public static traceParentHeader = "traceparent";

    /**
     * W3C distributed tracing protocol state header
     */
    public static traceStateHeader: "tracestate"; // currently not used

    /**
     * Sdk-Context header
     * If this header passed with appId in content then appId will be returned back by the backend.
     */
    public static sdkContextHeader = "Sdk-Context";

    /**
     * String to pass in header for requesting appId back from the backend.
     */
    public static sdkContextHeaderAppIdRequest = "appId";

    public static requestContextHeaderLowerCase = "request-context";
}