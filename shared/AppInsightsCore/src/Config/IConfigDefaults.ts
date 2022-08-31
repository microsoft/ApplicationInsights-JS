// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";

/**
 * The type to identify whether the default value should be applied in preference to the provided value.
 */
export type IConfigCheckFn<V> = (value: V) => boolean;

/**
 * The type which identifies the function use to validate the user supplied value
 */
export type IConfigSetFn<T, V> = (value: any, defValue: V, theConfig: T) => V;

/**
 * The default values with a check function
 */
export interface IConfigDefaultCheck<T, V, C extends IConfiguration = IConfiguration> {
    /**
     * Callback function to check if the user-supplied value is valid, if not the default will be applied
     */
    isVal?: IConfigCheckFn<V>;

    /**
     * Optional function to allow converting and setting of the default value
     */
    set?: IConfigSetFn<T, V>;

    /**
     * The default value to apply if the user-supplied value is not valid
     */
    v?: V;

    /**
     *  The default fallback key if the main key is not present, this is the key value from the config
     */
    fb?: keyof T | keyof C | Array<keyof T | keyof C>;

    /**
     * Use this check to determine the default fallback, default only checked whether the property isDefined,
     * therefore `null`; `""` are considered to be valid values.
     */
    dfVal?: (value: any) => boolean;
}
 
/**
 * The Type definition to define default values to be applied to the config
 * The value may be either the direct value or a ConfigDefaultCheck definition
 */
export type IConfigDefaults<T, C extends IConfiguration = IConfiguration> = {
    [key in keyof T]: T[key] | IConfigDefaultCheck<T, T[key], C>
};
