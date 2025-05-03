// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ObjAssign, ObjClass } from "@microsoft/applicationinsights-shims";
import {
    arrForEach, asString as asString21, isArray, isBoolean, isError, isFunction, isNullOrUndefined, isNumber, isObject, isPlainObject,
    isString, isUndefined, objDeepFreeze, objDefine, objForEachKey, objHasOwn, strIndexOf, strTrim
} from "@nevware21/ts-utils";
import { FeatureOptInMode } from "../JavaScriptSDK.Enums/FeatureOptInEnums";
import { TransportType } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IXDomainRequest } from "../JavaScriptSDK.Interfaces/IXDomainRequest";
import { STR_EMPTY } from "./InternalConstants";

// RESTRICT and AVOID circular dependencies you should not import other contained modules or export the contents of this file directly

// Added to help with minification
const strGetPrototypeOf = "getPrototypeOf";

const rCamelCase = /-([a-z])/g;
const rNormalizeInvalid = /([^\w\d_$])/g;
const rLeadingNumeric = /^(\d+[\w\d_$])/;

export let _getObjProto = Object[strGetPrototypeOf];

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
 * @param name - The name to validate
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
 * Convert a date to I.S.O. format in IE8
 */
export function toISOString(date: Date) {
    return date && date.toISOString() || "";
}

export const deepFreeze: <T>(obj: T) => T = objDeepFreeze;

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
 * properties of "referenced" object will work (target.context.newValue = 10 =\> will be reflected in the source.context as it's the
 * same object). ES3 Failures: assigning target.myProp = 3 -\> Won't change source.myProp = 3, likewise the reverse would also fail.
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
                    if (objHasOwn(target, field)) {
                        // Remove any previous instance property
                        delete (target as any)[field];
                    }

                    objDefine<any>(target, field, {
                        g: () => {
                            return source[field];
                        },
                        s: (theValue) => {
                            source[field] = theValue;
                        }
                    });
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
 * @param defaults - Simple helper
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
            let propOk = (isArgArray && (prop in arg)) || (isArgObj && objHasOwn(arg, prop));
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

export const asString = asString21;

/**
 * Checks if the feature is enabled on not. If the feature is not defined, it will return the default state if provided or undefined.
 * If the feature is defined, it will check the mode and return true if the mode is enable or false if the mode is disable.
 * @param feature - The feature name to check
 * @param cfg - The configuration object to check the feature state against
 * @param sdkDefaultState - Optional default state to return if the feature is not defined
 * @returns True if the feature is enabled, false if the feature is disabled, or undefined if the feature is not defined and no default state is provided.
 */
export function isFeatureEnabled<T extends IConfiguration = IConfiguration>(feature?: string, cfg?: T, sdkDefaultState?: boolean): boolean | undefined {
    let ft = cfg && cfg.featureOptIn && cfg.featureOptIn[feature];
    if (feature && ft) {
        let mode = ft.mode;
        // NOTE: None will be considered as true
        if (mode === FeatureOptInMode.enable) {
            return true
        } else if (mode === FeatureOptInMode.disable) {
            return false;
        }
    }

    // Return the default state if provided or undefined
    return sdkDefaultState;
}

export function getResponseText(xhr: XMLHttpRequest | IXDomainRequest) {
    try {
        return xhr.responseText;
    } catch (e) {
        // Best effort, as XHR may throw while XDR wont so just ignore
    }

    return null;
}

export function formatErrorMessageXdr(xdr: IXDomainRequest, message?: string): string {
    if (xdr) {
        return "XDomainRequest,Response:" + getResponseText(xdr) || "";
    }

    return message;
}

export function formatErrorMessageXhr(xhr: XMLHttpRequest, message?: string): string {
    if (xhr) {
        return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + getResponseText(xhr) || xhr.response || "";
    }

    return message;
}

export function prependTransports(theTransports: TransportType[], newTransports: TransportType | TransportType[]) {
    if (newTransports) {
        if (isNumber(newTransports)) {
            theTransports = [newTransports as TransportType].concat(theTransports);
        } else if (isArray(newTransports)) {
            theTransports = newTransports.concat(theTransports);
        }
    }
    return theTransports;
}

const strDisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
const strWithCredentials: string = "withCredentials";
const strTimeout: string = "timeout";

/**
 * Create and open an XMLHttpRequest object
 * @param method - The request method
 * @param urlString - The url
 * @param withCredentials - Option flag indicating that credentials should be sent
 * @param disabled - Optional flag indicating that the XHR object should be marked as disabled and not tracked (default is false)
 * @param isSync - Optional flag indicating if the instance should be a synchronous request (defaults to false)
 * @param timeout - Optional value identifying the timeout value that should be assigned to the XHR request
 * @returns A new opened XHR request
 */
export function openXhr(method: string, urlString: string, withCredentials?: boolean, disabled: boolean = false, isSync: boolean = false, timeout?: number) {

    function _wrapSetXhrProp<T>(xhr: XMLHttpRequest, prop: string, value: T) {
        try {
            xhr[prop] = value;
        } catch (e) {
            // - Wrapping as depending on the environment setting the property may fail (non-terminally)
        }
    }

    let xhr = new XMLHttpRequest();

    if (disabled) {
        // Tag the instance so it's not tracked (trackDependency)
        // If the environment has locked down the XMLHttpRequest (preventExtensions and/or freeze), this would
        // cause the request to fail and we no telemetry would be sent
        _wrapSetXhrProp(xhr, strDisabledPropertyName, disabled);
    }

    if (withCredentials) {
        // Some libraries require that the withCredentials flag is set "before" open and
        // - Wrapping as IE 10 has started throwing when setting before open
        _wrapSetXhrProp(xhr, strWithCredentials, withCredentials);
    }

    xhr.open(method, urlString, !isSync);

    if (withCredentials) {
        // withCredentials should be set AFTER open (https://xhr.spec.whatwg.org/#the-withcredentials-attribute)
        // And older firefox instances from 11+ will throw for sync events (current versions don't) which happens during unload processing
        _wrapSetXhrProp(xhr, strWithCredentials, withCredentials);
    }

    // Only set the timeout for asynchronous requests as
    // "Timeout shouldn't be used for synchronous XMLHttpRequests requests used in a document environment or it will throw an InvalidAccessError exception.""
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout
    if (!isSync && timeout) {
        _wrapSetXhrProp(xhr, strTimeout, timeout);
    }

    return xhr;
}

/**
* Converts the XHR getAllResponseHeaders to a map containing the header key and value.
* @internal
*/
// tslint:disable-next-line: align
export function convertAllHeadersToMap(headersString: string): { [headerName: string]: string } {
    let headers = {};
    if (isString(headersString)) {
        let headersArray = strTrim(headersString).split(/[\r\n]+/);
        arrForEach(headersArray, (headerEntry) => {
            if (headerEntry) {
                let idx = headerEntry.indexOf(": ");
                if (idx !== -1) {
                    // The new spec has the headers returning all as lowercase -- but not all browsers do this yet
                    let header = strTrim(headerEntry.substring(0, idx)).toLowerCase();
                    let value = strTrim(headerEntry.substring(idx + 1));
                    headers[header] = value;
                } else {
                    headers[strTrim(headerEntry)] = 1;
                }
            }
        });
    }

    return headers;
}

/**
* append the XHR headers.
* @internal
*/
export function _appendHeader(theHeaders: any, xhr: XMLHttpRequest, name: string) {
    if (!theHeaders[name] && xhr && xhr.getResponseHeader) {
        let value = xhr.getResponseHeader(name);
        if (value) {
            theHeaders[name] = strTrim(value);
        }
    }

    return theHeaders;
}

const STR_KILL_DURATION_HEADER = "kill-duration";
const STR_KILL_DURATION_SECONDS_HEADER = "kill-duration-seconds";
const STR_TIME_DELTA_HEADER = "time-delta-millis";
/**
* get the XHR getAllResponseHeaders.
* @internal
*/
export function _getAllResponseHeaders(xhr: XMLHttpRequest, isOneDs?: boolean) {
    let theHeaders = {};

    if (!xhr.getAllResponseHeaders) {
        // Firefox 2-63 doesn't have getAllResponseHeaders function but it does have getResponseHeader
        // Only call these if getAllResponseHeaders doesn't exist, otherwise we can get invalid response errors
        // as collector is not currently returning the correct header to allow JS to access these headers
        if (!!isOneDs) {
            theHeaders = _appendHeader(theHeaders, xhr, STR_TIME_DELTA_HEADER);
            theHeaders = _appendHeader(theHeaders, xhr, STR_KILL_DURATION_HEADER);
            theHeaders = _appendHeader(theHeaders, xhr, STR_KILL_DURATION_SECONDS_HEADER);
        }
    
    } else {
        theHeaders = convertAllHeadersToMap(xhr.getAllResponseHeaders());
    }

    return theHeaders;
}
