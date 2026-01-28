// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) TraceState type.
 *
 * The TraceState is a list of key/value pairs that are used to propagate
 * vendor-specific trace information across different distributed tracing systems.
 * The TraceState is used to store the state of a trace across different
 * distributed tracing systems, and it is used to ensure that the trace information
 * is consistent across different systems.
 *
 * Instances of TraceState are immutable, and the methods on this interface
 * return a new instance of TraceState with the updated values.
 */
export interface IOTelTraceState {
    /**
     * Create a new TraceState which inherits from this TraceState and has the
     * given key set.
     * The new entry will always be added in the front of the list of states.
     *
     * @param key - key of the TraceState entry.
     * @param value - value of the TraceState entry.
     */
    set(key: string, value: string): IOTelTraceState;
  
    /**
     * Return a new TraceState which inherits from this TraceState but does not
     * contain the given key.
     *
     * @param key - the key for the TraceState entry to be removed.
     */
    unset(key: string): IOTelTraceState;
  
    /**
     * Returns the value to which the specified key is mapped, or `undefined` if
     * this map contains no mapping for the key.
     *
     * @param key - with which the specified value is to be associated.
     * @returns the value to which the specified key is mapped, or `undefined` if
     *     this map contains no mapping for the key.
     */
    get(key: string): string | undefined;
  
    /**
     * Serializes the TraceState to a `list` as defined below. The `list` is a series of `list-members`
     * separated by commas `,`, and a list-member is a key/value pair separated by an equals sign `=`.
     * Spaces and horizontal tabs surrounding `list-members` are ignored. There can be a maximum of 32
     * `list-members` in a `list`.
     *
     * If the resulting serialization is limited to no longer than 512 bytes, if the combination of
     * keys and values exceeds this limit, the serialization will be truncated to the last key/value pair
     * that fits within the limit. The serialization will be returned as a string.
     *
     * This is different from the {@link IW3cTraceState} serialization which returns an array of strings where each
     * string is limited to 512 bytes and the array is limited to 32 strings. Thus the OpenTelemetry serialization
     * will only return the first single string that fits within the limie.
     *
     * @returns the serialized string.
     */
    serialize(): string;
}