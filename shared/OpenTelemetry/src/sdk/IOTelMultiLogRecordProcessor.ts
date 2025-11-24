// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createPromise, doAwait } from "@nevware21/ts-async";
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

    public forceFlush(): IPromise<void> {
        const timeout = this.forceFlushTimeoutMillis;
        return createPromise((resolve, reject) => {
            const processors = this.processors;
            const length = processors.length;
            if (length === 0) {
                resolve();
                return;
            }

            let remaining = length;
            for (let idx = 0; idx < length; idx++) {
                const processor = processors[idx];
                doAwait(
                    callWithTimeout(this._errorHandlers, processor.forceFlush(), timeout),
                    () => {
                        remaining--;
                        if (remaining === 0) {
                            resolve();
                        }
                    },
                    reject
                );
            }
        });
    }

    public onEmit(logRecord: IOTelSdkLogRecord, context?: IOTelContext): void {
        this.processors.forEach(processors =>
            processors.onEmit(logRecord, context)
        );
    }

    public shutdown(): IPromise<void> {
        return createPromise((resolve, reject) => {
            const processors = this.processors;
            const length = processors.length;
            if (length === 0) {
                resolve();
                return;
            }

            let remaining = length;
            for (let idx = 0; idx < length; idx++) {
                const processor = processors[idx];
                doAwait(
                    processor.shutdown(),
                    () => {
                        remaining--;
                        if (remaining === 0) {
                            resolve();
                        }
                    },
                    reject
                );
            }
        });
    }
}
