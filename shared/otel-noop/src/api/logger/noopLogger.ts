// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogger } from "@microsoft/otel-core-js";
import { _noopVoid } from "../noop/noopHelpers";

export function createNoopLogger(): IOTelLogger {
    return {
        emit: _noopVoid
    };
}

