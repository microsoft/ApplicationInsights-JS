// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EnumCls, createEnum, createTypeMap } from "@nevware21/ts-utils";

export declare type EnumValue<E = any> = EnumCls<E>;

/**
 * Create an enum style object which has both the key \=\> value and value \=\> key mappings
 * @param values - The values to populate on the new object
 * @returns
 */
export const createEnumStyle: <E>(values: { [key in keyof E]: E[keyof E] }) => EnumValue<E> = createEnum;

/**
 * Create a 2 index map that maps an enum's key and value to the defined map value, X["key"] \=\> mapValue and X[0] \=\> mapValue.
 * Generic values
 * - E = the const enum type (typeof eRequestHeaders);
 * - V = Identifies the valid values for the keys, this should include both the enum numeric and string key of the type. The
 * resulting "Value" of each entry identifies the valid values withing the assignments.
 * @param values - The values to populate on the new object
 * @returns
 */
export const createValueMap: <E, V = E>(values: { [key in keyof E]: [ E[keyof E], V[keyof V] ] }) => V = createTypeMap;
