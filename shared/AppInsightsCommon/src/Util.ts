// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StorageType } from "./Enums";
import {
    _InternalMessageId, IDiagnosticLogger, IPlugin, getPerformance,
    getExceptionName as coreGetExceptionName, dumpObj,
    isNullOrUndefined, strTrim, random32, isArray, isError, isDate,
    newId, generateW3CId, toISOString, arrForEach, getIEVersion, attachEvent,
    dateNow, uaDisallowsSameSiteNone, disableCookies as coreDisableCookies,
    canUseCookies as coreCanUseCookies, getCookie as coreGetCookie,
    setCookie as coreSetCookie, deleteCookie as coreDeleteCookie,
    isBeaconsSupported
} from "@microsoft/applicationinsights-core-js";
import { RequestHeaders } from "./RequestResponseHeaders";
import { dataSanitizeString } from "./Telemetry/Common/DataSanitizer";
import { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";
import { createDomEvent } from "./DomHelperFuncs";
import { stringToBoolOrDefault, msToTimeSpan, isCrossOriginError, getExtensionByName } from "./HelperFuncs";
import { strNotSpecified } from "./Constants";
import { utlCanUseLocalStorage, utlCanUseSessionStorage, utlDisableStorage, utlGetSessionStorage, utlGetSessionStorageKeys, utlGetLocalStorage, utlRemoveSessionStorage, utlRemoveStorage, utlSetSessionStorage, utlSetLocalStorage } from "./StorageHelperFuncs";
import { urlGetAbsoluteUrl, urlGetCompleteUrl, urlGetPathName, urlParseFullHost, urlParseHost, urlParseUrl } from "./UrlHelperFuncs";

// listing only non-geo specific locations
const _internalEndpoints: string[] = [
    "https://dc.services.visualstudio.com/v2/track",
    "https://breeze.aimon.applicationinsights.io/v2/track",
    "https://dc-int.services.visualstudio.com/v2/track"
];

export function isInternalApplicationInsightsEndpoint(endpointUrl: string): boolean {
    return _internalEndpoints.indexOf(endpointUrl.toLowerCase()) !== -1;
}

export interface IUtil {
    NotSpecified: string,

    createDomEvent: (eventName: string) => Event,

    /*
     * Force the SDK not to use local and session storage
    */
    disableStorage: () => void,

    /**
     *  Checks if endpoint URL is application insights internal injestion service URL.
     *
     *  @param endpointUrl Endpoint URL to check.
     *  @returns {boolean} True if if endpoint URL is application insights internal injestion service URL.
     */
    isInternalApplicationInsightsEndpoint: (endpointUrl: string) => boolean,

    /**
     *  Check if the browser supports local storage.
     *
     *  @returns {boolean} True if local storage is supported.
     */
    canUseLocalStorage: () => boolean,

    /**
     *  Get an object from the browser's local storage
     *
     *  @param {string} name - the name of the object to get from storage
     *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
     */
    getStorage: (logger: IDiagnosticLogger, name: string) => string,

    /**
     *  Set the contents of an object in the browser's local storage
     *
     *  @param {string} name - the name of the object to set in storage
     *  @param {string} data - the contents of the object to set in storage
     *  @returns {boolean} True if the storage object could be written.
     */
    setStorage: (logger: IDiagnosticLogger, name: string, data: string) => boolean,

    /**
     *  Remove an object from the browser's local storage
     *
     *  @param {string} name - the name of the object to remove from storage
     *  @returns {boolean} True if the storage object could be removed.
     */
    removeStorage: (logger: IDiagnosticLogger, name: string) => boolean,

    /**
     *  Check if the browser supports session storage.
     *
     *  @returns {boolean} True if session storage is supported.
     */
    canUseSessionStorage: () => boolean,

    /**
     *  Gets the list of session storage keys
     *
     *  @returns {string[]} List of session storage keys
     */
    getSessionStorageKeys: () => string[],

    /**
     *  Get an object from the browser's session storage
     *
     *  @param {string} name - the name of the object to get from storage
     *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
     */
    getSessionStorage: (logger: IDiagnosticLogger, name: string) => string,

    /**
     *  Set the contents of an object in the browser's session storage
     *
     *  @param {string} name - the name of the object to set in storage
     *  @param {string} data - the contents of the object to set in storage
     *  @returns {boolean} True if the storage object could be written.
     */
    setSessionStorage: (logger: IDiagnosticLogger, name: string, data: string) => boolean,

    /**
     *  Remove an object from the browser's session storage
     *
     *  @param {string} name - the name of the object to remove from storage
     *  @returns {boolean} True if the storage object could be removed.
     */
    removeSessionStorage: (logger: IDiagnosticLogger, name: string) => boolean,

    /**
     * @deprecated - Use the core.getCookieMgr().disable()
     * Force the SDK not to store and read any data from cookies.
     */
    disableCookies: () => void,

    /**
     * @deprecated - Use the core.getCookieMgr().isEnabled()
     * Helper method to tell if document.cookie object is available and whether it can be used.
     */
    canUseCookies: (logger: IDiagnosticLogger) => any,

    disallowsSameSiteNone: (userAgent: string) => boolean,

    /**
     * @deprecated - Use the core.getCookieMgr().set()
     * helper method to set userId and sessionId cookie
     */
    setCookie: (logger: IDiagnosticLogger, name: string, value: string, domain?: string) => void,

    stringToBoolOrDefault: (str: any, defaultValue?: boolean) => boolean,

    /**
     * @deprecated - Use the core.getCookieMgr().get()
     * helper method to access userId and sessionId cookie
     */
    getCookie: (logger: IDiagnosticLogger, name: string) => string,

    /**
     * @deprecated - Use the core.getCookieMgr().del()
     * Deletes a cookie by setting it's expiration time in the past.
     * @param name - The name of the cookie to delete.
     */
    deleteCookie: (logger: IDiagnosticLogger, name: string) => void,

    /**
     * helper method to trim strings (IE8 does not implement String.prototype.trim)
     */
    trim: (str: any) => string,

    /**
     * generate random id string
     */
    newId: () => string,

    /**
     * generate a random 32bit number (-0x80000000..0x7FFFFFFF).
     */
    random32: () => number,

    /**
     * generate W3C trace id
     */
    generateW3CId: () => string,

    /**
     * Check if an object is of type Array
     */
    isArray: (obj: any) => boolean,

    /**
     * Check if an object is of type Error
     */
    isError: (obj: any) => obj is Error,

    /**
     * Check if an object is of type Date
     */
    isDate: (obj: any) => obj is Date,

    // Keeping this name for backward compatibility (for now)
    toISOStringForIE8: (date: Date) => string,

    /**
     * Gets IE version returning the document emulation mode if we are running on IE, or null otherwise
     */
    getIEVersion: (userAgentStr?: string) => number,

    /**
     * Convert ms to c# time span format
     */
    msToTimeSpan: (totalms: number) => string,

    /**
     * Checks if error has no meaningful data inside. Ususally such errors are received by window.onerror when error
     * happens in a script from other domain (cross origin, CORS).
     */
    isCrossOriginError: (message: string|Event, url: string, lineNumber: number, columnNumber: number, error: Error) => boolean,

    /**
     * Returns string representation of an object suitable for diagnostics logging.
     */
    dump: (object: any) => string,

    /**
     * Returns the name of object if it's an Error. Otherwise, returns empty string.
     */
    getExceptionName: (object: any) => string,

    /**
     * Adds an event handler for the specified event to the window
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    addEventHandler: (obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean) => boolean,

    /**
     * Tells if a browser supports a Beacon API
     */
    IsBeaconApiSupported: () => boolean,

    getExtension: (extensions: IPlugin[], identifier: string) => IPlugin | null
}

export const Util: IUtil = {
    NotSpecified: strNotSpecified,
    createDomEvent,
    disableStorage: utlDisableStorage,
    isInternalApplicationInsightsEndpoint,
    canUseLocalStorage: utlCanUseLocalStorage,
    getStorage: utlGetLocalStorage,
    setStorage: utlSetLocalStorage,
    removeStorage: utlRemoveStorage,
    canUseSessionStorage: utlCanUseSessionStorage,
    getSessionStorageKeys: utlGetSessionStorageKeys,
    getSessionStorage: utlGetSessionStorage,
    setSessionStorage: utlSetSessionStorage,
    removeSessionStorage: utlRemoveSessionStorage,
    disableCookies: coreDisableCookies,
    canUseCookies: coreCanUseCookies,
    disallowsSameSiteNone: uaDisallowsSameSiteNone,
    setCookie: coreSetCookie,
    stringToBoolOrDefault,
    getCookie: coreGetCookie,
    deleteCookie: coreDeleteCookie,
    trim: strTrim,
    newId,
    random32() {
        return random32(true);
    },
    generateW3CId,
    isArray,
    isError,
    isDate,
    toISOStringForIE8: toISOString,
    getIEVersion,
    msToTimeSpan,
    isCrossOriginError,
    dump: dumpObj,
    getExceptionName: coreGetExceptionName,
    addEventHandler: attachEvent,
    IsBeaconApiSupported: isBeaconsSupported,
    getExtension: getExtensionByName
};

export interface IUrlHelper {

    parseUrl: (url: string) => HTMLAnchorElement,
    getAbsoluteUrl: (url: string) => string,
    getPathName: (url: string) => string,
    getCompleteUrl: (method: string, absoluteUrl: string) => string,

    // Fallback method to grab host from url if document.createElement method is not available
    parseHost: (url: string, inclPort?: boolean) => string,

    /**
     * Get the full host from the url, optionally including the port
     */
    parseFullHost: (url: string, inclPort?: boolean) => string
}

export const UrlHelper: IUrlHelper = {
    parseUrl: urlParseUrl,
    getAbsoluteUrl: urlGetAbsoluteUrl,
    getPathName: urlGetPathName,
    getCompleteUrl: urlGetCompleteUrl,
    parseHost: urlParseHost,
    parseFullHost: urlParseFullHost
};

export interface ICorrelationIdHelper {
    correlationIdPrefix: string;

    /**
     * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers.
     * Headers are always included if the current domain matches the request domain. If they do not match (CORS),
     * they are regex-ed across correlationHeaderDomains and correlationHeaderExcludedDomains to determine if headers are included.
     * Some environments don't give information on currentHost via window.location.host (e.g. Cordova). In these cases, the user must
     * manually supply domains to include correlation headers on. Else, no headers will be included at all.
     */
    canIncludeCorrelationHeader(config: ICorrelationConfig, requestUrl: string, currentHost?: string): boolean;

    /**
     * Combines target appId and target role name from response header.
     */
    getCorrelationContext(responseHeader: string): string | undefined;

    /**
     * Gets key from correlation response header
     */
    getCorrelationContextValue(responseHeader: string, key: string): string | undefined;
}

export const CorrelationIdHelper: ICorrelationIdHelper = {
    correlationIdPrefix: "cid-v1:",

    /**
     * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers.
     * Headers are always included if the current domain matches the request domain. If they do not match (CORS),
     * they are regex-ed across correlationHeaderDomains and correlationHeaderExcludedDomains to determine if headers are included.
     * Some environments don't give information on currentHost via window.location.host (e.g. Cordova). In these cases, the user must
     * manually supply domains to include correlation headers on. Else, no headers will be included at all.
     */
    canIncludeCorrelationHeader(config: ICorrelationConfig, requestUrl: string, currentHost?: string) {
        if (!requestUrl || (config && config.disableCorrelationHeaders)) {
            return false;
        }

        if (config && config.correlationHeaderExcludePatterns) {
            for (let i = 0; i < config.correlationHeaderExcludePatterns.length; i++) {
                if (config.correlationHeaderExcludePatterns[i].test(requestUrl)) {
                    return false;
                }
            }
        }

        let requestHost = urlParseUrl(requestUrl).host.toLowerCase();
        if (requestHost && (requestHost.indexOf(":443") !== -1 || requestHost.indexOf(":80") !== -1)) {
            // [Bug #1260] IE can include the port even for http and https URLs so if present
            // try and parse it to remove if it matches the default protocol port
            requestHost = (urlParseFullHost(requestUrl, true) || "").toLowerCase();
        }

        if ((!config || !config.enableCorsCorrelation) && (requestHost && requestHost !== currentHost)) {
            return false;
        }

        const includedDomains = config && config.correlationHeaderDomains;
        if (includedDomains) {
            let matchExists: boolean;
            arrForEach(includedDomains, (domain) => {
                const regex = new RegExp(domain.toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
                matchExists = matchExists || regex.test(requestHost);
            });

            if (!matchExists) {
                return false;
            }
        }

        const excludedDomains = config && config.correlationHeaderExcludedDomains;
        if (!excludedDomains || excludedDomains.length === 0) {
            return true;
        }

        for (let i = 0; i < excludedDomains.length; i++) {
            const regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*"));
            if (regex.test(requestHost)) {
                return false;
            }
        }

        // if we don't know anything about the requestHost, require the user to use included/excludedDomains.
        // Previously we always returned false for a falsy requestHost
        return requestHost && requestHost.length > 0;
    },

    /**
     * Combines target appId and target role name from response header.
     */
    getCorrelationContext(responseHeader: string) {
        if (responseHeader) {
            const correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestHeaders.requestContextTargetKey);
            if (correlationId && correlationId !== CorrelationIdHelper.correlationIdPrefix) {
                return correlationId;
            }
        }
    },

    /**
     * Gets key from correlation response header
     */
    getCorrelationContextValue(responseHeader: string, key: string) {
        if (responseHeader) {
            const keyValues = responseHeader.split(",");
            for (let i = 0; i < keyValues.length; ++i) {
                const keyValue = keyValues[i].split("=");
                if (keyValue.length === 2 && keyValue[0] === key) {
                    return keyValue[1];
                }
            }
        }
    }
};

export function AjaxHelperParseDependencyPath(logger: IDiagnosticLogger, absoluteUrl: string, method: string, commandName: string) {
    let target, name = commandName, data = commandName;

    if (absoluteUrl && absoluteUrl.length > 0) {
        const parsedUrl: HTMLAnchorElement = urlParseUrl(absoluteUrl)
        target = parsedUrl.host;
        if (!name) {
            if (parsedUrl.pathname != null) {
                let pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                if (pathName.charAt(0) !== "/") {
                    pathName = "/" + pathName;
                }
                data = parsedUrl.pathname;
                name = dataSanitizeString(logger, method ? method + " " + pathName : pathName);
            } else {
                name = dataSanitizeString(logger, absoluteUrl);
            }
        }
    } else {
        target = commandName;
        name = commandName;
    }

    return {
        target,
        name,
        data
    };
}

export function dateTimeUtilsNow() {
    // returns the window or webworker performance object
    let perf = getPerformance();
    if (perf && perf.now && perf.timing) {
        let now = perf.now() + perf.timing.navigationStart;
        // Known issue with IE where this calculation can be negative, so if it is then ignore and fallback
        if (now > 0) {
            return now;
        }
    }

    return dateNow();
}

export function dateTimeUtilsDuration(start: number, end: number): number {
    let result = null;
    if (start !== 0 && end !== 0 && !isNullOrUndefined(start) && !isNullOrUndefined(end)) {
        result = end - start;
    }

    return result;
}

export interface IDateTimeUtils {
    /**
     * Get the number of milliseconds since 1970/01/01 in local timezone
     */
    Now: () => number;

    /**
     * Gets duration between two timestamps
     */
    GetDuration: (start: number, end: number) => number;
}

/**
 * A utility class that helps getting time related parameters
 */
export const DateTimeUtils: IDateTimeUtils = {
    Now: dateTimeUtilsNow,
    GetDuration: dateTimeUtilsDuration
};
