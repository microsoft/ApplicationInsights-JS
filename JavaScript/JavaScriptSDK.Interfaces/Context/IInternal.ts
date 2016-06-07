module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface IInternal {
        /**
        * The SDK version used to create this telemetry item.
        */
        sdkVersion: string;

        /**
         * The SDK agent version.
         */
        agentVersion: string;
    }
}