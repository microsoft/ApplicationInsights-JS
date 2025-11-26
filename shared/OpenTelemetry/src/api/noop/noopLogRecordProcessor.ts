// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createSyncPromise } from "@nevware21/ts-async";
import { IOTelContext } from "../../interfaces/context/IOTelContext";
import { IOTelLogRecordProcessor } from "../../interfaces/logs/IOTelLogRecordProcessor";
import { ReadableLogRecord } from "../../interfaces/logs/IOTelReadableLogRecord";

export function createNoopLogRecordProcessor(): IOTelLogRecordProcessor {
    return {
        forceFlush(): IPromise<void> {
            return createSyncPromise<void>(resolve => resolve());
        },

        onEmit(_logRecord: ReadableLogRecord, _context: IOTelContext): void {},

        shutdown(): IPromise<void> {
            return createSyncPromise<void>(resolve => resolve());
        }
    };
}
