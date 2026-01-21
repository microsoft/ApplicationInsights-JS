// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecord, IOTelLogger } from "@microsoft/otel-core-js";

export function createNoopLogger(): IOTelLogger {
    return {
        emit(_logRecord: IOTelLogRecord): void {}
    };
}

