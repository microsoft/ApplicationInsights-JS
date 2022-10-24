// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "@microsoft/applicationinsights-core-js";

/**
 * Type of storage to differentiate between local storage and session storage
 */
export const enum eStorageType {
    LocalStorage,
    SessionStorage
}

export const StorageType = createEnumStyle<typeof eStorageType>({
    LocalStorage: eStorageType.LocalStorage,
    SessionStorage: eStorageType.SessionStorage
});
export type StorageType = eStorageType | typeof StorageType;

/**
 * Enum is used in aiDataContract to describe how fields are serialized.
 * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
 */
export const enum FieldType { Default = 0, Required = 1, Array = 2, Hidden = 4 }

export const enum eDistributedTracingModes {
    /**
     * (Default) Send Application Insights correlation headers
     */

    AI = 0,

    /**
     * Send both W3C Trace Context headers and back-compatibility Application Insights headers
     */
    AI_AND_W3C,

    /**
     * Send W3C Trace Context headers
     */
    W3C
}

export const DistributedTracingModes = createEnumStyle<typeof eDistributedTracingModes>({
    AI: eDistributedTracingModes.AI,
    AI_AND_W3C: eDistributedTracingModes.AI_AND_W3C,
    W3C: eDistributedTracingModes.W3C
});
export type DistributedTracingModes = number | eDistributedTracingModes;

export const enum IThrottleMsgKey {
    default = 0,
    ikeyDeprecate = 1,
    cdnDeprecate = 2
}
