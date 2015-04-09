module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class Application {
        /**
         * The application version.
         */
        public ver: string;

        /**
         * The application build version.
         */
        public build: string;
    }
}