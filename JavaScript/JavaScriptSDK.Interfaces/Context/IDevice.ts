// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface IDevice {
        /**
         * The type for the current device.
         */
        type: string;

        /**
         * A device unique ID.
         */
        id: string;

        /**
         * The device OEM for the current device.
         */
        oemName: string;

        /**
         * The device model for the current device.
         */
        model: string;

        /**
         * The IANA interface type for the internet connected network adapter.
         */
        network: number;

        /**
         * The application screen resolution.
         */
        resolution: string;

        /**
         * The current display language of the operating system.
         */
        locale: string;

        /**
         * The IP address.
         */
        ip: string;

        /**
         * The device language.
         */
        language: string;

        /**
         * The OS name.
         */
        os: string;

        /**
         * The OS version.
         */
        osversion: string;
    }
}