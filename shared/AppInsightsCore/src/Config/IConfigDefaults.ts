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
export interface IConfigDefaultCheck<T, V, C = IConfiguration> {
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
    v?: V | IConfigDefaults<V, T>;

    /**
     *  The default fallback key if the main key is not present, this is the key value from the config
     */
    fb?: keyof T | keyof C | Array<keyof T | keyof C>;

    /**
     * Use this check to determine the default fallback, default only checked whether the property isDefined,
     * therefore `null`; `""` are considered to be valid values.
     */
    dfVal?: (value: any) => boolean;

    /**
     * Specify that any provided value should have the default value(s) merged into the value rather than
     * just using either the default of user provided values. Mergeed objects will automatically be marked
     * as referenced.
     */
    mrg?: boolean;

    /**
     * Set this field of the target as referenced, which will cause any object or array instance
     * to be updated in-place rather than being entirely replaced. All other values will continue to be replaced.
     * This is required for nested default objects to avoid multiple repetitive updates to listeners
     * @returns The referenced properties current value
     */
    ref?: boolean;

    /**
     * Set this field of the target as read-only, which will block this single named property from
     * ever being changed for the target instance.
     * This does NOT freeze or seal the instance, it just stops the direct re-assignment of the named property,
     * if the value is a non-primitive (ie. an object or array) it's properties will still be mutable.
     * @returns The referenced properties current value
     */
    rdOnly?: boolean;

    /**
     * Block the value associated with this property from having it's properties / values converted into
     * dynamic properties, this is generally used to block objects or arrays provided by external libraries
     * which may be a plain object with readonly (non-configurable) or const properties.
     */
    blkVal?: boolean;
}
 
/**
 * The Type definition to define default values to be applied to the config
 * The value may be either the direct value or a ConfigDefaultCheck definition
 */
export type IConfigDefaults<T, C = IConfiguration> = {
    [key in keyof T]: T[key] | IConfigDefaultCheck<T, T[key], C>
};
