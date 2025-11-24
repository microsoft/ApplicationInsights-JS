// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecord } from "../../interfaces/logs/IOTelLogRecord";
import { IOTelLogger } from "../../interfaces/logs/IOTelLogger";

export class NoopLogger implements IOTelLogger {
    emit(_logRecord: IOTelLogRecord): void {}
}

export const NOOP_LOGGER = new NoopLogger();
