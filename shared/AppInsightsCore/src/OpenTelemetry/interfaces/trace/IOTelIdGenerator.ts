// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) IdGenerator type.
 * Used to generate Trace Id and Span Ids
 * @since 3.4.0
 */
export interface IOTelIdGenerator {
    /**
     * Returns a trace ID composed of 32 lowercase hex characters.
     */
    generateTraceId(): string;

    /**
     * Returns a span ID composed of 16 lowercase hex characters.
     */
    generateSpanId(): string;
}