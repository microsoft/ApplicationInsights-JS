// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Context/IDevice.ts" />

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export class Device implements IDevice {

        /**
         * The type for the current device.
         */
        public type: string;

        /**
         * A device unique ID.
         */
        public id: string;

        /**
         * The device OEM for the current device.
         */
        public oemName: string;

        /**
         * The device model for the current device.
         */
        public model: string;

        /**
         * The IANA interface type for the internet connected network adapter.
         */
        public network: number;

        /**
         * The application screen resolution.
         */
        public resolution: string;

        /**
         * The current display language of the operating system.
         */
        public locale: string;
        
        /**
         * The IP address.
         */
        public ip: string;

        /**
         * The device language.
         */
        public language: string;

        /**
         * The OS name.
         */
        public os: string;

        /**
         * The OS version.
         */
        public osversion: string;

        /**
         * Constructs a new instance of the Device class
         */
        constructor() {
            // don't attempt to fingerprint browsers
            this.id = "browser";

            // Device type is a dimension in our data platform
            // Setting it to 'Browser' allows to separate client and server dependencies/exceptions
            this.type = "Browser";
        }
    }
}
