// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {
    strShimUndefined, strShimObject, strShimFunction, throwTypeError,
    ObjClass, ObjProto, ObjAssign, ObjHasOwnProperty, ObjDefineProperty, strShimPrototype
} from "@microsoft/applicationinsights-shims";
import { strEmpty } from "./InternalConstants";

// RESTRICT and AVOID circular dependencies you should not import other contained modules or export the contents of this file directly

// Added to help with minfication
const strToISOString = "toISOString";
const cStrEndsWith = "endsWith";
const cStrStartsWith = "startsWith";
const strIndexOf = "indexOf";
const strMap = "map";
const strReduce = "reduce";
const cStrTrim = "trim";
const strToString = "toString";

/**
 * Constant string defined to support minimization
 * @ignore
 */
const str__Proto = "__proto__";

/**
  * Constant string defined to support minimization
  * @ignore
  */
const strConstructor = "constructor";
 
const _objDefineProperty = ObjDefineProperty;
const _objFreeze = ObjClass.freeze;
const _objSeal = ObjClass.seal;
const _objKeys = ObjClass.keys;

const StringProto = String[strShimPrototype];
const _strTrim = StringProto[cStrTrim];
const _strEndsWith = StringProto[cStrEndsWith];
const _strStartsWith = StringProto[cStrStartsWith];

const DateProto = Date[strShimPrototype];
const _dataToISOString = DateProto[strToISOString];
const _isArray = Array.isArray;
const _objToString = ObjProto[strToString];

const _fnToString = ObjHasOwnProperty[strToString];
// Cache what this browser reports as the object function constructor (as a string)
const _objFunctionString = _fnToString.call(ObjClass);

const rCamelCase = /-([a-z])/g;
const rNormalizeInvalid = /([^\w\d_$])/g;
const rLeadingNumeric = /^(\d+[\w\d_$])/;


/**
 * Pre-lookup to check if we are running on a modern browser (i.e. not IE8)
 * @ignore
 */
let _objGetPrototypeOf = Object["getPrototypeOf"];

/**
  * Helper used to get the prototype of the target object as getPrototypeOf is not available in an ES3 environment.
  * @ignore
  */
export function _getObjProto(target:any) {
    if (target) {
        // This method doesn't existing in older browsers (e.g. IE8)
        if (_objGetPrototypeOf) {
            return _objGetPrototypeOf(target);
        }
 
        // target[Constructor] May break if the constructor has been changed or removed
        let newProto = target[str__Proto] || target[strShimPrototype] || target[strConstructor];
        if(newProto) {
            return newProto;
        }
    }
 
    return null;
}

export function objToString(obj: any) {
    return _objToString.call(obj);
}

export function isTypeof(value: any, theType: string): boolean {
    return typeof value === theType;
}

export function isUndefined(value: any): value is undefined {
    return value === undefined || typeof value === strShimUndefined;
}

export function isNotUndefined<T>(value: T): value is T {
    return !isUndefined(value);
}

export function isNullOrUndefined(value: any): value is null | undefined {
    return (value === null || isUndefined(value));
}

export function isNotNullOrUndefined<T>(value: T): value is T {
    return !isNullOrUndefined(value);
}

export function hasOwnProperty(obj: any, prop: string): boolean {
    return !!(obj && ObjHasOwnProperty.call(obj, prop));
}

export function isObject<T>(value: T): value is T {
    // Changing to inline for performance
    return !!(value && typeof value === strShimObject);
}

export function isFunction(value: any): value is Function {
    // Changing to inline for performance
    return !!(value && typeof value === strShimFunction);
}

export function isPromiseLike<T>(value: any): value is PromiseLike<T> {
    return value && isFunction(value.then);
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

    if (value && isString(value)) {
        // CamelCase everything after the "-" and remove the dash
        value = value.replace(rCamelCase, function (_all, letter) {
            return letter.toUpperCase();
        });

        value = value.replace(rNormalizeInvalid, "_");
        value = value.replace(rLeadingNumeric, function(_all, match) {
            return "_" + match;
        });
    }

    return value;
}

/**
 * This is a helper function for the equivalent of arForEach(objKeys(target), callbackFn), this is a
 * performance optimization to avoid the creation of a new array for large objects
 * @param target The target object to find and process the keys
 * @param callbackfn The function to call with the details
 */
export function objForEachKey<T = any>(target: T, callbackfn: (name: string, value: T[keyof T]) => void) {
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
    let result = false;
    if (value && search && !(result = value === search)) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        result = _strEndsWith ? value[cStrEndsWith](search) : _strEndsWithPoly(value, search);
    }

    return result;
}

/**
 * The _strEndsWith() method determines whether a string ends with the characters of a specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param search - The characters to be searched for at the end of the value.
 * @returns true if the given search value is found at the end of the string, otherwise false.
 */
export function _strEndsWithPoly(value: string, search: string) {
    let result = false;
    let searchLen = search ? search.length : 0;
    let valLen = value ? value.length : 0;
    if (searchLen && valLen && valLen >= searchLen && !(result = value === search)) {
        let pos = valLen - 1;
        for (let lp = searchLen - 1; lp >= 0; lp--) {
            if (value[pos] != search[lp]) {
                return false;
            }
            pos--;
        }

        result = true;
    }

    return result;
}

/**
 * The strStartsWith() method determines whether a string starts with the characters of the specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param checkValue - The characters to be searched for at the start of the value.
 * @returns true if the given search value is found at the start of the string, otherwise false.
 */
export function strStartsWith(value: string, checkValue: string) {
    let result = false;
    if (value && checkValue && !(result = value === checkValue)) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        result = _strStartsWith ? value[cStrStartsWith](checkValue) : _strStartsWithPoly(value, checkValue);
    }

    return result;
}

/**
 * The strStartsWith() method determines whether a string starts with the characters of the specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param checkValue - The characters to be searched for at the start of the value.
 * @returns true if the given search value is found at the start of the string, otherwise false.
 */
export function _strStartsWithPoly(value: string, checkValue: string) {
    // Using helper for performance and because string startsWith() is not available on IE
    let result = false;
    let chkLen = checkValue ? checkValue.length : 0;
    if (value && chkLen && value.length >= chkLen && !(result = value === checkValue)) {
        for (let lp = 0; lp < chkLen; lp++) {
            if (value[lp] !== checkValue[lp]) {
                return false;
            }
        }

        result = true;
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
    return !!(obj && _objToString.call(obj) === "[object Date]");
}

/**
 * Check if an object is of type Array with optional generic T, the generic type is not validated
 * and exists to help with TypeScript validation only.
 */
export let isArray: <T = any>(obj: any) => obj is Array<T> = _isArray || _isArrayPoly;
function _isArrayPoly<T = any>(obj: any): obj is Array<T> {
    return !!(obj && _objToString.call(obj) === "[object Array]");
}

/**
 * Check if an object is of type Error
 */
export function isError(obj: any): obj is Error {
    return !!(obj && _objToString.call(obj) === "[object Error]");
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
 * Checks if the type of the value is a normal plain object (not a null or data)
 * @param value
 */
export function isPlainObject(value: any): boolean {
    let result: boolean = false;

    if (value && typeof value === "object") {
        // Inlining _objGetPrototypeOf for performance to avoid an additional function call
        let proto = _objGetPrototypeOf ? _objGetPrototypeOf(value) : _getObjProto(value);
        if (!proto) {
            // No prototype found so this is a plain Object eg. 'Object.create(null)'
            result = true;
        } else {
            // Objects that have a prototype are plain only if they were created using the Object global (native) function
            if (proto[strConstructor] && ObjHasOwnProperty.call(proto, strConstructor)) {
                proto = proto[strConstructor];
            }

            result = typeof proto === strShimFunction && _fnToString.call(proto) === _objFunctionString;
        }
    }

    return result;
}

/**
 * Convert a date to I.S.O. format in IE8
 */
export function toISOString(date: Date) {
    if (date) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        return _dataToISOString ? date[strToISOString]() : _toISOStringPoly(date);
    }
}

/**
 * Convert a date to I.S.O. format in IE8
 */
export function _toISOStringPoly(date: Date) {
    if (date && date.getUTCFullYear) {
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
export function arrForEach<T = any>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => undefined | void | number, thisArg?: any): void {
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
    if (arr) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        if (arr[strIndexOf]) {
            return arr[strIndexOf](searchElement, fromIndex);
        }

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
    let results: R[];

    if (arr) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        if (arr[strMap]) {
            return arr[strMap](callbackfn, thisArg);
        }

        let len = arr.length;
        let _this = thisArg || arr;
        results = new Array(len);
    
        try {
            for (let lp = 0; lp < len; lp++) {
                if (lp in arr) {
                    results[lp] = callbackfn.call(_this, arr[lp], arr);
                }
            }
        } catch (e) {
            // This can happen with some native browser objects, but should not happen for the type we are checking for
        }
    
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
    let value;

    if (arr) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        if (arr[strReduce]) {
            return arr[strReduce]<R>(callbackfn, initialValue);
        }

        let len = arr.length;
        let lp = 0;
    
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
    }

    return value;
}

/**
 * helper method to trim strings (IE8 does not implement String.prototype.trim)
 */
export function strTrim(str: any): string {
    if (str) {
        // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
        str = (_strTrim && str[cStrTrim]) ? str[cStrTrim]() : (str.replace ? str.replace(/^\s+|\s+$/g, "") : str);
    }
    
    return str;
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

    // For Performance try and use the native instance, using string lookup of the function to easily pass the ES3 build checks and minification
    if (!_objKeysHasDontEnumBug && _objKeys) {
        return _objKeys(obj);
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

function _doNothing<T>(value: T): T {
    return value;
}

export function deepFreeze<T>(obj: T): T {
    if (_objFreeze) {
        objForEachKey(obj, (name, value) => {
            if (isArray(value) || isObject(value)) {
                _objFreeze(value);
            }
        });
    }

    return objFreeze(obj);
}

export const objFreeze: <T>(value: T) => T = _objFreeze || _doNothing;
export const objSeal: <T>(value: T) => T = _objSeal || _doNothing;

/**
 * Return the current time via the Date now() function (if available) and falls back to (new Date()).getTime() if now() is unavailable (IE8 or less)
 * https://caniuse.com/#search=Date.now
 */
export function dateNow() {
    let dt = Date;
    
    return dt.now ? dt.now() : new dt().getTime();
}

/**
 * Returns the name of object if it's an Error. Otherwise, returns empty string.
 */
export function getExceptionName(object: any): string {
    if (isError(object)) {
        return object.name;
    }

    return strEmpty;
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
export function setValue<T, K extends keyof T>(target: T, field: K, value: T[K], valChk?: ((value: T[K]) => boolean) | null, srcChk?: ((value: T[K]) => boolean) | null) {
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

function _createProxyFunction<S>(source: S | (() => S), funcName: (keyof S)) {
    let srcFunc: () => S = null;
    let src: S = null;
    if (isFunction (source)) {
        srcFunc = source;
    } else {
        src = source;
    }

    return function() {
        // Capture the original arguments passed to the method
        var originalArguments = arguments;
        if (srcFunc) {
            src = srcFunc();
        }

        if (src) {
            return (src[funcName] as any).apply(src, originalArguments);
        }
    }
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
 */
export function proxyAssign<T, S>(target: T, source: S, chkSet?: (name: string, isFunc?: boolean, source?: S, target?: T) => boolean) {
    if (target && source && isObject(target) && isObject(source)) {
        // effectively apply/proxy full source to the target instance
        for (const field in source) {
            if (isString(field)) {
                let value = source[field] as any;
                if (isFunction(value)) {
                    if (!chkSet || chkSet(field, true, source, target)) {
                        // Create a proxy function rather than just copying the (possible) prototype to the new object as an instance function
                        target[field as string] = _createProxyFunction(source, field);
                    }
                } else if (!chkSet || chkSet(field, false, source, target)) {
                    if (hasOwnProperty(target, field)) {
                        // Remove any previous instance property
                        delete (target as any)[field];
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
 * Creates a proxy function on the target which internally will call the source version with all arguments passed to the target method.
 *
 * @param target - The target object to be assigned with the source properties and functions
 * @param name - The function name that will be added on the target
 * @param source - The source object which will be assigned / called by setting / calling the targets proxies
 * @param theFunc - The function name on the source that will be proxied on the target
 * @param overwriteTarget - If `false` this will not replace any pre-existing name otherwise (the default) it will overwrite any existing name
 */
export function proxyFunctionAs<T, S>(target: T, name: string, source: S | (() => S), theFunc: (keyof S), overwriteTarget?: boolean) {
    if (target && name && source) {
        if (overwriteTarget !== false || isUndefined(target[name])) {
            (target as any)[name] = _createProxyFunction(source, theFunc);
        }
    }
}

/**
 * Creates proxy functions on the target which internally will call the source version with all arguments passed to the target method.
 *
 * @param target - The target object to be assigned with the source properties and functions
 * @param source - The source object which will be assigned / called by setting / calling the targets proxies
 * @param functionsToProxy - An array of function names that will be proxied on the target
 * @param overwriteTarget - If false this will not replace any pre-existing name otherwise (the default) it will overwrite any existing name
 */
export function proxyFunctions<T, S>(target: T, source: S | (() => S), functionsToProxy: (keyof S)[], overwriteTarget?: boolean) {
    if (target && source && isObject(target) && isArray(functionsToProxy)) {
        arrForEach(functionsToProxy, (theFuncName) => {
            if (isString(theFuncName)) {
                proxyFunctionAs(target, theFuncName, source, theFuncName, overwriteTarget);
            }
        });
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
    if (theObject && ObjAssign) {
        theObject = ObjClass(ObjAssign({}, theObject));
    }

    return theObject;
}

/**
 * Pass in the objects to merge as arguments, this will only "merge" (extend) properties that are owned by the object.
 * It will NOT merge inherited or non-enumerable properties.
 * @param obj1 - object to merge.  Set this argument to 'true' for a deep extend.
 * @param obj2 - object to merge.
 * @param obj3 - object to merge.
 * @param obj4 - object to merge.
 * @param obj5 - object to merge.
 * @returns The extended first object.
 */
export function objExtend<T2, T3, T4, T5, T6>(deepExtend?: boolean, obj2?: T2, obj3?: T3, obj4?: T4, obj5?: T5, obj6?: T6): T2 & T3 & T4 & T5 & T6
export function objExtend<T1, T2, T3, T4, T5, T6>(obj1?: T1, obj2?: T2, obj3?: T3, obj4?: T4, obj5?: T5, obj6?: T6): T1 & T2 & T3 & T4 & T5 & T6
export function objExtend<T1, T2, T3, T4, T5, T6>(obj1?: T1 | any, obj2?: T2, obj3?: T3, obj4?: T4, obj5?: T5, obj6?: T6): T1 & T2 & T3 & T4 & T5 & T6 {
    // Variables
    let theArgs = arguments as any;
    let extended: T1 & T2 & T3 & T4 & T5 & T6 = theArgs[0] || {};
    let argLen = theArgs.length;
    let deep = false;
    let idx = 1;

    // Check for "Deep" flag
    if (argLen > 0 && isBoolean(extended)) {
        deep = extended;
        extended = theArgs[idx] || {};
        idx++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (!isObject(extended)) {
        extended = {} as T1 & T2 & T3 & T4 & T5 & T6;
    }

    // Loop through each remaining object and conduct a merge
    for (; idx < argLen; idx++ ) {
        let arg = theArgs[idx];
        let isArgArray = isArray(arg);
        let isArgObj = isObject(arg);
        for (let prop in arg) {
            let propOk = (isArgArray && (prop in arg)) || (isArgObj && (ObjHasOwnProperty.call(arg, prop)));
            if (!propOk) {
                continue;
            }

            let newValue = arg[prop];
            let isNewArray: boolean;

            // If deep merge and property is an object, merge properties
            if (deep && newValue && ((isNewArray = isArray(newValue)) || isPlainObject(newValue))) {
                // Grab the current value of the extended object
                let clone = extended[prop];

                if (isNewArray) {
                    if (!isArray(clone)) {
                        // We can't "merge" an array with a non-array so overwrite the original
                        clone = [];
                    }
                } else if (!isPlainObject(clone)) {
                    // We can't "merge" an object with a non-object
                    clone = {};
                }

                // Never move the original objects always clone them
                newValue = objExtend(deep, clone, newValue);
            }

            // Assign the new (or previous) value (unless undefined)
            if (newValue !== undefined) {
                extended[prop] = newValue;
            }
        }
    }

    return extended;
}