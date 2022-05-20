// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ObjAssign, ObjClass, ObjHasOwnProperty, ObjProto, strShimFunction, strShimPrototype } from "@microsoft/applicationinsights-shims";
import {
    arrForEach, isArray, isBoolean, isError, isFunction, isNullOrUndefined, isObject, isString, isUndefined, objDeepFreeze,
    objDefineAccessors, objForEachKey, objHasOwnProperty, strIndexOf, throwUnsupported
} from "@nevware21/ts-utils";
import { STR_EMPTY } from "./InternalConstants";

// RESTRICT and AVOID circular dependencies you should not import other contained modules or export the contents of this file directly

// Added to help with minification
const cString = "String";
const cObject = "Object";
const strToISOString = "toISOString";
const strMap = "map";
const strToString = "toString";
const strGetPrototypeOf = "getPrototypeOf";

/**
  * Constant string defined to support minimization
  * @ignore
  */
const strConstructor = "constructor";

const DateProto = Date[strShimPrototype];
const _dateToISOString = DateProto[strToISOString] || _polyfillRequired("Date", strToISOString);
const _objToString = ObjProto[strToString] || _polyfillRequired(cObject, strToString);

const _fnToString = ObjHasOwnProperty[strToString] || _polyfillRequired(cString, strToString);
// Cache what this browser reports as the object function constructor (as a string)
const _objFunctionString = _fnToString.call(ObjClass);

const rCamelCase = /-([a-z])/g;
const rNormalizeInvalid = /([^\w\d_$])/g;
const rLeadingNumeric = /^(\d+[\w\d_$])/;

function _polyfillRequired(object:string, name: string): any {
    return function() {
        throwUnsupported("Polyfill required for [" + name + "]");
    }
}

export let _getObjProto = Object[strGetPrototypeOf] || _polyfillRequired(cObject, strGetPrototypeOf);

export function objToString(obj: any) {
    return _objToString.call(obj);
}

export function isNotUndefined<T>(value: T): value is T {
    return !isUndefined(value);
}

export function isNotNullOrUndefined<T>(value: T): value is T {
    return !isNullOrUndefined(value);
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
 * A simple wrapper (for minification support) to check if the value contains the search string.
 * @param value - The string value to check for the existence of the search value
 * @param search - The value search within the value
 */
export function strContains(value: string, search: string): boolean {
    if (value && search) {
        return strIndexOf(value, search) !== -1;
    }

    return false;
}

/**
 * Checks if the type of the value is a normal plain object (not a null or data)
 * @param value
 */
export function isPlainObject(value: any): boolean {
    let result: boolean = false;

    if (value && typeof value === "object") {
        // Inlining _objGetPrototypeOf for performance to avoid an additional function call
        let proto = _getObjProto(value);
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
    return _dateToISOString.call(date);
}

export const deepFreeze: <T>(obj: T) => T = objDeepFreeze;

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

    return STR_EMPTY;
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

/**
 * Get the mapped config value, if null or undefined any supplied defaultValue will be returned.
 * @param field - The name of the field as the named enum value (number) or the string name.
 * @param defaultValue - The default value to return if the config field is not present, null or undefined.
 */
export function getCfgValue<V>(theValue: V, defaultValue?: V): V {
    return !isNullOrUndefined(theValue) ? theValue : defaultValue;
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
                    if (objHasOwnProperty(target, field)) {
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
