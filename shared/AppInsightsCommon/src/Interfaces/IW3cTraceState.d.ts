/**
* Represents a mutable [W3C trace state list](https://www.w3.org/TR/trace-context/#tracestate-header), this is a
* list of key/value pairs that are used to pass trace state information between different tracing systems. The
* list is ordered and the order is important as it determines the processing order.
*
* Importantly instances of this type are mutable, change made to an instance via {@link IW3cTraceState.set} or
* {@link IW3cTraceState.del} will be reflected on the instance and any child instances that use it as a parent.
* However, any parent instance associated with an instance will not be modified by operations on that particular
* instance.
*
* @since 3.4.0
*/
export interface IW3cTraceState {
    /**
     * Returns a readonly array of the current keys associated with the trace state, keys are returned in the
     * required processing order and if this instance has a parent the keys from the parent will be included
     * unless they have been removed (deleted) from the child instance.
     * Once created any modifications to the parent will also be reflected in the child, this is different from
     * the OpenTelemetry implementation which creates a new instance for each call.
     * @returns A readonly array of the current keys associated with the trace state
     */
    readonly keys: string[];
    /**
     * Check if the trace state list is empty, meaning it has no keys or values.
     * This exists to allow for quick checks without needing to create a new array of keys.
     * @since 3.4.0
     * @returns true if the trace state list is empty, false otherwise
     */
    readonly isEmpty: boolean;
    /**
     * Get the value for the specified key that is associated with this instance, either directly or from the parent.
     * @param key - The key to lookup
     * @returns The value for the key, or undefined if not found
     */
    get(key: string): string | undefined;
    /**
     * Set the value for the specified key for this instance, returning its new location within the list.
     * - 0 is the front of the list
     * - -1 not set because the key/value pair is invalid
     * If the key already exists it will be removed from its current location and added to the front of the list. And
     * if the key was in the parent this will override the value inherited from the parent, more importantly it will
     * not modify the parent value.
     * @param key - The key to set
     * @param value - The value to set
     * @returns 0 if successful, -1 if not
     */
    set(key: string, value: string): number;
    /**
     * Delete the specified key from this instance, if the key was in the parent it will be removed (hidden) from
     * this instance but will still be available directly from the parent.
     * @param key - The key to delete
     */
    del(key: string): void;
    /**
     * Format the trace state list into a strings where each string can be used as a header value.
     * This will return an empty array if the trace state list is empty.
     * @param maxHeaders - The maximum number of entries to include in the output, once the limit is reached no more entries will be included
     * @param maxKeys - The maximum number of keys to include in the output, once the limit is reached no more keys will be included
     * @param maxLen - The maximum length of each header value, once the limit is reached a new header value will be created
     * @returns An array of strings that can be used for the header values, if the trace state list is empty an empty array will be returned
     */
    hdrs(maxHeaders?: number, maxKeys?: number, maxLen?: number): string[];
    /**
     * Create a new instance of IW3cTraceState which is a child of this instance, meaning it will inherit the keys
     * and values from this instance but any changes made to the child will not affect this instance.
     * @returns A new instance of IW3cTraceState which is a child of this instance
     */
    child(): IW3cTraceState;
}
