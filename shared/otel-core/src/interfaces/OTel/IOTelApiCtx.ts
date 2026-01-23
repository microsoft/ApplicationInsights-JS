import { IDiagnosticLogger } from "../AppInsights/IDiagnosticLogger";
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
