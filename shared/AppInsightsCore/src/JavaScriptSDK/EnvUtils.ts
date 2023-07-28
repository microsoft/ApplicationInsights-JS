// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { getGlobal, strShimObject, strShimPrototype, strShimUndefined } from "@microsoft/applicationinsights-shims";
import { isFunction, isString, isUndefined, strContains } from "./HelperFuncs";
import { STR_EMPTY } from "./InternalConstants";

// TypeScript removed this interface so we need to declare the global so we can check for it's existence.
declare var XDomainRequest: any;

/**
 * This file exists to hold environment utilities that are required to check and
 * validate the current operating environment. Unless otherwise required, please
 * only use defined methods (functions) in this class so that users of these
 * functions/properties only need to include those that are used within their own modules.
 */

const strWindow = "window";
const strDocument = "document";
const strDocumentMode = "documentMode";
const strNavigator = "navigator";
const strHistory = "history";
const strLocation = "location";
const strConsole = "console";
const strPerformance = "performance";
const strJSON = "JSON";
const strCrypto = "crypto";
const strMsCrypto = "msCrypto";
const strReactNative = "ReactNative";
const strMsie = "msie";
const strTrident = "trident/";
const strXMLHttpRequest = "XMLHttpRequest";

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
 * @param enabled
 */
export function setEnableEnvMocks(enabled: boolean) {
    _enableMocks = enabled;
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
    return Boolean(typeof window === strShimObject && window);
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
    return Boolean(typeof document === strShimObject && document);
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
    return Boolean(typeof navigator === strShimObject && navigator);
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
    return Boolean(typeof history === strShimObject && history);
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
export function getLocation(checkForMock?: boolean): Location | null {
    if (checkForMock && _enableMocks) {
        let mockLocation = getGlobalInst("__mockLocation") as Location;
        if (mockLocation) {
            return mockLocation;
        }
    }

    if (typeof location === strShimObject && location) {
        return location;
    }

    return getGlobalInst(strLocation);
}

/**
 * Returns the global console object
 */
export function getConsole(): Console | null {
    if (typeof console !== strShimUndefined) {
        return console;
    }

    return getGlobalInst(strConsole);
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
    return Boolean((typeof JSON === strShimObject && JSON) || getGlobalInst(strJSON) !== null);
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

/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export function getCrypto(): Crypto | null {
    return getGlobalInst(strCrypto);
}

/**
 * Returns the crypto object if it is present otherwise null.
 * This helper is used to access the crypto object from the current
 * global instance which could be window or globalThis for a web worker
 */
export function getMsCrypto(): Crypto | null {
    return getGlobalInst(strMsCrypto);
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
        return Math.max(parseInt(ua.split(strMsie)[1]), (doc[strDocumentMode] || 0));
    } else if (strContains(ua, strTrident)) {
        let tridentVer = parseInt(ua.split(strTrident)[1]);
        if (tridentVer) {
            return tridentVer + 4;
        }
    }

    return null;
}

/**
 * Returns string representation of an object suitable for diagnostics logging.
 */
export function dumpObj(object: any): string {
    const objectTypeDump: string = Object[strShimPrototype].toString.call(object);
    let propertyValueDump: string = STR_EMPTY;
    if (objectTypeDump === "[object Error]") {
        propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
    } else if (hasJSON()) {
        propertyValueDump = getJSON().stringify(object);
    }

    return objectTypeDump + propertyValueDump;
}

export function isSafari(userAgentStr ?: string) {
    if (!userAgentStr || !isString(userAgentStr)) {
        let navigator = getNavigator() || ({} as Navigator);
        userAgentStr = navigator ? (navigator.userAgent || STR_EMPTY).toLowerCase() : STR_EMPTY;
    }

    var ua = (userAgentStr || STR_EMPTY).toLowerCase();
    return (ua.indexOf("safari") >= 0);
}

/**
 * Checks if HTML5 Beacons are supported in the current environment.
 * @returns True if supported, false otherwise.
 */
export function isBeaconsSupported(): boolean {
    if (_beaconsSupported === null) {
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
        isSupported = !!getGlobalInst("fetch");
        const request = getGlobalInst("Request");
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
            _useXDomainRequest = _useXDomainRequest && !_hasProperty(getGlobalInst(strXMLHttpRequest), "withCredentials");
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
        const xmlHttpRequest = getGlobalInst(strXMLHttpRequest);
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
 * @param name
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
 * @param name
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
