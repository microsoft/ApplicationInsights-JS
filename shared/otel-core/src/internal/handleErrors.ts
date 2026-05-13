// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dumpObj, fnApply } from "@nevware21/ts-utils";
import { IOTelErrorHandlers } from "../interfaces/otel/config/IOTelErrorHandlers";

/**
 * A source for error handlers — either the handlers directly or a config
 * object that contains an `errorHandlers` property (e.g., IOTelConfig, IOTelWebSdkConfig).
 * This allows handle* functions to accept the SDK/core config directly, putting
 * the dereferencing logic in one place rather than in every component.
 */
export type OTelErrorHandlerSource = IOTelErrorHandlers | { errorHandlers?: IOTelErrorHandlers };

/**
 * Resolves the error handlers from a source that may be either direct handlers
 * or a config object containing an `errorHandlers` property.
 * @param source - The error handler source to resolve
 * @returns The resolved IOTelErrorHandlers, never null
 */
function _resolveHandlers(source: OTelErrorHandlerSource): IOTelErrorHandlers {
    if (!source) {
        return {};
    }

    let asConfig = source as { errorHandlers?: IOTelErrorHandlers };
    if (asConfig.errorHandlers) {
        return asConfig.errorHandlers;
    }

    return source as IOTelErrorHandlers;
}

/**
 * Handle / report an error.
 * When not provided the default is to generally throw an {@link OTelInvalidAttributeError}
 * @param source - The error handlers or a config object with errorHandlers
 * @param message - The error message to report
 * @param key - The attribute key that caused the error
 * @param value - The attribute value that caused the error
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleAttribError(source: OTelErrorHandlerSource, message: string, key: string, value: any) {
    let handlers = _resolveHandlers(source);
    if (handlers.attribError) {
        handlers.attribError(message, key, value);
    } else {
        handleWarn(handlers, message + " for [" + key + "]: " + dumpObj(value));
    }
}

/**
 * There was an error with the span.
 * @param source - The error handlers or a config object with errorHandlers
 * @param message - The message to report
 * @param spanName - The name of the span
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleSpanError(source: OTelErrorHandlerSource, message: string, spanName: string) {
    let handlers = _resolveHandlers(source);
    if (handlers.spanError) {
        handlers.spanError(message, spanName);
    } else {
        handleWarn(handlers, "Span [" + spanName + "]: " + message);
    }
}

/**
 * Report a general debug message, should not be treated as fatal
 * @param source - The error handlers or a config object with errorHandlers
 * @param message - The debug message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleDebug(source: OTelErrorHandlerSource, message: string) {
    let handlers = _resolveHandlers(source);
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
 * @param source - The error handlers or a config object with errorHandlers
 * @param message - The warning message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleWarn(source: OTelErrorHandlerSource, message: string) {
    let handlers = _resolveHandlers(source);
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
 * @param source - The error handlers or a config object with errorHandlers
 * @param message - The error message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleError(source: OTelErrorHandlerSource, message: string) {
    let handlers = _resolveHandlers(source);
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
 * @param source - The error handlers or a config object with errorHandlers
 * @param message - The message to report
 */
/*#__NO_SIDE_EFFECTS__*/
export function handleNotImplemented(source: OTelErrorHandlerSource, message: string) {
    let handlers = _resolveHandlers(source);
    if (handlers.notImplemented) {
        handlers.notImplemented(message);
    } else {
        if (console) {
            let fn = console.error || console.log;
            fnApply(fn, console, [message]);
        }
    }
}
