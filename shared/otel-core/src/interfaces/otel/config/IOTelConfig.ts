// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelErrorHandlers } from "./IOTelErrorHandlers";
import { IOTelTraceCfg } from "./IOTelTraceCfg";

export interface IOTelConfig {
    traceCfg?: IOTelTraceCfg;
    errorHandlers?: IOTelErrorHandlers;
}
