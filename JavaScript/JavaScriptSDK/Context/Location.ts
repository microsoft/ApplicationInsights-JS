/// <reference path="ILocation.ts" />

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export class Location implements ILocation {

        /**
         * Client IP address for reverse lookup
         */
        public ip: string;
    }
}