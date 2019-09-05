// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface IApplication {
        /**
         * The application version.
         */
        ver: string;

        /**
         * The application build version.
         */
        build: string;
    }
}