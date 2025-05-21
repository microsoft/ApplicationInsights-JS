"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.utlDisableStorage = utlDisableStorage;
exports.utlSetStoragePrefix = utlSetStoragePrefix;
exports.utlEnableStorage = utlEnableStorage;
exports.utlCanUseLocalStorage = utlCanUseLocalStorage;
exports.utlGetLocalStorage = utlGetLocalStorage;
exports.utlSetLocalStorage = utlSetLocalStorage;
exports.utlRemoveStorage = utlRemoveStorage;
exports.utlCanUseSessionStorage = utlCanUseSessionStorage;
exports.utlGetSessionStorageKeys = utlGetSessionStorageKeys;
exports.utlGetSessionStorage = utlGetSessionStorage;
exports.utlSetSessionStorage = utlSetSessionStorage;
exports.utlRemoveSessionStorage = utlRemoveSessionStorage;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ts_utils_1 = require("@nevware21/ts-utils");
var Enums_1 = require("./Enums");
var _canUseLocalStorage = undefined;
var _canUseSessionStorage = undefined;
var _storagePrefix = "";
/**
 * Gets the localStorage object if available
 * @returns {Storage} - Returns the storage object if available else returns null
 */
function _getLocalStorageObject() {
    if (utlCanUseLocalStorage()) {
        return _getVerifiedStorageObject(Enums_1.StorageType.LocalStorage);
    }
    return null;
}
/**
 * Safely checks if storage object (localStorage or sessionStorage) is available and accessible
 * This helps prevent SecurityError in some browsers (e.g., Safari) when cookies are blocked
 * @param storageType - Type of storage
 * @returns {boolean} Returns whether storage object is safely accessible
 */
function _canSafelyAccessStorage(storageType) {
    var storageTypeName = storageType === Enums_1.StorageType.LocalStorage ? "localStorage" : "sessionStorage";
    var result = true;
    try {
        // First, check if window exists and get the global object once
        var gbl = (0, applicationinsights_core_js_1.getGlobal)();
        if ((0, applicationinsights_core_js_1.isNullOrUndefined)(gbl)) {
            result = false;
        }
        else {
            // Try to indirectly check if the property exists and is accessible
            // This avoids direct property access that might throw in Safari with "Block All Cookies" enabled
            // Some browsers throw when accessing the property descriptors with getOwnPropertyDescriptor
            // Others throw when directly accessing the storage objects
            // This approach tries both methods safely
            try {
                // Method 1: Try using property descriptor - safer in Safari with cookies blocked
                var descriptor = (0, ts_utils_1.objGetOwnPropertyDescriptor)(gbl, storageTypeName);
                if (!descriptor || !descriptor.get) {
                    result = false;
                }
            }
            catch (e) {
                // If the above fails, attempt a direct access inside a try-catch
                try {
                    var storage = gbl[storageTypeName];
                    if (!storage) {
                        result = false;
                    }
                }
                catch (e) {
                    // If both approaches fail, storage cannot be safely accessed
                    result = false;
                }
            }
        }
    }
    catch (e) {
        result = false;
    }
    return result;
}
/**
 * Tests storage object (localStorage or sessionStorage) to verify that it is usable
 * More details here: https://mathiasbynens.be/notes/localstorage-pattern
 * @param storageType - Type of storage
 * @returns {Storage} Returns storage object verified that it is usable
 */
function _getVerifiedStorageObject(storageType) {
    var result = null;
    try {
        // First check if we can safely access the storage object
        if (_canSafelyAccessStorage(storageType)) {
            var storageTypeName = storageType === Enums_1.StorageType.LocalStorage ? "localStorage" : "sessionStorage";
            // Now we can safely try to use the storage
            try {
                var uid = (new Date).toString();
                var storage = (0, applicationinsights_core_js_1.getGlobalInst)(storageTypeName);
                var name_1 = _storagePrefix + uid;
                storage.setItem(name_1, uid);
                var fail = storage.getItem(name_1) !== uid;
                storage.removeItem(name_1);
                if (!fail) {
                    result = storage;
                }
            }
            catch (exception) {
                // Storage exists but can't be used (quota exceeded, etc.)
            }
        }
    }
    catch (exception) {
        // Catch any unexpected errors
    }
    return result;
}
/**
 * Gets the sessionStorage object if available
 * @returns {Storage} - Returns the storage object if available else returns null
 */
function _getSessionStorageObject() {
    if (utlCanUseSessionStorage()) {
        return _getVerifiedStorageObject(Enums_1.StorageType.SessionStorage);
    }
    return null;
}
/**
 * Disables the global SDK usage of local or session storage if available
 */
function utlDisableStorage() {
    _canUseLocalStorage = false;
    _canUseSessionStorage = false;
}
function utlSetStoragePrefix(storagePrefix) {
    _storagePrefix = storagePrefix || "";
}
/**
 * Re-enables the global SDK usage of local or session storage if available
 */
function utlEnableStorage() {
    _canUseLocalStorage = utlCanUseLocalStorage(true);
    _canUseSessionStorage = utlCanUseSessionStorage(true);
}
/**
 * Returns whether LocalStorage can be used, if the reset parameter is passed a true this will override
 * any previous disable calls.
 * @param reset - Should the usage be reset and determined only based on whether LocalStorage is available
 */
function utlCanUseLocalStorage(reset) {
    if (reset || _canUseLocalStorage === undefined) {
        _canUseLocalStorage = !!_getVerifiedStorageObject(Enums_1.StorageType.LocalStorage);
    }
    return _canUseLocalStorage;
}
function utlGetLocalStorage(logger, name) {
    var storage = _getLocalStorageObject();
    if (storage !== null) {
        try {
            return storage.getItem(name);
        }
        catch (e) {
            _canUseLocalStorage = false;
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.BrowserCannotReadLocalStorage, "Browser failed read of local storage. " + (0, applicationinsights_core_js_1.getExceptionName)(e), { exception: (0, applicationinsights_core_js_1.dumpObj)(e) });
        }
    }
    return null;
}
function utlSetLocalStorage(logger, name, data) {
    var storage = _getLocalStorageObject();
    if (storage !== null) {
        try {
            storage.setItem(name, data);
            return true;
        }
        catch (e) {
            _canUseLocalStorage = false;
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.BrowserCannotWriteLocalStorage, "Browser failed write to local storage. " + (0, applicationinsights_core_js_1.getExceptionName)(e), { exception: (0, applicationinsights_core_js_1.dumpObj)(e) });
        }
    }
    return false;
}
function utlRemoveStorage(logger, name) {
    var storage = _getLocalStorageObject();
    if (storage !== null) {
        try {
            storage.removeItem(name);
            return true;
        }
        catch (e) {
            _canUseLocalStorage = false;
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.BrowserFailedRemovalFromLocalStorage, "Browser failed removal of local storage item. " + (0, applicationinsights_core_js_1.getExceptionName)(e), { exception: (0, applicationinsights_core_js_1.dumpObj)(e) });
        }
    }
    return false;
}
function utlCanUseSessionStorage(reset) {
    if (reset || _canUseSessionStorage === undefined) {
        _canUseSessionStorage = !!_getVerifiedStorageObject(Enums_1.StorageType.SessionStorage);
    }
    return _canUseSessionStorage;
}
function utlGetSessionStorageKeys() {
    var keys = [];
    if (utlCanUseSessionStorage()) {
        (0, applicationinsights_core_js_1.objForEachKey)((0, applicationinsights_core_js_1.getGlobalInst)("sessionStorage"), function (key) {
            keys.push(key);
        });
    }
    return keys;
}
function utlGetSessionStorage(logger, name) {
    var storage = _getSessionStorageObject();
    if (storage !== null) {
        try {
            return storage.getItem(name);
        }
        catch (e) {
            _canUseSessionStorage = false;
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.BrowserCannotReadSessionStorage, "Browser failed read of session storage. " + (0, applicationinsights_core_js_1.getExceptionName)(e), { exception: (0, applicationinsights_core_js_1.dumpObj)(e) });
        }
    }
    return null;
}
function utlSetSessionStorage(logger, name, data) {
    var storage = _getSessionStorageObject();
    if (storage !== null) {
        try {
            storage.setItem(name, data);
            return true;
        }
        catch (e) {
            _canUseSessionStorage = false;
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.BrowserCannotWriteSessionStorage, "Browser failed write to session storage. " + (0, applicationinsights_core_js_1.getExceptionName)(e), { exception: (0, applicationinsights_core_js_1.dumpObj)(e) });
        }
    }
    return false;
}
function utlRemoveSessionStorage(logger, name) {
    var storage = _getSessionStorageObject();
    if (storage !== null) {
        try {
            storage.removeItem(name);
            return true;
        }
        catch (e) {
            _canUseSessionStorage = false;
            (0, applicationinsights_core_js_1._throwInternal)(logger, applicationinsights_core_js_1.eLoggingSeverity.WARNING, applicationinsights_core_js_1._eInternalMessageId.BrowserFailedRemovalFromSessionStorage, "Browser failed removal of session storage item. " + (0, applicationinsights_core_js_1.getExceptionName)(e), { exception: (0, applicationinsights_core_js_1.dumpObj)(e) });
        }
    }
    return false;
}
