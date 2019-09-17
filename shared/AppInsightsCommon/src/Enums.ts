// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Type of storage to differentiate between local storage and session storage
 */
export enum StorageType {
    LocalStorage,
    SessionStorage
}

/**
 * Enum is used in aiDataContract to describe how fields are serialized. 
 * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
 */
export enum FieldType { Default = 0, Required = 1, Array = 2, Hidden = 4 };

export enum DistributedTracingModes {
    /**
     * (Default) Send Application Insights correlation headers
     */

    AI=0,

    /**
     * Send both W3C Trace Context headers and back-compatibility Application Insights headers
     */
    AI_AND_W3C,

    /**
     * Send W3C Trace Context headers
     */
    W3C
}
