// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { deepFreeze, objForEachKey } from "../JavaScriptSDK/HelperFuncs";

export declare type EnumValue<E = any> = { readonly [key in keyof E]: E[key] };
export declare type EnumMap<E = any, I = E> = { readonly [key in keyof E extends string ? keyof E : never]: key extends string ? key : keyof E } & I;

/**
 * Create an enum style object which has both the key => value and value => key mappings
 * @param values - The values to populate on the new object
 * @returns
 */
export function createEnumStyle<E>(values: { [key in keyof E]: E[keyof E] }): EnumValue<E> {
    let enumClass: any = {};
    objForEachKey(values, (field, value) => {
        enumClass[field] = value;
        enumClass[value] = field;
    });

    return deepFreeze(enumClass);
}

/**
 * Create a 2 index map that maps an enum's key as both the key and value, X["key"] => "key" and X[0] => "keyof 0".
 * @param values - The values to populate on the new object
 * @returns
 */
export function createEnumMap<E, I = keyof E>(values: { [key in keyof E]: E[keyof E] }): EnumMap<E, I> {
    let mapClass: any = {};
    objForEachKey(values, (field, value) => {
        mapClass[field] = field;
        mapClass[value] = field;
    });

    return deepFreeze(mapClass);
}

/**
 * Create a 2 index map that maps an enum's key and value to the defined map value, X["key"] => mapValue and X[0] => mapValue.
 * Generic values
 * - E = the const enum type (typeof eRequestHeaders);
 * - V = Identifies the valid values for the keys, this should include both the enum numeric and string key of the type. The
 * resulting "Value" of each entry identifies the valid values withing the assignments.
 * @param values - The values to populate on the new object
 * @returns
 */
export function createValueMap<E, V = E>(values: { [key in keyof E]: [ E[keyof E], V[keyof V] ] }): V {
    let mapClass: any = {};
    objForEachKey(values, (field, value) => {
        mapClass[field] = value[1];
        mapClass[value[0]] = value[1];
    });

    return deepFreeze(mapClass);
}
