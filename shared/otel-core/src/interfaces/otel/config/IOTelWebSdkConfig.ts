// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContextManager } from "../context/IOTelContextManager";
import { IOTelLogRecordProcessor } from "../logs/IOTelLogRecordProcessor";
import { IOTelResource } from "../resources/IOTelResource";
import { IOTelIdGenerator } from "../trace/IOTelIdGenerator";
import { IOTelSampler } from "../trace/IOTelSampler";
import { IOTelErrorHandlers } from "./IOTelErrorHandlers";

/**
 * Configuration interface for the OpenTelemetry Web SDK.
 * Provides all configuration options required for SDK initialization.
 *
 *
 * @remarks
 * - All properties must be provided during SDK creation
 * - Local caching of config values uses `onConfigChange` callbacks
 * - Supports dynamic configuration — config values can change at runtime
 *
 * @example
 * ```typescript
 * const config: IOTelWebSdkConfig = {
 *   resource: myResource,
 *   errorHandlers: myErrorHandlers,
 *   contextManager: myContextManager,
 *   idGenerator: myIdGenerator,
 *   sampler: myAlwaysOnSampler,
 *   logProcessors: [myLogProcessor],
 *   performanceNow: () => performance.now()
 * };
 *
 * const sdk = createOTelWebSdk(config);
 * ```
 *
 * @since 4.0.0
 */
export interface IOTelWebSdkConfig {
    /**
     * Resource information for telemetry source identification.
     * Provides attributes that describe the entity producing telemetry,
     * such as service name, version, and environment.
     *
     * @remarks
     * The resource is shared across all providers (trace, log, metrics)
     * within this SDK instance.
     */
    resource: IOTelResource;

    /**
     * Error handlers for SDK internal diagnostics.
     * Provides hooks to customize how different types of errors and
     * diagnostic messages are handled within the SDK.
     *
     * @remarks
     * Error handlers are propagated to all sub-components created by the SDK.
     * If individual handler callbacks are not provided, default behavior
     * (console logging) is used.
     *
     * @see {@link IOTelErrorHandlers}
     */
    errorHandlers: IOTelErrorHandlers;

    /**
     * Context manager implementation.
     * Manages the propagation of context (including active spans) across
     * asynchronous operations.
     *
     * @see {@link IOTelContextManager}
     */
    contextManager: IOTelContextManager;

    /**
     * ID generator for span and trace IDs.
     * Generates unique identifiers for distributed tracing.
     *
     * @see {@link IOTelIdGenerator}
     */
    idGenerator: IOTelIdGenerator;

    /**
     * Sampler implementation.
     * Determines which traces/spans should be recorded and exported.
     *
     * @see {@link IOTelSampler}
     */
    sampler: IOTelSampler;

    /**
     * Performance timing function.
     * Injected for testability — allows tests to control time measurement.
     *
     * @returns The current high-resolution time in milliseconds
     *
     * @example
     * ```typescript
     * // Production usage
     * performanceNow: () => performance.now()
     *
     * // Test usage with fake timers
     * performanceNow: () => fakeTimer.now()
     * ```
     */
    performanceNow: () => number;

    /**
     * Log record processors for the log pipeline.
     * Each processor receives log records and can transform, filter,
     * or export them.
     *
     * @remarks
     * Processors are invoked in order. If not provided, defaults to
     * an empty array (no log processing).
     *
     * @see {@link IOTelLogRecordProcessor}
     */
    logProcessors?: IOTelLogRecordProcessor[];

    // TODO: Phase 2 - Uncomment when IOTelSpanProcessor is implemented
    // /**
    //  * Span processors for the trace pipeline.
    //  * Each processor receives spans and can transform, filter,
    //  * or export them.
    //  *
    //  * @see IOTelSpanProcessor
    //  */
    // spanProcessors?: IOTelSpanProcessor[];

    // TODO: Phase 5 - Uncomment when IOTelMetricReader is implemented
    // /**
    //  * Metric readers for the metric pipeline.
    //  *
    //  * @see IOTelMetricReader
    //  */
    // metricReaders?: IOTelMetricReader[];
}
