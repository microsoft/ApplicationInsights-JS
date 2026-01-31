// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "../EnumHelperFuncs";

/**
 * Type of storage to differentiate between local storage and session storage
 */
export const enum eStorageType {
    LocalStorage,
    SessionStorage
}

export const StorageType = (/* @__PURE__ */ createEnumStyle<typeof eStorageType>({
    LocalStorage: eStorageType.LocalStorage,
    SessionStorage: eStorageType.SessionStorage
}));
export type StorageType = eStorageType | typeof StorageType;

/**
 * Enum is used in aiDataContract to describe how fields are serialized.
 * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
 */
export const enum FieldType { Default = 0, Required = 1, Array = 2, Hidden = 4 }

export const enum eDistributedTracingModes {
    /**
     * Send only the legacy Application Insights correlation headers
     *
     * Headers Sent:
     * - `Request-Id` (Legacy Application Insights header for older Server side SDKs)
     *
     * Config Decimal Value: `0` (Zero)
     */
    AI = 0x00,

    /**
     * (Default) Send both W3C Trace parent header and back-compatibility Application Insights headers
     * - `Request-Id`
     * - [`traceparent`](https://www.w3.org/TR/trace-context/#traceparent-header)
     *
     * Config Decimal Value: `1` (One)
     */
    AI_AND_W3C = 0x01,

    /**
     * Send Only the W3C Trace parent header
     *
     * Headers Sent:
     * - [`traceparent`](https://www.w3.org/TR/trace-context/#traceparent-header)
     *
     * Config Decimal Value: `2` (Two)
     */
    W3C = 0x02,

    /**
     * @internal
     * Bitwise mask used to separate the base distributed tracing mode from the additional optional
     * tracing modes.
     * @since 3.4.0
     */
    _BaseMask = 0x0F, // Mask to get the base distributed tracing mode

    /**
     * @internal
     * Enabling this bit will send the W3C Trace State header, it is not intended to be used directly
     * or on its own. The code may assume that if this bit is set, then the W3C Trace Context headers
     * will also be included.
     *
     * Config Decimal Value: `16` (Sixteen in decimal)
     * @since 3.4.0
     */
    _W3CTraceState = 0x10, // Bit mask to enable sending the W3C Trace State headers

    /**
     * Send all of the W3C Trace Context headers and the W3C Trace State headers and back-compatibility
     * Application Insights headers.
     *
     * Currently sent headers:
     * - `Request-Id` (Legacy Application Insights header for older Server side SDKs)
     * - [`traceparent`](https://www.w3.org/TR/trace-context/#traceparent-header)
     * - [`tracestate`](https://www.w3.org/TR/trace-context/#tracestate-header)
     *
     * NOTE!: Additional headers may be added as part of a future update should the W3C Trace Context specification be updated
     * to include additional headers.
     *
     * Config Decimal Value: `17` (Seventeen in decimal)
     * @since 3.4.0
     */
    AI_AND_W3C_TRACE = AI_AND_W3C | _W3CTraceState,

    /**
     * Send all of the W3C Trace Context headers and the W3C Trace State headers.
     *
     * Currently sent headers:
     * - [`traceparent`](https://www.w3.org/TR/trace-context/#traceparent-header)
     * - [`tracestate`](https://www.w3.org/TR/trace-context/#tracestate-header)
     *
     * NOTE!: Additional headers may be added as part of a future update should the W3C Trace Context specification be updated
     * to include additional headers.
     *
     * Config Decimal Value: `18` (Eighteen in decimal)
     * @since 3.4.0
     */
    W3C_TRACE = W3C | _W3CTraceState
}

export const DistributedTracingModes = (/* @__PURE__ */ createEnumStyle<typeof eDistributedTracingModes>({
    AI: eDistributedTracingModes.AI,
    AI_AND_W3C: eDistributedTracingModes.AI_AND_W3C,
    W3C: eDistributedTracingModes.W3C,
    AI_AND_W3C_TRACE: eDistributedTracingModes.AI_AND_W3C_TRACE,
    W3C_TRACE: eDistributedTracingModes.W3C_TRACE,

    // Internal mask values
    _BaseMask: eDistributedTracingModes._BaseMask,
    _W3CTraceState: eDistributedTracingModes._W3CTraceState
}));
export type DistributedTracingModes = number | eDistributedTracingModes;

/**
 * The EventPersistence contains a set of values that specify the event's persistence.
 */
export const enum EventPersistenceValue {
    /**
     * Normal persistence.
     */
    Normal = 1,
    /**
     * Critical persistence.
     */
    Critical = 2
}

/**
 * The EventPersistence contains a set of values that specify the event's persistence.
 */
export const EventPersistence = (/* @__PURE__ */ createEnumStyle<typeof EventPersistenceValue>({
    /**
     * Normal persistence.
     */
    Normal: EventPersistenceValue.Normal,

    /**
     * Critical persistence.
     */
    Critical: EventPersistenceValue.Critical
}));
export type EventPersistence = number | EventPersistenceValue;
