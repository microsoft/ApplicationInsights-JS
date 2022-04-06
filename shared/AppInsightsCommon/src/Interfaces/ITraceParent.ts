// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * This interface represents the components of a W3C traceparent header
 */
export interface ITraceParent {
    /**
     * The version of the definition, this MUST be a string with a length of 2 and only contain lowercase
     * hexadecimal characters. A value of 'ff' is considered to be an invalid version.
     */
    version: string;

    /**
     * This is the ID of the whole trace forest and is used to uniquely identify a distributed trace
     * through a system. It is represented as a 32-character string of lowercase hexadecimal characters,
     * for example, 4bf92f3577b34da6a3ce929d0e0e4736.
     * All characters as zero (00000000000000000000000000000000) is considered an invalid value.
     */
    traceId: string;

    /**
     * This is the ID of the current request as known by the caller (in some tracing systems, this is also
     * known as the parent-id, where a span is the execution of a client request). It is represented as an
     * 16-character string of lowercase hexadecimal characters, for example, 00f067aa0ba902b7.
     * All bytes as zero (0000000000000000) is considered an invalid value.
     */
    spanId: string;

    /**
     * An 8-bit value of flags that controls tracing such as sampling, trace level, etc. These flags are
     * recommendations given by the caller rather than strict rules to follow.
     * As this is a bit field, you cannot interpret flags by decoding the hex value and looking at the resulting
     * number. For example, a flag 00000001 could be encoded as 01 in hex, or 09 in hex if present with the flag
     * 00001000. A common mistake in bit fields is forgetting to mask when interpreting flags.
     */
    traceFlags: number;
}
