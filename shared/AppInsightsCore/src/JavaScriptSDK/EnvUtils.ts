// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

/**
 * This file exists to hold environment utilities that are requied to check and
 * validate the current operating environment. Unless otherwise required, please
 * only defined methods (functions) in this class so that users of these 
 * functions/properties only need to include those that are used within their own modules.
 */

export const strUndefined = "undefined";
export const strObject = "object";
export const strPrototype = "prototype";
export const strFunction = "function";

const strWindow = "window";
const strDocument = "document";
const strNavigator = "navigator";
const strHistory = "history";
const strLocation = "location";
const strPerformance = "performance";
const strJSON = "JSON";

// To address compile time errors declaring these here
declare var globalThis: Window;
declare var global: Window;

/**
 * Returns the current global scope object, for a normal web page this will be the current
 * window, for a Web Worker this will be current worker global scope via "self". The internal 
 * implementation returns the first available instance object in the following order
 * - globalThis (New standard)
 * - self (Will return the current window instance for supported browsers)
 * - window (fallback for older browser implementations)
 * - global (NodeJS standard)
 * - <null> (When all else fails)
 * While the return type is a Window for the normal case, not all environments will support all
 * of the properties or functions.
 */
export function getGlobal(): Window {
    if (typeof globalThis !== strUndefined && globalThis) {
        return globalThis;
    }

    if (typeof self !== strUndefined && self) {
        return self;
    }

    if (typeof window !== strUndefined && window) {
        return window;
    }

    if (typeof global !== strUndefined && global) {
        return global;
    }

    return null;
}

/**
 * Return the named global object if available, will return null if the object is not available.
 * @param name The globally named object
 */
export function getGlobalInst<T>(name:string): T {
    let gbl = getGlobal();
    if (gbl && gbl[name]) {
        return gbl[name] as T;
    }

    // Test workaround, for environments where <global>.window (when global == window) doesn't return the base window
    if (name === strWindow && hasWindow()) {
        // tslint:disable-next-line: no-angle-bracket-type-assertion
        return <any>window as T;
    }

    return null;
}

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

    // Return the global instance or null
    return getGlobalInst(strWindow);
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
    }

    return getGlobalInst(strDocument);
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

    return getGlobalInst(strNavigator);
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

    return getGlobalInst(strHistory);
}

/**
 * Returns the global location object if it is present otherwise null.
 * This helper is used to access the location object without causing an exception
 * "Uncaught ReferenceError: location is not defined"
 */
export function getLocation(): Location | null {
    if (typeof location === strObject && location) {
        return location;
    }

    return getGlobalInst(strLocation);
}

/**
 * Returns the performance object if it is present otherwise null.
 * This helper is used to access the performance object from the current
 * global instance which could be window or globalThis for a web worker
 */
export function getPerformance(): Performance | null {
    return getGlobalInst(strPerformance);
}

/**
 * Checks if JSON object is available, this is required as we support the API running without a 
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a history 
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: JSON is not defined" 
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasJSON(): boolean {
    return Boolean((typeof JSON === strObject && JSON) || getGlobalInst(strJSON) !== null);
}

/**
 * Returns the global JSON object if it is present otherwise null.
 * This helper is used to access the JSON object without causing an exception
 * "Uncaught ReferenceError: JSON is not defined"
 */
export function getJSON(): JSON | null {
    if (hasJSON()) {
        return JSON || getGlobalInst(strJSON);
    }

    return null;
}
