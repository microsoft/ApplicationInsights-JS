// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration"
import { _InternalMessageId, LoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { CoreUtils } from "./CoreUtils";
import { AppInsightsCore } from "./AppInsightsCore";

export class _InternalLogMessage{
    public message: string;
    public messageId: _InternalMessageId;

    public static dataType: string = "MessageData";

    /**
     * For user non actionable traces use AI Internal prefix.
     */
    private static AiNonUserActionablePrefix = "AI (Internal): ";

    /**
     * Prefix of the traces in portal.
     */
    private static AiUserActionablePrefix = "AI: ";

    constructor(msgId: _InternalMessageId, msg: string, isUserAct = false, properties?: Object) {

        this.messageId = msgId;
        this.message =
            (isUserAct ? _InternalLogMessage.AiUserActionablePrefix : _InternalLogMessage.AiNonUserActionablePrefix) +
            msgId;

        var diagnosticText =
            (msg ? " message:" + _InternalLogMessage.sanitizeDiagnosticText(msg) : "") +
            (properties ? " props:" + _InternalLogMessage.sanitizeDiagnosticText(JSON.stringify(properties)) : "");

        this.message += diagnosticText;
    }

    private static sanitizeDiagnosticText(text: string) {
        return "\"" + text.replace(/\"/g, "") + "\"";
    }
}

export class DiagnosticLogger implements IDiagnosticLogger {

    /**
    *  Session storage key for the prefix for the key indicating message type already logged
    */
    private AIInternalMessagePrefix: string = "AITR_";

    /**
     * When this is true the SDK will throw exceptions to aid in debugging.
     */
    public enableDebugExceptions = () => false;

    /**
     * 0: OFF
     * 1: CRITICAL (default)
     * 2: >= WARNING
     */
    public consoleLoggingLevel = () => 1;

    /**
     * 0: OFF (default)
     * 1: CRITICAL
     * 2: >= WARNING
     */
    public telemetryLoggingLevel = () => 0;

    /**
     * The maximum number of internal messages allowed to be sent per page view
     */
    public maxInternalMessageLimit = () => { return 25; }

    /**
     * The internal logging queue
     */
    public queue: Array<_InternalLogMessage> = [];

    /**
     * Count of internal messages sent
     */
    private _messageCount = 0;

    /**
     * Holds information about what message types were already logged to console or sent to server.
     */
    private _messageLogged: { [msg: number]: boolean } = {};

    constructor(config?: IConfiguration) {
        if (CoreUtils.isNullOrUndefined(config)) {
            // TODO: Use default config
            // config = AppInsightsCore.defaultConfig;

            // For now, use defaults specified in DiagnosticLogger members;
            return;
        }
        if (!CoreUtils.isNullOrUndefined(config.loggingLevelConsole)) {
            this.consoleLoggingLevel = () => { return config.loggingLevelConsole };
        }
        if (!CoreUtils.isNullOrUndefined(config.loggingLevelTelemetry)) {
            this.telemetryLoggingLevel = () => { return config.loggingLevelTelemetry };
        }
        if (!CoreUtils.isNullOrUndefined(config.maxMessageLimit)) {
            this.maxInternalMessageLimit = () => { return config.maxMessageLimit; }
        }
        if (!CoreUtils.isNullOrUndefined(config.enableDebugExceptions)) {
            this.enableDebugExceptions = () => { return config.enableDebugExceptions };
        }
    }

    /**
     * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The log message.
     */
    public throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) {
        let message = new _InternalLogMessage(msgId, msg, isUserAct, properties);

        if (this.enableDebugExceptions()) {
            throw message;
        } else {
            if (typeof (message) !== "undefined" && !!message) {
                if (typeof (message.message) !== "undefined") {
                    if (isUserAct) {
                        // check if this message type was already logged to console for this page view and if so, don't log it again
                        var messageKey: number = +message.messageId;

                        if (!this._messageLogged[messageKey] || this.consoleLoggingLevel() >= LoggingSeverity.WARNING) {
                            this.warnToConsole(message.message);
                            this._messageLogged[messageKey] = true;
                        }
                    } else {
                        // don't log internal AI traces in the console, unless the verbose logging is enabled
                        if (this.consoleLoggingLevel() >= LoggingSeverity.WARNING) {
                            this.warnToConsole(message.message);
                        }
                    }

                    this.logInternalMessage(severity, message);
                }
            }
        }
    }

    /**
     * This will write a warning to the console if possible
     * @param message {string} - The warning message
     */
    public warnToConsole(message: string) {
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
    public resetInternalMessageCount(): void {
        this._messageCount = 0;
        this._messageLogged = {};
    }

    /**
     * Logs a message to the internal queue.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The message to log.
     */
    private logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
        if (this._areInternalMessagesThrottled()) {
            return;
        }

        // check if this message type was already logged for this session and if so, don't log it again
        var logMessage = true;
        var messageKey = this.AIInternalMessagePrefix + message.messageId;

        // if the session storage is not available, limit to only one message type per page view
        if (this._messageLogged[messageKey]) {
            logMessage = false;
        } else {
            this._messageLogged[messageKey] = true;
        }

        if (logMessage) {
            // Push the event in the internal queue
            if (severity <= this.telemetryLoggingLevel()) {
                this.queue.push(message);
                this._messageCount++;
            }

            // When throttle limit reached, send a special event
            if (this._messageCount == this.maxInternalMessageLimit()) {
                var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                var throttleMessage = new _InternalLogMessage(_InternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);

                this.queue.push(throttleMessage);
                this.warnToConsole(throttleLimitMessage);
            }
        }
    }

    /**
     * Indicates whether the internal events are throttled
     */
    private _areInternalMessagesThrottled(): boolean {
        return this._messageCount >= this.maxInternalMessageLimit();
    }
}
