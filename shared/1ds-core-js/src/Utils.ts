/**
* Utils.ts
* @author  Abhilash Panwar (abpanwar) Hector Hernandez (hectorh)
* @copyright Microsoft 2018
* File containing utility functions.
*/
import {
    ICookieMgr, ITelemetryItem, arrForEach, getGlobalInst, getNavigator, hasDocument, hasWindow, isArray, isBoolean, isNullOrUndefined,
    isNumber, isObject, isReactNative, isString, isUndefined, newGuid, objForEachKey, perfNow
} from "@microsoft/applicationinsights-core-js";
import { ObjProto, strShimObject } from "@microsoft/applicationinsights-shims";
import { strIndexOf, strLeft } from "@nevware21/ts-utils";
import { IEventProperty, IExtendedTelemetryItem } from "./DataModels";
import { EventLatency, EventLatencyValue, FieldValueSanitizerType, GuidStyle, eEventPropertyType, eValueKind } from "./Enums";
import { STR_EMPTY } from "./InternalConstants";

export const Version = "#version#";
export const FullVersionString = "1DS-Web-JS-" + Version;

const ObjHasOwnProperty = ObjProto.hasOwnProperty;

// Defining here so we don't need to take (import) the ApplicationInsights Common module
const strDisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
const strWithCredentials: string = "withCredentials";
const strTimeout: string = "timeout";

// If value is array just get the type for the first element
const _fieldTypeEventPropMap = {
    [FieldValueSanitizerType.NotSet]: eEventPropertyType.Unspecified,
    [FieldValueSanitizerType.Number]: eEventPropertyType.Double,
    [FieldValueSanitizerType.String]: eEventPropertyType.String,
    [FieldValueSanitizerType.Boolean]: eEventPropertyType.Bool,
    [FieldValueSanitizerType.Array | FieldValueSanitizerType.Number]: eEventPropertyType.Double,
    [FieldValueSanitizerType.Array | FieldValueSanitizerType.String]: eEventPropertyType.String,
    [FieldValueSanitizerType.Array | FieldValueSanitizerType.Boolean]: eEventPropertyType.Bool
};

/**
 * @ignore
 */
// let _uaDisallowsSameSiteNone = null;

var uInt8ArraySupported: boolean | null = null;
// var _areCookiesAvailable: boolean | undefined;

/**
 * Checks if document object is available
 */
export const isDocumentObjectAvailable: boolean = hasDocument();

/**
 * Checks if window object is available
 */
export const isWindowObjectAvailable: boolean = hasWindow();

/**
 * Checks if value is assigned to the given param.
 * @param value - The token from which the tenant id is to be extracted.
 * @returns True/false denoting if value is assigned to the param.
 */
export function isValueAssigned(value: any) {
    /// <summary> takes a value and checks for undefined, null and empty string </summary>
    /// <param type="any"> value to be tested </param>
    /// <returns> true if value is null undefined or emptyString </returns>
    return !(value === STR_EMPTY || isNullOrUndefined(value));
}

/**
 * Gets the tenant id from the tenant token.
 * @param apiKey - The token from which the tenant id is to be extracted.
 * @returns The tenant id.
 */
export function getTenantId(apiKey: string | undefined): string {
    if (apiKey) {
        let indexTenantId = strIndexOf(apiKey, "-");
        if (indexTenantId > -1) {
            return strLeft(apiKey, indexTenantId);
        }
    }
    return STR_EMPTY;
}

/**
 * Checks if Uint8Array are available in the current environment. Safari and Firefox along with
 * ReactNative are known to not support Uint8Array properly.
 * @returns True if available, false otherwise.
 */
export function isUint8ArrayAvailable(): boolean {
    if (uInt8ArraySupported === null) {
        uInt8ArraySupported = !isUndefined(Uint8Array) && !isSafariOrFirefox() && !isReactNative();
    }
    return uInt8ArraySupported;
}

/**
 * Checks if the value is a valid EventLatency.
 * @param value - The value that needs to be checked.
 * @returns True if the value is in AWTEventLatency, false otherwise.
 */
export function isLatency(value: EventLatency | undefined): boolean {
    if (value && isNumber(value) && value >= EventLatencyValue.Normal && value <= EventLatencyValue.Immediate) {
        return true;
    }
    return false;
}

/**
 * Sanitizes the Property. It checks the that the property name and value are valid. It also
 * checks/populates the correct type and pii of the property value.
 * @param name - property name                          - The property name.
 * @param property - The property value or an IEventProperty containing value,
 * type ,pii and customer content.
 * @returns IEventProperty containing valid name, value, pii and type or null if invalid.
 */
export function sanitizeProperty(name: string,
    property: string | number | boolean | string[] | number[] | boolean[] | object | IEventProperty,
    stringifyObjects?: boolean): IEventProperty | null {
    // Check that property is valid
    if ((!property && !isValueAssigned(property)) || typeof name !== "string") {
        return null;
    }

    // Perf optimization -- only need to get the type once not multiple times
    let propType = typeof property;

    // If the property isn't IEventProperty (and is either string, number, boolean or array), convert it into one.
    if (propType === "string" || propType === "number" || propType === "boolean" || isArray(property)) {
        property = ({ value: property } as IEventProperty);
    } else if (propType === "object" && !ObjHasOwnProperty.call(property, "value")) {
        property = ({ value: stringifyObjects ? JSON.stringify(property) : property } as IEventProperty);
    } else if (isNullOrUndefined((property as IEventProperty).value)
        || (property as IEventProperty).value === STR_EMPTY || (!isString((property as IEventProperty).value)
            && !isNumber((property as IEventProperty).value) && !isBoolean((property as IEventProperty).value)
            && !isArray((property as IEventProperty).value))) {
        // Since property is IEventProperty, we need to validate its value
        return null;
    }

    // We need to check that if the property value is an array, it is valid
    if (isArray((property as IEventProperty).value) &&
        !isArrayValid((property as IEventProperty).value as string[] | number[] | boolean[])) {
        return null;
    }

    // If either pii or cc is set convert value to string (since only string pii/cc is allowed).
    // If the value is a complex type like an array that can't be converted to string we will drop
    // the property.
    if (!isNullOrUndefined((property as IEventProperty).kind)) {
        if (isArray((property as IEventProperty).value) || !isValueKind((property as IEventProperty).kind)) {
            return null;
        }

        (property as IEventProperty).value = (property as IEventProperty).value.toString();
    }

    return (property as IEventProperty);
}

export function getCommonSchemaMetaData(value: string | boolean | number | string[] | number[] | boolean[] | undefined, kind: number | undefined, type?: number | undefined): number {
    let encodedTypeValue = -1;

    if (!isUndefined(value)) {
        if (kind > 0) {
            if (kind === eValueKind.CustomerContent_GenericContent) {
                // encode customer content. Value can only be string. bit 13-16 are for cc
                encodedTypeValue = (1 << 13);
            } else if (kind <= 13) {
                // encode PII. Value can only be string. bits 5-12 are for Pii
                encodedTypeValue = (kind << 5);
            }
        }

        // isDataType checks that the "type" is a number so we don't need to check for undefined
        if (isDataType(type)) {
            // Data Type is provided and valid, so use that
            if (encodedTypeValue === -1) {
                // Don't return -1
                encodedTypeValue = 0;
            }

            encodedTypeValue |= type;
        } else {
            let propType = _fieldTypeEventPropMap[getFieldValueType(value)] || -1;

            if (encodedTypeValue !== -1 && propType !== -1) {
                // pii exists so we must return correct type
                encodedTypeValue |= propType;
            } else if (propType === eEventPropertyType.Double) {
                encodedTypeValue = propType;
            }
        }
    }

    return encodedTypeValue;
}

/**
 * Helper to get and decode the cookie value using decodeURIComponent, this is for historical
 * backward compatibility where the document.cookie value was decoded before parsing.
 * @param cookieMgr - The cookie manager to use
 * @param name - The name of the cookie to get
 * @param decode - A flag to indicate whether the cookie value should be decoded
 * @returns The decoded cookie value (if available) otherwise an empty string.
 */
export function getCookieValue(cookieMgr: ICookieMgr, name: string, decode: boolean = true): string {
    let cookieValue: string;
    if (cookieMgr) {
        cookieValue = cookieMgr.get(name);
        if (decode && cookieValue && decodeURIComponent) {
            cookieValue = decodeURIComponent(cookieValue);
        }
    }

    return cookieValue || STR_EMPTY;
}

/**
 * Create a new guid.
 * @param style - The style of guid to generated, defaults to Digits
 * Digits (Default) : 32 digits separated by hyphens: 00000000-0000-0000-0000-000000000000
 * Braces - 32 digits separated by hyphens, enclosed in braces: \{00000000-0000-0000-0000-000000000000\}
 * Parentheses - 32 digits separated by hyphens, enclosed in parentheses: (00000000-0000-0000-0000-000000000000)
 * Numeric - 32 digits: 00000000000000000000000000000000
 */
export function createGuid(style: GuidStyle = GuidStyle.Digits): string {
    let theGuid = newGuid();
    if (style === GuidStyle.Braces) {
        theGuid = "{" + theGuid + "}";
    } else if (style === GuidStyle.Parentheses) {
        theGuid = "(" + theGuid + ")";
    } else if (style === GuidStyle.Numeric) {
        theGuid = theGuid.replace(/-/g, STR_EMPTY);
    }

    return theGuid;
}

/**
 * Pass in the objects to merge as arguments.
 * @param obj1 - object to merge.  Set this argument to 'true' for a deep extend.
 * @param obj2 - object to merge.
 * @param obj3 - object to merge.
 * @param obj4 - object to merge.
 * @param obj5 - object to merge.
 * @returns The extended object.
 */
export function extend(obj?: any, obj2?: any, obj3?: any, obj4?: any, obj5?: any): any {
    // Variables
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;
    var theArgs = arguments;

    // Check if a deep merge
    if (isBoolean(theArgs[0])) {
        deep = theArgs[0];
        i++;
    }

    // Loop through each object and conduct a merge
    for (; i < length; i++) {
        var obj = theArgs[i];
        objForEachKey(obj, (prop, value) => {
            // If deep merge and property is an object, merge properties
            if (deep && value && isObject(value)) {
                if (isArray(value)) {
                    extended[prop] = extended[prop] || [];
                    arrForEach(value, (arrayValue, arrayIndex) => {
                        if (arrayValue && isObject(arrayValue)) {
                            extended[prop][arrayIndex] = extend(true, extended[prop][arrayIndex], arrayValue);
                        } else {
                            extended[prop][arrayIndex] = arrayValue;
                        }
                    });
                } else {
                    extended[prop] = extend(true, extended[prop], value);
                }
            } else {
                extended[prop] = value;
            }
        });
    }

    return extended;
}

export let getTime = perfNow;

export function isValueKind(value: number | undefined): boolean {
    // Always assume that it's a number (no type checking) for performance as this is used during the JSON serialization
    if (value === eValueKind.NotSet || ((value > eValueKind.NotSet && value <= eValueKind.Pii_IPV4AddressLegacy) || value === eValueKind.CustomerContent_GenericContent)) {
        return true;
    }

    return false;
}

function isDataType(value: number): boolean {
    // Remark: 0 returns false, but it doesn't affect encoding anyways
    // Always assume that it's a number (no type checking) for performance as this is used during the JSON serialization
    if (value >= 0 && value <= 9) {
        return true;
    }
    return false;
}

function isSafariOrFirefox(): boolean {
    var nav = getNavigator();
    // If non-browser navigator will be undefined
    if (!isUndefined(nav) && nav.userAgent) {
        var ua = nav.userAgent.toLowerCase();
        if ((ua.indexOf("safari") >= 0 || ua.indexOf("firefox") >= 0) && ua.indexOf("chrome") < 0) {
            return true;
        }
    }
    return false;
}

export function isArrayValid(value: any[]): boolean {
    return value.length > 0;
}

export function setProcessTelemetryTimings(event: ITelemetryItem, identifier: string): void {
    var evt = event as IExtendedTelemetryItem;
    evt.timings = evt.timings || {};
    evt.timings.processTelemetryStart = evt.timings.processTelemetryStart || {};
    evt.timings.processTelemetryStart[identifier] = getTime();
}

/**
 * Returns a bitwise value for the FieldValueSanitizerType enum representing the decoded type of the passed value
 * @param value - The value to determine the type
 */
export function getFieldValueType(value: any): FieldValueSanitizerType {
    let theType: FieldValueSanitizerType = FieldValueSanitizerType.NotSet;

    if (value !== null && value !== undefined) {
        let objType = typeof value;
        if (objType === "string") {
            theType = FieldValueSanitizerType.String;
        } else if (objType === "number") {
            theType = FieldValueSanitizerType.Number;
        } else if (objType === "boolean") {
            theType = FieldValueSanitizerType.Boolean;
        } else if (objType === strShimObject) {
            theType = FieldValueSanitizerType.Object;
            if (isArray(value)) {
                theType = FieldValueSanitizerType.Array;
                if (value.length > 0) {
                    // Empty arrays are not supported and are considered to be the same as null
                    theType |= getFieldValueType(value[0]);
                }
            } else if (ObjHasOwnProperty.call(value, "value")) {
                // Looks like an IEventProperty
                theType = FieldValueSanitizerType.EventProperty | getFieldValueType(value.value);
            }
        }
    }

    return theType;
}

/**
 * Helper to identify whether we are running in a chromium based browser environment
 */
export function isChromium() {
    return !!getGlobalInst("chrome");
}

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
 * Check to see if the value is \> 0
 * @param value - The value to check
 * @returns true if \> 0 otherwise false
 */
export function isGreaterThanZero(value: number) {
    return value > 0;
}
