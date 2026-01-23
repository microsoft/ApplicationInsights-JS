// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isArray, isPlainObject, objForEachKey, symbolFor, throwTypeError } from "@nevware21/ts-utils";
import { IConfiguration } from "../interfaces/ai/IConfiguration";
import { IDynamicConfigHandler } from "../interfaces/config/IDynamicConfigHandler";
import { _IDynamicConfigHandlerState } from "../interfaces/config/_IDynamicConfigHandlerState";

// Using Symbol.for so that if the same symbol was already created it would be returned
// To handle multiple instances using potentially different versions we are not using
// createUniqueNamespace()
export const CFG_HANDLER_LINK = symbolFor("[[ai_dynCfg_1]]");

/**
 * @internal
 * @ignore
 * The symbol to tag objects / arrays with if they should not be converted
 */
const BLOCK_DYNAMIC = symbolFor("[[ai_blkDynCfg_1]]");

/**
 * @internal
 * @ignore
 * The symbol to tag objects to indicate that when included into the configuration that
 * they should be converted into a trackable dynamic object.
 */
const FORCE_DYNAMIC = symbolFor("[[ai_frcDynCfg_1]]");

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
 * @returns
 */
export function getDynamicConfigHandler<T = IConfiguration, V = IConfiguration>(value: V | IDynamicConfigHandler<T>): IDynamicConfigHandler<T> | null {
    if (value) {
        let handler: IDynamicConfigHandler<T> = value[CFG_HANDLER_LINK] || value;
        if (handler.cfg && (handler.cfg === (value as any) || handler.cfg[CFG_HANDLER_LINK] === handler)) {
            return handler;
        }
    }

    return null;
}

/**
 * Mark the provided value so that if it's included into the configuration it will NOT have
 * its properties converted into a dynamic (reactive) object. If the object is not a plain object
 * or an array (ie. a class) this function has not affect as only Objects and Arrays are converted
 * into dynamic objects in the dynamic configuration.
 *
 * When you have tagged a value as both {@link forceDynamicConversion} and blocked force will take precedence.
 *
 * You should only need to use this function, if you are creating dynamic "classes" from objects
 * which confirm to the require interface. A common case for this is during unit testing where it's
 * easier to create mock extensions.
 *
 * If `value` is falsy (null / undefined / 0 / empty string etc) it will not be tagged and
 * if there is an exception adding the property to the value (because its frozen etc) the
 * exception will be swallowed
 *
 * @example
 * ```ts
 * // This is a valid "extension", but it is technically an object
 * // So when included in the config.extensions it WILL be cloned and then
 * // converted into a dynamic object, where all of its properties will become
 * // get/set object properties and will be tracked. While this WILL still
 * // function, when attempt to use a mocking framework on top of this the
 * // functions are now technically get accessors which return a function
 * // and this can cause some mocking frameworks to fail.
 * let mockChannel = {
 *      pause: () => { },
*      resume: () => { },
*      teardown: () => { },
*      flush: (async: any, callBack: any) => { },
*      processTelemetry: (env: any) => { },
*      setNextPlugin: (next: any) => { },
*      initialize: (config: any, core: any, extensions: any) => { },
*      identifier: "testChannel",
*      priority: 1003
* };
 * ```
 * @param value - The object that you want to block from being converted into a
 * trackable dynamic object
 * @returns The original value
 */
export function blockDynamicConversion<T>(value: T): T {
    if (value && (isPlainObject(value) || isArray(value))) {
        try {
            value[BLOCK_DYNAMIC] = true;
        } catch(e) {
            // Don't throw for this case as it's an ask only
        }
    }

    return value;
}

/**
 * This is the reverse case of {@link blockDynamicConversion} in that this will tag an
 * object to indicate that it should always be converted into a dynamic trackable object
 * even when not an object or array. So all properties of this object will become
 * get / set accessor functions.
 *
 * When you have tagged a value as both {@link forceDynamicConversion} and blocked force will take precedence.
 *
 * If `value` is falsy (null / undefined / 0 / empty string etc) it will not be tagged and
 * if there is an exception adding the property to the value (because its frozen etc) the
 * exception will be swallowed.
 * @param value - The object that should be tagged and converted if included into a dynamic
 * configuration.
 * @returns The original value
 */
export function forceDynamicConversion<T>(value: T): T {
    if (value) {
        try {
            value[FORCE_DYNAMIC] = true;
        } catch(e) {
            // Don't throw for this case as it's an ask only
        }
    }

    return value;
}

/**
 * @internal
 * @ignore
 * Helper function to check whether an object can or should be converted into a dynamic
 * object.
 * @param value - The object to check whether it should be converted
 * @returns `true` if the value should be converted otherwise `false`.
 */
export function _canMakeDynamic<T>(getFunc: () => any, state: _IDynamicConfigHandlerState<T>, value: any) {
    let result = false;

    // Object must exist and be truthy
    if (value && !getFunc[state.blkVal]) {
        // Tagged as always convert
        result = value[FORCE_DYNAMIC];

        // Check that it's not explicitly tagged as blocked
        if (!result && !value[BLOCK_DYNAMIC]) {
            // Only convert plain objects or arrays by default
            result = isPlainObject(value) || isArray(value);
        }
    }

    return result;
}


/**
 * Throws an invalid access exception
 * @param message - The message to include in the exception
 */
export function throwInvalidAccess(message: string): never {
    throwTypeError("InvalidAccess:" + message);
}
