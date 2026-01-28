// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * PartC  telemetry interface
 */
export interface IPartC {
    /**
     * Property bag to contain additional custom properties (Part C)
     */
    properties?: { [key: string]: any };

    /**
     * Property bag to contain additional custom measurements (Part C)
     * @deprecated -- please use properties instead
     */
    measurements?: { [key: string]: number };
}
