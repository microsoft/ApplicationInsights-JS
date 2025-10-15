// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict"
import dynamicProto from "@microsoft/dynamicproto-js";
import { IPromise } from "@nevware21/ts-async";
import { dumpObj, isFunction, isUndefined } from "@nevware21/ts-utils";
import { createDynamicConfig, onConfigChange } from "../Config/DynamicConfig";
import { LoggingSeverity, _InternalMessageId, _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { IConfigDefaults, IUnloadHook } from "../applicationinsights-core-js";
import { getDebugExt } from "../JavaScriptSDK/DbgExtensionUtils";
import { getConsole, getJSON, hasJSON } from "../JavaScriptSDK/EnvUtils";
import { STR_EMPTY } from "../JavaScriptSDK/InternalConstants";

const STR_WARN_TO_CONSOLE = "warnToConsole";

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

const defaultValues: IConfigDefaults<IConfiguration> = {
    loggingLevelConsole: 0,
    loggingLevelTelemetry: 1,
    maxMessageLimit: 25,
    enableDebug: false
}

const _logFuncs: { [key in eLoggingSeverity]: keyof IDiagnosticLogger} = {
    [eLoggingSeverity.DISABLED]: null,
    [eLoggingSeverity.CRITICAL]: "errorToConsole",
    [eLoggingSeverity.WARNING]: STR_WARN_TO_CONSOLE,
    [eLoggingSeverity.DEBUG]: "debugToConsole"
}

function _sanitizeDiagnosticText(text: string) {
    if (text) {
        return "\"" + text.replace(/\"/g, STR_EMPTY) + "\"";
    }

    return STR_EMPTY;
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

        let strProps:string = STR_EMPTY;
        if (hasJSON()) {
            strProps = getJSON().stringify(properties);
        }

        const diagnosticText =
            (msg ? " message:" + _sanitizeDiagnosticText(msg) : STR_EMPTY) +
            (properties ? " props:" + _sanitizeDiagnosticText(strProps) : STR_EMPTY);

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
        let _messageCount: number = 0;

        /**
         * Holds information about what message types were already logged to console or sent to server.
         */
        let _messageLogged: { [msg: number]: boolean } = {};

        let _loggingLevelConsole: number;
        let _loggingLevelTelemetry: number;
        let _maxInternalMessageLimit: number;
        let _enableDebug: boolean;
        let _unloadHandler: IUnloadHook;

        dynamicProto(DiagnosticLogger, this, (_self) => {
            _unloadHandler = _setDefaultsFromConfig(config || {});

            _self.consoleLoggingLevel = () => _loggingLevelConsole;

            /**
             * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
             * @param severity - The severity of the log message
             * @param message  - The log message.
             */
            _self.throwInternal = (severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) => {
                const message = new _InternalLogMessage(msgId, msg, isUserAct, properties);

                if (_enableDebug) {
                    throw dumpObj(message);
                } else {
                    // Get the logging function and fallback to warnToConsole of for some reason errorToConsole doesn't exist
                    let logFunc = _logFuncs[severity] || STR_WARN_TO_CONSOLE;

                    if (!isUndefined(message.message)) {
                        if (isUserAct) {
                            // check if this message type was already logged to console for this page view and if so, don't log it again
                            const messageKey: number = +message.messageId;

                            if (!_messageLogged[messageKey] && _loggingLevelConsole >= severity) {
                                _self[logFunc](message.message);
                                _messageLogged[messageKey] = true;
                            }
                        } else {
                            // Only log traces if the console Logging Level is >= the throwInternal severity level
                            if (_loggingLevelConsole >= severity) {
                                _self[logFunc](message.message);
                            }
                        }

                        _logInternalMessage(severity, message);
                    } else {
                        _debugExtMsg("throw" + (severity === eLoggingSeverity.CRITICAL ? "Critical" : "Warning"), message);
                    }
                }
            }

            _self.debugToConsole = (message: string) => {
                _logToConsole("debug", message);
                _debugExtMsg("warning", message);
            };

            _self.warnToConsole = (message: string) => {
                _logToConsole("warn", message);
                _debugExtMsg("warning", message);
            };


            _self.errorToConsole = (message: string) => {
                _logToConsole("error", message);
                _debugExtMsg("error", message);
            };

            _self.resetInternalMessageCount = (): void => {
                _messageCount = 0;
                _messageLogged = {};
            };

            _self.logInternalMessage = _logInternalMessage;

            _self.unload = (isAsync?: boolean) => {
                _unloadHandler && _unloadHandler.rm();
                _unloadHandler = null;
            };

            function _logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
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
                    if (severity <= _loggingLevelTelemetry) {
                        _self.queue.push(message);
                        _messageCount++;
                        _debugExtMsg((severity === eLoggingSeverity.CRITICAL ? "error" : "warn"), message);
                    }

                    // When throttle limit reached, send a special event
                    if (_messageCount === _maxInternalMessageLimit) {
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
            }

            function _setDefaultsFromConfig(config: IConfiguration): IUnloadHook {
                // make sure the config is dynamic
                return onConfigChange(createDynamicConfig(config, defaultValues, _self).cfg, (details) => {
                    let config = details.cfg;
                    _loggingLevelConsole = config.loggingLevelConsole;
                    _loggingLevelTelemetry = config.loggingLevelTelemetry;
                    _maxInternalMessageLimit = config.maxMessageLimit;
                    _enableDebug =  config.enableDebug;
                });
            }

            function _areInternalMessagesThrottled(): boolean {
                return _messageCount >= _maxInternalMessageLimit;
            }

            function _debugExtMsg(name: string, data: any) {
                let dbgExt = getDebugExt(config || {});
                if (dbgExt && dbgExt.diagLog) {
                    dbgExt.diagLog(name, data);
                }
            }
        });
    }

    /**
     * 0: OFF (default)
     * 1: CRITICAL
     * 2: \>= WARNING
     */
    public consoleLoggingLevel(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    /**
     * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
     * @param severity  - The severity of the log message
     * @param message - The log message.
     */
    public throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * This will write a debug message to the console if possible
     * @param message - The debug message
     */
    public debugToConsole(message: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * This will write a warning to the console if possible
     * @param message  - The warning message
     */
    public warnToConsole(message: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * This will write an error to the console if possible
     * @param message - The warning message
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
     * @param severity - The severity of the log message
     * @param message - The message to log.
     */
    public logInternalMessage(severity: LoggingSeverity, message: _InternalLogMessage): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Unload and remove any state that this IDiagnosticLogger may be holding, this is generally called when the
     * owning SDK is being unloaded.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @returns If the unload occurs synchronously then nothing should be returned, if happening asynchronously then
     * the function should return an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * / Promise to allow any listeners to wait for the operation to complete.
     */
    public unload(isAsync?: boolean): void | IPromise<void> {
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
 * @param severity - The severity of the log message
 * @param message  - The log message.
 */
export function _throwInternal(logger: IDiagnosticLogger, severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) {
    _getLogger(logger).throwInternal(severity, msgId, msg, properties, isUserAct);
}

/**
 * This is a helper method which will call warnToConsole on the passed logger with the provided message.
 * @param logger - The Diagnostic Logger instance to use.
 * @param message  - The log message.
 */
export function _warnToConsole(logger: IDiagnosticLogger, message: string) {
    _getLogger(logger).warnToConsole(message);
}

/**
 * Logs a message to the internal queue.
 * @param logger - The Diagnostic Logger instance to use.
 * @param severity  - The severity of the log message
 * @param message - The message to log.
 */
export function _logInternalMessage(logger: IDiagnosticLogger, severity: LoggingSeverity, message: _InternalLogMessage) {
    _getLogger(logger).logInternalMessage(severity, message);
}
