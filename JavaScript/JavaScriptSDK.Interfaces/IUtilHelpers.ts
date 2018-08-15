module Microsoft.ApplicationInsights {

    "use strict";

    export interface IUtilHelpers {

        /**
         * generate random id string
         */
        newId?(): string;
    }
}