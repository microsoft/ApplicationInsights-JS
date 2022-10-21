// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isArray, isPlainObject, objForEachKey, symbolFor, throwTypeError } from "@nevware21/ts-utils";
import { IDynamicConfigHandler } from "./IDynamicConfigHandler";

// Using Symbol.for so that if the same symbol was already created it would be returned
// To handle multiple instances using potentially different versions we are not using
// createUniqueNamespace()
export const CFG_HANDLER_LINK = symbolFor("[[ai_dynCfg_1]]");

export function _cfgDeepCopy<T>(source: T): T {

    if (source) {
        let target: any;

        if (isArray(source)) {
            target = [];
            target.length = source.length;
        } else if (isPlainObject(source)) {
            target = {} as T;
        }

        if (target) {
            // Copying index values by property name as the extensionConfig can be an array or object
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
