// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger } from "../ai/IDiagnosticLogger";
import { IOTelConfig } from "./config/IOTelConfig";
import { IOTelTracerProvider } from "./trace/IOTelTracerProvider";

/**
 * The context for the current IOTelApi instance and it's configuration
 */
export interface IOTelApiCtx {
    otelCfg: IOTelConfig;
    
    traceProvider: IOTelTracerProvider;

    diagLogger: IDiagnosticLogger;
}
