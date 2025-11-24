// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { IOTelLogRecordProcessor } from "../interfaces/logs/IOTelLogRecordProcessor";
import type { IOTelSdkLogRecord } from "../interfaces/logs/IOTelSdkLogRecord";
import { IOTelErrorHandlers } from "../interfaces/config/IOTelErrorHandlers";
import { IOTelContext } from "../interfaces/context/IOTelContext";
import { callWithTimeout } from "../internal/commonUtils";

/**
 * Implementation of the {@link IOTelLogRecordProcessor} that simply forwards all
 * received events to a list of {@link IOTelLogRecordProcessor}s.
 */
export class MultiLogRecordProcessor implements IOTelLogRecordProcessor {
    private readonly _errorHandlers: IOTelErrorHandlers;

    constructor(
        public readonly processors: IOTelLogRecordProcessor[],
        public readonly forceFlushTimeoutMillis: number,
        errorHandlers?: IOTelErrorHandlers
    ) {
        this._errorHandlers = errorHandlers || {};
    }

    public async forceFlush(): Promise<void> {
        const timeout = this.forceFlushTimeoutMillis;
        await Promise.all(
            this.processors.map(processor =>
                callWithTimeout(this._errorHandlers, processor.forceFlush(), timeout)
            )
        );
    }

    public onEmit(logRecord: IOTelSdkLogRecord, context?: IOTelContext): void {
        this.processors.forEach(processors =>
            processors.onEmit(logRecord, context)
        );
    }

    public async shutdown(): Promise<void> {
        await Promise.all(this.processors.map(processor => processor.shutdown()));
    }
}
