// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const strShimFunction = "function";
export const strShimObject = "object";
export const strShimUndefined = "undefined";
export const strShimPrototype = "prototype";
export const strShimHasOwnProperty = "hasOwnProperty";

// To address compile time errors declaring these here
declare var globalThis: Window;
declare var global: Window;
declare var __extends:(d: any, b: any) => any;
declare var __assign:(t: any) => any;

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
    if (typeof globalThis !== strShimUndefined && globalThis) {
        return globalThis;
    }

    if (typeof self !== strShimUndefined && self) {
        return self;
    }

    if (typeof window !== strShimUndefined && window) {
        return window;
    }

    if (typeof global !== strShimUndefined && global) {
        return global;
    }

    return null;
}

/**
 * Creates an object that has the specified prototype, and that optionally contains specified properties. This helper exists to avoid adding a polyfil
 * for older browsers that do not define Object.create eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
 * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param obj Object to use as a prototype. May be null
 */
export function objCreateFn(obj: any): any {
    var func = Object["create"];
    // Use build in Object.create
    if (func) {
        // Use Object create method if it exists
        return func(obj); 
    }
    if (obj == null) { 
        return {}; 
    }
    var type = typeof obj;
    if (type !== strShimObject && type !== strShimFunction) { 
        throw new TypeError('Object prototype may only be an Object:' + obj); 
    }

    function tmpFunc() {}
    tmpFunc[strShimPrototype] = obj;

    return new (tmpFunc as any)();    
}

export function __assignFn(t: any) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) {
            if (Object[strShimPrototype][strShimHasOwnProperty].call(s, p)) {
                t[p] = s[p];
            }
        }
    }
    return t;
}

// tslint:disable-next-line: only-arrow-functions
var __extendStaticsFn = function(d: any, b: any): any {
    __extendStaticsFn = Object["setPrototypeOf"] ||
        // tslint:disable-next-line: only-arrow-functions
        ({ __proto__: [] } instanceof Array && function (d: any, b: any) { d.__proto__ = b; }) ||
        // tslint:disable-next-line: only-arrow-functions
        function (d: any, b: any) { 
            for (var p in b) {
                if (b[strShimHasOwnProperty](p)) {
                    d[p] = b[p];
                }
            }
        };
    return __extendStaticsFn(d, b);
};

export function __extendsFn(d: any, b: any) {
    __extendStaticsFn(d, b);
    function __() { this.constructor = d; }
    // tslint:disable-next-line: ban-comma-operator
    d[strShimPrototype] = b === null ? objCreateFn(b) : (__[strShimPrototype] = b[strShimPrototype], new (__ as any)());
}

let globalObj:any = getGlobal() || {};

// tslint:disable: only-arrow-functions
(function (root: any, assignFn, extendsFn) {
    // Assign the globally scoped versions of the functions -- used when consuming individual ts files
    root.__assign = root.__assign || (Object as any).assign || assignFn;
    root.__extends = root.__extends || extendsFn;
})(globalObj, __assignFn, __extendsFn);

// Assign local variables that will be used for embedded scenarios
__assign = globalObj.__assign;
__extends = globalObj.__extends;

