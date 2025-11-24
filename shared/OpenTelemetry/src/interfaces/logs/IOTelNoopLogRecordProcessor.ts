// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "../context/IOTelContext";
import { IOTelLogRecordProcessor } from "./IOTelLogRecordProcessor";
import { ReadableLogRecord } from "./IOTelReadableLogRecord";

export class NoopLogRecordProcessor implements IOTelLogRecordProcessor {
    forceFlush(): Promise<void> {
        return Promise.resolve();
    }

    onEmit(_logRecord: ReadableLogRecord, _context: IOTelContext): void {}

    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}