// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface ILocation {
        /**
         * Client IP address for reverse lookup
         */
        ip: string;
    }
}