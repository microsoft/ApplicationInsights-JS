import { IOTelErrorHandlers } from "@microsoft/applicationinsights-core-js";
import { dumpObj, fnApply } from "@nevware21/ts-utils";

/**
 * Handle / report an error.
 * When not provided the default is to generally throw an {@link InvalidAttributeError}
 * @param message
 * @param key
 * @param value
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
 * @param message - the message to report
 * @param spanName - the name of the span
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
 * Report a general wanring, should not be treated as fatal
 * @param message
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
 * Report a general wanring, should not be treated as fatal
 * @param message
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
 * @param message
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
 * @param message - the message to report
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
