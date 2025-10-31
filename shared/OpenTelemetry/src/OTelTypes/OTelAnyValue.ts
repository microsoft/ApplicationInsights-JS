// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * AnyValue can be one of the following:
 * - a scalar value
 * - a byte array
 * - array of any value
 * - map from string to any value
 * - empty value
 */
export type OTelAnyValue =
  | OTelAnyValueScalar
  | Uint8Array
  | OTelAnyValueArray
  | OTelAnyValueMap
  | null
  | undefined;

export type OTelAnyValueScalar = string | boolean | number;

export type OTelAnyValueArray = Array<OTelAnyValue>;

/**
 * Map from string to OTelAnyValue
 */
export interface OTelAnyValueMap {
    [attributeKey: string]: OTelAnyValue;
}