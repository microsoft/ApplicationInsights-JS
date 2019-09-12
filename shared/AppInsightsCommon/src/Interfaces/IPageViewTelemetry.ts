// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Pageview telemetry interface
 */
export interface IPageViewTelemetry {
    /**
     * name String - The string you used as the name in startTrackPage. Defaults to the document title.
     */
    name?: string;

    /**
     * uri  String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
     */
    uri?: string;

    /**
     * refUri  String - the URL of the source page where current page is loaded from
     */
    refUri?: string;

    /**
     * pageType  String - page type
     */
    pageType?: string;

    /**
     * isLoggedIn - boolean is user logged in
     */
    isLoggedIn?: boolean;

    /**
     * property bag to contain an extension to domain properties - extension to Part B
     */
    properties?: { [key: string]: any };

    /**
     * Property bag to contain additional custom measurements (Part C)
     */
    measurements?: { [key: string]: number };
}


export interface IPageViewTelemetryInternal extends IPageViewTelemetry {
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
}
