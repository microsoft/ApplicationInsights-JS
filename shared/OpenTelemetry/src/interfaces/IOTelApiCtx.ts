import { IDiagnosticLogger, IOTelConfig, IOTelTracerProvider } from "@microsoft/applicationinsights-core-js";

/**
 * The context for the current IOTelApi instance and it's configuration
 */
export interface IOTelApiCtx {
    otelCfg: IOTelConfig;
    
    traceProvider: IOTelTracerProvider;

    diagLogger: IDiagnosticLogger;
}
