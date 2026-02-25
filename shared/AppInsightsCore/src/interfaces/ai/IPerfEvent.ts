// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * This interface identifies the details of an internal performance event - it does not represent an outgoing reported event
 */
export interface IPerfEvent {
    /**
     * The name of the performance event
     */
    name: string;

    /**
     * The start time of the performance event
     */
    start: number;

    /**
     * The payload (contents) of the perfEvent, may be null or only set after the event has completed depending on
     * the runtime environment.
     */
    payload: any;

    /**
     * Is this occurring from an asynchronous event
     */
    isAsync: boolean;
    
    /**
     * Identifies the total inclusive time spent for this event, including the time spent for child events,
     * this will be undefined until the event is completed
     */
    time?: number;

    /**
     * Identifies the exclusive time spent in for this event (not including child events),
     * this will be undefined until the event is completed.
     */
    exTime?: number;
    /**
     * The Parent event that was started before this event was created
     */
    parent?: IPerfEvent;

    /**
     * The child perf events that are contained within the total time of this event.
     */
    childEvts?: IPerfEvent[];

    /**
     * Identifies whether this event is a child event of a parent
     */
    isChildEvt: () => boolean;

    /**
     * Get the names additional context associated with this perf event
     */
    getCtx?: (key: string) => any;

    /**
     * Set the named additional context to be associated with this perf event, this will replace any existing value
     */
    setCtx?: (key: string, value: any) => void;

    /**
     * Mark this event as completed, calculating the total execution time.
     */
    complete: () => void;
}