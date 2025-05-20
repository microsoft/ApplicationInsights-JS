// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, dumpObj, eLoggingSeverity, getExceptionName, getGlobal, getGlobalInst,
    isNullOrUndefined, objForEachKey
} from "@microsoft/applicationinsights-core-js";
import { objGetOwnPropertyDescriptor } from "@nevware21/ts-utils";
import { StorageType } from "./Enums";

let _canUseLocalStorage: boolean = undefined;
let _canUseSessionStorage: boolean = undefined;
let _storagePrefix: string = "";

/**
 * Gets the localStorage object if available
 * @returns {Storage} - Returns the storage object if available else returns null
 */
function _getLocalStorageObject(): Storage {
    if (utlCanUseLocalStorage()) {
        return _getVerifiedStorageObject(StorageType.LocalStorage);
    }

    return null;
}

/**
 * Safely checks if storage object (localStorage or sessionStorage) is available and accessible
 * This helps prevent SecurityError in some browsers (e.g., Safari) when cookies are blocked
 * @param storageType - Type of storage
 * @returns {boolean} Returns whether storage object is safely accessible
 */
function _canSafelyAccessStorage(storageType: StorageType): boolean {
    const storageTypeName = storageType === StorageType.LocalStorage ? "localStorage" : "sessionStorage";
    
    try {
        // First, check if window exists and get the global object once
        const gbl: any = getGlobal();
        if (isNullOrUndefined(gbl)) {
            return false;
        }
        
        // Try to indirectly check if the property exists and is accessible
        // This avoids direct property access that might throw in Safari with "Block All Cookies" enabled
        
        // Some browsers throw when accessing the property descriptors with getOwnPropertyDescriptor
        // Others throw when directly accessing the storage objects
        // This approach tries both methods safely
        try {
            // Method 1: Try using property descriptor - safer in Safari with cookies blocked
            const descriptor = objGetOwnPropertyDescriptor(gbl, storageTypeName);
            if (!descriptor || !descriptor.get) {
                return false;
            }
        } catch (e) {
            // If the above fails, attempt a direct access inside a try-catch
            try {
                const storage = gbl[storageTypeName];
                if (!storage) {
                    return false;
                }
            } catch (e) {
                // If both approaches fail, storage cannot be safely accessed
                return false;
            }
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Tests storage object (localStorage or sessionStorage) to verify that it is usable
 * More details here: https://mathiasbynens.be/notes/localstorage-pattern
 * @param storageType - Type of storage
 * @returns {Storage} Returns storage object verified that it is usable
 */
function _getVerifiedStorageObject(storageType: StorageType): Storage {
    try {
        // First check if we can safely access the storage object
        if (!_canSafelyAccessStorage(storageType)) {
            return null;
        }
        
        const storageTypeName = storageType === StorageType.LocalStorage ? "localStorage" : "sessionStorage";
        
        // Now we can safely try to use the storage
        try {
            let uid = (new Date).toString();
            let storage: Storage = getGlobalInst(storageTypeName);
            let name:string = _storagePrefix + uid;
            storage.setItem(name, uid);
            let fail = storage.getItem(name) !== uid;
            storage.removeItem(name);
            if (!fail) {
                return storage;
            }
        } catch (exception) {
            // Storage exists but can't be used (quota exceeded, etc.)
            return null;
        }
    } catch (exception) {
        // Catch any unexpected errors
    }

    return null;
}

/**
 * Gets the sessionStorage object if available
 * @returns {Storage} - Returns the storage object if available else returns null
 */
function _getSessionStorageObject(): Storage {
    if (utlCanUseSessionStorage()) {
        return _getVerifiedStorageObject(StorageType.SessionStorage);
    }

    return null;
}

/**
 * Disables the global SDK usage of local or session storage if available
 */
export function utlDisableStorage() {
    _canUseLocalStorage = false;
    _canUseSessionStorage = false;
}

export function utlSetStoragePrefix(storagePrefix: string) {
    _storagePrefix = storagePrefix || "";
}

/**
 * Re-enables the global SDK usage of local or session storage if available
 */
export function utlEnableStorage() {
    _canUseLocalStorage = utlCanUseLocalStorage(true);
    _canUseSessionStorage = utlCanUseSessionStorage(true);
}

/**
 * Returns whether LocalStorage can be used, if the reset parameter is passed a true this will override
 * any previous disable calls.
 * @param reset - Should the usage be reset and determined only based on whether LocalStorage is available
 */
export function utlCanUseLocalStorage(reset?: boolean): boolean {
    if (reset || _canUseLocalStorage === undefined) {
        _canUseLocalStorage = !!_getVerifiedStorageObject(StorageType.LocalStorage);
    }

    return _canUseLocalStorage;
}

export function utlGetLocalStorage(logger: IDiagnosticLogger, name: string): string {
    const storage = _getLocalStorageObject();
    if (storage !== null) {
        try {
            return storage.getItem(name);
        } catch (e) {
            _canUseLocalStorage = false;

            _throwInternal(logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.BrowserCannotReadLocalStorage,
                "Browser failed read of local storage. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return null;
}

export function utlSetLocalStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
    const storage = _getLocalStorageObject();
    if (storage !== null) {
        try {
            storage.setItem(name, data);
            return true;
        } catch (e) {
            _canUseLocalStorage = false;

            _throwInternal(logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.BrowserCannotWriteLocalStorage,
                "Browser failed write to local storage. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return false;
}

export function utlRemoveStorage(logger: IDiagnosticLogger, name: string): boolean {
    const storage = _getLocalStorageObject();
    if (storage !== null) {
        try {
            storage.removeItem(name);
            return true;
        } catch (e) {
            _canUseLocalStorage = false;

            _throwInternal(logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.BrowserFailedRemovalFromLocalStorage,
                "Browser failed removal of local storage item. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return false;
}

export function utlCanUseSessionStorage(reset?: boolean): boolean {
    if (reset || _canUseSessionStorage === undefined) {
        _canUseSessionStorage = !!_getVerifiedStorageObject(StorageType.SessionStorage);
    }

    return _canUseSessionStorage;
}

export function utlGetSessionStorageKeys(): string[] {
    const keys: string[] = [];

    if (utlCanUseSessionStorage()) {
        objForEachKey(getGlobalInst<any>("sessionStorage"), (key) => {
            keys.push(key);
        });
    }

    return keys;
}

export function utlGetSessionStorage(logger: IDiagnosticLogger, name: string): string {
    const storage = _getSessionStorageObject();
    if (storage !== null) {
        try {
            return storage.getItem(name);
        } catch (e) {
            _canUseSessionStorage = false;

            _throwInternal(logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.BrowserCannotReadSessionStorage,
                "Browser failed read of session storage. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return null;
}

export function utlSetSessionStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
    const storage = _getSessionStorageObject();
    if (storage !== null) {
        try {
            storage.setItem(name, data);
            return true;
        } catch (e) {
            _canUseSessionStorage = false;

            _throwInternal(logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.BrowserCannotWriteSessionStorage,
                "Browser failed write to session storage. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return false;
}

export function utlRemoveSessionStorage(logger: IDiagnosticLogger, name: string): boolean {
    const storage = _getSessionStorageObject();
    if (storage !== null) {
        try {
            storage.removeItem(name);
            return true;
        } catch (e) {
            _canUseSessionStorage = false;

            _throwInternal(logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.BrowserFailedRemovalFromSessionStorage,
                "Browser failed removal of session storage item. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }

    return false;
}
