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
    url?: string;

    /**
     * Property bag to contain additional custom properties (Part C)
     */
    properties?: { [key: string]: string };

    /**
     * Property bag to contain additional custom measurements (Part C)
     */
    measurements?: { [key: string]: number };
}
