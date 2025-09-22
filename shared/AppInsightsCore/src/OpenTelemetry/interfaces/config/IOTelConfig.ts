import { IOTelErrorHandlers } from "./IOTelErrorHandlers";
import { ITraceCfg } from "./ITraceCfg";

/**
 * OpenTelemetry configuration interface
 * Provides configuration specific to the OpenTelemetry extensions
 */
export interface IOTelConfig {
    /**
     * Configuration for OpenTelemetry tracing
     */
    traceCfg?: ITraceCfg;

    
    errorHandlers?: IOTelErrorHandlers;
}
