module Microsoft.ApplicationInsights.Context {

    "use strict";

    export interface IUser {
        /**
        * The telemetry configuration.
        */
        config: ITelemetryConfig;

        /**
         * The user ID.
         */
        id: string;

        /**
         * Authenticated user id
         */
        authenticatedId: string;

        /**
         * The account ID.
         */
        accountId: string;

        /**
         * The account acquisition date.
         */
        accountAcquisitionDate: string;

        /**
         * The user agent string.
         */
        agent: string;

        /**
         * The store region.
         */
        storeRegion: string;
    }
}