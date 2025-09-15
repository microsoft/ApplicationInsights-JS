// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelBaggageEntryMetadata } from "./OTelBaggageEntryMetadata";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) BaggageEntry
 * type.
 */
export interface IOTelBaggageEntry {
    /**
     *  `String` value of the `BaggageEntry`.
     */
    value: string;

    /**
     * Metadata is an optional string property defined by the W3C baggage specification.
     * It currently has no special meaning defined by the specification.
     */
    metadata?: OTelBaggageEntryMetadata;
}
