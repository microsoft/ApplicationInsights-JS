// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelErrorHandlers } from "../config/IOTelErrorHandlers";
import { IOTelResource } from "../resources/IOTelResource";
import { IOTelLogRecordLimits } from "./IOTelLogRecordLimits";
import { IOTelLogRecordProcessor } from "./IOTelLogRecordProcessor";

/**
 * Configuration interface for the OpenTelemetry LoggerProvider.
 * Provides all configuration options required for LoggerProvider initialization.
 *
 * @remarks
 * - The `resource` and `errorHandlers` properties are required
 * - Config is used directly — never copied with spread operator
 * - Supports dynamic configuration via `onConfigChange` callbacks
 *
 * @since 3.4.0
 */
export interface IOTelLoggerProviderConfig {
    /**
     * Resource information for telemetry source identification.
     * Provides attributes that describe the entity producing telemetry.
     */
    resource: IOTelResource;

    /**
     * Error handlers for internal diagnostics.
     * Provides hooks to customize how different types of errors and
     * diagnostic messages are handled.
     *
     * @see {@link IOTelErrorHandlers}
     */
    errorHandlers: IOTelErrorHandlers;

    /**
     * How long the forceFlush can run before it is cancelled.
     * The default value is 30000ms
     */
    forceFlushTimeoutMillis?: number;

    /** Log Record Limits */
    logRecordLimits?: IOTelLogRecordLimits;

    /** Log Record Processors */
    processors?: IOTelLogRecordProcessor[];
}
