// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createSyncPromise } from "@nevware21/ts-async";
import { IOTelContext } from "../context/IOTelContext";
import { IOTelLogRecordProcessor } from "./IOTelLogRecordProcessor";
import { ReadableLogRecord } from "./IOTelReadableLogRecord";

export class NoopLogRecordProcessor implements IOTelLogRecordProcessor {
    forceFlush(): IPromise<void> {
        return createSyncPromise<void>(resolve => resolve());
    }

    onEmit(_logRecord: ReadableLogRecord, _context: IOTelContext): void {}

    shutdown(): IPromise<void> {
        return createSyncPromise<void>(resolve => resolve());
    }
}
