// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StorageType } from "./Enums";
import { 
    CoreUtils, EventHelper, _InternalMessageId, LoggingSeverity, IDiagnosticLogger, IPlugin, 
    getGlobal, getGlobalInst, getWindow, getDocument, getNavigator, getPerformance, getLocation, hasJSON, getJSON,
    strPrototype
} from "@microsoft/applicationinsights-core-js";
import { RequestHeaders } from "./RequestResponseHeaders";
import { DataSanitizer } from "./Telemetry/Common/DataSanitizer";
import { ICorrelationConfig } from "./Interfaces/ICorrelationConfig";

let _navigator = getNavigator();
let _isString = CoreUtils.isString;
let _uaDisallowsSameSiteNone:boolean = null;

function _endsWith(value:string, search:string) {
    let len = value.length;
    let start = len - search.length;
    return value.substring(start >= 0 ? start : 0, len) === search;
}

export class Util {
    private static document: any = getDocument()||{};
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

        if (CoreUtils.isFunction(Event)) { // Use Event constructor when available
            event = new Event(eventName);
        } else { // Event has no constructor in IE
            let doc = getDocument();
            if (doc && doc.createEvent) {
                event = doc.createEvent("Event");
                event.initEvent(eventName, true, true);
            }
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
            if (CoreUtils.isNullOrUndefined(getGlobal())) {
                return null;
            }
            uid = new Date;
            storage = storageType === StorageType.LocalStorage ? getGlobalInst("localStorage") : getGlobalInst("sessionStorage");
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
            for (const key in getGlobalInst<any>("sessionStorage")) {
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

    public static disallowsSameSiteNone(userAgent:string) {
        if (!_isString(userAgent)) {
            return false;
        }
    
        // Cover all iOS based browsers here. This includes:
        // - Safari on iOS 12 for iPhone, iPod Touch, iPad
        // - WkWebview on iOS 12 for iPhone, iPod Touch, iPad
        // - Chrome on iOS 12 for iPhone, iPod Touch, iPad
        // All of which are broken by SameSite=None, because they use the iOS networking stack
        if (userAgent.indexOf("CPU iPhone OS 12") !== -1 || userAgent.indexOf("iPad; CPU OS 12") !== -1) {
            return true;
        }
     
        // Cover Mac OS X based browsers that use the Mac OS networking stack. This includes:
        // - Safari on Mac OS X
        // This does not include:
        // - Internal browser on Mac OS X
        // - Chrome on Mac OS X
        // - Chromium on Mac OS X
        // Because they do not use the Mac OS networking stack.
        if (userAgent.indexOf("Macintosh; Intel Mac OS X 10_14") !== -1 && userAgent.indexOf("Version/") !== -1 && userAgent.indexOf("Safari") !== -1) {
            return true;
        }
     
        // Cover Mac OS X internal browsers that use the Mac OS networking stack. This includes:
        // - Internal browser on Mac OS X
        // This does not include:
        // - Safari on Mac OS X
        // - Chrome on Mac OS X
        // - Chromium on Mac OS X
        // Because they do not use the Mac OS networking stack.
        if (userAgent.indexOf("Macintosh; Intel Mac OS X 10_14") !== -1 && _endsWith(userAgent, "AppleWebKit/605.1.15 (KHTML, like Gecko)")) {
            return true;
        }
     
        // Cover Chrome 50-69, because some versions are broken by SameSite=None, and none in this range require it.
        // Note: this covers some pre-Chromium Edge versions, but pre-Chromim Edge does not require SameSite=None, so this is fine.
        // Note: this regex applies to Windows, Mac OS X, and Linux, deliberately.
        if (userAgent.indexOf("Chrome/5") !== -1 || userAgent.indexOf("Chrome/6") !== -1) {
            return true;
        }
     
        // Unreal Engine runs Chromium 59, but does not advertise as Chrome until 4.23. Treat versions of Unreal
        // that don't specify their Chrome version as lacking support for SameSite=None.
        if (userAgent.indexOf("UnrealEngine") !== -1 && userAgent.indexOf("Chrome") === -1) {
            return true;
        }
     
        // UCBrowser < 12.13.2 ignores Set-Cookie headers with SameSite=None
        // NB: this rule isn't complete - you need regex to make a complete rule.
        // See: https://www.chromium.org/updates/same-site/incompatible-clients
        if (userAgent.indexOf("UCBrowser/12") !== -1 || userAgent.indexOf("UCBrowser/11") !== -1) {
            return true;
        }
     
        return false;
    }
    
    /**
     * helper method to set userId and sessionId cookie
     */
    public static setCookie(logger: IDiagnosticLogger, name: string, value: string, domain?: string) {
        if (Util.canUseCookies(logger)) {
            let domainAttrib = "";
            let secureAttrib = "";

            if (domain) {
                domainAttrib = ";domain=" + domain;
            }

            let location = getLocation();
            if (location && location.protocol === "https:") {
                secureAttrib = ";secure";
                if (_uaDisallowsSameSiteNone === null) {
                    _uaDisallowsSameSiteNone = Util.disallowsSameSiteNone((getNavigator()||{} as Navigator).userAgent);
                }
                
                if (!_uaDisallowsSameSiteNone) {
                    value = value + ";SameSite=None"; // SameSite can only be set on secure pages
                }
            }

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
    public static getCookie(logger: IDiagnosticLogger, name: string) {
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
        if (!_isString(str)) { return str; }
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
        return Object[strPrototype].toString.call(obj) === "[object Array]";
    }

    /**
     * Check if an object is of type Error
     */
    public static isError(obj: any): boolean {
        return Object[strPrototype].toString.call(obj) === "[object Error]";
    }

    /**
     * Check if an object is of type Date
     */
    public static isDate = CoreUtils.isDate;

    // Keeping this name for backward compatibility (for now)
    public static toISOStringForIE8 = CoreUtils.toISOString;

    /**
     * Gets IE version if we are running on IE, or null otherwise
     */
    public static getIEVersion(userAgentStr: string = null): number {
        const myNav = userAgentStr ? userAgentStr.toLowerCase() : (_navigator ? (_navigator.userAgent ||"").toLowerCase() : "");
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
        const objectTypeDump: string = Object[strPrototype].toString.call(object);
        let propertyValueDump: string = "";
        if (objectTypeDump === "[object Error]") {
            propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
        } else if (hasJSON()) {
            propertyValueDump = getJSON().stringify(object);
        }

        return objectTypeDump + propertyValueDump;
    }

    /**
     * Returns the name of object if it's an Error. Otherwise, returns empty string.
     */
    public static getExceptionName(object: any): string {
        const objectTypeDump: string = Object[strPrototype].toString.call(object);
        if (objectTypeDump === "[object Error]") {
            return object.name;
        }
        return "";
    }

    /**
     * Adds an event handler for the specified event to the window
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static addEventHandler(eventName: string, callback: any): boolean {
        return EventHelper.Attach(getWindow(), eventName, callback);
    }

    /**
     * Tells if a browser supports a Beacon API
     */
    public static IsBeaconApiSupported(): boolean {
        return ('sendBeacon' in _navigator && (_navigator as any).sendBeacon);
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
    private static document: any = getDocument()||{};
    private static htmlAnchorElement: HTMLAnchorElement;

    public static parseUrl(url: string): HTMLAnchorElement {
        if (!UrlHelper.htmlAnchorElement) {
            UrlHelper.htmlAnchorElement = !!UrlHelper.document.createElement ? UrlHelper.document.createElement('a') : { host: UrlHelper.parseHost(url) }; // fill host field in the fallback case as that is the only externally required field from this fn
        }

        UrlHelper.htmlAnchorElement.href = url;

        return UrlHelper.htmlAnchorElement;
    }

    public static getAbsoluteUrl(url: string): string {
        let result: string;
        const a = UrlHelper.parseUrl(url);
        if (a) {
            result = a.href;
        }

        return result;
    }

    public static getPathName(url: string): string {
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
        if (url) {
            const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
            if (match != null && match.length > 2 && _isString(match[2]) && match[2].length > 0) {
                return match[2];
            }
        }

        return null;
    }
}

export class CorrelationIdHelper {
    public static correlationIdPrefix = "cid-v1:";

    /**
     * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers.
     * Headers are always included if the current domain matches the request domain. If they do not match (CORS),
     * they are regexed across correlationHeaderDomains and correlationHeaderExcludedDomains to determine if headers are included.
     * Some environments don't give information on currentHost via window.location.host (e.g. Cordova). In these cases, the user must
     * manually supply domains to include correlation headers on. Else, no headers will be included at all.
     */
    public static canIncludeCorrelationHeader(config: ICorrelationConfig, requestUrl: string, currentHost?: string) {
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
            let matchExists: boolean;
            CoreUtils.arrForEach(includedDomains, (domain) => {
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

        // if we don't know anything about the requestHost, require the user to use included/excludedDomains.
        // Previously we always returned false for a falsy requestHost
        return requestHost && requestHost.length > 0;
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
    public static Now = () => {
        // returns the window or webworker performance object
        let perf = getPerformance();
        if (perf && perf.now && perf.timing) {
            return perf.now() + perf.timing.navigationStart
        }
    
        return new Date().getTime()
    };

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
