// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createRacePromise, createTimeoutPromise } from "@nevware21/ts-async";
import { dumpObj, fnApply } from "@nevware21/ts-utils";
import { IOTelErrorHandlers } from "../interfaces/otel/config/IOTelErrorHandlers";

/**
 * Handle / report an error.
 * When not provided the default is to generally throw an {@link InvalidAttributeError}
 * @param handlers - The error handlers configuration
 * @param message - The error message to report
 * @param key - The attribute key that caused the error
 * @param value - The attribute value that caused the error
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleAttribError(handlers: IOTelErrorHandlers, message: string, key: string, value: any) {
    if (handlers.attribError) {
        handlers.attribError(message, key, value);
    } else {
        handleWarn(handlers, message + " for [" + key + "]: " + dumpObj(value));
    }
}

/**
 * There was an error with the span.
 * @param handlers - The error handlers configuration
 * @param message - The message to report
 * @param spanName - The name of the span
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleSpanError(handlers: IOTelErrorHandlers, message: string, spanName: string) {
    if (handlers.spanError) {
        handlers.spanError(message, spanName);
    } else {
        handleWarn(handlers, "Span [" + spanName + "]: " + message);
    }
}

/**
 * Report a general debug message, should not be treated as fatal
 * @param handlers - The error handlers configuration
 * @param message - The debug message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleDebug(handlers: IOTelErrorHandlers, message: string) {
    if (handlers.debug) {
        handlers.debug(message);
    } else {
        if (console) {
            let fn = console.log;
            fnApply(fn, console, [message]);
        }
    }
}

/**
 * Report a general warning, should not be treated as fatal
 * @param handlers - The error handlers configuration
 * @param message - The warning message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleWarn(handlers: IOTelErrorHandlers, message: string) {
    if (handlers.warn) {
        handlers.warn(message);
    } else {
        if (console) {
            let fn = console.warn || console.log;
            fnApply(fn, console, [message]);
        }
    }
}

/**
 * Report a general error, should not be treated as fatal
 * @param handlers - The error handlers configuration
 * @param message - The error message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleError(handlers: IOTelErrorHandlers, message: string) {
    if (handlers.error) {
        handlers.error(message);
    } else if (handlers.warn) {
        handlers.warn(message);
    } else {
        if (console) {
            let fn = console.error || console.warn || console.log;
            fnApply(fn, console, [message]);
        }
    }
}

/**
 * A general error handler for not implemented methods.
 * @param handlers - The error handlers configuration
 * @param message - The message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleNotImplemented(handlers: IOTelErrorHandlers, message: string) {
    if (handlers.notImplemented) {
        handlers.notImplemented(message);
    } else {
        if (console) {
            let fn = console.error || console.log;
            fnApply(fn, console, [message]);
        }
    }
}

/**
 * Adds a timeout to a promise and rejects if the specified timeout has elapsed.
 * Reports the timeout through the configured error handlers before rejecting.
 *
 * @param handlers - The configured error handlers to notify.
 * @param promise - The promise to guard with the timeout.
 * @param timeout - Timeout in milliseconds before the promise is rejected.
 */

export function callWithTimeout<T>(
    handlers: IOTelErrorHandlers,
    promise: Promise<T>,
    timeout: number
): IPromise<T> {
    const timeoutMessage = "Operation timed out.";
    const timeoutError = new Error(timeoutMessage);
    timeoutError.name = "TimeoutError";
    (timeoutError as { __otelTimeout?: boolean }).__otelTimeout = true;

    const racedPromise = createRacePromise<T>([
        promise,
        createTimeoutPromise<Error>(timeout, false, timeoutError) as unknown as PromiseLike<T>
    ]);

    return racedPromise.catch((error) => {
        if (error && (error === timeoutError || (error as { __otelTimeout?: boolean }).__otelTimeout)) {
            handleError(handlers, timeoutMessage);
        }

        throw error;
    });
}
