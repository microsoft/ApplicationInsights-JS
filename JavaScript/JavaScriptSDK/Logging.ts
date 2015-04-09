module Microsoft.ApplicationInsights {
    
    export enum LoggingSeverity {
        CRITICAL = 0,
        WARNING = 1
    }

    export class _InternalLogging {

        /**
         * Prefix of the traces in portal.
         */
        private static AiUserActionablePrefix = "AI: ";

        /**
         * For user non actionable traces use AI Internal prefix.
         */
        private static AiNonUserActionable = "AI (Internal): ";

        /**
         * Maximum queue size.
         */
        private static MAX_QUEUE_SIZE = 100;

        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        public static enableDebugExceptions = () => false;

        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        public static verboseLogging = () => false;


        public static queue = [];
        
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         */
        public static throwInternalNonUserActionable(severity: LoggingSeverity, message: string) {
            if (_InternalLogging.enableDebugExceptions()) {
                throw message;
            } else {
                _InternalLogging.warn(message);

                if (_InternalLogging.verboseLogging() || severity === LoggingSeverity.CRITICAL) {
                    if (this.queue.length < this.MAX_QUEUE_SIZE) {
                        this.queue.push(_InternalLogging.AiNonUserActionable + message);
                    }
                }
            }
        }

        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         */
        public static throwInternalUserActionable(severity: LoggingSeverity, message: string) {
            if (_InternalLogging.enableDebugExceptions()) {
                throw message;
            } else {
                _InternalLogging.warn(message);

                if (_InternalLogging.verboseLogging() || severity === LoggingSeverity.CRITICAL) {
                    if (this.queue.length < this.MAX_QUEUE_SIZE) {
                        this.queue.push(_InternalLogging.AiUserActionablePrefix + message);
                    }
                }
            }
        }

        /**
         * This will write a warning to the console if possible
         */
        public static warn(message: string) {
            if (typeof console !== "undefined" && !!console) {
                if (typeof console.warn === "function") {
                console.warn(message);
                } else if (typeof console.log === "function") {
                    console.log(message);
                }
            }
        }
    }
}