// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelBufferConfig } from "./IOTelBufferConfig";

/**
 * Interface configuration for a buffer.
 */
export interface IOTelBatchLogRecordProcessorBrowserConfig extends IOTelBufferConfig {
    /**
     * Disable auto flush on document hide event
     */
    disableAutoFlushOnDocumentHide?: boolean;
}
