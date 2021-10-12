// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ICustomProperties } from "@microsoft/applicationinsights-core-js";
import { DistributedTracingModes } from "../Enums";
import { IRequestContext } from "./IRequestContext";

export interface ICorrelationConfig {
    enableCorsCorrelation: boolean;
    correlationHeaderExcludedDomains: string[];
    correlationHeaderExcludePatterns?: RegExp[];
    disableCorrelationHeaders: boolean;
    distributedTracingMode: DistributedTracingModes;
    maxAjaxCallsPerView: number;
    disableAjaxTracking: boolean;
    disableFetchTracking: boolean;
    appId?: string;
    enableRequestHeaderTracking?: boolean;
    enableResponseHeaderTracking?: boolean;
    enableAjaxErrorStatusText?: boolean;

    /**
     * Flag to enable looking up and including additional browser window.performance timings
     * in the reported ajax (XHR and fetch) reported metrics.
     * Defaults to false.
     */
    enableAjaxPerfTracking?: boolean;

    /**
     * The maximum number of times to look for the window.performance timings (if available), this
     * is required as not all browsers populate the window.performance before reporting the
     * end of the XHR request and for fetch requests this is added after its complete
     * Defaults to 3
     */
    maxAjaxPerfLookupAttempts?: number;

    /**
     * The amount of time to wait before re-attempting to find the windows.performance timings
     * for an ajax request, time is in milliseconds and is passed directly to setTimeout()
     * Defaults to 25.
     */
    ajaxPerfLookupDelay?: number;

    correlationHeaderDomains?: string[];

    /**
     * Response and request headers to be excluded from ajax tracking data.
     */
    ignoreHeaders?: string[];

    /**
     * Provide a way to exclude specific route from automatic tracking for XMLHttpRequest or Fetch request.
     * For an ajax / fetch request that the request url matches with the regex patterns, auto tracking is turned off.
     * Default is undefined.
     */
    excludeRequestFromAutoTrackingPatterns?: string[] | RegExp[];

    /**
     * Provide a way to enrich dependencies logs with context at the beginning of api call.
     * Default is undefined.
     */
    addRequestContext?: (requestContext?: IRequestContext) => ICustomProperties;
}