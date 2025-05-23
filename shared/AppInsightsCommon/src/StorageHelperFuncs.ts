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
                const name = _storagePrefix + uid;
                
                storage.setItem(name, uid);
                const success = storage.getItem(name) === uid;
                storage.removeItem(name);
                
                if (success) {
                    // Create a wrapped storage object that handles errors
                    const originalStorage = storage;
                    const wrappedStorage = {
                        getItem: function(key: string): string {
                            try {
                                return originalStorage.getItem(key);
                            } catch (e) {
                                // Reset the cached storage on error
                                if (storageType === StorageType.LocalStorage) {
                                    _verifiedLocalStorage = null;
                                } else {
                                    _verifiedSessionStorage = null;
                                }
                                return null;
                            }
                        },
                        setItem: function(key: string, value: string): void {
                            try {
                                originalStorage.setItem(key, value);
                            } catch (e) {
                                // Reset the cached storage on error
                                if (storageType === StorageType.LocalStorage) {
                                    _verifiedLocalStorage = null;
                                } else {
                                    _verifiedSessionStorage = null;
                                }
                            }
                        },
                        removeItem: function(key: string): void {
                            try {
                                originalStorage.removeItem(key);
                            } catch (e) {
                                // Reset the cached storage on error
                                if (storageType === StorageType.LocalStorage) {
                                    _verifiedLocalStorage = null;
                                } else {
                                    _verifiedSessionStorage = null;
                                }
                            }
                        },
                        clear: function(): void {
                            try {
                                originalStorage.clear();
                            } catch (e) {
                                // Reset the cached storage on error
                                if (storageType === StorageType.LocalStorage) {
                                    _verifiedLocalStorage = null;
                                } else {
                                    _verifiedSessionStorage = null;
                                }
                            }
                        },
                        key: function(index: number): string {
                            try {
                                return originalStorage.key(index);
                            } catch (e) {
                                // Reset the cached storage on error
                                if (storageType === StorageType.LocalStorage) {
                                    _verifiedLocalStorage = null;
                                } else {
                                    _verifiedSessionStorage = null;
                                }
                                return null;
                            }
                        },
                        get length(): number {
                            try {
                                return originalStorage.length;
                            } catch (e) {
                                // Reset the cached storage on error
                                if (storageType === StorageType.LocalStorage) {
                                    _verifiedLocalStorage = null;
                                } else {
                                    _verifiedSessionStorage = null;
                                }
                                return 0;
                            }
                        }
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
 * Helper function to safely wrap storage operations in try/catch
 * and reset cache if an operation fails
 * @param storageFn - Function that performs a storage operation
 * @param storageType - Type of storage being accessed
 * @param fallbackValue - Value to return if operation fails
 * @param logger - Optional logger for error reporting
 * @returns Result of the storage operation or the fallback value
 */
function _safeStorageOperation<T>(storageFn: () => T, storageType: StorageType, fallbackValue: T, logger?: IDiagnosticLogger, errorMessageId?: _eInternalMessageId, errorMessage?: string): T {
    try {
        return storageFn();
    } catch (e) {
        // If operation fails, invalidate the cache
        if (storageType === StorageType.LocalStorage) {
            _verifiedLocalStorage = null;
            
            // Log error if logger is provided
            if (logger && errorMessageId) {
                _throwInternal(
                    logger,
                    eLoggingSeverity.WARNING,
                    errorMessageId,
                    errorMessage + " " + getExceptionName(e),
                    { exception: dumpObj(e) }
                );
            }
        } else {
            _verifiedSessionStorage = null;
            
            // Log error if logger is provided
            if (logger && errorMessageId) {
                _throwInternal(
                    logger,
                    eLoggingSeverity.WARNING,
                    errorMessageId,
                    errorMessage + " " + getExceptionName(e),
                    { exception: dumpObj(e) }
                );
            }
        }
        return fallbackValue;
    }
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
    _verifiedLocalStorage = null;
    _verifiedSessionStorage = null;
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
    if (reset || !_verifiedLocalStorage) {
        _verifiedLocalStorage = createCachedValue(_getVerifiedStorageObject(StorageType.LocalStorage));
    }

    return !!(_verifiedLocalStorage && _verifiedLocalStorage.v);
}

export function utlGetLocalStorage(logger: IDiagnosticLogger, name: string): string {
    return _safeStorageOperation<string>(
        () => {
            const storage = _getLocalStorageObject();
            if (storage !== null) {
                return storage.getItem(name);
            }
            return null;
        }, 
        StorageType.LocalStorage,
        null,
        logger,
        _eInternalMessageId.BrowserCannotReadLocalStorage,
        "Browser failed read of local storage."
    );
}

export function utlSetLocalStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
    return _safeStorageOperation<boolean>(
        () => {
            const storage = _getLocalStorageObject();
            if (storage !== null) {
                storage.setItem(name, data);
                return true;
            }
            return false;
        },
        StorageType.LocalStorage,
        false,
        logger,
        _eInternalMessageId.BrowserCannotWriteLocalStorage,
        "Browser failed write to local storage."
    );
}

export function utlRemoveStorage(logger: IDiagnosticLogger, name: string): boolean {
    return _safeStorageOperation<boolean>(
        () => {
            const storage = _getLocalStorageObject();
            if (storage !== null) {
                storage.removeItem(name);
                return true;
            }
            return false;
        },
        StorageType.LocalStorage,
        false,
        logger,
        _eInternalMessageId.BrowserFailedRemovalFromLocalStorage,
        "Browser failed removal of local storage item."
    );
}

export function utlCanUseSessionStorage(reset?: boolean): boolean {
    if (reset || !_verifiedSessionStorage) {
        _verifiedSessionStorage = createCachedValue(_getVerifiedStorageObject(StorageType.SessionStorage));
    }

    return !!(_verifiedSessionStorage && _verifiedSessionStorage.v);
}

export function utlGetSessionStorageKeys(): string[] {
    return _safeStorageOperation<string[]>(
        () => {
            const keys: string[] = [];
            if (utlCanUseSessionStorage()) {
                objForEachKey(getGlobalInst<any>("sessionStorage"), (key) => {
                    keys.push(key);
                });
            }
            return keys;
        },
        StorageType.SessionStorage,
        []
    );
}

export function utlGetSessionStorage(logger: IDiagnosticLogger, name: string): string {
    return _safeStorageOperation<string>(
        () => {
            const storage = _getSessionStorageObject();
            if (storage !== null) {
                return storage.getItem(name);
            }
            return null;
        },
        StorageType.SessionStorage,
        null,
        logger,
        _eInternalMessageId.BrowserCannotReadSessionStorage,
        "Browser failed read of session storage."
    );
}

export function utlSetSessionStorage(logger: IDiagnosticLogger, name: string, data: string): boolean {
    return _safeStorageOperation<boolean>(
        () => {
            const storage = _getSessionStorageObject();
            if (storage !== null) {
                storage.setItem(name, data);
                return true;
            }
            return false;
        },
        StorageType.SessionStorage,
        false,
        logger,
        _eInternalMessageId.BrowserCannotWriteSessionStorage,
        "Browser failed write to session storage."
    );
}

export function utlRemoveSessionStorage(logger: IDiagnosticLogger, name: string): boolean {
    return _safeStorageOperation<boolean>(
        () => {
            const storage = _getSessionStorageObject();
            if (storage !== null) {
                storage.removeItem(name);
                return true;
            }
            return false;
        },
        StorageType.SessionStorage,
        false,
        logger,
        _eInternalMessageId.BrowserFailedRemovalFromSessionStorage,
        "Browser failed removal of session storage item."
    );
}
