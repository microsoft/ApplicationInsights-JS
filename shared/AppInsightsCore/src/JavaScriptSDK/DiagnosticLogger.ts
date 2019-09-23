// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration"
import { _InternalMessageId, LoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { CoreUtils } from "./CoreUtils";
import { AppInsightsCore } from "./AppInsightsCore";

export class _InternalLogMessage{
    public static dataType: string = "MessageData";

    /**
     * For user non actionable traces use AI Internal prefix.
     */
    private static AiNonUserActionablePrefix = "AI (Internal): ";

    /**
     * Prefix of the traces in portal.
     */
    private static AiUserActionablePrefix = "AI: ";

    private static sanitizeDiagnosticText(text: string) {
        return "\"" + text.replace(/\"/g, "") + "\"";
    }

    public message: string;
    public messageId: _InternalMessageId;

    constructor(msgId: _InternalMessageId, msg: string, isUserAct = false, properties?: Object) {

        this.messageId = msgId;
        this.message =
            (isUserAct ? _InternalLogMessage.AiUserActionablePrefix : _InternalLogMessage.AiNonUserActionablePrefix) +
            msgId;

        const diagnosticText =
            (msg ? " message:" + _InternalLogMessage.sanitizeDiagnosticText(msg) : "") +
            (properties ? " props:" + _InternalLogMessage.sanitizeDiagnosticText(JSON.stringify(properties)) : "");

        this.message += diagnosticText;
    }
}

export class DiagnosticLogger implements IDiagnosticLogger {

    /**
     * The internal logging queue
     */
    public queue: _InternalLogMessage[] = [];

    /**
     *  Session storage key for the prefix for the key indicating message type already logged
     */
    private AIInternalMessagePrefix: string = "AITR_";

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
            this.consoleLoggingLevel = () => config.loggingLevelConsole;
        }
        if (!CoreUtils.isNullOrUndefined(config.loggingLevelTelemetry)) {
            this.telemetryLoggingLevel = () => config.loggingLevelTelemetry;
        }
        if (!CoreUtils.isNullOrUndefined(config.maxMessageLimit)) {
            this.maxInternalMessageLimit = () => config.maxMessageLimit
        }
        if (!CoreUtils.isNullOrUndefined(config.enableDebugExceptions)) {
            this.enableDebugExceptions = () => config.enableDebugExceptions;
        }
    }

    /**
     * When this is true the SDK will throw exceptions to aid in debugging.
     */
    public enableDebugExceptions = () => false;

    /**
     * 0: OFF (default)
     * 1: CRITICAL
     * 2: >= WARNING
     */
    public consoleLoggingLevel = () => 0;

    /**
     * 0: OFF
     * 1: CRITICAL (default)
     * 2: >= WARNING
     */
    public telemetryLoggingLevel = () => 1;

    /**
     * The maximum number of internal messages allowed to be sent per page view
     */
    public maxInternalMessageLimit = () => 25;

    /**
     * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The log message.
     */
    public throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) {
        const message = new _InternalLogMessage(msgId, msg, isUserAct, properties);

        if (this.enableDebugExceptions()) {
            throw message;
        } else {
            if (typeof (message) !== "undefined" && !!message) {
                if (typeof (message.message) !== "undefined") {
                    if (isUserAct) {
                        // check if this message type was already logged to console for this page view and if so, don't log it again
                        const messageKey: number = +message.messageId;

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
    public logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
        if (this._areInternalMessagesThrottled()) {
            return;
        }

        // check if this message type was already logged for this session and if so, don't log it again
        let logMessage = true;
        const messageKey = this.AIInternalMessagePrefix + message.messageId;

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
            if (this._messageCount === this.maxInternalMessageLimit()) {
                const throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                const throttleMessage = new _InternalLogMessage(_InternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);

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
