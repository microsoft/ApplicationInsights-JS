// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecord } from "./IOTelLogRecord";

/**
 * Interface for a Logger.
 */
export interface IOTelLogger {
    emit(logRecord: IOTelLogRecord): void;
}
