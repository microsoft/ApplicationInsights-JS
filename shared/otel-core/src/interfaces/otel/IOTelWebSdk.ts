// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { IOTelWebSdkConfig } from "./config/IOTelWebSdkConfig";
import { IOTelLogger } from "./logs/IOTelLogger";
import { IOTelLoggerOptions } from "./logs/IOTelLoggerOptions";
import { IOTelTracer } from "./trace/IOTelTracer";
import { IOTelTracerOptions } from "./trace/IOTelTracerOptions";

/**
 * Main interface for the OpenTelemetry Web SDK.
 * Provides access to tracer and logger providers, configuration management,
 * and complete lifecycle control including unload/cleanup.
 *
 * @remarks
 * - Supports multiple isolated instances without global state
 * - All dependencies injected through {@link IOTelWebSdkConfig}
 * - Complete unload support — every instance must fully clean up on unload
 *
 * @example
 * ```typescript
 * const sdk = createOTelWebSdk({
 *   resource: myResource,
 *   errorHandlers: myHandlers,
 *   contextManager: myContextManager,
 *   idGenerator: myIdGenerator,
 *   sampler: myAlwaysOnSampler
 * });
 *
 * // Get a tracer and create spans
 * const tracer = sdk.getTracer("my-service");
 * const span = tracer.startSpan("operation");
 * span.end();
 *
 * // Get a logger and emit log records
 * const logger = sdk.getLogger("my-service");
 * logger.emit({ body: "Hello, World!" });
 *
 * // Cleanup when done
 * sdk.shutdown();
 * ```
 *
 * @since 4.0.0
 */
export interface IOTelWebSdk {
    /**
     * Returns a Tracer for creating spans.
     * Tracers are cached by name + version combination — requesting the same
     * name and version returns the same Tracer instance.
     *
     * @param name - The name of the tracer or instrumentation library
     * @param version - The version of the tracer or instrumentation library
     * @param options - Additional tracer options (e.g., schemaUrl)
     * @returns A Tracer with the given name and version, or null if the SDK is shutdown or
     * required dependencies are not configured
     *
     * @example
     * ```typescript
     * const tracer = sdk.getTracer("my-component", "1.0.0");
     * const span = tracer.startSpan("my-operation");
     * ```
     */
    getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer | null;

    /**
     * Returns a Logger for emitting log records.
     * Loggers are cached by name + version + schemaUrl combination —
     * requesting the same combination returns the same Logger instance.
     *
     * @param name - The name of the logger or instrumentation library
     * @param version - The version of the logger or instrumentation library
     * @param options - Additional logger options (e.g., schemaUrl, scopeAttributes)
     * @returns A Logger with the given name and version, or null if the SDK is shutdown
     *
     * @example
     * ```typescript
     * const logger = sdk.getLogger("my-component", "1.0.0");
     * logger.emit({ body: "Operation completed", severityText: "INFO" });
     * ```
     */
    getLogger(name: string, version?: string, options?: IOTelLoggerOptions): IOTelLogger | null;

    // TODO: Phase 5 - Uncomment when metrics are implemented
    // /**
    //  * Returns a Meter for recording metrics.
    //  * @param name - The name of the meter or instrumentation library
    //  * @param version - The version of the meter or instrumentation library
    //  * @param options - Additional meter options
    //  * @returns A Meter with the given name and version
    //  */
    // getMeter(name: string, version?: string, options?: IOTelMeterOptions): IOTelMeter;

    /**
     * Forces all providers to flush any buffered data.
     * This is useful before application shutdown to ensure all telemetry
     * is exported.
     *
     * @returns A promise that resolves when the flush is complete
     */
    forceFlush(): IPromise<void>;

    /**
     * Shuts down the SDK and releases all resources.
     * After shutdown, the SDK instance is no longer usable — all
     * subsequent calls to `getTracer` or `getLogger` will return null.
     *
     * @remarks
     * Shutdown performs the following:
     * - Flushes all pending telemetry
     * - Shuts down all providers (trace, log)
     * - Removes all config change listeners (calls `IUnloadHook.rm()`)
     * - Clears all cached instances
     *
     * @returns A promise that resolves when shutdown is complete
     */
    shutdown(): IPromise<void>;

    /**
     * Gets the current SDK configuration as a live reference.
     * Callers should treat the returned configuration as read-only.
     *
     * @returns The current SDK configuration
     */
    getConfig(): Readonly<IOTelWebSdkConfig>;
}
