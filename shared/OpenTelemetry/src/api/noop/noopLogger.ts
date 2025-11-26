// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecord } from "../../interfaces/logs/IOTelLogRecord";
import { IOTelLogger } from "../../interfaces/logs/IOTelLogger";

export function createNoopLogger(): IOTelLogger {
    return {
        emit(_logRecord: IOTelLogRecord): void {}
    };
}

