// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StorageType } from "./Enums";
import { CoreUtils, _InternalMessageId, LoggingSeverity, IDiagnosticLogger, IPlugin } from "@microsoft/applicationinsights-core-js";
import { IConfig } from "./Interfaces/IConfig";
import { RequestHeaders } from "./RequestResponseHeaders";
import { DataSanitizer } from "./Telemetry/Common/DataSanitizer";
import { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";

export class Util {
    private static document: any = typeof document !== "undefined" ? document : {};
    private static _canUseLocalStorage: boolean = undefined;
    private static _canUseSessionStorage: boolean = undefined;
    // listing only non-geo specific locations
    private static _internalEndpoints: string[] = [
        "https://dc.services.visualstudio.com/v2/track",
        "https://breeze.aimon.applicationinsights.io/v2/track",
        "https://dc-int.services.visualstudio.com/v2/track"
    ];
    public static NotSpecified = "not_specified";

    public static createDomEvent(eventName: string): Event {
        let event: Event = null;

        if (typeof Event === "function") { // Use Event constructor when available
            event = new Event(eventName);
        } else { // Event has no constructor in IE
            event = document.createEvent("Event");
            event.initEvent(eventName, true, true);
        }

        return event;
    }

    /*
     * Force the SDK not to use local and session storage
    */
    public static disableStorage() {
        Util._canUseLocalStorage = false;
        Util._canUseSessionStorage = false;
    }

    /**
     * Gets the localStorage object if available
     * @return {Storage} - Returns the storage object if available else returns null
     */
    private static _getLocalStorageObject(): Storage {
        if (Util.canUseLocalStorage()) {
            return Util._getVerifiedStorageObject(StorageType.LocalStorage);
        }

        return null;
    }

    /**
     * Tests storage object (localStorage or sessionStorage) to verify that it is usable
     * More details here: https://mathiasbynens.be/notes/localstorage-pattern
     * @param storageType Type of storage
     * @return {Storage} Returns storage object verified that it is usable
     */
    private static _getVerifiedStorageObject(storageType: StorageType): Storage {
        let storage: Storage = null;
        let fail: boolean;
        let uid: Date;
        try {
            if (typeof window === 'undefined') {
                return null;
            }
            uid = new Date;
            storage = storageType === StorageType.LocalStorage ? window.localStorage : window.sessionStorage;
            storage.setItem(uid.toString(), uid.toString());
            fail = storage.getItem(uid.toString()) !== uid.toString();
            storage.removeItem(uid.toString());
            if (fail) {
                storage = null;
            }
        } catch (exception) {
            storage = null;
        }

        return storage;
    }

    /**
     *  Checks if endpoint URL is application insights internal injestion service URL.
     *
     *  @param endpointUrl Endpoint URL to check.
     *  @returns {boolean} True if if endpoint URL is application insights internal injestion service URL.
     */
    public static isInternalApplicationInsightsEndpoint(endpointUrl: string): boolean {
        return Util._internalEndpoints.indexOf(endpointUrl.toLowerCase()) !== -1;
    }

    /**
     *  Check if the browser supports local storage.
     *
     *  @returns {boolean} True if local storage is supported.
     */
    public static canUseLocalStorage(): boolean {
        if (Util._canUseLocalStorage === undefined) {
            Util._canUseLocalStorage = !!Util._getVerifiedStorageObject(StorageType.LocalStorage);
        }

        return Util._canUseLocalStorage;
    }

    /**
     *  Get an object from the browser's local storage
     *
     *  @param {string} name - the name of the object to get from storage
     *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
     */
    public static getStorage(logger: IDiagnosticLogger, name: string): string {
        const storage = Util._getLocalStorageObject();
        if (storage !== null) {
            try {
                return storage.getItem(name);
            } catch (e) {
                Util._canUseLocalStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotReadLocalStorage,
                    "Browser failed read of local storage. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
        return null;
    }

    /**
     *  Set the contents of an object in the browser's local storage
     *
     *  @param {string} name - the name of the object to set in storage
     *  @param {string} data - the contents of the object to set in storage
     *  @returns {boolean} True if the storage object could be written.
     */
    public static setStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
        const storage = Util._getLocalStorageObject();
        if (storage !== null) {
            try {
                storage.setItem(name, data);
                return true;
            } catch (e) {
                Util._canUseLocalStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotWriteLocalStorage,
                    "Browser failed write to local storage. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
        return false;
    }

    /**
     *  Remove an object from the browser's local storage
     *
     *  @param {string} name - the name of the object to remove from storage
     *  @returns {boolean} True if the storage object could be removed.
     */
    public static removeStorage(logger: IDiagnosticLogger, name: string): boolean {
        const storage = Util._getLocalStorageObject();
        if (storage !== null) {
            try {
                storage.removeItem(name);
                return true;
            } catch (e) {
                Util._canUseLocalStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserFailedRemovalFromLocalStorage,
                    "Browser failed removal of local storage item. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
        return false;
    }

    /**
     * Gets the sessionStorage object if available
     * @return {Storage} - Returns the storage object if available else returns null
     */
    private static _getSessionStorageObject(): Storage {
        if (Util.canUseSessionStorage()) {
            return Util._getVerifiedStorageObject(StorageType.SessionStorage);
        }

        return null;
    }

    /**
     *  Check if the browser supports session storage.
     *
     *  @returns {boolean} True if session storage is supported.
     */
    public static canUseSessionStorage(): boolean {
        if (Util._canUseSessionStorage === undefined) {
            Util._canUseSessionStorage = !!Util._getVerifiedStorageObject(StorageType.SessionStorage);
        }

        return Util._canUseSessionStorage;
    }

    /**
     *  Gets the list of session storage keys
     *
     *  @returns {string[]} List of session storage keys
     */
    public static getSessionStorageKeys(): string[] {
        const keys = [];

        if (Util.canUseSessionStorage()) {
            for (const key in window.sessionStorage) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     *  Get an object from the browser's session storage
     *
     *  @param {string} name - the name of the object to get from storage
     *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
     */
    public static getSessionStorage(logger: IDiagnosticLogger, name: string): string {
        const storage = Util._getSessionStorageObject();
        if (storage !== null) {
            try {
                return storage.getItem(name);
            } catch (e) {
                Util._canUseSessionStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotReadSessionStorage,
                    "Browser failed read of session storage. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
        return null;
    }

    /**
     *  Set the contents of an object in the browser's session storage
     *
     *  @param {string} name - the name of the object to set in storage
     *  @param {string} data - the contents of the object to set in storage
     *  @returns {boolean} True if the storage object could be written.
     */
    public static setSessionStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
        const storage = Util._getSessionStorageObject();
        if (storage !== null) {
            try {
                storage.setItem(name, data);
                return true;
            } catch (e) {
                Util._canUseSessionStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserCannotWriteSessionStorage,
                    "Browser failed write to session storage. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
        return false;
    }

    /**
     *  Remove an object from the browser's session storage
     *
     *  @param {string} name - the name of the object to remove from storage
     *  @returns {boolean} True if the storage object could be removed.
     */
    public static removeSessionStorage(logger: IDiagnosticLogger, name: string): boolean {
        const storage = Util._getSessionStorageObject();
        if (storage !== null) {
            try {
                storage.removeItem(name);
                return true;
            } catch (e) {
                Util._canUseSessionStorage = false;

                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.BrowserFailedRemovalFromSessionStorage,
                    "Browser failed removal of session storage item. " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
        return false;
    }

    /*
     * Force the SDK not to store and read any data from cookies
     */
    public static disableCookies() {
        CoreUtils.disableCookies();
    }

    /*
     * helper method to tell if document.cookie object is available
     */
    public static canUseCookies(logger: IDiagnosticLogger): any {
        if (CoreUtils._canUseCookies === undefined) {
            CoreUtils._canUseCookies = false;

            try {
                CoreUtils._canUseCookies = Util.document.cookie !== undefined;
            } catch (e) {
                logger.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.CannotAccessCookie,
                    "Cannot access document.cookie - " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            };
        }

        return CoreUtils._canUseCookies;
    }

    /**
     * helper method to set userId and sessionId cookie
     */
    public static setCookie(logger: IDiagnosticLogger, name, value, domain?) {
        let domainAttrib = "";
        let secureAttrib = "";

        if (domain) {
            domainAttrib = ";domain=" + domain;
        }

        if (Util.document.location && Util.document.location.protocol === "https:") {
            secureAttrib = ";secure";
        }

        if (Util.canUseCookies(logger)) {
            Util.document.cookie = name + "=" + value + domainAttrib + ";path=/" + secureAttrib;
        }
    }

    public static stringToBoolOrDefault(str: any, defaultValue = false): boolean {
        if (str === undefined || str === null) {
            return defaultValue;
        }

        return str.toString().toLowerCase() === "true";
    }

    /**
     * helper method to access userId and sessionId cookie
     */
    public static getCookie(logger: IDiagnosticLogger, name) {
        if (!Util.canUseCookies(logger)) {
            return;
        }

        let value = "";
        if (name && name.length) {
            const cookieName = name + "=";
            const cookies = Util.document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i];
                cookie = Util.trim(cookie);
                if (cookie && cookie.indexOf(cookieName) === 0) {
                    value = cookie.substring(cookieName.length, cookies[i].length);
                    break;
                }
            }
        }

        return value;
    }

    /**
     * Deletes a cookie by setting it's expiration time in the past.
     * @param name - The name of the cookie to delete.
     */
    public static deleteCookie(logger: IDiagnosticLogger, name: string) {
        if (Util.canUseCookies(logger)) {
            // Setting the expiration date in the past immediately removes the cookie
            Util.document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
    }

    /**
     * helper method to trim strings (IE8 does not implement String.prototype.trim)
     */
    public static trim(str: any): string {
        if (typeof str !== "string") { return str; }
        return str.replace(/^\s+|\s+$/g, "");
    }

    /**
     * generate random id string
     */
    public static newId(): string {
        const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        let result = "";
        // tslint:disable-next-line:insecure-random
        let random = Math.random() * 1073741824; // 5 symbols in base64, almost maxint

        while (random > 0) {
            const char = base64chars.charAt(random % 64);
            result += char;
            random = Math.floor(random / 64);
        }
        return result;
    }

    /**
     * generate a random 32bit number (-0x80000000..0x7FFFFFFF).
     */
    public static random32() {
        return (0x100000000 * Math.random()) | 0;
    }

    /**
     * generate W3C trace id
     */
    public static generateW3CId() {
        const hexValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

        // rfc4122 version 4 UUID without dashes and with lowercase letters
        let oct = "", tmp;
        for (let a = 0; a < 4; a++) {
            tmp = Util.random32();
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
        const clockSequenceHi = hexValues[8 + (Math.random() * 4) | 0];
        return oct.substr(0, 8) + oct.substr(9, 4) + "4" + oct.substr(13, 3) + clockSequenceHi + oct.substr(16, 3) + oct.substr(19, 12);
    }

    /**
     * Check if an object is of type Array
     */
    public static isArray(obj: any): boolean {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    /**
     * Check if an object is of type Error
     */
    public static isError(obj: any): boolean {
        return Object.prototype.toString.call(obj) === "[object Error]";
    }

    /**
     * Check if an object is of type Date
     */
    public static isDate(obj: any): boolean {
        return Object.prototype.toString.call(obj) === "[object Date]";
    }

    /**
     * Convert a date to I.S.O. format in IE8
     */
    public static toISOStringForIE8(date: Date) {
        if (Util.isDate(date)) {
            if (Date.prototype.toISOString) {
                return date.toISOString();
            } else {
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
    }

    /**
     * Gets IE version if we are running on IE, or null otherwise
     */
    public static getIEVersion(userAgentStr: string = null): number {
        const myNav = userAgentStr ? userAgentStr.toLowerCase() : navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : null;
    }

    /**
     * Convert ms to c# time span format
     */
    public static msToTimeSpan(totalms: number): string {
        if (isNaN(totalms) || totalms < 0) {
            totalms = 0;
        }

        totalms = Math.round(totalms);

        let ms = "" + totalms % 1000;
        let sec = "" + Math.floor(totalms / 1000) % 60;
        let min = "" + Math.floor(totalms / (1000 * 60)) % 60;
        let hour = "" + Math.floor(totalms / (1000 * 60 * 60)) % 24;
        const days = Math.floor(totalms / (1000 * 60 * 60 * 24));

        ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
        sec = sec.length < 2 ? "0" + sec : sec;
        min = min.length < 2 ? "0" + min : min;
        hour = hour.length < 2 ? "0" + hour : hour;

        return (days > 0 ? days + "." : "") + hour + ":" + min + ":" + sec + "." + ms;
    }

    /**
     * Checks if error has no meaningful data inside. Ususally such errors are received by window.onerror when error
     * happens in a script from other domain (cross origin, CORS).
     */
    public static isCrossOriginError(message: string, url: string, lineNumber: number, columnNumber: number, error: Error): boolean {
        return (message === "Script error." || message === "Script error") && !error;
    }

    /**
     * Returns string representation of an object suitable for diagnostics logging.
     */
    public static dump(object: any): string {
        const objectTypeDump: string = Object.prototype.toString.call(object);
        let propertyValueDump: string = JSON.stringify(object);
        if (objectTypeDump === "[object Error]") {
            propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
        }

        return objectTypeDump + propertyValueDump;
    }

    /**
     * Returns the name of object if it's an Error. Otherwise, returns empty string.
     */
    public static getExceptionName(object: any): string {
        const objectTypeDump: string = Object.prototype.toString.call(object);
        if (objectTypeDump === "[object Error]") {
            return object.name;
        }
        return "";
    }

    /**
     * Adds an event handler for the specified event
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static addEventHandler(eventName: string, callback: any): boolean {
        if (typeof window === 'undefined' || !window || typeof eventName !== 'string' || typeof callback !== 'function') {
            return false;
        }

        // Create verb for the event
        const verbEventName = 'on' + eventName;

        // check if addEventListener is available
        if (window.addEventListener) {
            window.addEventListener(eventName, callback, false);
        } else if (window["attachEvent"]) { // For older browsers
            window["attachEvent"](verbEventName, callback);
        } else { // if all else fails
            return false;
        }

        return true;
    }

    /**
     * Tells if a browser supports a Beacon API
     */
    public static IsBeaconApiSupported(): boolean {
        return ('sendBeacon' in navigator && (navigator as any).sendBeacon);
    }

    public static getExtension(extensions: IPlugin[], identifier: string) {
        let extension = null;
        let extIx = 0;

        while (!extension && extIx < extensions.length) {
            if (extensions[extIx] && extensions[extIx].identifier === identifier) {
                extension = extensions[extIx];
            }
            extIx++;
        }

        return extension;
    }
}

export class UrlHelper {
    private static document: any = typeof document !== "undefined" ? document : {};
    private static htmlAnchorElement: HTMLAnchorElement;

    public static parseUrl(url): HTMLAnchorElement {
        if (!UrlHelper.htmlAnchorElement) {
            UrlHelper.htmlAnchorElement = !!UrlHelper.document.createElement ? UrlHelper.document.createElement('a') : { host: UrlHelper.parseHost(url) }; // fill host field in the fallback case as that is the only externally required field from this fn
        }

        UrlHelper.htmlAnchorElement.href = url;

        return UrlHelper.htmlAnchorElement;
    }

    public static getAbsoluteUrl(url): string {
        let result: string;
        const a = UrlHelper.parseUrl(url);
        if (a) {
            result = a.href;
        }

        return result;
    }

    public static getPathName(url): string {
        let result: string;
        const a = UrlHelper.parseUrl(url);
        if (a) {
            result = a.pathname;
        }

        return result;
    }

    public static getCompleteUrl(method: string, absoluteUrl: string) {
        if (method) {
            return method.toUpperCase() + " " + absoluteUrl;
        } else {
            return absoluteUrl;
        }
    }

    // Fallback method to grab host from url if document.createElement method is not available
    public static parseHost(url: string) {
        const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
            return match[2];
        } else {
            return null;
        }
    }
}

export class CorrelationIdHelper {
    public static correlationIdPrefix = "cid-v1:";

    /**
     * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers
     */
    public static canIncludeCorrelationHeader(config: ICorrelationConfig, requestUrl: string, currentHost: string) {
        if (config && config.disableCorrelationHeaders) {
            return false;
        }

        if (!requestUrl) {
            return false;
        }

        const requestHost = UrlHelper.parseUrl(requestUrl).host.toLowerCase();
        if ((!config || !config.enableCorsCorrelation) && requestHost !== currentHost) {
            return false;
        }

        const includedDomains = config && config.correlationHeaderDomains;
        if (includedDomains) {
            let matchExists;
            includedDomains.forEach((domain) => {
                const regex = new RegExp(domain.toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
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
            const regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
            if (regex.test(requestHost)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Combines target appId and target role name from response header.
     */
    public static getCorrelationContext(responseHeader: string) {
        if (responseHeader) {
            const correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestHeaders.requestContextTargetKey);
            if (correlationId && correlationId !== CorrelationIdHelper.correlationIdPrefix) {
                return correlationId;
            }
        }
    }

    /**
     * Gets key from correlation response header
     */
    public static getCorrelationContextValue(responseHeader: string, key: string) {
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
}

export class AjaxHelper {
    public static ParseDependencyPath(logger: IDiagnosticLogger, absoluteUrl: string, method: string, commandName: string) {
        let target, name = commandName, data = commandName;

        if (absoluteUrl && absoluteUrl.length > 0) {
            const parsedUrl: HTMLAnchorElement = UrlHelper.parseUrl(absoluteUrl)
            target = parsedUrl.host;
            if (!name) {
                if (parsedUrl.pathname != null) {
                    let pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== '/') {
                        pathName = "/" + pathName;
                    }
                    data = parsedUrl.pathname;
                    name = DataSanitizer.sanitizeString(logger, method ? method + " " + pathName : pathName);
                } else {
                    name = DataSanitizer.sanitizeString(logger, absoluteUrl);
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
}

/**
 * A utility class that helps getting time related parameters
 */
export class DateTimeUtils {
    /**
     * Get the number of milliseconds since 1970/01/01 in local timezone
     */
    public static Now = (typeof window === 'undefined') ? () => new Date().getTime() :
        (window.performance && window.performance.now && window.performance.timing) ?
            () => {
                return window.performance.now() + window.performance.timing.navigationStart;
            }
            :
            () => {
                return new Date().getTime();
            }

    /**
     * Gets duration between two timestamps
     */
    public static GetDuration = (start: number, end: number): number => {
        let result = null;
        if (start !== 0 && end !== 0 && !CoreUtils.isNullOrUndefined(start) && !CoreUtils.isNullOrUndefined(end)) {
            result = end - start;
        }

        return result;
    }
}
