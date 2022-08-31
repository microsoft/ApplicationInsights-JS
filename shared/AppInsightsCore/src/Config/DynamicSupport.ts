// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, isArray, objForEachKey, symbolFor, throwTypeError } from "@nevware21/ts-utils";
import { isPlainObject } from "../JavaScriptSDK/HelperFuncs";
import { IDynamicConfigHandler } from "./IDynamicConfigHandler";

// Using Symbol.for so that if the same symbol was already created it would be returned
// To handle multiple instances using potentially different versions we are not using
// createUniqueNamespace()
export const CFG_HANDLER_LINK = symbolFor("[[ai_dynCfg_1]]");

export function _cfgDeepCopy<T>(source: T): T {

    if (source) {
        if (isArray(source)) {
            let result: any[] = [];
            result.length = source.length;
            arrForEach(source, (value, idx) => {
                result[idx] = _cfgDeepCopy(value);
            });
    
            return <any>result;
        }
    
        if (isPlainObject(source)) {
            let target = {} as T;
            objForEachKey(source, (key, value) => {
                // Perform a deep copy of the object
                target[key] = _cfgDeepCopy(value);
            });

            return target;
        }
    }

    return source;
}

/**
 * @internal
 * Get the dynamic config handler if the value is already dynamic
 * @param value
 * @returns
 */
export function getDynamicConfigHandler<T>(value: T | IDynamicConfigHandler<T>): IDynamicConfigHandler<T> | null {
    if (value) {
        let handler: IDynamicConfigHandler<T> = value[CFG_HANDLER_LINK] || value;
        if (handler.cfg && (handler.cfg === value || handler.cfg[CFG_HANDLER_LINK] === handler)) {
            return handler;
        }
    }

    return null;
}

/**
 * Throws an invalid access exception
 * @param message - The message to include in the exception
 */
export function throwInvalidAccess(message: string): never {
    throwTypeError("InvalidAccess:" + message);
}
