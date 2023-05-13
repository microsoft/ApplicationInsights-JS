// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/**
* The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
*/
export const enum SendRequestReason {
    /**
     * No specific reason was specified
     */
    Undefined       = 0,

    /**
     * Events are being sent based on the normal event schedule / timer.
     */
    NormalSchedule = 1,

    /**
     * A manual flush request was received
     */
    ManualFlush = 1,

    /**
     * Unload event is being processed
     */
    Unload = 2,

    /**
     * The event(s) being sent are sync events
     */
    SyncEvent = 3,

    /**
     * The Channel was resumed
     */
    Resumed = 4,

    /**
     * The event(s) being sent as a retry
     */
    Retry = 5,

    /**
     * The SDK is unloading
     */
    SdkUnload = 6,
    
    /**
     * Maximum batch size would be exceeded
     */
    MaxBatchSize = 10,

    /**
     * The Maximum number of events have already been queued
     */
    MaxQueuedEvents = 20
}
