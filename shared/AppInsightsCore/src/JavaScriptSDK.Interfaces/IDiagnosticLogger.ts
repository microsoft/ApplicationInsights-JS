// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { _InternalMessageId, LoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../JavaScriptSDK/DiagnosticLogger";

"use strict"

export interface IDiagnosticLogger {
    /**
     * When this is true the SDK will throw exceptions to aid in debugging.
     */
    enableDebugExceptions: () => boolean;
    
    /**
     * 0: OFF
     * 1: only critical (default)
     * 2: critical + info
     */
    consoleLoggingLevel: () => number;

    /**
     * 0: OFF (default)
     * 1: CRITICAL
     * 2: WARNING
     */
    telemetryLoggingLevel: () => number;

    /**
     * The maximum number of internal messages allowed to be sent per page view
     */
    maxInternalMessageLimit: () => number;

    /**
     * The internal logging queue
     */
    queue: _InternalLogMessage[];

    /**
     * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The log message.
     */
    throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct?: boolean): void;

    /**
     * This will write a warning to the console if possible
     * @param message {string} - The warning message
     */
    warnToConsole(message: string): void;

    /**
     * Resets the internal message count
     */
    resetInternalMessageCount(): void;

    /**
     * Logs a message to the internal queue.
     * @param severity {LoggingSeverity} - The severity of the log message
     * @param message {_InternalLogMessage} - The message to log.
     */
    logInternalMessage?(severity: LoggingSeverity, message: _InternalLogMessage): void;
}
