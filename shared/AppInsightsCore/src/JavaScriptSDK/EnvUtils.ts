// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { getGlobal, strShimObject, strShimPrototype, strShimUndefined } from "@microsoft/applicationinsights-shims";
import {
    getDocument, getInst, getNavigator, getPerformance, hasNavigator, isFunction, isString, isUndefined, mathMax, objForEachKey, strIndexOf,
    strSubstring
} from "@nevware21/ts-utils";
import { IConfiguration } from "../applicationinsights-core-js";
import { strContains } from "./HelperFuncs";
import { STR_EMPTY, UNDEFINED_VALUE } from "./InternalConstants";

// TypeScript removed this interface so we need to declare the global so we can check for it's existence.
declare var XDomainRequest: any;

/**
 * This file exists to hold environment utilities that are required to check and
 * validate the current operating environment. Unless otherwise required, please
 * only use defined methods (functions) in this class so that users of these
 * functions/properties only need to include those that are used within their own modules.
 */

const strDocumentMode = "documentMode";
const strLocation = "location";
const strConsole = "console";
const strJSON = "JSON";
const strCrypto = "crypto";
const strMsCrypto = "msCrypto";
const strReactNative = "ReactNative";
const strMsie = "msie";
const strTrident = "trident/";
const strXMLHttpRequest = "XMLHttpRequest";
const STR_REDACTED = "REDACTED";

let _isTrident: boolean = null;
let _navUserAgentCheck: string = null;
let _enableMocks = false;
let _useXDomainRequest: boolean | null = null;
let _beaconsSupported: boolean | null = null;

function _hasProperty(theClass: any, property: string) {
    let supported = false;
    if (theClass) {
        try {
            supported = property in theClass;
            if (!supported) {
                let proto = theClass[strShimPrototype];
                if (proto) {
                    supported = property in proto;
                }
            }
        } catch (e) {
            // Do Nothing
        }

        if (!supported) {
            try {
                let tmp = new theClass();
                supported = !isUndefined(tmp[property]);
            } catch (e) {
                // Do Nothing
            }
        }
    }

    return supported;
}

/**
 * Enable the lookup of test mock objects if requested
 * @param enabled - A flag to enable or disable the mock
 */
export function setEnableEnvMocks(enabled: boolean) {
    _enableMocks = enabled;
}

/**
 * Returns the global location object if it is present otherwise null.
 * This helper is used to access the location object without causing an exception
 * "Uncaught ReferenceError: location is not defined"
 */
export function getLocation(checkForMock?: boolean): Location | null {
    if (checkForMock && _enableMocks) {
        let mockLocation = getInst("__mockLocation") as Location;
        if (mockLocation) {
            return mockLocation;
        }
    }

    if (typeof location === strShimObject && location) {
        return location;
    }

    return getInst(strLocation);
}

/**
 * Returns the global console object
 */
export function getConsole(): Console | null {
    if (typeof console !== strShimUndefined) {
        return console;
    }

    return getInst(strConsole);
}

/**
 * Checks if JSON object is available, this is required as we support the API running without a
 * window /document (eg. Node server, electron webworkers) and if we attempt to assign a history
 * object to a local variable or pass as an argument an "Uncaught ReferenceError: JSON is not defined"
 * exception will be thrown.
 * Defined as a function to support lazy / late binding environments.
 */
export function hasJSON(): boolean {
    return Boolean((typeof JSON === strShimObject && JSON) || getInst(strJSON) !== null);
}

/**
 * Returns the global JSON object if it is present otherwise null.
 * This helper is used to access the JSON object without causing an exception
 * "Uncaught ReferenceError: JSON is not defined"
 */
export function getJSON(): JSON | null {
    if (hasJSON()) {
        return JSON || getInst(strJSON);
    }

    return null;
}

/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export function getCrypto(): Crypto | null {
    return getInst(strCrypto);
}

/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export function getMsCrypto(): Crypto | null {
    return getInst(strMsCrypto);
}

/**
 * Returns whether the environment is reporting that we are running in a React Native Environment
 */
export function isReactNative(): boolean {
    // If running in React Native, navigator.product will be populated
    var nav = getNavigator();
    if (nav && nav.product) {
        return nav.product === strReactNative;
    }

    return false;
}

/**
 * Identifies whether the current environment appears to be IE
 */
export function isIE() {
    let nav = getNavigator();
    if (nav && (nav.userAgent !== _navUserAgentCheck || _isTrident === null)) {
        // Added to support test mocking of the user agent
        _navUserAgentCheck = nav.userAgent;
        let userAgent = (_navUserAgentCheck || STR_EMPTY).toLowerCase();
        _isTrident = (strContains(userAgent, strMsie) || strContains(userAgent, strTrident));
    }

    return _isTrident;
}

/**
 * Gets IE version returning the document emulation mode if we are running on IE, or null otherwise
 */
export function getIEVersion(userAgentStr: string = null): number {
    if (!userAgentStr) {
        let navigator = getNavigator() || ({} as Navigator);
        userAgentStr = navigator ? (navigator.userAgent || STR_EMPTY).toLowerCase() : STR_EMPTY;
    }

    var ua = (userAgentStr || STR_EMPTY).toLowerCase();
    // Also check for documentMode in case X-UA-Compatible meta tag was included in HTML.
    if (strContains(ua, strMsie)) {
        let doc = getDocument() || {} as Document;
        return mathMax(parseInt(ua.split(strMsie)[1]), (doc[strDocumentMode] || 0));
    } else if (strContains(ua, strTrident)) {
        let tridentVer = parseInt(ua.split(strTrident)[1]);
        if (tridentVer) {
            return tridentVer + 4;
        }
    }

    return null;
}

export function isSafari(userAgentStr ?: string) {
    if (!userAgentStr || !isString(userAgentStr)) {
        let navigator = getNavigator() || ({} as Navigator);
        userAgentStr = navigator ? (navigator.userAgent || STR_EMPTY).toLowerCase() : STR_EMPTY;
    }

    var ua = (userAgentStr || STR_EMPTY).toLowerCase();
    return (strIndexOf(ua, "safari") >= 0);
}

/**
 * Checks if HTML5 Beacons are supported in the current environment.
 * @param useCached - [Optional] used for testing to bypass the cached lookup, when `true` this will
 * cause the cached global to be reset.
 * @returns True if supported, false otherwise.
 */
export function isBeaconsSupported(useCached?: boolean): boolean {
    if (_beaconsSupported === null || useCached === false) {
        _beaconsSupported = hasNavigator() && Boolean(getNavigator().sendBeacon);
    }

    return _beaconsSupported;
}

/**
 * Checks if the Fetch API is supported in the current environment.
 * @param withKeepAlive - [Optional] If True, check if fetch is available and it supports the keepalive feature, otherwise only check if fetch is supported
 * @returns True if supported, otherwise false
 */
export function isFetchSupported(withKeepAlive?: boolean): boolean {
    let isSupported = false;
    try {
        isSupported = !!getInst("fetch");
        const request = getInst("Request");
        if (isSupported && withKeepAlive && request) {
            isSupported = _hasProperty(request, "keepalive");
        }
    } catch (e) {
        // Just Swallow any failure during availability checks
    }

    return isSupported;
}

export function useXDomainRequest(): boolean | undefined {
    if (_useXDomainRequest === null) {
        _useXDomainRequest = (typeof XDomainRequest !== strShimUndefined);
        if (_useXDomainRequest && isXhrSupported()) {
            _useXDomainRequest = _useXDomainRequest && !_hasProperty(getInst(strXMLHttpRequest), "withCredentials");
        }
    }

    return _useXDomainRequest;
}

/**
 * Checks if XMLHttpRequest is supported
 * @returns True if supported, otherwise false
 */
export function isXhrSupported(): boolean {
    let isSupported = false;
    try {
        const xmlHttpRequest = getInst(strXMLHttpRequest);
        isSupported = !!xmlHttpRequest;
    } catch (e) {
        // Just Swallow any failure during availability checks
    }

    return isSupported;
}


function _getNamedValue(values: any, name: string) {
    if (values) {
        for (var i = 0; i < values.length; i++) {
            var value = values[i] as any;
            if (value.name) {
                if(value.name === name) {
                    return value;
                }
            }
        }
    }

    return {};
}

/**
 * Helper function to fetch the named meta-tag from the page.
 * @param name - The name of the meta-tag to find.
 */
export function findMetaTag(name: string): any {
    let doc = getDocument();
    if (doc && name) {
        // Look for a meta-tag
        return _getNamedValue(doc.querySelectorAll("meta"), name).content;
    }

    return null;
}

/**
 * Helper function to fetch the named server timing value from the page response (first navigation event).
 * @param name - The name of the server timing value to find.
 */
export function findNamedServerTiming(name: string): any {
    let value: any;
    let perf = getPerformance();
    if (perf) {
        // Try looking for a server-timing header
        let navPerf = perf.getEntriesByType("navigation") || [];
        value = _getNamedValue((navPerf.length > 0 ? navPerf[0] : {} as any).serverTiming, name).description;
    }

    return value;
}

// TODO: should reuse this method for analytics plugin
export function dispatchEvent(target:EventTarget, evnt: Event | CustomEvent): boolean {
    if (target && target.dispatchEvent && evnt) {
        target.dispatchEvent(evnt);
        return true;
    }
    return false;
}


export function createCustomDomEvent(eventName: string, details?: any): CustomEvent {
    let event: CustomEvent = null;
    let detail = {detail: details || null } as CustomEventInit;
    if (isFunction(CustomEvent)) { // Use CustomEvent constructor when available
        event = new CustomEvent(eventName, detail);
    } else { // CustomEvent has no constructor in IE
        let doc = getDocument();
        if (doc && doc.createEvent) {
            event = doc.createEvent("CustomEvent");
            event.initCustomEvent(eventName, true, true, detail);
        }
    }

    return event;
}



export function sendCustomEvent(evtName: string, cfg?: any, customDetails?: any): boolean {
    let global = getGlobal();
    if (global && (global as any).CustomEvent) {
        try {
            let details = {cfg: cfg || null,  customDetails: customDetails || null} as any;
            return dispatchEvent(global, createCustomDomEvent(evtName, details));
        } catch(e) {
            // eslint-disable-next-line no-empty
        }
    }
    return false;
}

/**
 * Redacts user information from a URL
 * @param url - The URL string to redact
 * @returns The URL with user information redacted
 */
function redactUserInfo(url: string): string {
    const schemeEndIndex = url.indexOf(":");
    if (schemeEndIndex === -1) {
        // not a valid url
        return url;
    }
    const len = url.length;
    if (len <= schemeEndIndex + 2
        || url.charAt(schemeEndIndex + 1) !== "/"
        || url.charAt(schemeEndIndex + 2) !== "/") {
        return url;
    }
    
    let index: number;
    let atIndex = -1;
    for (index = schemeEndIndex + 3; index < len; index++) {
        const c = url.charAt(index);

        if (c === "@") {
            atIndex = index;
        }

        if (c === "/" || c === "?" || c === "#") {
            break;
        }
    }
    if (atIndex === -1 || atIndex === len - 1) {
        return url;
    }
    return url.substring(0, schemeEndIndex + 3) + "REDACTED:REDACTED" + url.substring(atIndex);
}

/**
 * Redacts sensitive query parameters from a URL
 * @param url - The URL string to redact
 * @returns The URL with sensitive query parameters redacted
 */
function redactQueryParameters(url: string, config?: IConfiguration): string {
    const DEFAULT_SENSITIVE_PARAMS = ["sig", "Signature", "AWSAccessKeyId", "X-Goog-Signature"];
    let sensitiveParams: string[];
    const questionMarkIndex = strIndexOf(url, "?");
    if (questionMarkIndex === -1) {
        return url;
    }
    // To build a parameter name until we reach the '=' character
    // If the parameter name is a one to redact, we will redact the value
    const baseUrl = strSubstring(url, 0, questionMarkIndex + 1);
    let queryString = strSubstring(url, questionMarkIndex + 1);

    // Extract fragment if present
    let fragment = STR_EMPTY;
    const hashIndex = strIndexOf(queryString, "#");
    if (hashIndex !== -1) {
        fragment = strSubstring(queryString, hashIndex);
        queryString = strSubstring(queryString, 0, hashIndex);
    }

    // Extract parameters
    const params: { [key: string]: string } = {};
    if (queryString && queryString.length) {
        const pairs = queryString.split("&");
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            if (!pair) {
                continue;
            }
            
            const equalsIndex = strIndexOf(pair, "=");
            if (equalsIndex === -1) {
                params[pair] = null;
            } else {
                const paramName = pair.substring(0, equalsIndex);
                const paramValue = pair.substring(equalsIndex + 1);
                params[paramName] = paramValue;
            }
        }
    }
    
    // Check if any parameters need redaction
    let anyParamRedacted = false;
    if (config && config.redactQueryParams) {
        sensitiveParams = DEFAULT_SENSITIVE_PARAMS.concat(config.redactQueryParams);
    } else {
        sensitiveParams = DEFAULT_SENSITIVE_PARAMS;
    }
    for (let i = 0; i < sensitiveParams.length; i++) {
        const sensParam = sensitiveParams[i];
        if (params[sensParam] !== UNDEFINED_VALUE) {
            params[sensParam] = STR_REDACTED;
            anyParamRedacted = true;
        }
    }
    
    // If no parameters were redacted, return the original URL
    if (!anyParamRedacted) {
        return url;
    }

    const parts: string[] = [];
    objForEachKey(params, (key, value) => {
        parts.push(value === null ? key : key + "=" + value);
    });

    return baseUrl + parts.join("&") + fragment;
}

/**
 * Redacts sensitive information from a URL string, including credentials and specific query parameters.
 * @param input - The URL string to be redacted.
 * @param config - Configuration object that contain redactionEnabled setting.
 * @returns The redacted URL string or the original string if no redaction was needed or possible.
 */
export function fieldRedaction(input: string, config: IConfiguration): string {
    if (!input){
        return input;
    }
    if (input.indexOf(" ") !== -1) {
        return input; // Checking for URLs with spaces
    }
    const isRedactionDisabled = config && config.redactionEnabled === false;
    if (isRedactionDisabled) {
        return input;
    }
    try {
        let parsedUrl = redactUserInfo(input);
        parsedUrl = redactQueryParameters(parsedUrl, config);
        return parsedUrl;
    } catch (e) {
        return input;
    }
}