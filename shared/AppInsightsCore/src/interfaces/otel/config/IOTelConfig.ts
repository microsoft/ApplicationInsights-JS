// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelErrorHandlers } from "./IOTelErrorHandlers";
import { ITraceCfg } from "./IOTelTraceCfg";

/**
 * OpenTelemetry configuration interface
 * Provides configuration specific to the OpenTelemetry extensions
 */
export interface IOTelConfig {
    /**
     * Configuration interface for OpenTelemetry tracing functionality.
     * This interface contains all the settings that control how traces are created,
     * processed, and managed within the OpenTelemetry system.
     *
     * @example
     * ```typescript
     * const traceCfg: ITraceCfg = {
     *   serviceName: "my-service",
     *   generalLimits: {
     *     attributeCountLimit: 128,
     *     attributeValueLengthLimit: 4096
     *   },
     *   spanLimits: {
     *     attributeCountLimit: 128,
     *     linkCountLimit: 128,
     *     eventCountLimit: 128
     *   }
     * };
     * ```
     *
     * @since 3.4.0
     */
    traceCfg?: ITraceCfg;

    /**
     * Error handlers for OpenTelemetry operations.
     * This interface allows you to specify custom error handling logic for various
     * OpenTelemetry components, enabling better control over how errors are managed
     * within the OpenTelemetry system.
     *
     * @see {@link IOTelErrorHandlers}
     *
     * @example
     * ```typescript
     * const errorHandlers: IOTelErrorHandlers = {
     *   attribError: (message, key, value) => {
     *    console.warn(`Attribute error for ${key}:`, message);
     *  }
     * };
     * ```
     */
    errorHandlers?: IOTelErrorHandlers;
}
