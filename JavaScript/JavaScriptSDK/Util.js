define(["require", "exports"], function (require, exports) {
    /// <reference path="./logging.ts" />
    var Microsoft;
    (function (Microsoft) {
        var ApplicationInsights;
        (function (ApplicationInsights) {
            var Util = (function () {
                function Util() {
                }
                /**
                 * Gets the localStorage object if available
                 * @return {Storage} - Returns the storage object if available else returns null
                 */
                Util._getStorageObject = function () {
                    try {
                        if (window.localStorage) {
                            return window.localStorage;
                        }
                        else {
                            return null;
                        }
                    }
                    catch (e) {
                        _InternalLogging.warnToConsole('Failed to get client localStorage: ' + e.message);
                        return null;
                    }
                };
                /**
                 *  Check if the browser supports local storage.
                 *
                 *  @returns {boolean} True if local storage is supported.
                 */
                Util.canUseLocalStorage = function () {
                    return !!Util._getStorageObject();
                };
                /**
                 *  Get an object from the browser's local storage
                 *
                 *  @param {string} name - the name of the object to get from storage
                 *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
                 */
                Util.getStorage = function (name) {
                    var storage = Util._getStorageObject();
                    if (storage !== null) {
                        try {
                            return storage.getItem(name);
                        }
                        catch (e) {
                            var message = new _InternalLogMessage(_InternalMessageId.NONUSRACT_BrowserCannotReadLocalStorage, "Browser failed read of local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.WARNING, message);
                        }
                    }
                    return null;
                };
                /**
                 *  Set the contents of an object in the browser's local storage
                 *
                 *  @param {string} name - the name of the object to set in storage
                 *  @param {string} data - the contents of the object to set in storage
                 *  @returns {boolean} True if the storage object could be written.
                 */
                Util.setStorage = function (name, data) {
                    var storage = Util._getStorageObject();
                    if (storage !== null) {
                        try {
                            storage.setItem(name, data);
                            return true;
                        }
                        catch (e) {
                            var message = new _InternalLogMessage(_InternalMessageId.NONUSRACT_BrowserCannotWriteLocalStorage, "Browser failed write to local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.WARNING, message);
                        }
                    }
                    return false;
                };
                /**
                 *  Remove an object from the browser's local storage
                 *
                 *  @param {string} name - the name of the object to remove from storage
                 *  @returns {boolean} True if the storage object could be removed.
                 */
                Util.removeStorage = function (name) {
                    var storage = Util._getStorageObject();
                    if (storage !== null) {
                        try {
                            storage.removeItem(name);
                            return true;
                        }
                        catch (e) {
                            var message = new _InternalLogMessage(_InternalMessageId.NONUSRACT_BrowserFailedRemovalFromLocalStorage, "Browser failed removal of local storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.WARNING, message);
                        }
                    }
                    return false;
                };
                /**
                 * Gets the localStorage object if available
                 * @return {Storage} - Returns the storage object if available else returns null
                 */
                Util._getSessionStorageObject = function () {
                    try {
                        if (window.sessionStorage) {
                            return window.sessionStorage;
                        }
                        else {
                            return null;
                        }
                    }
                    catch (e) {
                        _InternalLogging.warnToConsole('Failed to get client session storage: ' + e.message);
                        return null;
                    }
                };
                /**
                 *  Check if the browser supports session storage.
                 *
                 *  @returns {boolean} True if session storage is supported.
                 */
                Util.canUseSessionStorage = function () {
                    return !!Util._getSessionStorageObject();
                };
                /**
                 *  Gets the list of session storage keys
                 *
                 *  @returns {string[]} List of session storage keys
                 */
                Util.getSessionStorageKeys = function () {
                    var keys = [];
                    if (Util.canUseSessionStorage()) {
                        for (var key in window.sessionStorage) {
                            keys.push(key);
                        }
                    }
                    return keys;
                };
                /**
                 *  Get an object from the browser's session storage
                 *
                 *  @param {string} name - the name of the object to get from storage
                 *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
                 */
                Util.getSessionStorage = function (name) {
                    var storage = Util._getSessionStorageObject();
                    if (storage !== null) {
                        try {
                            return storage.getItem(name);
                        }
                        catch (e) {
                            var message = new _InternalLogMessage(_InternalMessageId.NONUSRACT_BrowserCannotReadSessionStorage, "Browser failed read of session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, message);
                        }
                    }
                    return null;
                };
                /**
                 *  Set the contents of an object in the browser's session storage
                 *
                 *  @param {string} name - the name of the object to set in storage
                 *  @param {string} data - the contents of the object to set in storage
                 *  @returns {boolean} True if the storage object could be written.
                 */
                Util.setSessionStorage = function (name, data) {
                    var storage = Util._getSessionStorageObject();
                    if (storage !== null) {
                        try {
                            storage.setItem(name, data);
                            return true;
                        }
                        catch (e) {
                            var message = new _InternalLogMessage(_InternalMessageId.NONUSRACT_BrowserCannotWriteSessionStorage, "Browser failed write to session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, message);
                        }
                    }
                    return false;
                };
                /**
                 *  Remove an object from the browser's session storage
                 *
                 *  @param {string} name - the name of the object to remove from storage
                 *  @returns {boolean} True if the storage object could be removed.
                 */
                Util.removeSessionStorage = function (name) {
                    var storage = Util._getSessionStorageObject();
                    if (storage !== null) {
                        try {
                            storage.removeItem(name);
                            return true;
                        }
                        catch (e) {
                            var message = new _InternalLogMessage(_InternalMessageId.NONUSRACT_BrowserFailedRemovalFromSessionStorage, "Browser failed removal of session storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, message);
                        }
                    }
                    return false;
                };
                /**
                 * helper method to set userId and sessionId cookie
                 */
                Util.setCookie = function (name, value) {
                    Util.document.cookie = name + "=" + value + ";path=/";
                };
                Util.stringToBoolOrDefault = function (str) {
                    if (!str) {
                        return false;
                    }
                    return str.toString().toLowerCase() === "true";
                };
                /**
                 * helper method to access userId and sessionId cookie
                 */
                Util.getCookie = function (name) {
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
                };
                /**
                 * Deletes a cookie by setting it's expiration time in the past.
                 * @param name - The name of the cookie to delete.
                 */
                Util.deleteCookie = function (name) {
                    // Setting the expiration date in the past immediately removes the cookie
                    Util.document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                };
                /**
                 * helper method to trim strings (IE8 does not implement String.prototype.trim)
                 */
                Util.trim = function (str) {
                    if (typeof str !== "string")
                        return str;
                    return str.replace(/^\s+|\s+$/g, "");
                };
                /**
                 * generate random id string
                 */
                Util.newId = function () {
                    var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                    var result = "";
                    var random = Math.random() * 1073741824; //5 symbols in base64, almost maxint
                    while (random > 0) {
                        var char = base64chars.charAt(random % 64);
                        result += char;
                        random = Math.floor(random / 64);
                    }
                    return result;
                };
                /**
                 * Check if an object is of type Array
                 */
                Util.isArray = function (obj) {
                    return Object.prototype.toString.call(obj) === "[object Array]";
                };
                /**
                 * Check if an object is of type Error
                 */
                Util.isError = function (obj) {
                    return Object.prototype.toString.call(obj) === "[object Error]";
                };
                /**
                 * Check if an object is of type Date
                 */
                Util.isDate = function (obj) {
                    return Object.prototype.toString.call(obj) === "[object Date]";
                };
                /**
                 * Convert a date to I.S.O. format in IE8
                 */
                Util.toISOStringForIE8 = function (date) {
                    if (Util.isDate(date)) {
                        if (Date.prototype.toISOString) {
                            return date.toISOString();
                        }
                        else {
                            function pad(number) {
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
                };
                Util.isIE = function () {
                    return navigator.userAgent.toLowerCase().indexOf("msie") != -1;
                };
                Util.document = typeof document !== "undefined" ? document : {};
                Util.NotSpecified = "not_specified";
                return Util;
            })();
            ApplicationInsights.Util = Util;
            msToTimeSpan(totalms, number);
            string;
            {
                if (isNaN(totalms) || totalms < 0) {
                    totalms = 0;
                }
                var ms = "" + totalms % 1000;
                var sec = "" + Math.floor(totalms / 1000) % 60;
                var min = "" + Math.floor(totalms / (1000 * 60)) % 60;
                var hour = "" + Math.floor(totalms / (1000 * 60 * 60)) % 24;
                ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
                sec = sec.length < 2 ? "0" + sec : sec;
                min = min.length < 2 ? "0" + min : min;
                hour = hour.length < 2 ? "0" + hour : hour;
                return hour + ":" + min + ":" + sec + "." + ms;
            }
            isCrossOriginError(message, string, url, string, lineNumber, number, columnNumber, number, error, Error);
            boolean;
            {
                return (message === "Script error." || message === "Script error") && error === null;
            }
            dump(object, any);
            string;
            {
                var objectTypeDump = Object.prototype.toString.call(object);
                var propertyValueDump = JSON.stringify(object);
                if (objectTypeDump === "[object Error]") {
                    propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
                }
                return objectTypeDump + propertyValueDump;
            }
            getExceptionName(object, any);
            string;
            {
                var objectTypeDump = Object.prototype.toString.call(object);
                if (objectTypeDump === "[object Error]") {
                    return object.name;
                }
                return "";
            }
            addEventHandler(eventName, string, callback, any);
            boolean;
            {
                if (!window || typeof eventName !== 'string' || typeof callback !== 'function') {
                    return false;
                }
                // Create verb for the event
                var verbEventName = 'on' + eventName;
                // check if addEventListener is available
                if (window.addEventListener) {
                    window.addEventListener(eventName, callback, false);
                }
                else if (window["attachEvent"]) {
                    window["attachEvent"].call(verbEventName, callback);
                }
                else {
                    return false;
                }
                return true;
            }
        })(ApplicationInsights = Microsoft.ApplicationInsights || (Microsoft.ApplicationInsights = {}));
    })(Microsoft || (Microsoft = {}));
    var UrlHelper = (function () {
        function UrlHelper() {
        }
        UrlHelper.parseUrl = function (url) {
            if (!UrlHelper.htmlAnchorElement) {
                UrlHelper.htmlAnchorElement = UrlHelper.document.createElement('a');
            }
            UrlHelper.htmlAnchorElement.href = url;
            return UrlHelper.htmlAnchorElement;
        };
        UrlHelper.getAbsoluteUrl = function (url) {
            var result;
            var a = UrlHelper.parseUrl(url);
            if (a) {
                result = a.href;
            }
            return result;
        };
        UrlHelper.getPathName = function (url) {
            var result;
            var a = UrlHelper.parseUrl(url);
            if (a) {
                result = a.pathname;
            }
            return result;
        };
        UrlHelper.document = typeof document !== "undefined" ? document : {};
        return UrlHelper;
    })();
    exports.UrlHelper = UrlHelper;
});
//# sourceMappingURL=Util.js.map