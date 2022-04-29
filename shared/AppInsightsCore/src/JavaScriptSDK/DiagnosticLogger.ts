// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration"
import { _InternalMessageId, _eInternalMessageId, LoggingSeverity, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { hasJSON, getJSON, getConsole, dumpObj } from "./EnvUtils";
import dynamicProto from "@microsoft/dynamicproto-js";
import { isFunction, isNullOrUndefined, isUndefined } from "./HelperFuncs";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { getDebugExt } from "./DbgExtensionUtils";
import { strEmpty } from "./InternalConstants";

/**
 * For user non actionable traces use AI Internal prefix.
 */
const AiNonUserActionablePrefix = "AI (Internal): ";

/**
 * Prefix of the traces in portal.
 */
const AiUserActionablePrefix = "AI: ";

/**
 *  Session storage key for the prefix for the key indicating message type already logged
 */
const AIInternalMessagePrefix = "AITR_";

const strErrorToConsole = "errorToConsole";
const strWarnToConsole = "warnToConsole";

function _sanitizeDiagnosticText(text: string) {
    if (text) {
        return "\"" + text.replace(/\"/g, strEmpty) + "\"";
    }

    return strEmpty;
}

function _logToConsole(func: string, message: string) {
    let theConsole = getConsole();
    if (!!theConsole) {
        let logFunc = "log";
        if (theConsole[func]) {
            logFunc = func;
        }

        if (isFunction(theConsole[logFunc])) {
            theConsole[logFunc](message);
        }
    }
}

export class _InternalLogMessage{
    public static dataType: string = "MessageData";

    public message: string;
    public messageId: _InternalMessageId;

    constructor(msgId: _InternalMessageId, msg: string, isUserAct = false, properties?: Object) {
        let _self = this;

        _self.messageId = msgId;
        _self.message =
            (isUserAct ? AiUserActionablePrefix : AiNonUserActionablePrefix) +
            msgId;

        let strProps:string = strEmpty;
        if (hasJSON()) {
            strProps = getJSON().stringify(properties);
        }

        const diagnosticText =
            (msg ? " message:" + _sanitizeDiagnosticText(msg) : strEmpty) +
            (properties ? " props:" + _sanitizeDiagnosticText(strProps) : strEmpty);

        _self.message += diagnosticText;
    }
}

export function safeGetLogger(core: IAppInsightsCore, config?: IConfiguration): IDiagnosticLogger {
    return (core || {} as any).logger || new DiagnosticLogger(config);
}
  
export class DiagnosticLogger implements IDiagnosticLogger {
    public identifier = "DiagnosticLogger";
    
    /**
     * The internal logging queue
     */
    public queue: _InternalLogMessage[] = [];

    constructor(config?: IConfiguration) {
        /**
         * Count of internal messages sent
         */
        let _messageCount = 0;

        /**
         * Holds information about what message types were already logged to console or sent to server.
         */
        let _messageLogged: { [msg: number]: boolean } = {};

        dynamicProto(DiagnosticLogger, this, (_self) => {
            if (isNullOrUndefined(config)) {
                config = {};
            }

            _self.consoleLoggingLevel = () => _getConfigValue("loggingLevelConsole", 0);
            
            _self.telemetryLoggingLevel = () => _getConfigValue("loggingLevelTelemetry", 1);

            _self.maxInternalMessageLimit = () => _getConfigValue("maxMessageLimit", 25);

            _self.enableDebugExceptions = () => _getConfigValue("enableDebugExceptions", false);
            
            /**
             * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
             * @param severity {LoggingSeverity} - The severity of the log message
             * @param message {_InternalLogMessage} - The log message.
             */
            _self.throwInternal = (severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) => {
                const message = new _InternalLogMessage(msgId, msg, isUserAct, properties);

                if (_self.enableDebugExceptions()) {
                    throw dumpObj(message);
                } else {
                    // Get the logging function and fallback to warnToConsole of for some reason errorToConsole doesn't exist
                    let logFunc = severity === eLoggingSeverity.CRITICAL ? strErrorToConsole : strWarnToConsole;

                    if (!isUndefined(message.message)) {
                        const logLevel = _self.consoleLoggingLevel();
                        if (isUserAct) {
                            // check if this message type was already logged to console for this page view and if so, don't log it again
                            const messageKey: number = +message.messageId;

                            if (!_messageLogged[messageKey] && logLevel >= severity) {
                                _self[logFunc](message.message);
                                _messageLogged[messageKey] = true;
                            }
                        } else {
                            // Only log traces if the console Logging Level is >= the throwInternal severity level
                            if (logLevel >= severity) {
                                _self[logFunc](message.message);
                            }
                        }

                        _self.logInternalMessage(severity, message);
                    } else {
                        _debugExtMsg("throw" + (severity === eLoggingSeverity.CRITICAL ? "Critical" : "Warning"), message);
                    }
                }
            }

            /**
             * This will write a warning to the console if possible
             * @param message {string} - The warning message
             */
            _self.warnToConsole = (message: string) => {
                _logToConsole("warn", message);
                _debugExtMsg("warning", message);
            }

            /**
             * This will write an error to the console if possible
             * @param message {string} - The error message
             */
            _self.errorToConsole = (message: string) => {
                _logToConsole("error", message);
                _debugExtMsg("error", message);
            }

            /**
             * Resets the internal message count
             */
            _self.resetInternalMessageCount = (): void => {
                _messageCount = 0;
                _messageLogged = {};
            };

            /**
             * Logs a message to the internal queue.
             * @param severity {LoggingSeverity} - The severity of the log message
             * @param message {_InternalLogMessage} - The message to log.
             */
            _self.logInternalMessage = (severity: LoggingSeverity, message: _InternalLogMessage): void => {
                if (_areInternalMessagesThrottled()) {
                    return;
                }

                // check if this message type was already logged for this session and if so, don't log it again
                let logMessage = true;
                const messageKey = AIInternalMessagePrefix + message.messageId;

                // if the session storage is not available, limit to only one message type per page view
                if (_messageLogged[messageKey]) {
                    logMessage = false;
                } else {
                    _messageLogged[messageKey] = true;
                }

                if (logMessage) {
                    // Push the event in the internal queue
                    if (severity <= _self.telemetryLoggingLevel()) {
                        _self.queue.push(message);
                        _messageCount++;
                        _debugExtMsg((severity === eLoggingSeverity.CRITICAL ? "error" : "warn"), message);
                    }

                    // When throttle limit reached, send a special event
                    if (_messageCount === _self.maxInternalMessageLimit()) {
                        const throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                        const throttleMessage = new _InternalLogMessage(_eInternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);
                        _self.queue.push(throttleMessage);
                        if (severity === eLoggingSeverity.CRITICAL) {
                            _self.errorToConsole(throttleLimitMessage);
                        } else {
                            _self.warnToConsole(throttleLimitMessage);
                        }
                    }
                }
            };

            function _getConfigValue<T>(name: keyof IConfiguration, defValue: T): T {
                let value = config[name] as T;
                if (!isNullOrUndefined(value)) {
                    return value;
                }

                return defValue;
            }

            function _areInternalMessagesThrottled(): boolean {
                return _messageCount >= _self.maxInternalMessageLimit();
            }

            function _debugExtMsg(name: string, data: any) {
                let dbgExt = getDebugExt(config);
                if (dbgExt && dbgExt.diagLog) {
                    dbgExt.diagLog(name, data);
                }
            }
        });
    }

    /**
     * When this is true the SDK will throw exceptions to aid in debugging.
     */
    public enableDebugExceptions(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * 0: OFF (default)
     * 1: CRITICAL
     * 2: >= WARNING
     */
    public consoleLoggingLevel(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    /**
     * 0: OFF
     * 1: CRITICAL (default)
     * 2: >= WARNING
     */
    public telemetryLoggingLevel(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 1;
    }

    /**
     * The maximum number of internal messages allowed to be sent per page view
     */
    public maxInternalMessageLimit(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 25;
    }

    /**
     * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The log message.
     */
    public throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * This will write a warning to the console if possible
     * @param message {string} - The warning message
     */
    public warnToConsole(message: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * This will write an error to the console if possible
     * @param message {string} - The warning message
     */
    public errorToConsole(message: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resets the internal message count
     */
    public resetInternalMessageCount(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Logs a message to the internal queue.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The message to log.
     */
    public logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

function _getLogger(logger: IDiagnosticLogger) {
    return (logger || new DiagnosticLogger());
}

/**
 * This is a helper method which will call throwInternal on the passed logger, will throw exceptions in
 * debug mode or attempt to log the error as a console warning. This helper is provided mostly to better
 * support minification as logger.throwInternal() will not compress the publish "throwInternal" used throughout
 * the code.
 * @param logger - The Diagnostic Logger instance to use.
 * @param severity {LoggingSeverity} - The severity of the log message
 * @param message {_InternalLogMessage} - The log message.
 */
export function _throwInternal(logger: IDiagnosticLogger, severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) {
    (logger || new DiagnosticLogger()).throwInternal(severity, msgId, msg, properties, isUserAct);
}

/**
 * This is a helper method which will call warnToConsole on the passed logger with the provided message.
 * @param logger - The Diagnostic Logger instance to use.
 * @param message {_InternalLogMessage} - The log message.
 */
export function _warnToConsole(logger: IDiagnosticLogger, message: string) {
    _getLogger(logger).warnToConsole(message);
}

/**
 * Logs a message to the internal queue.
 * @param logger - The Diagnostic Logger instance to use.
 * @param severity {LoggingSeverity} - The severity of the log message
 * @param message {_InternalLogMessage} - The message to log.
 */
export function _logInternalMessage(logger: IDiagnosticLogger, severity: LoggingSeverity, message: _InternalLogMessage) {
    _getLogger(logger).logInternalMessage(severity, message);
}