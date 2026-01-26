// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelApi } from "./IOTelApi";
import { IOTelConfig } from "./config/IOTelConfig";
import { IOTelTracerProvider } from "./trace/IOTelTracerProvider";

export interface IOTelSdk extends IOTelTracerProvider {
    cfg: IOTelConfig;

    api: IOTelApi
}
