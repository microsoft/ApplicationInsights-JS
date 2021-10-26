// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {
    strShimUndefined, strShimObject, strShimFunction, throwTypeError,
    ObjClass, ObjProto, ObjAssign, ObjHasOwnProperty, ObjDefineProperty
} from "@microsoft/applicationinsights-shims";

// RESTRICT and AVOID circular dependencies you should not import other contained modules or export the contents of this file directly

// Added to help with minfication
const strOnPrefix = "on";
const strAttachEvent = "attachEvent";
const strAddEventHelper = "addEventListener";
const strDetachEvent = "detachEvent";
const strRemoveEventListener = "removeEventListener";

const _objDefineProperty = ObjDefineProperty;
const _objFreeze = ObjClass["freeze"];
const _objSeal = ObjClass["seal"];

export function objToString(obj: any) {
    return ObjProto.toString.call(obj);
}

export function isTypeof(value: any, theType: string): boolean {
    return typeof value === theType;
}

export function isUndefined(value: any): boolean {
    return value === undefined || typeof value === strShimUndefined;
}

export function isNotUndefined(value: any): boolean {
    return !isUndefined(value);
}

export function isNullOrUndefined(value: any): boolean {
    return (value === null || isUndefined(value));
}

export function isNotNullOrUndefined(value: any): boolean {
    return !isNullOrUndefined(value);
}

export function hasOwnProperty(obj: any, prop: string): boolean {
    return obj && ObjHasOwnProperty.call(obj, prop);
}

export function isObject(value: any): boolean {
    // Changing to inline for performance
    return typeof value === strShimObject;
}

export function isFunction(value: any): value is Function {
    // Changing to inline for performance
    return typeof value === strShimFunction;
}

/**
 * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
 * @param obj Object to add the event too.
 * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
 * @param handlerRef Pointer that specifies the function to call when event fires
 * @param useCapture [Optional] Defaults to false
 * @returns True if the function was bound successfully to the event, otherwise false
 */
export function attachEvent(obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean = false) {
    let result = false;
    if (!isNullOrUndefined(obj)) {
        try {
            if (!isNullOrUndefined(obj[strAddEventHelper])) {
                // all browsers except IE before version 9
                obj[strAddEventHelper](eventNameWithoutOn, handlerRef, useCapture);
                result = true;
            } else if (!isNullOrUndefined(obj[strAttachEvent])) {
                // IE before version 9
                obj[strAttachEvent](strOnPrefix + eventNameWithoutOn, handlerRef);
                result = true;
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }

    return result;
}

/**
 * Removes an event handler for the specified event
 * @param Object to remove the event from
 * @param eventNameWithoutOn {string} - The name of the event
 * @param handlerRef {any} - The callback function that needs to be executed for the given event
 * @param useCapture [Optional] Defaults to false
 */
export function detachEvent(obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean = false) {
    if (!isNullOrUndefined(obj)) {
        try {
            if (!isNullOrUndefined(obj[strRemoveEventListener])) {
                obj[strRemoveEventListener](eventNameWithoutOn, handlerRef, useCapture);
            } else if (!isNullOrUndefined(obj[strDetachEvent])) {
                obj[strDetachEvent](strOnPrefix + eventNameWithoutOn, handlerRef);
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }
}

/**
 * Validates that the string name conforms to the JS IdentifierName specification and if not
 * normalizes the name so that it would. This method does not identify or change any keywords
 * meaning that if you pass in a known keyword the same value will be returned.
 * This is a simplified version
 * @param name The name to validate
 */
export function normalizeJsName(name: string): string {
    let value = name;
    let match = /([^\w\d_$])/g;
    if (match.test(name)) {
        value = name.replace(match, "_");
    }

    return value;
}

/**
 * This is a helper function for the equivalent of arForEach(objKeys(target), callbackFn), this is a
 * performance optimization to avoid the creation of a new array for large objects
 * @param target The target object to find and process the keys
 * @param callbackfn The function to call with the details
 */
export function objForEachKey(target: any, callbackfn: (name: string, value: any) => void) {
    if (target) {
        for (let prop in target) {
            if (ObjHasOwnProperty.call(target, prop)) {
                callbackfn.call(target, prop, target[prop]);
            }
        }
    }
}

/**
 * The strEndsWith() method determines whether a string ends with the characters of a specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param search - The characters to be searched for at the end of the value.
 * @returns true if the given search value is found at the end of the string, otherwise false.
 */
export function strEndsWith(value: string, search: string) {
    if (value && search) {
        let searchLen = search.length;
        let valLen = value.length;
        if (value === search) {
            return true;
        } else if (valLen >= searchLen) {
            let pos = valLen - 1;
            for (let lp = searchLen - 1; lp >= 0; lp--) {
                if (value[pos] != search[lp]) {
                    return false;
                }
                pos--;
            }

            return true;
        }
    }

    return false;
}

/**
 * The strStartsWith() method determines whether a string starts with the characters of the specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param checkValue - The characters to be searched for at the start of the value.
 * @returns true if the given search value is found at the start of the string, otherwise false.
 */
export function strStartsWith(value: string, checkValue: string) {
    // Using helper for performance and because string startsWith() is not available on IE
    let result = false;
    if (value && checkValue) {
        let chkLen = checkValue.length;
        if (value === checkValue) {
            return true;
        } else if (value.length >= chkLen) {
            for (let lp = 0; lp < chkLen; lp++) {
                if (value[lp] !== checkValue[lp]) {
                    return false;
                }
            }
            result = true;
        }
    }

    return result;
}

/**
 * A simple wrapper (for minification support) to check if the value contains the search string.
 * @param value - The string value to check for the existence of the search value
 * @param search - The value search within the value
 */
export function strContains(value: string, search: string) {
    if (value && search) {
        return value.indexOf(search) !== -1;
    }

    return false;
}

/**
 * Check if an object is of type Date
 */
export function isDate(obj: any): obj is Date {
    return objToString(obj) === "[object Date]";
}

/**
 * Check if an object is of type Array
 */
export function isArray(obj: any): boolean {
    return objToString(obj) === "[object Array]";
}

/**
 * Check if an object is of type Error
 */
export function isError(obj: any): obj is Error {
    return objToString(obj) === "[object Error]";
}

/**
 * Checks if the type of value is a string.
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a string, false otherwise.
 */
export function isString(value: any): value is string {
    // Changing to inline for performance
    return typeof value === "string";
}

/**
 * Checks if the type of value is a number.
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a number, false otherwise.
 */
export function isNumber(value: any): value is number {
    // Changing to inline for performance
    return typeof value === "number";
}

/**
 * Checks if the type of value is a boolean.
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a boolean, false otherwise.
 */
export function isBoolean(value: any): value is boolean {
    // Changing to inline for performance
    return typeof value === "boolean";
}

/**
 * Checks if the type of value is a Symbol.
 * This only returns a boolean as returning value is Symbol will cause issues for older TypeScript consumers
 * @param {any} value - Value to be checked.
 * @return {boolean} True if the value is a Symbol, false otherwise.
 */
export function isSymbol(value: any): boolean {
    return typeof value === "symbol";
}

/**
 * Convert a date to I.S.O. format in IE8
 */
export function toISOString(date: Date) {
    if (isDate(date)) {
        const pad = (num: number) => {
            let r = String(num);
            if (r.length === 1) {
                r = "0" + r;
            }

            return r;
        }

        return date.getUTCFullYear()
            + "-" + pad(date.getUTCMonth() + 1)
            + "-" + pad(date.getUTCDate())
            + "T" + pad(date.getUTCHours())
            + ":" + pad(date.getUTCMinutes())
            + ":" + pad(date.getUTCSeconds())
            + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
            + "Z";
    }
}

/**
 * Performs the specified action for each element in an array. This helper exists to avoid adding a polyfil for older browsers
 * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
 * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
 * cause a testing requirement to test with and without the implementations
 * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. It can return -1 to break out of the loop
 * @param thisArg  [Optional] An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
 */
export function arrForEach<T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void|number, thisArg?: any): void {
    let len = arr.length;
    try {
        for (let idx = 0; idx < len; idx++) {
            if (idx in arr) {
                if (callbackfn.call(thisArg || arr, arr[idx], idx, arr) === -1) {
                    break;
                }
            }
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
}

/**
 * Returns the index of the first occurrence of a value in an array. This helper exists to avoid adding a polyfil for older browsers
 * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
 * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
 * cause a testing requirement to test with and without the implementations
 * @param searchElement The value to locate in the array.
 * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
 */
export function arrIndexOf<T>(arr: T[], searchElement: T, fromIndex?: number): number {
    let len = arr.length;
    let from = fromIndex || 0;
    try {
        for (let lp = Math.max(from >= 0 ? from : len - Math.abs(from), 0); lp < len; lp++) {
            if (lp in arr && arr[lp] === searchElement) {
                return lp;
            }
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }

    return -1;
}

/**
 * Calls a defined callback function on each element of an array, and returns an array that contains the results. This helper exists
 * to avoid adding a polyfil for older browsers that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page
 * checks for presence/absence of the prototype implementation. Note: For consistency this will not use the Array.prototype.xxxx
 * implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
 * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
 */
export function arrMap<T, R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any): R[] {
    let len = arr.length;
    let _this = thisArg || arr;
    let results = new Array(len);

    try {
        for (let lp = 0; lp < len; lp++) {
            if (lp in arr) {
                results[lp] = callbackfn.call(_this, arr[lp], arr);
            }
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }

    return results;
}

/**
 * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is
 * provided as an argument in the next call to the callback function. This helper exists to avoid adding a polyfil for older browsers that do not define
 * Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation. Note: For consistency
 * this will not use the Array.prototype.xxxx implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
 * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
 */
export function arrReduce<T, R>(arr: T[], callbackfn: (previousValue: T | R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R): R {
    let len = arr.length;
    let lp = 0;
    let value;

    // Specifically checking the number of passed arguments as the value could be anything
    if (arguments.length >= 3) {
        value = arguments[2];
    } else {
        while (lp < len && !(lp in arr)) {
            lp++;
        }

        value = arr[lp++];
    }

    while (lp < len) {
        if (lp in arr) {
            value = callbackfn(value, arr[lp], lp, arr);
        }
        lp++;
    }

    return value;
}

/**
 * helper method to trim strings (IE8 does not implement String.prototype.trim)
 */
export function strTrim(str: any): string {
    if (typeof str !== "string") {
        return str;
    }

    return str.replace(/^\s+|\s+$/g, "");
}

let _objKeysHasDontEnumBug = !({ toString: null }).propertyIsEnumerable("toString");
let _objKeysDontEnums = [
    "toString",
    "toLocaleString",
    "valueOf",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "constructor"
];

/**
 * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers
 * that do not define Object.keys eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
 * Note: For consistency this will not use the Object.keys implementation if it exists as this would cause a testing requirement to test with and without the implementations
 * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
 */
export function objKeys(obj: {}): string[] {
    var objType = typeof obj;

    if (objType !== strShimFunction && (objType !== strShimObject || obj === null)) {
        throwTypeError("objKeys called on non-object");
    }

    let result: string[] = [];

    for (let prop in obj) {
        if (obj && ObjHasOwnProperty.call(obj, prop)) {
            result.push(prop);
        }
    }

    if (_objKeysHasDontEnumBug) {
        let dontEnumsLength = _objKeysDontEnums.length;

        for (let lp = 0; lp < dontEnumsLength; lp++) {
            if (obj && ObjHasOwnProperty.call(obj, _objKeysDontEnums[lp])) {
                result.push(_objKeysDontEnums[lp]);
            }
        }
    }

    return result;
}

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
export function objDefineAccessors<T>(target: any, prop: string, getProp?: () => T, setProp?: (v: T) => void): boolean {
    if (_objDefineProperty) {
        try {
            let descriptor: PropertyDescriptor = {
                enumerable: true,
                configurable: true
            }

            if (getProp) {
                descriptor.get = getProp;
            }
            if (setProp) {
                descriptor.set = setProp;
            }

            _objDefineProperty(target, prop, descriptor);
            return true;
        } catch (e) {
            // IE8 Defines a defineProperty on Object but it's only supported for DOM elements so it will throw
            // We will just ignore this here.
        }
    }

    return false;
}

export function objFreeze<T>(value: T): T {
    if (_objFreeze) {
        value = _objFreeze(value) as T;
    }

    return value;
}

export function objSeal<T>(value: T): T {
    if (_objSeal) {
        value = _objSeal(value) as T;
    }

    return value;
}

/**
 * Return the current time via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less)
 * https://caniuse.com/#search=Date.now
 */
export function dateNow() {
    let dt = Date;
    if (dt.now) {
        return dt.now();
    }

    return new dt().getTime();
}

/**
 * Returns the name of object if it's an Error. Otherwise, returns empty string.
 */
export function getExceptionName(object: any): string {
    if (isError(object)) {
        return object.name;
    }

    return "";
}

/**
 * Sets the provided value on the target instance using the field name when the provided chk function returns true, the chk
 * function will only be called if the new value is no equal to the original value.
 * @param target - The target object
 * @param field - The key of the target
 * @param value - The value to set
 * @param valChk - [Optional] Callback to check the value that if supplied will be called check if the new value can be set
 * @param srcChk - [Optional] Callback to check to original value that if supplied will be called if the new value should be set (if allowed)
 * @returns The existing or new value, depending what was set
 */
export function setValue<T, K extends keyof T>(target: T, field: K, value: T[K], valChk?: (value: T[K]) => boolean, srcChk?: (value: T[K]) => boolean) {
    let theValue = value;
    if (target) {
        theValue = target[field];
        if (theValue !== value && (!srcChk || srcChk(theValue)) && (!valChk || valChk(value))) {
            theValue = value;
            target[field] = theValue;
        }
    }

    return theValue;
}

/**
 * Returns the current value from the target object if not null or undefined otherwise sets the new value and returns it
 * @param target - The target object to return or set the default value
 * @param field - The key for the field to set on the target
 * @param defValue - [Optional] The value to set if not already present, when not provided a empty object will be added
 */
export function getSetValue<T, K extends keyof T>(target: T, field: K, defValue?: T[K]): T[K] {
    let theValue;
    if (target) {
        theValue = target[field];
        if (!theValue && isNullOrUndefined(theValue)) {
            // Supports having the default as null
            theValue = !isUndefined(defValue) ? defValue : {} as any;
            target[field] = theValue;
        }
    } else {
        // Expanded for performance so we only check defValue if required
        theValue = !isUndefined(defValue) ? defValue : {} as any;
    }

    return theValue;
}

export function isNotTruthy(value: any) {
    return !value;
}

export function isTruthy(value: any) {
    return !!value;
}

export function throwError(message: string): never {
    throw new Error(message);
}

/**
 * Effectively assigns all enumerable properties (not just own properties) and functions (including inherited prototype) from
 * the source object to the target, it attempts to use proxy getters / setters (if possible) and proxy functions to avoid potential
 * implementation issues by assigning prototype functions as instance ones
 *
 * This method is the primary method used to "update" the snippet proxy with the ultimate implementations.
 *
 * Special ES3 Notes:
 * Updates (setting) of direct property values on the target or indirectly on the source object WILL NOT WORK PROPERLY, updates to the
 * properties of "referenced" object will work (target.context.newValue = 10 => will be reflected in the source.context as it's the
 * same object). ES3 Failures: assigning target.myProp = 3 -> Won't change source.myProp = 3, likewise the reverse would also fail.
 * @param target - The target object to be assigned with the source properties and functions
 * @param source - The source object which will be assigned / called by setting / calling the targets proxies
 * @param chkSet - An optional callback to determine whether a specific property/function should be proxied
 * @memberof Initialization
 */
export function proxyAssign(target: any, source: any, chkSet?: (name: string, isFunc?: boolean, source?: any, target?: any) => boolean) {
    if (target && source && target !== source && isObject(target) && isObject(source)) {
        // effectively apply/proxy full source to the target instance
        for (const field in source) {
            if (isString(field)) {
                let value = source[field] as any;
                if (isFunction(value)) {
                    if (!chkSet || chkSet(field, true, source, target)) {
                        // Create a proxy function rather than just copying the (possible) prototype to the new object as an instance function
                        target[field as string] = (function(funcName: string) {
                            return function() {
                                // Capture the original arguments passed to the method
                                var originalArguments = arguments;
                                return source[funcName].apply(source, originalArguments);
                            }
                        })(field);
                    }
                } else if (!chkSet || chkSet(field, false, source, target)) {
                    if (hasOwnProperty(target, field)) {
                        // Remove any previous instance property
                        delete target[field];
                    }

                    if (!objDefineAccessors(target, field, () => {
                        return source[field];
                    }, (theValue) => {
                        source[field] = theValue;
                    })) {
                        // Unable to create an accessor, so just assign the values as a fallback
                        // -- this will (mostly) work for objects
                        // -- but will fail for accessing primitives (if the source changes it) and all types of "setters" as the source won't be modified
                        target[field as string] = value;
                    }
                }
            }
        }
    }

    return target;
}

/**
 * Simpler helper to create a dynamic class that implements the interface and populates the values with the defaults.
 * Only instance properties (hasOwnProperty) values are copied from the defaults to the new instance
 * @param defaults Simple helper
 */
export function createClassFromInterface<T>(defaults?: T) {
    return class {
        constructor() {
            if (defaults) {
                objForEachKey(defaults, (field, value) => {
                    (this as any)[field] = value;
                });
            }
        }
    } as new () => T;
}

/**
 * A helper function to assist with JIT performance for objects that have properties added / removed dynamically
 * this is primarily for chromium based browsers and has limited effects on Firefox and none of IE. Only call this
 * function after you have finished "updating" the object, calling this within loops reduces or defeats the benefits.
 * This helps when iterating using for..in, objKeys() and objForEach()
 * @param theObject - The object to be optimized if possible
 */
export function optimizeObject<T>(theObject: T): T {
    // V8 Optimization to cause the JIT compiler to create a new optimized object for looking up the own properties
    // primarily for object with <= 19 properties for >= 20 the effect is reduced or non-existent
    if (theObject) {
        theObject = ObjClass(ObjAssign ? ObjAssign({}, theObject) : theObject);
    }

    return theObject;
}
