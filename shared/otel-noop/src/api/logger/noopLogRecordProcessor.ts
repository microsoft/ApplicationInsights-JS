// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecordProcessor } from "@microsoft/otel-core-js";
import { _noopResolvedPromise, _noopVoid } from "../noop/noopHelpers";

export function createNoopLogRecordProcessor(): IOTelLogRecordProcessor {

    return {
        forceFlush: _noopResolvedPromise<void>(undefined),

        onEmit: _noopVoid,

        shutdown: _noopResolvedPromise<void>(undefined)
    };
}
