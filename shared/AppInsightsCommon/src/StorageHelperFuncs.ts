// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dumpObj, getExceptionName, getGlobal, getGlobalInst, IDiagnosticLogger, isNullOrUndefined, LoggingSeverity, objForEachKey, _InternalMessageId } from "@microsoft/applicationinsights-core-js";
import { StorageType } from "./Enums";

let _canUseLocalStorage: boolean = undefined;
let _canUseSessionStorage: boolean = undefined;

/**
 * Gets the localStorage object if available
 * @return {Storage} - Returns the storage object if available else returns null
 */
function _getLocalStorageObject(): Storage {
    if (utlCanUseLocalStorage()) {
        return _getVerifiedStorageObject(StorageType.LocalStorage);
    }

    return null;
}

/**
 * Tests storage object (localStorage or sessionStorage) to verify that it is usable
 * More details here: https://mathiasbynens.be/notes/localstorage-pattern
 * @param storageType Type of storage
 * @return {Storage} Returns storage object verified that it is usable
 */
function _getVerifiedStorageObject(storageType: StorageType): Storage {
    try {
        if (isNullOrUndefined(getGlobal())) {
            return null;
        }
        let uid = new Date;
        let storage: Storage = getGlobalInst(storageType === StorageType.LocalStorage ? "localStorage" : "sessionStorage");
        storage.setItem(uid.toString(), uid.toString());
        let fail = storage.getItem(uid.toString()) !== uid.toString();
        storage.removeItem(uid.toString());
        if (!fail) {
            return storage;
        }
    } catch (exception) {
        // eslint-disable-next-line no-empty
    }

    return null;
}

/**
 * Gets the sessionStorage object if available
 * @return {Storage} - Returns the storage object if available else returns null
 */
function _getSessionStorageObject(): Storage {
    if (utlCanUseSessionStorage()) {
        return _getVerifiedStorageObject(StorageType.SessionStorage);
    }

    return null;
}

export function utlDisableStorage() {
    _canUseLocalStorage = false;
    _canUseSessionStorage = false;
}

export function utlCanUseLocalStorage(): boolean {
    if (_canUseLocalStorage === undefined) {
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

            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.BrowserCannotReadLocalStorage,
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

            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.BrowserCannotWriteLocalStorage,
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

            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.BrowserFailedRemovalFromLocalStorage,
                "Browser failed removal of local storage item. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return false;
}

export function utlCanUseSessionStorage(): boolean {
    if (_canUseSessionStorage === undefined) {
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

            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.BrowserCannotReadSessionStorage,
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

            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.BrowserCannotWriteSessionStorage,
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

            logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.BrowserFailedRemovalFromSessionStorage,
                "Browser failed removal of session storage item. " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }
    return false;
}