// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { createEnum, createTypeMap } from "@nevware21/ts-utils";
/**
 * Create an enum style object which has both the key \=\> value and value \=\> key mappings
 * @param values - The values to populate on the new object
 * @returns
 */
export var createEnumStyle = createEnum;
/**
 * Create a 2 index map that maps an enum's key and value to the defined map value, X["key"] \=\> mapValue and X[0] \=\> mapValue.
 * Generic values
 * - E = the const enum type (typeof eRequestHeaders);
 * - V = Identifies the valid values for the keys, this should include both the enum numeric and string key of the type. The
 * resulting "Value" of each entry identifies the valid values withing the assignments.
 * @param values - The values to populate on the new object
 * @returns
 */
export var createValueMap = createTypeMap;
//# sourceMappingURL=EnumHelperFuncs.js.map