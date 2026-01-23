// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "../context/IOTelContext";
import { IOTelSdkLogRecord } from "./IOTelSdkLogRecord";

/**
 * Interface for a LogRecord Processor.
 */
export interface IOTelLogRecordProcessor {
    /**
     * Forces to export all finished log records
     */
    forceFlush(): Promise<void>;

    /**
     * Called when a {@link LogRecord} is emitted
     * @param logRecord the ReadWriteLogRecord that just emitted.
     * @param context the current Context, or an empty Context if the Logger was obtained with include_trace_context=false
     */
    onEmit(logRecord: IOTelSdkLogRecord, context?: IOTelContext): void;

    /**
     * Shuts down the processor. Called when SDK is shut down. This is an
     * opportunity for processor to do any cleanup required.
     */
    shutdown(): Promise<void>;
}
