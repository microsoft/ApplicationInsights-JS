// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IPageViewPerformanceTelemetry {
    /**
     * name String - The name of the page. Defaults to the document title.
     */
    name?: string;

    /**
     * url String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     */
    uri?: string;
    /**
     * Performance total in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff". This is total duration in timespan format.
     */
    perfTotal?: string;
    /**
     * Performance total in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff". This represents the total page load time.
     */
    duration?: string;
    /**
     * Sent request time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    networkConnect?: string;
    /**
     * Sent request time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff.
     */
    sentRequest?: string;
    /**
     * Received response time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff.
     */
    receivedResponse?: string;
    /**
     * DOM processing time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
     */
    domProcessing?: string;

    /**
     * Property bag to contain additional custom properties (Part C)
     */
    properties?: { [key: string]: any };

    /**
     * Property bag to contain additional custom measurements (Part C)
     */
    measurements?: { [key: string]: number };
}

export interface IPageViewPerformanceTelemetryInternal extends IPageViewPerformanceTelemetry {
    /**
     * An identifier assigned to each distinct impression for the purposes of correlating with pageview.
     * A new id is automatically generated on each pageview. You can manually specify this field if you
     * want to use a specific value instead.
     */
    id?: string;
    /**
     * Version of the part B schema, todo: set this value in trackpageView
     */
    ver?: string;
    /**
     * Field indicating whether this instance of PageViewPerformance is valid and should be sent
     */
    isValid?: boolean;
    /**
     * Duration in miliseconds
     */
    durationMs?: number;
}