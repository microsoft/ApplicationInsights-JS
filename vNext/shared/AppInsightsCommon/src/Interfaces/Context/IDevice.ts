// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IDevice {
    /**
     * The type for the current device.
     */
    deviceClass: string;
    /**
     * A device unique ID.
     */
    id: string;
    
    /**
     * The device model for the current device.
     */
    model: string;
   
    /**
     * The application screen resolution.
     */
    resolution: string;

    /**
     * The IP address.
     */
    ip: string;
}