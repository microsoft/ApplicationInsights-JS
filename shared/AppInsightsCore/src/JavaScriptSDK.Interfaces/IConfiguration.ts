// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryPlugin } from "./ITelemetryPlugin";
import { IChannelControls } from "./IChannelControls";

"use strict";

/**
 * Configuration provided to SDK core
 */
export interface IConfiguration {

    /**
     * Instrumentation key of resource
     */
    instrumentationKey: string; // todo: update later for multi-tenant?

    /**
     * Polling interval (in ms) for internal logging queue
     */
    diagnosticLogInterval?: number;

    /**
     * Maximum number of iKey transmitted logging telemetry per page view
     */
    maxMessageLimit?: number;

    /**
     * Console logging level. All logs with a severity level higher
     * than the configured level will be printed to console. Otherwise 
     * they are suppressed. ie Level 2 will print both CRITICAL and
     * WARNING logs to console, level 1 prints only CRITICAL.
     * 
     * Note: Logs sent as telemetry to instrumentation key will also 
     * be logged to console if their severity meets the configured loggingConsoleLevel
     * 
     * 0: ALL console logging off
     * 1: logs to console: severity >= CRITICAL
     * 2: logs to console: severity >= WARNING
     */
    loggingLevelConsole?: number;

    /**
     * Telemtry logging level to instrumentation key. All logs with a severity
     * level higher than the configured level will sent as telemetry data to
     * the configured instrumentation key.
     * 
     * 0: ALL iKey logging off
     * 1: logs to iKey: severity >= CRITICAL
     * 2: logs to iKey: severity >= WARNING
     */
    loggingLevelTelemetry?: number

    /**
     * If enabled, uncaught exceptions will be thrown to help with debugging
     */
    enableDebugExceptions?: boolean;
    
    /**
     * Endpoint where telemetry data is sent
     */
    endpointUrl?: string;

    /**
     * Extension configs loaded in SDK
     */
    extensionConfig?: { [key: string]: any }; // extension configs;

    /**
     * Additional plugins that should be loaded by core at runtime
     */
    extensions?: ITelemetryPlugin[];

    /**
     * Channel queues that is setup by caller in desired order. 
     * If channels are provided here, core will ignore any channels that are already setup, example if there is a SKU with an initialized channel
     */
    channels?: IChannelControls[][];
}