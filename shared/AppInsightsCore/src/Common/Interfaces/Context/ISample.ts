// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryItem } from "../../../JavaScriptSDK.Interfaces/ITelemetryItem";

export interface ISample {
    /**
     * Sample rate
     */
    sampleRate: number;
    isSampledIn(envelope: ITelemetryItem): boolean;
}