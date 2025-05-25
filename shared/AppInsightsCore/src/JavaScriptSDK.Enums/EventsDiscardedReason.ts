// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "../JavaScriptSDK.Enums/EnumHelperFuncs";

/**
 * The eEventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
 */
export const enum eEventsDiscardedReason {
    /**
     * Unknown.
     */
     Unknown = 0,
     /**
      * Status set to non-retryable.
      */
     NonRetryableStatus = 1,
     /**
      * The event is invalid.
      */
     InvalidEvent = 2,
     /**
      * The size of the event is too large.
      */
     SizeLimitExceeded = 3,
     /**
      * The server is not accepting events from this instrumentation key.
      */
     KillSwitch = 4,
     /**
      * The event queue is full.
      */
     QueueFull = 5
 }

/**
 * The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
 */
export const EventsDiscardedReason = createEnumStyle<typeof eEventsDiscardedReason>({
    /**
     * Unknown.
     */
    Unknown: eEventsDiscardedReason.Unknown,

    /**
     * Status set to non-retryable.
     */
    NonRetryableStatus: eEventsDiscardedReason.NonRetryableStatus,

    /**
     * The event is invalid.
     */
    InvalidEvent: eEventsDiscardedReason.InvalidEvent,

    /**
     * The size of the event is too large.
     */
    SizeLimitExceeded: eEventsDiscardedReason.SizeLimitExceeded,

    /**
     * The server is not accepting events from this instrumentation key.
     */
    KillSwitch: eEventsDiscardedReason.KillSwitch,

    /**
     * The event queue is full.
     */
    QueueFull: eEventsDiscardedReason.QueueFull
});

export type EventsDiscardedReason = number | eEventsDiscardedReason;


/**
 * The eBatchDiscardedReason enumeration contains a set of values that specify the reason for discarding offline batches.
 */
export const enum eBatchDiscardedReason {
    /**
     * Unknown.
     */
     Unknown = 0,

     /**
      * Status set to non-retryable after sending
      */
     NonRetryableStatus = 1,
      
     /**
      * Batches with lower number of critical events are dropped to free up storage space
      */
     CleanStorage = 2,

     /**
      * The batches in storage exceed max allowed time
      */
     MaxInStorageTimeExceeded = 3
}

/**
 *  The eBatchDiscardedReason enumeration contains a set of values that specify the reason for discarding offline batches.
 */
export const BatchDiscardedReason = createEnumStyle<typeof eBatchDiscardedReason>({
    /**
     * Unknown.
     */
    Unknown: eBatchDiscardedReason.Unknown,

    /**
      * Status set to non-retryable after sending
      */
    NonRetryableStatus: eBatchDiscardedReason.NonRetryableStatus,
      
    /**
     * Batches with lower number of critical events are dropped to free up storage space
     */
    CleanStorage: eBatchDiscardedReason.CleanStorage,

    /**
     * The batches in storage exceed max allowed time
     */
    MaxInStorageTimeExceeded: eBatchDiscardedReason.MaxInStorageTimeExceeded
    
});

export type BatchDiscardedReason = number | eBatchDiscardedReason;
