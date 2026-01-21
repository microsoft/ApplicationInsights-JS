// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext, IOTelLogRecordProcessor, IOTelSdkLogRecord } from "@microsoft/otel-core-js";
import { IPromise, createSyncResolvedPromise } from "@nevware21/ts-async";

export function createNoopLogRecordProcessor(): IOTelLogRecordProcessor {

    return {
        forceFlush(): IPromise<void> {
            return createSyncResolvedPromise<void>(undefined);
        },

        onEmit(_logRecord: IOTelSdkLogRecord, _context?: IOTelContext): void {},

        shutdown(): IPromise<void> {
            return createSyncResolvedPromise<void>(undefined);
        }
    };
}
