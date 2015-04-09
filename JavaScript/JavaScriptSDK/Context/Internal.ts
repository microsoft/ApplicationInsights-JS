module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class Internal {

        /**
         * The SDK version used to create this telemetry item.
         */
        public sdkVersion: string;

        /**
         * The SDK agent version.
         */
        public agentVersion: string;

         /**
         * Constructs a new instance of the internal telemetry data class.
         */
        constructor() {
            this.sdkVersion = Version;
        }
    }
}