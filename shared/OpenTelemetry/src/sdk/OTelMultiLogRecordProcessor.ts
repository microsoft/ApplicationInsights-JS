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
export function createMultiLogRecordProcessor(
    processors: IOTelLogRecordProcessor[],
    forceFlushTimeoutMillis: number,
    errorHandlers?: IOTelErrorHandlers
): IOTelLogRecordProcessor & {
    readonly processors: IOTelLogRecordProcessor[];
    readonly forceFlushTimeoutMillis: number;
} {
    const registeredProcessors = processors;
    const timeout = forceFlushTimeoutMillis;
    const handlers = errorHandlers || {};

    function forceFlush(): IPromise<void> {
        if (registeredProcessors.length === 0) {
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        const operations: PromiseLike<void>[] = [];

        for (let idx = 0; idx < registeredProcessors.length; idx++) {
            const processor = registeredProcessors[idx];
            if (!processor) {
                continue;
            }

            let flushPromise: Promise<void>;
            try {
                flushPromise = Promise.resolve(processor.forceFlush());
            } catch (error) {
                return createRejectedPromise(error);
            }

            operations.push(callWithTimeout(handlers, flushPromise, timeout));
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

    function onEmit(logRecord: IOTelSdkLogRecord, context?: IOTelContext): void {
        for (let idx = 0; idx < registeredProcessors.length; idx++) {
            const processor = registeredProcessors[idx];
            if (processor) {
                processor.onEmit(logRecord, context);
            }
        }
    }

    function shutdown(): IPromise<void> {
        if (registeredProcessors.length === 0) {
            return createSyncPromise(function (resolve) {
                resolve();
            });
        }

        const operations: PromiseLike<void>[] = [];

        for (let idx = 0; idx < registeredProcessors.length; idx++) {
            const processor = registeredProcessors[idx];
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

    return {
        get processors(): IOTelLogRecordProcessor[] {
            return registeredProcessors;
        },
        get forceFlushTimeoutMillis(): number {
            return timeout;
        },
        forceFlush,
        onEmit,
        shutdown
    };
}
