// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDomain } from "@microsoft/otel-core-js";

/**
 * This interface indentifies the serialized request data contract that is sent to Application Insights backend
 */
export interface IRequestData extends IDomain {

    /**
     * Schema version
     */
    ver: number; /* 2 */

    /**
     * Identifier of a request call instance. Used for correlation between request and other telemetry items.
     */
    id: string;

    /**
     * Name of the request. Represents code path taken to process request. Low cardinality value to allow better grouping of requests. For HTTP requests it represents the HTTP method and URL path template like 'GET /values/\{id\}'.
     */
    name?: string;

    /**
     * Request duration in format: DD.HH:MM:SS.MMMMMM. Must be less than 1000 days.
     */
    duration: string;

    /**
     * Indication of successful or unsuccessful call.
     */
    success: boolean;

    /**
     * Result of a request execution. HTTP status code for HTTP requests.
     */
    responseCode?: string;

    /**
     * Source of the request. Examples are the instrumentation key of the caller or the ip address of the caller.
     */
    source?: string;

    /**
     * Request URL with all query string parameters.
     */
    url?: string;

    /**
     * Collection of custom properties.
     */
    properties?: { [propertyName: string]: string }; /* \{\} */

    /**
     * Collection of custom measurements.
     */
    measurements?: { [propertyName: string]: number }; /* \{\} */
}
