// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IPromise } from "@nevware21/ts-async";
import { _InternalLogMessage } from "../../diagnostics/DiagnosticLogger";
import { LoggingSeverity, _InternalMessageId } from "../../enums/ai/LoggingEnums";
import { ITelemetryUpdateState } from "./ITelemetryUpdateState";

export interface IDiagnosticLogger {

    /**
     * 0: OFF
     * 1: only critical (default)
     * 2: critical + info
     */
    consoleLoggingLevel: () => number;

    /**
     * The internal logging queue
     */
    queue: _InternalLogMessage[];

    /**
     * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
     * @param severity - The severity of the log message
     * @param message - The log message.
     */
    throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct?: boolean): void;

    /**
     * This will write a debug message to the console if possible
     * @param message - The debug message
     */
    debugToConsole? (message: string): void

    /**
     * This will write a warning to the console if possible
     * @param message - The warning message
     */
    warnToConsole(message: string): void;

    /**
     * This will write an error to the console if possible.
     * Provided by the default DiagnosticLogger instance, and internally the SDK will fall back to warnToConsole, however,
     * direct callers MUST check for its existence on the logger as you can provide your own IDiagnosticLogger instance.
     * @param message - The error message
     */
    errorToConsole?(message: string): void;

    /**
     * Resets the internal message count
     */
    resetInternalMessageCount(): void;

    /**
     * Logs a message to the internal queue.
     * @param severity - The severity of the log message
     * @param message - The message to log.
     */
    logInternalMessage?(severity: LoggingSeverity, message: _InternalLogMessage): void;

    /**
     * Optional Callback hook to allow the diagnostic logger to update it's configuration
     * @param updateState - The new configuration state to apply to the diagnostic logger
     */
    update?(updateState: ITelemetryUpdateState): void;

    /**
     * Unload and remove any state that this IDiagnosticLogger may be holding, this is generally called when the
     * owning SDK is being unloaded.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @returns If the unload occurs synchronously then nothing should be returned, if happening asynchronously then
     * the function should return an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * / Promise to allow any listeners to wait for the operation to complete.
     */
    unload?(isAsync?: boolean): void | IPromise<void>;

    /**
     * A flag that indicates whether this logger is in debug (throw real exceptions) mode
     */
    readonly dbgMode?: boolean;
}
