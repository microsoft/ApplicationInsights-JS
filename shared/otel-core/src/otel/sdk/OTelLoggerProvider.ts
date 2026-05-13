// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { onConfigChange } from "../../config/DynamicConfig";
import { IUnloadHook } from "../../interfaces/ai/IUnloadHook";
import { IOTelLogger } from "../../interfaces/otel/logs/IOTelLogger";
import { IOTelLoggerOptions } from "../../interfaces/otel/logs/IOTelLoggerOptions";
import { IOTelLoggerProvider } from "../../interfaces/otel/logs/IOTelLoggerProvider";
import { IOTelLoggerProviderSharedState } from "../../interfaces/otel/logs/IOTelLoggerProviderSharedState";
import { IOTelResource } from "../../interfaces/otel/resources/IOTelResource";
import { IOTelWebSdkConfig } from "../../interfaces/otel/config/IOTelWebSdkConfig";
import { createLoggerProviderSharedState } from "../../internal/LoggerProviderSharedState";
import { handleError, handleWarn } from "../../internal/handleErrors";
import { createLogger } from "./OTelLogger";
import { loadDefaultConfig, reconfigureLimits } from "./config";

export const DEFAULT_LOGGER_NAME = "unknown";

/**
 * Creates an OpenTelemetry LoggerProvider instance.
 *
 * The LoggerProvider manages Logger instances and coordinates log record
 * processing through registered processors.
 *
 * @param config - The SDK config (IOTelWebSdkConfig) with required dependencies injected.
 *  Must include `resource` and `errorHandlers`. The provider reads `logProcessors`
 *  from the config for processors.
 * @returns An initialized IOTelLoggerProvider instance with `forceFlush` and `shutdown` support.
 *
 * @remarks
 * - All dependencies are inherited from the SDK config — no separate config interfaces
 * - Error handlers are obtained from `config.errorHandlers`
 * - Local config caching uses `onConfigChange` callbacks
 * - Complete unload support — call `shutdown()` to release all resources
 *
 * @example
 * ```typescript
 * const provider = createLoggerProvider(sdkConfig);
 *
 * const logger = provider.getLogger("my-service", "1.0.0");
 * ```
 *
 * @since 3.4.0
 */
export function createLoggerProvider(
    config: IOTelWebSdkConfig
): IOTelLoggerProvider & {
    forceFlush(): IPromise<void>;
    shutdown(): IPromise<void>;
    readonly _sharedState: IOTelLoggerProviderSharedState;
} {
    let _resource: IOTelResource;

    let defaults = loadDefaultConfig();
    let forceFlushTimeoutMillis: number;
    let logRecordLimits;

    let _isShutdown = false;
    let _unloadHooks: IUnloadHook[] = [];

    // Read initial config values from the SDK config
    _resource = config.resource;
    forceFlushTimeoutMillis = config.forceFlushTimeoutMillis !== undefined
        ? config.forceFlushTimeoutMillis
        : defaults.forceFlushTimeoutMillis;
    logRecordLimits = config.logRecordLimits || defaults.logRecordLimits;

    if (!_resource) {
        handleError(config, "Resource must be provided to LoggerProvider");
    }

    let sharedState = createLoggerProviderSharedState(
        _resource,
        forceFlushTimeoutMillis,
        reconfigureLimits(logRecordLimits),
        config.logProcessors || []
    );

    // Register for config changes using onConfigChange on the already-dynamic SDK config
    let _configUnload = onConfigChange(config, function () {
        _resource = config.resource;
        forceFlushTimeoutMillis = config.forceFlushTimeoutMillis !== undefined
            ? config.forceFlushTimeoutMillis
            : defaults.forceFlushTimeoutMillis;
        logRecordLimits = config.logRecordLimits || defaults.logRecordLimits;

        // Propagate updated values to shared state
        sharedState.resource = _resource;
        sharedState.forceFlushTimeoutMillis = forceFlushTimeoutMillis;
        sharedState.logRecordLimits = reconfigureLimits(logRecordLimits);
    });
    _unloadHooks.push(_configUnload);

    function getLogger(
        name: string,
        version?: string,
        options?: IOTelLoggerOptions
    ): IOTelLogger | null {
        if (_isShutdown) {
            handleWarn(config, "A shutdown LoggerProvider cannot provide a Logger");
            return null;
        }

        if (!name) {
            handleWarn(config, "Logger requested without instrumentation scope name.");
        }

        let loggerName = name || DEFAULT_LOGGER_NAME;
        let schemaUrl = options && options.schemaUrl;
        let key = loggerName + "@" + (version || "") + ":" + (schemaUrl || "");
        if (!sharedState.loggers.has(key)) {
            sharedState.loggers.set(
                key,
                createLogger(
                    { name: loggerName, version, schemaUrl },
                    sharedState
                )
            );
        }

        let logger = sharedState.loggers.get(key);
        return logger || null;
    }

    function forceFlush(): IPromise<void> {
        if (_isShutdown) {
            handleWarn(config, "invalid attempt to force flush after LoggerProvider shutdown");
            return Promise.resolve();
        }

        return sharedState.activeProcessor.forceFlush();
    }

    function shutdown(): IPromise<void> {
        if (_isShutdown) {
            handleWarn(config, "shutdown may only be called once per LoggerProvider");
            return Promise.resolve();
        }

        _isShutdown = true;

        // Remove all config change listeners
        for (let i = 0; i < _unloadHooks.length; i++) {
            _unloadHooks[i].rm();
        }
        _unloadHooks = [];

        return sharedState.activeProcessor.shutdown();
    }

    return {
        getLogger,
        forceFlush,
        shutdown,
        get _sharedState(): IOTelLoggerProviderSharedState {
            return sharedState;
        }
    };
}
