// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IRequestHeaders {
    /**
     * Request-Context header
     */
    requestContextHeader: string,

    /**
     * Target instrumentation header that is added to the response and retrieved by the
     * calling application when processing incoming responses.
     */
    requestContextTargetKey: string,

    /**
     * Request-Context appId format
     */
    requestContextAppIdFormat: string,

    /**
     * Request-Id header
     */
    requestIdHeader: string,

    /**
     * W3C distributed tracing protocol header
     */
    traceParentHeader: string,

    /**
     * W3C distributed tracing protocol state header
     */
    traceStateHeader: string,     // currently not used

    /**
     * Sdk-Context header
     * If this header passed with appId in content then appId will be returned back by the backend.
     */
    sdkContextHeader: string,

    /**
     * String to pass in header for requesting appId back from the backend.
     */
    sdkContextHeaderAppIdRequest: string,

    requestContextHeaderLowerCase: string
}

export const RequestHeaders: IRequestHeaders = {
    requestContextHeader: "Request-Context",
    requestContextTargetKey: "appId",
    requestContextAppIdFormat: "appId=cid-v1:",
    requestIdHeader: "Request-Id",
    traceParentHeader: "traceparent",
    traceStateHeader: "tracestate",     // currently not used
    sdkContextHeader: "Sdk-Context",
    sdkContextHeaderAppIdRequest: "appId",
    requestContextHeaderLowerCase: "request-context"
};