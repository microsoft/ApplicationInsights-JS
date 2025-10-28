/**
* The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
*/
export declare const enum SendRequestReason {
    /**
     * No specific reason was specified
     */
    Undefined = 0,
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
export declare const enum TransportType {
    /**
     * Use the default available api
     */
    NotSet = 0,
    /**
     * Use XMLHttpRequest or XMLDomainRequest if available
     */
    Xhr = 1,
    /**
     * Use the Fetch api if available
     */
    Fetch = 2,
    /**
     * Use sendBeacon api if available
     */
    Beacon = 3
}
