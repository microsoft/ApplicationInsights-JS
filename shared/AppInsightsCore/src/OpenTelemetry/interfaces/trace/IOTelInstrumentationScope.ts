// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) InstrumentationScope
 * type.
 * An instrumentation scope consists of the name and optional version used to obtain a tracer or meter
 * from a provider. This metadata is made available on {@link IReadableSpan} and IMetricRecord
 * for use by the export pipeline.
 * @since 3.4.0
 */
export interface IOTelInstrumentationScope {
    /**
     * The name of the instrumentation scope.
     */
    readonly name: string;

    /**
     * The version of the instrumentation scope.
     */
    readonly version?: string;

    /**
     * The schema URL for the instrumentation scope.
     */
    readonly schemaUrl?: string;
}
