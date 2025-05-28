// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, dumpObj, eLoggingSeverity, getExceptionName, getGlobal, getGlobalInst,
    isNullOrUndefined, objForEachKey
} from "@microsoft/applicationinsights-core-js";
import { ICachedValue, createCachedValue, objGetOwnPropertyDescriptor } from "@nevware21/ts-utils";
import { StorageType } from "./Enums";

let _storagePrefix: string = "";

// Create cached values for verified storage objects to avoid repeated checks
let _verifiedLocalStorage: ICachedValue<Storage> = null;
let _verifiedSessionStorage: ICachedValue<Storage> = null;

/**
 * Gets the localStorage object if available
 * @returns {Storage} - Returns the storage object if available else returns null
 */
function _getLocalStorageObject(): Storage {
    if (!_verifiedLocalStorage) {
        _verifiedLocalStorage = createCachedValue(_getVerifiedStorageObject(StorageType.LocalStorage));
    }
    return _verifiedLocalStorage.v;
}

/**
 * Tests storage object (localStorage or sessionStorage) to verify that it is usable
 * More details here: https://mathiasbynens.be/notes/localstorage-pattern
 * @param storageType - Type of storage
 * @returns {Storage} Returns storage object verified that it is usable
 */
function _getVerifiedStorageObject(storageType: StorageType): Storage {
    let result = null;
    const storageTypeName = storageType === StorageType.LocalStorage ? "localStorage" : "sessionStorage";
    
    try {
        // Default to false - assume storage is not available
        let canAccessStorage = false;
        const gbl = getGlobal();
        
        // Only proceed if we have a global object
        if (!isNullOrUndefined(gbl)) {
            // Try the safest method first (property descriptor)
            try {
                const descriptor = objGetOwnPropertyDescriptor(gbl, storageTypeName);
                if (descriptor && descriptor.get) {
                    canAccessStorage = true;
                }
            } catch (e) {
                // If descriptor check fails, try direct access
                // This will be caught by the outer try-catch if it fails
                canAccessStorage = !!gbl[storageTypeName];
            }
        }
        
        // If we determined storage might be accessible, verify it works
        if (canAccessStorage) {
            try {
                const uid = (new Date).toString();
                const storage: Storage = getGlobalInst(storageTypeName);
                if (!storage) {
                    return null;
                }
                const name = _storagePrefix + uid;
                
                storage.setItem(name, uid);
                const success = storage.getItem(name) === uid;
                storage.removeItem(name);
                
                if (success) {
                    // Create a wrapped storage object that protects write operations
                    const originalStorage = storage;
                    
                    // Helper to create storage operation methods with consistent error handling
                    const _createStorageOperation = function<T>(operationName: string, resetOnError: boolean, defaultValue?: T): Function {
                        return function(...args: any[]): T {
                            try {
                                // Execute the operation but allow exceptions to propagate after handling
                                return originalStorage[operationName].apply(originalStorage, args);
                            } catch (e) {
                                // Log or handle the error as needed
                                if (resetOnError) {
                                    // Reset the verified storage on write errors
                                    if (storageType === StorageType.LocalStorage) {
                                        _verifiedLocalStorage = null;
                                    } else {
                                        _verifiedSessionStorage = null;
                                    }
                                }
                                // Rethrow the exception to the caller
                                throw e;
                            }
                        };
                    }
                    
                    const wrappedStorage = {
                        // Read operations - don't reset cache on error
                        getItem: _createStorageOperation<string>("getItem", false, null),
                        key: _createStorageOperation<string>("key", false, null),
                        get length(): number { 
                            return _createStorageOperation<number>("length", false, 0)();
                        },
                        
                        // Write operations - reset cache on error
                        setItem: _createStorageOperation<void>("setItem", true),
                        removeItem: _createStorageOperation<void>("removeItem", true),
                        clear: _createStorageOperation<void>("clear", true)
                    };
                    
                    result = wrappedStorage as Storage;
                }
            } catch (e) {
                // Storage exists but can't be used (quota exceeded, etc.)
            }
        }
    } catch (e) {
        // Catch any unexpected errors
    }
    
    return result;
}

/**
 * Gets the sessionStorage object if available
 * @returns {Storage} - Returns the storage object if available else returns null
 */
function _getSessionStorageObject(): Storage {
    if (!_verifiedSessionStorage) {
        _verifiedSessionStorage = createCachedValue(_getVerifiedStorageObject(StorageType.SessionStorage));
    }
    return _verifiedSessionStorage.v;
}



/**
 * Disables the global SDK usage of local or session storage if available
 */
export function utlDisableStorage() {
    _verifiedLocalStorage = createCachedValue(null);
    _verifiedSessionStorage = createCachedValue(null);
}

export function utlSetStoragePrefix(storagePrefix: string) {
    _storagePrefix = storagePrefix || "";
    // Reset the cached storage instances since prefix changed
    _verifiedLocalStorage = null;
    _verifiedSessionStorage = null;
}

/**
 * Re-enables the global SDK usage of local or session storage if available
 */
export function utlEnableStorage() {
    // Force recheck of storage availability
    utlCanUseLocalStorage(true);
    utlCanUseSessionStorage(true);
}

/**
 * Returns whether LocalStorage can be used, if the reset parameter is passed a true this will override
 * any previous disable calls.
 * @param reset - Should the usage be reset and determined only based on whether LocalStorage is available
 */
export function utlCanUseLocalStorage(reset?: boolean): boolean {
    if (reset) {
        _verifiedLocalStorage = null;
    }
    
    const storage = _getLocalStorageObject();
    return !!storage;
}

export function utlGetLocalStorage(logger: IDiagnosticLogger, name: string): string {
    const storage = _getLocalStorageObject();
    if (storage !== null) {
        return storage.getItem(name);
    }
    return null;
}

export function utlSetLocalStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
    const storage = _getLocalStorageObject();
    if (storage !== null) {
        storage.setItem(name, data);
        return true;
    }
    return false;
}

export function utlRemoveStorage(logger: IDiagnosticLogger, name: string): boolean {
    const storage = _getLocalStorageObject();
    if (storage !== null) {
        storage.removeItem(name);
        return true;
    }
    return false;
}

export function utlCanUseSessionStorage(reset?: boolean): boolean {
    if (reset) {
        _verifiedSessionStorage = null;
    }
    
    const storage = _getSessionStorageObject();
    return !!storage;
}

export function utlGetSessionStorageKeys(): string[] {
    if (utlCanUseSessionStorage()) {
        const keys: string[] = [];
        try {
            objForEachKey(getGlobalInst<any>("sessionStorage"), (key) => {
                keys.push(key);
            });
        } catch (e) {
            // Invalidate session storage on any error
            _verifiedSessionStorage = null;
        }
        return keys;
    }
    return [];
}

export function utlGetSessionStorage(logger: IDiagnosticLogger, name: string): string {
    try {
        const storage = _getSessionStorageObject();
        if (storage !== null) {
            return storage.getItem(name);
        }
    } catch (e) {
        _throwInternal(logger, eLoggingSeverity.WARNING,
            _eInternalMessageId.FailedToGetSessionStorageItem,
            "Failed to get session storage: " + getExceptionName(e),
            { exception: dumpObj(e) });
    }
    return null;
}

export function utlSetSessionStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
    try {
        const storage = _getSessionStorageObject();
        if (storage !== null) {
            storage.setItem(name, data);
            return true;
        }
    } catch (e) {
        _throwInternal(logger, eLoggingSeverity.WARNING,
            _eInternalMessageId.FailedToSetSessionStorageItem,
            "Failed to set session storage: " + getExceptionName(e),
            { exception: dumpObj(e) });
    }
    return false;
}

export function utlRemoveSessionStorage(logger: IDiagnosticLogger, name: string): boolean {
    try {
        const storage = _getSessionStorageObject();
        if (storage !== null) {
            storage.removeItem(name);
            return true;
        }
    } catch (e) {
        _throwInternal(logger, eLoggingSeverity.WARNING,
            _eInternalMessageId.FailedToRemoveSessionStorageItem,
            "Failed to remove session storage: " + getExceptionName(e),
            { exception: dumpObj(e) });
    }
    return false;
}
