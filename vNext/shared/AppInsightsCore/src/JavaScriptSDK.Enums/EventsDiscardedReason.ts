// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/**
 * The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
 */
export const EventsDiscardedReason = {
    /**
     * Unknown.
     */
    Unknown: 0,
    /**
     * Status set to non-retryable.
     */
    NonRetryableStatus: 1,
    /**
     * The event is invalid.
     */
    InvalidEvent: 2,
    /**
     * The size of the event is too large.
     */
    SizeLimitExceeded: 3,
    /**
     * The server is not accepting events from this instrumentation key.
     */
    KillSwitch: 4,
    /**
     * The event queue is full.
     */
    QueueFull: 5,
};
