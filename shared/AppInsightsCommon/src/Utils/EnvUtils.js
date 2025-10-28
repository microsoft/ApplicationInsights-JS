// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { getGlobal, strShimObject, strShimPrototype, strShimUndefined } from "@microsoft/applicationinsights-shims";
import { arrForEach, getDocument, getInst, getNavigator, getPerformance, hasNavigator, isFunction, isNullOrUndefined, isString, isUndefined, mathMax, strContains, strIndexOf, strSubstring } from "@nevware21/ts-utils";
import { DEFAULT_SENSITIVE_PARAMS, STR_EMPTY, STR_REDACTED } from "../InternalConstants";
/**
 * This file exists to hold environment utilities that are required to check and
 * validate the current operating environment. Unless otherwise required, please
 * only use defined methods (functions) in this class so that users of these
 * functions/properties only need to include those that are used within their own modules.
 */
var strDocumentMode = "documentMode";
var strLocation = "location";
var strConsole = "console";
var strJSON = "JSON";
var strCrypto = "crypto";
var strMsCrypto = "msCrypto";
var strReactNative = "ReactNative";
var strMsie = "msie";
var strTrident = "trident/";
var strXMLHttpRequest = "XMLHttpRequest";
var _isTrident = null;
var _navUserAgentCheck = null;
var _enableMocks = false;
var _useXDomainRequest = null;
var _beaconsSupported = null;
function _hasProperty(theClass, property) {
    var supported = false;
    if (theClass) {
        try {
            supported = property in theClass;
            if (!supported) {
                var proto = theClass[strShimPrototype];
                if (proto) {
                    supported = property in proto;
                }
            }
        }
        catch (e) {
            // Do Nothing
        }
        if (!supported) {
            try {
                var tmp = new theClass();
                supported = !isUndefined(tmp[property]);
            }
            catch (e) {
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
export function setEnableEnvMocks(enabled) {
    _enableMocks = enabled;
}
/**
 * Returns the global location object if it is present otherwise null.
 * This helper is used to access the location object without causing an exception
 * "Uncaught ReferenceError: location is not defined"
 */
export function getLocation(checkForMock) {
    if (checkForMock && _enableMocks) {
        var mockLocation = getInst("__mockLocation");
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
export function getConsole() {
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
export function hasJSON() {
    return Boolean((typeof JSON === strShimObject && JSON) || getInst(strJSON) !== null);
}
/**
 * Returns the global JSON object if it is present otherwise null.
 * This helper is used to access the JSON object without causing an exception
 * "Uncaught ReferenceError: JSON is not defined"
 */
export function getJSON() {
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
export function getCrypto() {
    return getInst(strCrypto);
}
/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export function getMsCrypto() {
    return getInst(strMsCrypto);
}
/**
 * Returns whether the environment is reporting that we are running in a React Native Environment
 */
export function isReactNative() {
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
    var nav = getNavigator();
    if (nav && (nav.userAgent !== _navUserAgentCheck || _isTrident === null)) {
        // Added to support test mocking of the user agent
        _navUserAgentCheck = nav.userAgent;
        var userAgent = (_navUserAgentCheck || STR_EMPTY).toLowerCase();
        _isTrident = (strContains(userAgent, strMsie) || strContains(userAgent, strTrident));
    }
    return _isTrident;
}
/**
 * Gets IE version returning the document emulation mode if we are running on IE, or null otherwise
 */
export function getIEVersion(userAgentStr) {
    if (userAgentStr === void 0) { userAgentStr = null; }
    if (!userAgentStr) {
        var navigator_1 = getNavigator() || {};
        userAgentStr = navigator_1 ? (navigator_1.userAgent || STR_EMPTY).toLowerCase() : STR_EMPTY;
    }
    var ua = (userAgentStr || STR_EMPTY).toLowerCase();
    // Also check for documentMode in case X-UA-Compatible meta tag was included in HTML.
    if (strContains(ua, strMsie)) {
        var doc = getDocument() || {};
        return mathMax(parseInt(ua.split(strMsie)[1]), (doc[strDocumentMode] || 0));
    }
    else if (strContains(ua, strTrident)) {
        var tridentVer = parseInt(ua.split(strTrident)[1]);
        if (tridentVer) {
            return tridentVer + 4;
        }
    }
    return null;
}
export function isSafari(userAgentStr) {
    if (!userAgentStr || !isString(userAgentStr)) {
        var navigator_2 = getNavigator() || {};
        userAgentStr = navigator_2 ? (navigator_2.userAgent || STR_EMPTY).toLowerCase() : STR_EMPTY;
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
export function isBeaconsSupported(useCached) {
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
export function isFetchSupported(withKeepAlive) {
    var isSupported = false;
    try {
        isSupported = !!getInst("fetch");
        var request = getInst("Request");
        if (isSupported && withKeepAlive && request) {
            isSupported = _hasProperty(request, "keepalive");
        }
    }
    catch (e) {
        // Just Swallow any failure during availability checks
    }
    return isSupported;
}
export function useXDomainRequest() {
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
export function isXhrSupported() {
    var isSupported = false;
    try {
        var xmlHttpRequest = getInst(strXMLHttpRequest);
        isSupported = !!xmlHttpRequest;
    }
    catch (e) {
        // Just Swallow any failure during availability checks
    }
    return isSupported;
}
function _getNamedValue(values, name) {
    var items = [];
    if (values) {
        arrForEach(values, function (value) {
            if (value.name) {
                if (value.name === name) {
                    items.push(value);
                }
            }
        });
    }
    return items;
}
/**
 * Helper function to fetch the named meta-tag from the page.
 * @param name - The name of the meta-tag to find.
 */
export function findMetaTag(name) {
    var tags = findMetaTags(name);
    if (tags.length > 0) {
        return tags[0];
    }
    return null;
}
/**
 * Helper function to fetch all named meta-tag from the page.
 * @since 3.4.0
 * @param name - The name of the meta-tag to find.
 * @returns - An array of meta-tag values.
 */
export function findMetaTags(name) {
    var tags = [];
    var doc = getDocument();
    if (doc && name) {
        // Look for a meta-tag
        arrForEach(_getNamedValue(doc.querySelectorAll("meta"), name), function (item) {
            tags.push(item.content);
        });
    }
    return tags;
}
/**
 * Helper function to fetch the named server timing value from the page response (first navigation event).
 * @param name - The name of the server timing value to find.
 */
export function findNamedServerTiming(name) {
    var value;
    var serverTimings = findNamedServerTimings(name);
    if (serverTimings.length > 0) {
        value = serverTimings[0];
    }
    return value;
}
/**
 * Helper function to fetch the named server timing value from the page response (first navigation event).
 * @since 3.4.0
 * @param name - The name of the server timing value to find.
 * @returns - An array of server timing values.
 */
export function findNamedServerTimings(name) {
    var values = [];
    var perf = getPerformance();
    if (perf && perf.getEntriesByType) {
        // Try looking for a server-timing header
        arrForEach(perf.getEntriesByType("navigation") || [], function (navPerf) {
            arrForEach(_getNamedValue(navPerf.serverTiming, name), function (value) {
                var desc = value.description;
                if (!isNullOrUndefined(desc)) {
                    values.push(desc);
                }
            });
        });
    }
    return values;
}
// TODO: should reuse this method for analytics plugin
export function dispatchEvent(target, evnt) {
    if (target && target.dispatchEvent && evnt) {
        target.dispatchEvent(evnt);
        return true;
    }
    return false;
}
export function createCustomDomEvent(eventName, details) {
    var event = null;
    var detail = { detail: details || null };
    if (isFunction(CustomEvent)) { // Use CustomEvent constructor when available
        event = new CustomEvent(eventName, detail);
    }
    else { // CustomEvent has no constructor in IE
        var doc = getDocument();
        if (doc && doc.createEvent) {
            event = doc.createEvent("CustomEvent");
            event.initCustomEvent(eventName, true, true, detail);
        }
    }
    return event;
}
export function sendCustomEvent(evtName, cfg, customDetails) {
    var global = getGlobal();
    if (global && global.CustomEvent) {
        try {
            var details = { cfg: cfg || null, customDetails: customDetails || null };
            return dispatchEvent(global, createCustomDomEvent(evtName, details));
        }
        catch (e) {
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
function redactUserInfo(url) {
    return url.replace(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^:@]{1,200}):([^@]{1,200})@(.*)$/, "$1REDACTED:REDACTED@$4");
}
/**
 * Redacts sensitive query parameters from a URL
 * @param url - The URL string to redact
 * @returns The URL with sensitive query parameters redacted
 */
function redactQueryParameters(url, config) {
    var sensitiveParams;
    var questionMarkIndex = strIndexOf(url, "?");
    if (questionMarkIndex === -1) {
        return url;
    }
    if (config && config.redactQueryParams) {
        sensitiveParams = DEFAULT_SENSITIVE_PARAMS.concat(config.redactQueryParams);
    }
    else {
        sensitiveParams = DEFAULT_SENSITIVE_PARAMS;
    }
    var baseUrl = strSubstring(url, 0, questionMarkIndex + 1);
    var queryString = strSubstring(url, questionMarkIndex + 1);
    var fragment = STR_EMPTY;
    var hashIndex = strIndexOf(queryString, "#");
    if (hashIndex !== -1) {
        fragment = strSubstring(queryString, hashIndex);
        queryString = strSubstring(queryString, 0, hashIndex);
    }
    var hasPotentialSensitiveParam = false;
    for (var i = 0; i < sensitiveParams.length; i++) {
        var paramCheck = sensitiveParams[i] + "=";
        if (strIndexOf(queryString, paramCheck) !== -1) {
            hasPotentialSensitiveParam = true;
            break;
        }
    }
    if (!hasPotentialSensitiveParam) {
        return url;
    }
    var resultParts = [];
    var anyParamRedacted = false;
    if (queryString && queryString.length) {
        var pairs = queryString.split("&");
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            if (!pair) {
                continue;
            }
            var equalsIndex = strIndexOf(pair, "=");
            if (equalsIndex === -1) {
                // Parameter without value
                resultParts.push(pair);
            }
            else {
                var paramName = pair.substring(0, equalsIndex);
                var paramValue = pair.substring(equalsIndex + 1);
                if (paramValue === STR_EMPTY) {
                    resultParts.push(pair);
                }
                else {
                    var shouldRedact = false;
                    for (var j = 0; j < sensitiveParams.length; j++) {
                        if (paramName === sensitiveParams[j]) {
                            shouldRedact = true;
                            anyParamRedacted = true;
                            break;
                        }
                    }
                    if (shouldRedact) {
                        resultParts.push(paramName + "=" + STR_REDACTED);
                    }
                    else {
                        resultParts.push(pair);
                    }
                }
            }
        }
    }
    // If no parameters were redacted, return the original URL
    if (!anyParamRedacted) {
        return url;
    }
    return baseUrl + resultParts.join("&") + fragment;
}
/**
 * Redacts sensitive information from a URL string, including credentials and specific query parameters.
 * @param input - The URL string to be redacted.
 * @param config - Configuration object that contain redactUrls setting.
 * @returns The redacted URL string or the original string if no redaction was needed or possible.
 */
export function fieldRedaction(input, config) {
    if (!input || input.indexOf(" ") !== -1) {
        return input;
    }
    var isRedactionDisabled = config && config.redactUrls === false;
    if (isRedactionDisabled) {
        return input;
    }
    var hasCredentials = strIndexOf(input, "@") !== -1;
    var hasQueryParams = strIndexOf(input, "?") !== -1;
    // If no credentials and no query params, return original
    if (!hasCredentials && !hasQueryParams) {
        return input;
    }
    try {
        var result = input;
        if (hasCredentials) {
            result = redactUserInfo(input);
        }
        if (hasQueryParams) {
            result = redactQueryParameters(result, config);
        }
        return result;
    }
    catch (e) {
        return input;
    }
}
//# sourceMappingURL=EnvUtils.js.map