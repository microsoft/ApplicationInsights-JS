// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="./Logging.ts" />
/// <reference path="./UtilHelpers.ts" />

module Microsoft.ApplicationInsights {

    /**
    * Type of storage to differentiate between local storage and session storage
    */
    enum StorageType {
        LocalStorage,
        SessionStorage
    }

    export class Util {
        private static document: any = typeof document !== "undefined" ? document : {};
        private static _canUseCookies: boolean = undefined;
        private static _canUseLocalStorage: boolean = undefined;
        private static _canUseSessionStorage: boolean = undefined;
        // listing only non-geo specific locations
        private static _internalEndpoints: string[] = [
            "https://dc.services.visualstudio.com/v2/track",
            "https://breeze.aimon.applicationinsights.io/v2/track",
            "https://dc-int.services.visualstudio.com/v2/track"
        ]
        public static NotSpecified = "not_specified";

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
            var storage: Storage = null;
            var fail: boolean;
            var uid;
            try {
                uid = new Date;
                storage = storageType === StorageType.LocalStorage ? window.localStorage : window.sessionStorage;
                storage.setItem(uid, uid);
                fail = storage.getItem(uid) != uid;
                storage.removeItem(uid);
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
        public static getStorage(name: string): string {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                } catch (e) {
                    Util._canUseLocalStorage = false;

                    _InternalLogging.throwInternal(
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
        public static setStorage(name: string, data: string): boolean {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                } catch (e) {
                    Util._canUseLocalStorage = false;

                    _InternalLogging.throwInternal(
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
        public static removeStorage(name: string): boolean {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                } catch (e) {
                    Util._canUseLocalStorage = false;

                    _InternalLogging.throwInternal(
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
            var keys = [];

            if (Util.canUseSessionStorage()) {
                for (var key in window.sessionStorage) {
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
        public static getSessionStorage(name: string): string {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                } catch (e) {
                    Util._canUseSessionStorage = false;

                    _InternalLogging.throwInternal(
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
        public static setSessionStorage(name: string, data: string): boolean {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                } catch (e) {
                    Util._canUseSessionStorage = false;

                    _InternalLogging.throwInternal(
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
        public static removeSessionStorage(name: string): boolean {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                } catch (e) {
                    Util._canUseSessionStorage = false;

                    _InternalLogging.throwInternal(
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
            Util._canUseCookies = false;
        }

        /*
         * helper method to tell if document.cookie object is available
         */
        public static canUseCookies(): any {
            if (Util._canUseCookies === undefined) {
                Util._canUseCookies = false;

                try {
                    Util._canUseCookies = Util.document.cookie !== undefined;
                } catch (e) {
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.CannotAccessCookie,
                        "Cannot access document.cookie - " + Util.getExceptionName(e),
                        { exception: Util.dump(e) });
                };
            }

            return Util._canUseCookies;
        }

        /**
         * helper method to set userId and sessionId cookie
         */
        public static setCookie(name, value, domain?) {
            var domainAttrib = "";
            var secureAttrib = "";

            if (domain) {
                domainAttrib = ";domain=" + domain;
            }

            if (Util.document.location && Util.document.location.protocol === "https:") {
                secureAttrib = ";secure";
            }

            if (Util.canUseCookies()) {
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
        public static getCookie(name) {
            if (!Util.canUseCookies()) {
                return;
            }

            var value = "";
            if (name && name.length) {
                var cookieName = name + "=";
                var cookies = Util.document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
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
        public static deleteCookie(name: string) {
            if (Util.canUseCookies()) {
                // Setting the expiration date in the past immediately removes the cookie
                Util.document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            }
        }

        /**
         * helper method to trim strings (IE8 does not implement String.prototype.trim)
         */
        public static trim(str: any): string {
            if (typeof str !== "string") return str;
            return str.replace(/^\s+|\s+$/g, "");
        }

        /**
         * generate random id string
         */
        public static newId(): string {
            return UtilHelpers.newId();
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
                    const pad = function (number) {
                        var r = String(number);
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
            var myNav = userAgentStr ? userAgentStr.toLowerCase() : navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : null;
        }

        /**
         * Convert ms to c# time span format
         */
        public static msToTimeSpan(totalms: number): string {
            if (isNaN(totalms) || totalms < 0) {
                totalms = 0;
            }

            totalms = Math.round(totalms);

            var ms = "" + totalms % 1000;
            var sec = "" + Math.floor(totalms / 1000) % 60;
            var min = "" + Math.floor(totalms / (1000 * 60)) % 60;
            var hour = "" + Math.floor(totalms / (1000 * 60 * 60)) % 24;
            var days = Math.floor(totalms / (1000 * 60 * 60 * 24));

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
            var objectTypeDump: string = Object.prototype.toString.call(object);
            var propertyValueDump: string = JSON.stringify(object);
            if (objectTypeDump === "[object Error]") {
                propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
            }

            return objectTypeDump + propertyValueDump;
        }

        /**
        * Returns the name of object if it's an Error. Otherwise, returns empty string.
        */
        public static getExceptionName(object: any): string {
            var objectTypeDump: string = Object.prototype.toString.call(object);
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
            if (!window || typeof eventName !== 'string' || typeof callback !== 'function') {
                return false;
            }

            // Create verb for the event
            var verbEventName = 'on' + eventName;

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
            return ('sendBeacon' in navigator && (<any>navigator).sendBeacon);
        }
    }

    export class UrlHelper {
        private static document: any = typeof document !== "undefined" ? document : {};
        private static htmlAnchorElement: HTMLAnchorElement;

        public static parseUrl(url): HTMLAnchorElement {
            if (!UrlHelper.htmlAnchorElement) {
                UrlHelper.htmlAnchorElement = !!UrlHelper.document.createElement ? UrlHelper.document.createElement('a') : { host: UrlHelper.parseHost(url) };
            }

            UrlHelper.htmlAnchorElement.href = url;

            return UrlHelper.htmlAnchorElement;
        }

        // Fallback method to grab host from url if document.createElement method is not available
        public static parseHost(url: string) {
            var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
            if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
                return match[2];
            } else {
                return null;
            }
        }

        public static getAbsoluteUrl(url): string {
            var result: string;
            var a = UrlHelper.parseUrl(url);
            if (a) {
                result = a.href;
            }

            return result;
        }

        public static getPathName(url): string {
            var result: string;
            var a = UrlHelper.parseUrl(url);
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
    }

    export class CorrelationIdHelper {
        public static correlationIdPrefix = "cid-v1:";

        /**
        * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers
        */
        public static canIncludeCorrelationHeader(config: IConfig, requestUrl: string, currentHost: string) {
            if (config && config.disableCorrelationHeaders) {
                return false;
            }

            if (!requestUrl) {
                return false;
            }

            let requestHost = UrlHelper.parseUrl(requestUrl).host.toLowerCase();
            if ((!config || !config.enableCorsCorrelation) && requestHost !== currentHost) {
                return false;
            }

            let excludedDomains = config && config.correlationHeaderExcludedDomains;
            if (!excludedDomains || excludedDomains.length == 0) {
                return true;
            }

            for (let i = 0; i < excludedDomains.length; i++) {
                let regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
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
                    if (keyValue.length == 2 && keyValue[0] == key) {
                        return keyValue[1];
                    }
                }
            }
        }
    }
}
