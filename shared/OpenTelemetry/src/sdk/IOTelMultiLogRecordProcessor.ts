// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { IOTelLogRecordProcessor } from "../interfaces/logs/IOTelLogRecordProcessor";
import type { IOTelSdkLogRecord } from "../interfaces/logs/IOTelSdkLogRecord";
import { IPromise, createAllPromise, createRejectedPromise, createSyncPromise } from "@nevware21/ts-async";
import { IOTelErrorHandlers } from "../interfaces/config/IOTelErrorHandlers";
import { IOTelContext } from "../interfaces/context/IOTelContext";
import { callWithTimeout } from "../internal/commonUtils";

/**
 * Implementation of the {@link IOTelLogRecordProcessor} that forwards all events
 * to each configured processor.
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
        const processors = this.processors;
        if (processors.length === 0) {
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        const timeout = this.forceFlushTimeoutMillis;
        const operations: PromiseLike<void>[] = [];

        for (let idx = 0; idx < processors.length; idx++) {
            const processor = processors[idx];
            if (!processor) {
                continue;
            }

            let flushPromise: Promise<void>;
            try {
                flushPromise = Promise.resolve(processor.forceFlush());
            } catch (error) {
                return createRejectedPromise(error);
            }

            operations.push(callWithTimeout(this._errorHandlers, flushPromise, timeout));
        }

        if (operations.length === 0) {
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        return createAllPromise(operations).then(function (): void {
            return undefined;
        });
    }

    public onEmit(logRecord: IOTelSdkLogRecord, context?: IOTelContext): void {
        const processors = this.processors;
        for (let idx = 0; idx < processors.length; idx++) {
            const processor = processors[idx];
            if (processor) {
                processor.onEmit(logRecord, context);
            }
        }
    }

    public shutdown(): IPromise<void> {
        const processors = this.processors;
        if (processors.length === 0) {
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        const operations: PromiseLike<void>[] = [];

        for (let idx = 0; idx < processors.length; idx++) {
            const processor = processors[idx];
            if (!processor) {
                continue;
            }

            try {
                operations.push(Promise.resolve(processor.shutdown()));
            } catch (error) {
                return createRejectedPromise(error);
            }
        }

        if (operations.length === 0) {
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        return createAllPromise(operations).then(function (): void {
            return undefined;
        });
    }
}
