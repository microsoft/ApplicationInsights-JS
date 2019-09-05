// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDevice } from '@microsoft/applicationinsights-common';

export class Device implements IDevice {

    /**
     * The type for the current device.
     */
    public deviceClass: string;

    /**
     * A device unique ID.
     */
    public id: string;

    /**
     * The application screen resolution.
     */
    resolution: string;

    /**
     * The device model for the current device.
     */
    public model: string;

    /**
     * Device identifier known at instrumentation time
     */
    public localId: string;

    /**
     * Device identifier known at instrumentation time
     */
    public ip: string;

    /**
     * Constructs a new instance of the Device class
     */
    constructor() {
        // don't attempt to fingerprint browsers
        this.id = "browser";

        // Device type is a dimension in our data platform
        // Setting it to 'Browser' allows to separate client and server dependencies/exceptions
        this.deviceClass = "Browser";
    }
}
