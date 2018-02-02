module Microsoft.ApplicationInsights {
    "use strict";

    export class RequestHeaders {
        /**
         * Request-Context header
         */
        public static requestContextHeader = "request-context";

        /**
         * Target instrumentation header that is added to the response and retrieved by the
         * calling application when processing incoming responses.
         */
        public static requestContextTargetKey = "appId";

        /**
         * Request-Id header
         */
        public static requestIdHeader = "Request-Id";
    }
}
