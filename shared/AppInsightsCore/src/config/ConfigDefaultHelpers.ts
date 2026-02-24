// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { asString, isBoolean, isFunction, isNullOrUndefined, isString } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../constants/InternalConstants";
import { IConfiguration } from "../interfaces/ai/IConfiguration";
import { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "../interfaces/config/IConfigDefaults";

/**
 * @internal
 * @ignore
 * @param str
 * @param defaultValue
 * @returns
 */
function _stringToBoolOrDefault<T>(theValue: any, defaultValue: boolean, theConfig: T): boolean {
    if (!theValue && isNullOrUndefined(theValue)) {
        return defaultValue;
    }

    if (isBoolean(theValue)) {
        return theValue;
    }

    return asString(theValue).toLowerCase() === "true";
}

/**
 * Helper which returns an IConfigDefaultCheck instance with the field defined as an object
 * that should be merged
 * @param defaultValue - The default value to apply it not provided or it's not valid
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfMerge<V, T = IConfiguration, C = IConfiguration>(defaultValue: (V | undefined) | IConfigDefaults<V | undefined, T>): IConfigDefaultCheck<T, V | undefined, C> {
    return {
        mrg: true,
        v: defaultValue
    };
}

/**
 * Helper which returns an IConfigDefaultCheck instance with the provided field set function
 * @param setter - The IConfigCheckFn function to validate the user provided value
 * @param defaultValue - The default value to apply it not provided or it's not valid
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfSet<V, T, C = IConfiguration>(setter: IConfigSetFn<T, V>, defaultValue: V): IConfigDefaultCheck<T, V, C> {
    return {
        set: setter,
        v: defaultValue
    };
}

/**
 * Helper which returns an IConfigDefaultCheck instance with the provided field validator
 * @param validator - The IConfigCheckFn function to validate the user provided value
 * @param defaultValue - The default value to apply it not provided or it's not valid
 * @param fallBackName - The fallback configuration name if the current value is not available
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfValidate<V, T, C = IConfiguration>(validator: IConfigCheckFn<V>, defaultValue: V, fallBackName?: keyof T | keyof C | Array<keyof T | keyof C>): IConfigDefaultCheck<T, V, C> {
    return {
        fb: fallBackName,
        isVal: validator,
        v: defaultValue
    };
}


/**
 * Helper which returns an IConfigDefaultCheck instance that will validate and convert the user
 * provided value to a boolean from a string or boolean value
 * @param defaultValue - The default value to apply it not provided or it's not valid
 * @param fallBackName - The fallback configuration name if the current value is not available
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfBoolean<T, C = IConfiguration>(defaultValue?: boolean, fallBackName?: keyof T | keyof C | Array<keyof T | keyof C>): IConfigDefaultCheck<T, boolean, C> {
    return {
        fb: fallBackName,
        set: _stringToBoolOrDefault,
        v: !!defaultValue
    }
}

/**
 * Helper which returns an IConfigDefaultCheck instance that will validate that the user
 * provided value is a function.
 * @param defaultValue - The default value to apply it not provided or it's not valid
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfFunc<V, T, C = IConfiguration>(defaultValue?: V): IConfigDefaultCheck<T, V, C> {
    return {
        isVal: isFunction,
        v: defaultValue || null
    }
}

/**
 * Helper which returns an IConfigDefaultCheck instance that will validate that the user
 * provided value is a function.
 * @param defaultValue - The default string value to apply it not provided or it's not valid, defaults to an empty string
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfString<T, C = IConfiguration>(defaultValue?: string): IConfigDefaultCheck<T, string, C> {
    return {
        isVal: isString,
        v: asString(defaultValue || STR_EMPTY)
    }
}

/**
 * Helper which returns an IConfigDefaultCheck instance identifying that value associated with this property
 * should not have it's properties converted into a dynamic config properties.
 * @param defaultValue - The default value to apply it not provided or it's not valid
 * @returns a new IConfigDefaultCheck structure
 */
export function cfgDfBlockPropValue<V, T = IConfiguration, C = IConfiguration>(defaultValue: V | IConfigDefaults<V, T>): IConfigDefaultCheck<T, V, C> {
    return {
        blkVal: true,
        v: defaultValue
    };
}
