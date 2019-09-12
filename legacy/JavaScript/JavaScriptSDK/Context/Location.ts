// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Context/ILocation.ts" />

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export class Location implements ILocation {

        /**
         * Client IP address for reverse lookup
         */
        public ip: string;
    }
}