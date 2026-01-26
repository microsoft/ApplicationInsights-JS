// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Attribute values may be any non-nullish primitive value except an object.
 *
 * null or undefined attribute values are invalid and will result in undefined behavior.
 *
 * @since 3.4.0
 */
export type OTelAttributeValue =
    | string
    | number
    | boolean
    | Array<null | undefined | string>
    | Array<null | undefined | number>
    | Array<null | undefined | boolean>;

/**
 * Defines extended attribute values which may contain nested attributes.
 *
 * @since 3.4.0
 */
export type ExtendedOTelAttributeValue = OTelAttributeValue | IOTelAttributes;

/**
 * Attributes is a map from string to attribute values.
 *
 * Note: only the own enumerable keys are counted as valid attribute keys.
 *
 * @since 3.4.0
 */
export interface IOTelAttributes {
    [key: string]: OTelAttributeValue | undefined;
}
  
