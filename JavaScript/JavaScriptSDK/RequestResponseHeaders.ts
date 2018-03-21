module Microsoft.ApplicationInsights {
    "use strict";

    export class RequestHeaders {
        /**
         * Request-Context header
         */
        public static requestContextHeader = "Request-Context";

        /**
         * Target instrumentation header that is added to the response and retrieved by the
         * calling application when processing incoming responses.
         */
        public static requestContextTargetKey = "appId";

        /**
         * Request-Context appId format
         */
        public static requestContextAppIdFormat = "appId=cid-v1:";

        /**
         * Request-Id header
         */
        public static requestIdHeader = "Request-Id";

        /**
         * Sdk-Context header.
         */
        public static sdkContextHeader = "Sdk-Context";

        /**
         * String to pass in header for requesting appId back from the backend.
         */
        public static sdkContextHeaderAppIdRequest = "appId";
    }
}
