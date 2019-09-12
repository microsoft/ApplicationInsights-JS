// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IEventTelemetry {
    /**
     * @description An event name string
     * @type {string}
     * @memberof IEventTelemetry
     */
    name: string;

    /**
     * Property bag to contain additional custom properties (Part C)
     */
    properties?: { [key: string]: any };

    /**
     * Property bag to contain additional custom measurements (Part C)
     */
    measurements?: { [key: string]: number };
}
