// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Interface configuration for a buffer.
 */
export interface IOTelBufferConfig {
    /**
     * Maximum time the export service will wait for each batch export (milliseconds)
     */
    exportTimeoutMillis?: number;

    /**
     * maxExportBatchSize is the maximum number of log records to export in a single batch
     */
    maxExportBatchSize?: number;

    /**
     * maxQueueSize is the maximum queue size to buffer log records for delayed processing
     */
    maxQueueSize?: number;

    /**
     * scheduledDelayMillis is the delay interval in milliseconds between two consecutive exports
     */
    scheduledDelayMillis?: number;
}
