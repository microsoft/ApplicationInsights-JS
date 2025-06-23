// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createValueMap } from "@microsoft/applicationinsights-core-js";

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

export const enum eRequestHeaders {
    requestContextHeader = 0,
    requestContextTargetKey = 1,
    requestContextAppIdFormat = 2,
    requestIdHeader = 3,
    traceParentHeader = 4,
    traceStateHeader = 5,     // currently not used
    sdkContextHeader = 6,
    sdkContextHeaderAppIdRequest = 7,
    requestContextHeaderLowerCase = 8
}

export const RequestHeaders = createValueMap<typeof eRequestHeaders, IRequestHeaders & {
    // Defined the enum lookups
    [eRequestHeaders.requestContextHeader]: "Request-Context",
    [eRequestHeaders.requestContextTargetKey]: "appId",
    [eRequestHeaders.requestContextAppIdFormat]: "appId=cid-v1:",
    [eRequestHeaders.requestIdHeader]: "Request-Id",
    [eRequestHeaders.traceParentHeader]: "traceparent",
    [eRequestHeaders.traceStateHeader]: "tracestate",     // currently not used
    [eRequestHeaders.sdkContextHeader]: "Sdk-Context",
    [eRequestHeaders.sdkContextHeaderAppIdRequest]: "appId",
    [eRequestHeaders.requestContextHeaderLowerCase]: "request-context",
    // Defined Named reference
    requestContextHeader: "Request-Context",
    requestContextTargetKey: "appId",
    requestContextAppIdFormat: "appId=cid-v1:",
    requestIdHeader: "Request-Id",
    traceParentHeader: "traceparent",
    traceStateHeader: "tracestate",     // currently not used
    sdkContextHeader: "Sdk-Context",
    sdkContextHeaderAppIdRequest: "appId",
    requestContextHeaderLowerCase: "request-context"
}>({
    requestContextHeader: [ eRequestHeaders.requestContextHeader, "Request-Context" ],
    requestContextTargetKey: [ eRequestHeaders.requestContextTargetKey, "appId"],
    requestContextAppIdFormat: [ eRequestHeaders.requestContextAppIdFormat, "appId=cid-v1:"],
    requestIdHeader: [ eRequestHeaders.requestIdHeader, "Request-Id"],
    traceParentHeader: [ eRequestHeaders.traceParentHeader, "traceparent"],
    traceStateHeader: [ eRequestHeaders.traceStateHeader, "tracestate"],     // currently not used
    sdkContextHeader: [ eRequestHeaders.sdkContextHeader, "Sdk-Context"],
    sdkContextHeaderAppIdRequest: [ eRequestHeaders.sdkContextHeaderAppIdRequest, "appId"],
    requestContextHeaderLowerCase: [ eRequestHeaders.requestContextHeaderLowerCase, "request-context"]
});

