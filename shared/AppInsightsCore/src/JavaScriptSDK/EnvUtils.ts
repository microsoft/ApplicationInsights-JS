// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

/**
 * This file exists to hold environment utilities that are requied to check and
 * validate the current operating environment. Unless otherwise required, please
 * only defined methods (functions) in this class so that users of these 
 * functions/properties only need to include those that are used within their own modules.
 */

export const strObject = "object";

/**
 * Checks if window object is available, this is required as we support the API running without a 
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a window 
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: window is not defined" 
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasWindow(): boolean {
    return Boolean(typeof window === strObject && window);
}

/**
 * Returns the global window object if it is present otherwise null.
 * This helper is used to access the window object without causing an exception
 * "Uncaught ReferenceError: window is not defined"
 */
export function getWindow(): Window | null {
    if (hasWindow()) {
        return window;
    }

    return null;
}

/**
 * Checks if document object is available, this is required as we support the API running without a 
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a document 
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: document is not defined" 
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasDocument(): boolean {
    return Boolean(typeof document === strObject && document);
}

/**
 * Returns the global document object if it is present otherwise null.
 * This helper is used to access the document object without causing an exception
 * "Uncaught ReferenceError: document is not defined"
 */
export function getDocument(): Document | null {
    if (hasDocument()) {
        return document;
    } else if (hasWindow()) {
        return getWindow().document || null;
    }

    return null;
}


/**
 * Checks if navigator object is available, this is required as we support the API running without a 
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a navigator 
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: navigator is not defined" 
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasNavigator(): boolean {
    return Boolean(typeof navigator === strObject && navigator);
}

/**
 * Returns the global navigator object if it is present otherwise null.
 * This helper is used to access the navigator object without causing an exception
 * "Uncaught ReferenceError: navigator is not defined"
 */
export function getNavigator(): Navigator | null {
    if (hasNavigator()) {
        return navigator;
    }

    return null;
}

/**
 * Checks if history object is available, this is required as we support the API running without a 
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a history 
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: history is not defined" 
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasHistory(): boolean {
    return Boolean(typeof history === strObject && history);
}

/**
 * Returns the global history object if it is present otherwise null.
 * This helper is used to access the history object without causing an exception
 * "Uncaught ReferenceError: history is not defined"
 */
export function getHistory(): History | null {
    if (hasHistory()) {
        return history;
    }

    return null;
}

/**
 * Checks if JSON object is available, this is required as we support the API running without a 
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a history 
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: JSON is not defined" 
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasJSON(): boolean {
    return Boolean(typeof JSON === strObject && JSON);
}

/**
 * Returns the global JSON object if it is present otherwise null.
 * This helper is used to access the JSON object without causing an exception
 * "Uncaught ReferenceError: JSON is not defined"
 */
export function getJSON(): JSON | null {
    if (hasJSON()) {
        return JSON;
    }

    return null;
}


