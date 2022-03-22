// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { objCreateFn, strShimUndefined } from "@microsoft/applicationinsights-shims";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ICookieMgr } from "../JavaScriptSDK.Interfaces/ICookieMgr";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { _gblCookieMgr } from "./CookieMgr";
import { getPerformance, isIE }  from "./EnvUtils";
import {
    arrForEach, arrIndexOf, arrMap, arrReduce, dateNow, hasOwnProperty,
    isArray, isBoolean, isDate, isError, isFunction, isNullOrUndefined, isNumber, isObject, isString, isTypeof,
    isUndefined, objDefineAccessors, objKeys, strTrim, toISOString
} from "./HelperFuncs";
import { addEventHandler, attachEvent, detachEvent } from "./EventHelpers";
import { randomValue, random32, mwcRandomSeed, mwcRandom32, newId } from "./RandomHelper";
import { strEmpty } from "./InternalConstants";

let _cookieMgrs: ICookieMgr[] = null;
let _canUseCookies: boolean;    // legacy supported config

// Added to help with minfication
export const Undefined = strShimUndefined;
export function newGuid(): string {
    function randomHexDigit() {
        return randomValue(15); // Get a random value from 0..15
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(GuidRegex, (c) => {
        const r = (randomHexDigit() | 0), v = (c === "x" ? r : r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Return the current value of the Performance Api now() function (if available) and fallback to dateNow() if it is unavailable (IE9 or less)
 * https://caniuse.com/#search=performance.now
 */
export function perfNow(): number {
    let perf = getPerformance();
    if (perf && perf.now) {
        return perf.now();
    }

    return dateNow();
}

/**
 * The strEndsWith() method determines whether a string ends with the characters of a specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param search - The characters to be searched for at the end of the value.
 * @returns true if the given search value is found at the end of the string, otherwise false.
 */
export function strEndsWith(value: string, search: string) {
    if (value && search) {
        let len = value.length;
        let start = len - search.length;
        return value.substring(start >= 0 ? start : 0, len) === search;
    }

    return false;
}

/**
 * generate W3C trace id
 */
export function generateW3CId(): string {
    const hexValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

    // rfc4122 version 4 UUID without dashes and with lowercase letters
    let oct = strEmpty, tmp;
    for (let a = 0; a < 4; a++) {
        tmp = random32();
        oct +=
            hexValues[tmp & 0xF] +
            hexValues[tmp >> 4 & 0xF] +
            hexValues[tmp >> 8 & 0xF] +
            hexValues[tmp >> 12 & 0xF] +
            hexValues[tmp >> 16 & 0xF] +
            hexValues[tmp >> 20 & 0xF] +
            hexValues[tmp >> 24 & 0xF] +
            hexValues[tmp >> 28 & 0xF];
    }

    // "Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively"
    const clockSequenceHi = hexValues[8 + (random32() & 0x03) | 0];
    return oct.substr(0, 8) + oct.substr(9, 4) + "4" + oct.substr(13, 3) + clockSequenceHi + oct.substr(16, 3) + oct.substr(19, 12);
}

/**
 * Provides a collection of utility functions, included for backward compatibility with previous releases.
 * @deprecated Marking this interface and instance as deprecated in favor of direct usage of the helper functions
 * as direct usage provides better tree-shaking and minification by avoiding the inclusion of the unused items
 * in your resulting code.
 */
export interface ICoreUtils {
    /**
     * Internal - Do not use directly.
     * @deprecated Direct usage of this property is not recommend
     */
    _canUseCookies: boolean;

    isTypeof: (value: any, theType: string) => boolean;

    isUndefined: (value: any) => boolean;

    isNullOrUndefined: (value: any) => boolean;

    hasOwnProperty: (obj: any, prop: string) => boolean;

    /**
     * Checks if the passed of value is a function.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    isFunction: (value: any) => value is Function;

    /**
     * Checks if the passed of value is a function.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    isObject: (value: any) => boolean;

    /**
     * Check if an object is of type Date
     */
    isDate: (obj: any) => obj is Date;

    /**
     * Check if an object is of type Array
     */
    isArray: (obj: any) => boolean;

    /**
     * Check if an object is of type Error
     */
    isError: (obj: any) => obj is Error;

    /**
     * Checks if the type of value is a string.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a string, false otherwise.
     */
    isString: (value: any) => value is string;

    /**
     * Checks if the type of value is a number.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a number, false otherwise.
     */
    isNumber: (value: any) => value is number;

    /**
     * Checks if the type of value is a boolean.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    isBoolean: (value: any) => value is boolean;

    /**
     * Convert a date to I.S.O. format in IE8
     */
    toISOString: (date: Date) => string;

    /**
     * Performs the specified action for each element in an array. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
     * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
     * cause a testing requirement to test with and without the implementations
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. It can return -1 to break out of the loop
     * @param thisArg  [Optional] An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    arrForEach: <T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void|number, thisArg?: any) => void;

    /**
     * Returns the index of the first occurrence of a value in an array. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
     * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
     * cause a testing requirement to test with and without the implementations
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    arrIndexOf: <T>(arr: T[], searchElement: T, fromIndex?: number) => number;

    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results. This helper exists
     * to avoid adding a polyfil for older browsers that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page
     * checks for presence/absence of the prototype implementation. Note: For consistency this will not use the Array.prototype.xxxx
     * implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    arrMap: <T, R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any) => R[];

    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is
     * provided as an argument in the next call to the callback function. This helper exists to avoid adding a polyfil for older browsers that do not define
     * Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation. Note: For consistency
     * this will not use the Array.prototype.xxxx implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    arrReduce: <T, R>(arr: T[], callbackfn: (previousValue: T | R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R) => R;

    /**
     * helper method to trim strings (IE8 does not implement String.prototype.trim)
     */
    strTrim: (str: any) => string;

    /**
     * Creates an object that has the specified prototype, and that optionally contains specified properties. This helper exists to avoid adding a polyfil
     * for older browsers that do not define Object.create eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object to use as a prototype. May be null
     */
    // tslint:disable-next-line: member-ordering
    objCreate:(obj: object) => any;

    /**
     * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Object.keys eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.keys implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    objKeys: (obj: {}) => string[];

    /**
     * Try to define get/set object property accessors for the target object/prototype, this will provide compatibility with
     * existing API definition when run within an ES5+ container that supports accessors but still enable the code to be loaded
     * and executed in an ES3 container, providing basic IE8 compatibility.
     * @param target The object on which to define the property.
     * @param prop The name of the property to be defined or modified.
     * @param getProp The getter function to wire against the getter.
     * @param setProp The setter function to wire against the setter.
     * @returns True if it was able to create the accessors otherwise false
     */
    objDefineAccessors: <T>(target: any, prop: string, getProp?: () => T, setProp?: (v: T) => void) => boolean;

    /**
     * Trys to add an event handler for the specified event to the window, body and document
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    addEventHandler: (eventName: string, callback: any, evtNamespace?: string | string[]) => boolean;

    /**
     * Return the current time via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less)
     * https://caniuse.com/#search=Date.now
     */
    dateNow: () => number;

    /**
     * Identifies whether the current environment appears to be IE
     */
    isIE: () => boolean;

    /**
     * @deprecated - Use the core.getCookieMgr().disable()
     * Force the SDK not to store and read any data from cookies.
     */
    disableCookies: () => void;

    newGuid: () => string;

    /**
     * Return the current value of the Performance Api now() function (if available) and fallback to dateNow() if it is unavailable (IE9 or less)
     * https://caniuse.com/#search=performance.now
     */
    perfNow: () => number;

    /**
     * Generate random base64 id string.
     * The default length is 22 which is 132-bits so almost the same as a GUID but as base64 (the previous default was 5)
     * @param maxLength - Optional value to specify the length of the id to be generated, defaults to 22
     */
    newId: (maxLength?: number) => string;

    /**
     * Generate a random value between 0 and maxValue, max value should be limited to a 32-bit maximum.
     * So maxValue(16) will produce a number from 0..16 (range of 17)
     * @param maxValue
     */
    randomValue: (maxValue: number) => number;

    /**
     * generate a random 32-bit number (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), defaults un-unsigned.
     * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
     */
    random32: (signed?: boolean) => number;

    /**
     * Seed the MWC random number generator with the specified seed or a random value
     * @param value - optional the number to used as the seed, if undefined, null or zero a random value will be chosen
     */
    mwcRandomSeed: (value?: number) => void;

    /**
     * Generate a random 32-bit number between (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), using MWC (Multiply with carry)
     * instead of Math.random() defaults to un-signed.
     * Used as a replacement random generator for IE to avoid issues with older IE instances.
     * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
     */
    mwcRandom32: (signed?: boolean) => number;

    /**
     * generate W3C trace id
     */
    generateW3CId: () => string;
}

/**
 * Provides a collection of utility functions, included for backward compatibility with previous releases.
 * @deprecated Marking this instance as deprecated in favor of direct usage of the helper functions
 * as direct usage provides better tree-shaking and minification by avoiding the inclusion of the unused items
 * in your resulting code.
 */
export const CoreUtils: ICoreUtils = {
    _canUseCookies: undefined,
    isTypeof: isTypeof,
    isUndefined: isUndefined,
    isNullOrUndefined: isNullOrUndefined,
    hasOwnProperty: hasOwnProperty,
    isFunction: isFunction,
    isObject: isObject,
    isDate: isDate,
    isArray: isArray,
    isError: isError,
    isString: isString,
    isNumber: isNumber,
    isBoolean: isBoolean,
    toISOString: toISOString,
    arrForEach: arrForEach,
    arrIndexOf: arrIndexOf,
    arrMap: arrMap,
    arrReduce: arrReduce,
    strTrim: strTrim,
    objCreate: objCreateFn,
    objKeys: objKeys,
    objDefineAccessors: objDefineAccessors,
    addEventHandler: addEventHandler,
    dateNow: dateNow,
    isIE: isIE,
    disableCookies: disableCookies,
    newGuid: newGuid,
    perfNow: perfNow,
    newId: newId,
    randomValue: randomValue,
    random32: random32,
    mwcRandomSeed: mwcRandomSeed,
    mwcRandom32: mwcRandom32,
    generateW3CId: generateW3CId
};

const GuidRegex = /[xy]/g;

export interface IEventHelper {
    /**
     * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
     * @param obj Object to add the event too.
     * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
     * @param handlerRef Pointer that specifies the function to call when event fires
     * @returns True if the function was bound successfully to the event, otherwise false
     */
    Attach: (obj: any, eventNameWithoutOn: string, handlerRef: any) => boolean;

    /**
     * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
     * @deprecated Use {@link EventHelper#Attach} as we are already in a class call EventHelper the extra "Event" just causes a larger result
     * @param obj Object to add the event too.
     * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
     * @param handlerRef Pointer that specifies the function to call when event fires
     * @returns True if the function was bound successfully to the event, otherwise false
     */
    AttachEvent: (obj: any, eventNameWithoutOn: string, handlerRef: any) => boolean;

    /**
     * Removes an event handler for the specified event
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    Detach: (obj: any, eventNameWithoutOn: string, handlerRef: any) => void;

    /**
     * Removes an event handler for the specified event
     * @deprecated Use {@link EventHelper#Detach} as we are already in a class call EventHelper the extra "Event" just causes a larger result
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    DetachEvent: (obj: any, eventNameWithoutOn: string, handlerRef: any) => void;
}

export const EventHelper: IEventHelper = {
    Attach: attachEvent,
    AttachEvent: attachEvent,
    Detach: detachEvent,
    DetachEvent: detachEvent
};

/**
 * Helper to support backward compatibility for users that use the legacy cookie handling functions and the use the internal
 * CoreUtils._canUseCookies global flag to enable/disable cookies usage.
 * Note: This has the following deliberate side-effects
 * - Creates the global (legacy) cookie manager if it does not already exist
 * - Attempts to add "listeners" to the CoreUtils._canUseCookies property to support the legacy usage
 * @param config
 * @param logger
 * @returns
 */
export function _legacyCookieMgr(config?: IConfiguration, logger?: IDiagnosticLogger): ICookieMgr {
    let cookieMgr = _gblCookieMgr(config, logger);
    let legacyCanUseCookies = (CoreUtils as any)._canUseCookies;

    if (_cookieMgrs === null) {
        _cookieMgrs = [];
        _canUseCookies = legacyCanUseCookies;

        // Dynamically create get/set property accessors for backward compatibility for enabling / disabling cookies
        // this WILL NOT work for ES3 browsers (< IE8)
        objDefineAccessors<boolean>(CoreUtils, "_canUseCookies",
            () => {
                return _canUseCookies;
            },
            (value) => {
                _canUseCookies = value;
                arrForEach(_cookieMgrs, (mgr) => {
                    mgr.setEnabled(value);
                });
            });
    }

    if (arrIndexOf(_cookieMgrs, cookieMgr) === -1) {
        _cookieMgrs.push(cookieMgr);
    }

    if (isBoolean(legacyCanUseCookies)) {
        cookieMgr.setEnabled(legacyCanUseCookies);
    }

    if (isBoolean(_canUseCookies)) {
        cookieMgr.setEnabled(_canUseCookies);
    }

    return cookieMgr;
}

/**
 * @deprecated - Use the core.getCookieMgr().disable()
 * Force the SDK not to store and read any data from cookies.
 */
export function disableCookies() {
    _legacyCookieMgr().setEnabled(false);
}

/**
 * @deprecated - Use the core.getCookieMgr().isEnabled()
 * Helper method to tell if document.cookie object is available and whether it can be used.
 */
export function canUseCookies(logger: IDiagnosticLogger): any {
    return _legacyCookieMgr(null, logger).isEnabled();
}

/**
 * @deprecated - Use the core.getCookieMgr().get()
 * helper method to access userId and sessionId cookie
 */
export function getCookie(logger: IDiagnosticLogger, name: string) {
    return _legacyCookieMgr(null, logger).get(name);
}

/**
 * @deprecated - Use the core.getCookieMgr().set()
 * helper method to set userId and sessionId cookie
 */
export function setCookie(logger: IDiagnosticLogger, name: string, value: string, domain?: string) {
    _legacyCookieMgr(null, logger).set(name, value, null, domain);
}

/**
 * @deprecated - Use the core.getCookieMgr().del()
 * Deletes a cookie by setting it's expiration time in the past.
 * @param name - The name of the cookie to delete.
 */
export function deleteCookie(logger: IDiagnosticLogger, name: string) {
    return _legacyCookieMgr(null, logger).del(name);
}
