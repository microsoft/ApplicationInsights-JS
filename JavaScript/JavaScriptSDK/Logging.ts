module Microsoft.ApplicationInsights {

    export enum LoggingSeverity {
        /**
         * Error will be sent as internal telemetry
         */
        CRITICAL = 0,

        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        WARNING = 1
    }

    /**
     * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
     */
    export enum _InternalMessageId {
        NONUSRACT_BrowserDoesNotSupportLocalStorage,
        NONUSRACT_BrowserCannotReadLocalStorage,
        NONUSRACT_BrowserCannotReadSessionStorage,
        NONUSRACT_BrowserCannotWriteLocalStorage,
        NONUSRACT_BrowserCannotWriteSessionStorage,
        NONUSRACT_BrowserFailedRemovalFromLocalStorage,
        NONUSRACT_BrowserFailedRemovalFromSessionStorage,
        NONUSRACT_CannotSendEmptyTelemetry,
        NONUSRACT_ClientPerformanceMathError,
        NONUSRACT_ErrorParsingAISessionCookie,
        NONUSRACT_ErrorPVCalc,
        NONUSRACT_ExceptionWhileLoggingError,
        NONUSRACT_FailedAddingTelemetryToBuffer,
        NONUSRACT_FailedMonitorAjaxAbort,
        NONUSRACT_FailedMonitorAjaxDur,
        NONUSRACT_FailedMonitorAjaxOpen,
        NONUSRACT_FailedMonitorAjaxRSC,
        NONUSRACT_FailedMonitorAjaxSend,
        NONUSRACT_FailedToAddHandlerForOnBeforeUnload,
        NONUSRACT_FailedToSendQueuedTelemetry,
        NONUSRACT_FailedToReportDataLoss,
        NONUSRACT_FlushFailed,
        NONUSRACT_MessageLimitPerPVExceeded,
        NONUSRACT_MissingRequiredFieldSpecification,
        NONUSRACT_NavigationTimingNotSupported,
        NONUSRACT_OnError,
        NONUSRACT_SessionRenewalDateIsZero,
        NONUSRACT_SenderNotInitialized,
        NONUSRACT_StartTrackEventFailed,
        NONUSRACT_StopTrackEventFailed,
        NONUSRACT_StartTrackFailed,
        NONUSRACT_StopTrackFailed,
        NONUSRACT_TelemetrySampledAndNotSent,
        NONUSRACT_TrackEventFailed,
        NONUSRACT_TrackExceptionFailed,
        NONUSRACT_TrackMetricFailed,
        NONUSRACT_TrackPVFailed,
        NONUSRACT_TrackPVFailedCalc,
        NONUSRACT_TrackTraceFailed,
        NONUSRACT_TransmissionFailed,
        NONUSRACT_FailedToSetStorageBuffer,
        NONUSRACT_FailedToRestoreStorageBuffer,
        NONUSRACT_InvalidBackendResponse,

        USRACT_CannotSerializeObject,
        USRACT_CannotSerializeObjectNonSerializable,
        USRACT_CircularReferenceDetected,
        USRACT_ClearAuthContextFailed,
        USRACT_ExceptionTruncated,
        USRACT_IllegalCharsInName,
        USRACT_ItemNotInArray,
        USRACT_MaxAjaxPerPVExceeded,
        USRACT_MessageTruncated,
        USRACT_NameTooLong,
        USRACT_SampleRateOutOfRange,
        USRACT_SetAuthContextFailed,
        USRACT_SetAuthContextFailedAccountName,
        USRACT_StringValueTooLong,
        USRACT_StartCalledMoreThanOnce,
        USRACT_StopCalledWithoutStart,
        USRACT_TelemetryInitializerFailed,
        USRACT_TrackArgumentsNotSpecified,
        USRACT_UrlTooLong,
        USRACT_SessionStorageBufferFull,
        USRACT_CannotAccessCookie,
    }

    export class _InternalLogMessage {
        public message: string;
        public messageId: _InternalMessageId;

        constructor(msgId: _InternalMessageId, msg: string, properties?: Object) {

            this.message = _InternalMessageId[msgId].toString();
            this.messageId = msgId;

            var diagnosticText =
                (msg ? " message:" + _InternalLogMessage.sanitizeDiagnosticText(msg) : "") +
                (properties ? " props:" + _InternalLogMessage.sanitizeDiagnosticText(JSON.stringify(properties)) : "");

            this.message += diagnosticText;
        }

        private static sanitizeDiagnosticText(text: string) {
            return "\"" + text.replace(/\"/g, "") + "\"";
        }
    }

    export class _InternalLogging {

        /**
         * Prefix of the traces in portal.
         */
        private static AiUserActionablePrefix = "AI: ";

        /**
        *  Session storage key for the prefix for the key indicating message type already logged
        */
        private static AIInternalMessagePrefix: string = "AITR_";

        /**
         * For user non actionable traces use AI Internal prefix.
         */
        private static AiNonUserActionablePrefix = "AI (Internal): ";

        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        public static enableDebugExceptions = () => false;

        /**
         * When this is true the SDK will log more messages to aid in debugging.
         */
        public static verboseLogging = () => false;

        /**
         * The internal logging queue
         */
        public static queue = [];

        /**
         * The maximum number of internal messages allowed to be sent per page view
         */
        private static MAX_INTERNAL_MESSAGE_LIMIT = 25;

        /**
         * Count of internal messages sent
         */
        private static _messageCount = 0;

        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        public static throwInternalNonUserActionable(severity: LoggingSeverity, message: _InternalLogMessage) {
            if (this.enableDebugExceptions()) {
                throw message;
            } else {
                if (typeof (message) !== "undefined" && !!message) {
                    if (typeof (message.message) !== "undefined") {
                        message.message = this.AiNonUserActionablePrefix + message.message;

                        // don't log internal AI traces in the console, unless the verbose logging is enabled
                        if (this.verboseLogging()) {
                            this.warnToConsole(message.message);
                        }
                        this.logInternalMessage(severity, message);
                    }
                }

            }
        }

        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        public static throwInternalUserActionable(severity: LoggingSeverity, message: _InternalLogMessage) {
            if (this.enableDebugExceptions()) {
                throw message;
            } else {
                if (typeof (message) !== "undefined" && !!message) {
                    if (typeof (message.message) !== "undefined") {
                        message.message = this.AiUserActionablePrefix + message.message;
                        this.warnToConsole(message.message);
                        this.logInternalMessage(severity, message);
                    }
                }
            }
        }

        /**
         * This will write a warning to the console if possible
         * @param message {string} - The warning message
         */
        public static warnToConsole(message: string) {
            if (typeof console !== "undefined" && !!console) {
                if (typeof console.warn === "function") {
                    console.warn(message);
                } else if (typeof console.log === "function") {
                    console.log(message);
                }
            }
        }

        /**
         * Resets the internal message count
         */
        public static resetInternalMessageCount(): void {
            this._messageCount = 0;
        }

        /**
         * Clears the list of records indicating that internal message type was already logged
         */
        public static clearInternalMessageLoggedTypes(): void {
            if (Util.canUseSessionStorage()) {
                var sessionStorageKeys = Util.getSessionStorageKeys();
                for (var i = 0; i < sessionStorageKeys.length; i++) {
                    if (sessionStorageKeys[i].indexOf(_InternalLogging.AIInternalMessagePrefix) === 0) {
                        Util.removeSessionStorage(sessionStorageKeys[i]);
                    }
                }
            }
        }

        /**
         * Sets the limit for the number of internal events before they are throttled
         * @param limit {number} - The throttle limit to set for internal events
         */
        public static setMaxInternalMessageLimit(limit: number): void {
            if (!limit) {
                throw new Error('limit cannot be undefined.');
            }

            this.MAX_INTERNAL_MESSAGE_LIMIT = limit;
        }

        /**
         * Logs a message to the internal queue.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The message to log.
         */
        private static logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
            if (this._areInternalMessagesThrottled()) {
                return;
            }

            // check if this message type was already logged for this session and if so, don't log it again
            var logMessage = true;
            if (Util.canUseSessionStorage()) {
                var storageMessageKey = _InternalLogging.AIInternalMessagePrefix + _InternalMessageId[message.messageId];
                var internalMessageTypeLogRecord = Util.getSessionStorage(storageMessageKey);
                if (internalMessageTypeLogRecord) {
                    logMessage = false;
                } else {
                    Util.setSessionStorage(storageMessageKey, "1");
                }
            }

            if (logMessage) {
                // Push the event in the internal queue
                if (this.verboseLogging() || severity === LoggingSeverity.CRITICAL) {
                    this.queue.push(message);
                    this._messageCount++;
                }

                // When throttle limit reached, send a special event
                if (this._messageCount == this.MAX_INTERNAL_MESSAGE_LIMIT) {
                    var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                    var throttleMessage = new _InternalLogMessage(_InternalMessageId.NONUSRACT_MessageLimitPerPVExceeded, throttleLimitMessage);

                    this.queue.push(throttleMessage);
                    this.warnToConsole(throttleLimitMessage);
                }
            }
        }

        /**
         * Indicates whether the internal events are throttled
         */
        private static _areInternalMessagesThrottled(): boolean {
            return this._messageCount >= this.MAX_INTERNAL_MESSAGE_LIMIT;
        }
    }
}