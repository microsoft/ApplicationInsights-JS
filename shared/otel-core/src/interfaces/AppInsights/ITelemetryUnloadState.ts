// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TelemetryUnloadReason } from "../../enums/AppInsights/TelemetryUnloadReason";

export interface ITelemetryUnloadState {
    reason: TelemetryUnloadReason;
    isAsync: boolean;
    flushComplete?: boolean;
}
