import { IOTelErrorHandlers } from "./IOTelErrorHandlers";
import { IOTelTraceCfg } from "./IOTelTraceCfg";

/**
 * OpenTelemetry configuration interface
 * Provides configuration specific to the OpenTelemetry extensions
 */
export interface IOTelConfig {
    /**
     * Configuration for OpenTelemetry tracing
     */
    traceCfg?: IOTelTraceCfg;

    
    errorHandlers?: IOTelErrorHandlers;
}
