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
        private static AiNonUserActionablePrefix = "AI (Internal): ";
    
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

        /**
         * The internal logging queue
         */
        public static queue = [];
        
        /**
         * The maximum number of internal events allowed to be sent per page view
         */
        private static MAX_ALLOWED_EVENT_LIMIT = 2;
        
        /**
         * Count of events sent
         */
        private static _eventCount = 0;
        
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         */
        public static throwInternalNonUserActionable(severity: LoggingSeverity, message: string) {
            if (_InternalLogging.enableDebugExceptions()) {
                throw message;
            } else {
                _InternalLogging.warn(message);
                this._throttle(severity, this.AiNonUserActionablePrefix + message, this.MAX_ALLOWED_EVENT_LIMIT);
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
                this._throttle(severity, this.AiUserActionablePrefix + message, this.MAX_ALLOWED_EVENT_LIMIT);
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
        
        /**
         * Resetting the throttle limits for Internal events
         */
        public static resetInternalEventsThrottle(): void {
            this._eventCount = 0;
        }

        /**
         * Sets the limit for the number of internal events before they are throttled
         */
        public static setMaxAllowedInternalThrottleLimit(limit: number): void {
            if (!limit) {
                return;
            }
            
            this.MAX_ALLOWED_EVENT_LIMIT = limit;
        }
        
        /**
         * Throttles the internal logs based on the SDK configurations
         */
        private static _throttle(severity: LoggingSeverity, message: string, throttleLimit: number): void {
            // If the event count exceeds the throttle limit, do nothing.
            if (this._eventCount >= this.MAX_ALLOWED_EVENT_LIMIT) {
                return;
            }

            // Push the event in the internal queue
            if (_InternalLogging.verboseLogging() || severity === LoggingSeverity.CRITICAL) {
                if (this.queue.length < this.MAX_QUEUE_SIZE) {
                    this.queue.push(message);
                    this._eventCount++;
                }
            }

            // When throttle limit reached, send a special event
            if (this._eventCount == this.MAX_ALLOWED_EVENT_LIMIT) {
                var throttleLimitMessage = this.AiNonUserActionablePrefix + "Internal events throttled for this app";
                this.queue.push(throttleLimitMessage);
                this.warn(throttleLimitMessage);
            }
        }
    }
}