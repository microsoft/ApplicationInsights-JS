// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Properties telemetry interface
 */

export interface IProperties {
    /**
     * Property bag to contain additional custom properties (Part C)
     */
    properties?: { [key: string]: any };

    /**
     * Property bag to contain additional custom measurements (Part C)
     */
    measurements?: { [key: string]: number }; // deprecated, please use properties instead
}