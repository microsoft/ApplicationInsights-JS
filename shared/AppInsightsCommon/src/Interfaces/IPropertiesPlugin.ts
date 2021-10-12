// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryContext } from "./ITelemetryContext";

export interface IPropertiesPlugin {
    readonly context: ITelemetryContext;
}