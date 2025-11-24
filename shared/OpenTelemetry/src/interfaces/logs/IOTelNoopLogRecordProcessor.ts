// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "../context/IOTelContext";
import { IOTelLogRecordProcessor } from "./IOTelLogRecordProcessor";
import { ReadableLogRecord } from "./IOTelReadableLogRecord";
import { IPromise, createSyncPromise } from "../../async/Promise";

export class NoopLogRecordProcessor implements IOTelLogRecordProcessor {
    forceFlush(): IPromise<void> {
        return createSyncPromise<void>();
    }

    onEmit(_logRecord: ReadableLogRecord, _context: IOTelContext): void {}

    shutdown(): IPromise<void> {
        return createSyncPromise<void>();
    }
}