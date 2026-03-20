// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { createDynamicConfig } from "../../config/DynamicConfig";
import { IUnloadHook } from "../../interfaces/ai/IUnloadHook";
import { IOTelErrorHandlers } from "../../interfaces/otel/config/IOTelErrorHandlers";
import { IOTelLogger } from "../../interfaces/otel/logs/IOTelLogger";
import { IOTelLoggerOptions } from "../../interfaces/otel/logs/IOTelLoggerOptions";
import { IOTelLoggerProvider } from "../../interfaces/otel/logs/IOTelLoggerProvider";
import { IOTelLoggerProviderConfig } from "../../interfaces/otel/logs/IOTelLoggerProviderConfig";
import { IOTelLoggerProviderSharedState } from "../../interfaces/otel/logs/IOTelLoggerProviderSharedState";
import { IOTelResource } from "../../interfaces/otel/resources/IOTelResource";
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
 * @param config - The LoggerProvider configuration with required dependencies injected.
 *  Must include `resource` and `errorHandlers`.
 * @returns An initialized IOTelLoggerProvider instance with `forceFlush` and `shutdown` support.
 *
 * @remarks
 * - All dependencies must be injected through config — no global state
 * - Config is used directly — never copied with spread operator
 * - Error handlers are obtained from `config.errorHandlers`
 * - Local config caching uses `onConfigChange` callbacks
 * - Complete unload support — call `shutdown()` to release all resources
 *
 * @example
 * ```typescript
 * const provider = createLoggerProvider({
 *   resource: myResource,
 *   errorHandlers: myErrorHandlers,
 *   processors: [myLogProcessor]
 * });
 *
 * const logger = provider.getLogger("my-service", "1.0.0");
 * ```
 *
 * @since 3.4.0
 */
export function createLoggerProvider(
    config: IOTelLoggerProviderConfig
): IOTelLoggerProvider & {
    forceFlush(): IPromise<void>;
    shutdown(): IPromise<void>;
    readonly _sharedState: IOTelLoggerProviderSharedState;
} {
    // Validate required dependencies upfront
    let _handlers: IOTelErrorHandlers;
    let _resource: IOTelResource;

    let defaults = loadDefaultConfig();
    let forceFlushTimeoutMillis: number;
    let logRecordLimits;

    let _isShutdown = false;
    let _unloadHooks: IUnloadHook[] = [];

    // Register for config changes — save the returned IUnloadHook
    let _configUnload = createDynamicConfig(config).watch(function () {
        _handlers = config.errorHandlers || {};
        _resource = config.resource;
        forceFlushTimeoutMillis = config.forceFlushTimeoutMillis !== undefined
            ? config.forceFlushTimeoutMillis
            : defaults.forceFlushTimeoutMillis;
        logRecordLimits = config.logRecordLimits || defaults.logRecordLimits;
    });
    _unloadHooks.push(_configUnload);

    if (!_resource) {
        handleError(_handlers, "Resource must be provided to LoggerProvider");
    }

    let sharedState = createLoggerProviderSharedState(
        _resource,
        forceFlushTimeoutMillis,
        reconfigureLimits(logRecordLimits),
        config.processors || []
    );

    function getLogger(
        name: string,
        version?: string,
        options?: IOTelLoggerOptions
    ): IOTelLogger | null {
        if (_isShutdown) {
            handleWarn(_handlers, "A shutdown LoggerProvider cannot provide a Logger");
            return null;
        }

        if (!name) {
            handleWarn(_handlers, "Logger requested without instrumentation scope name.");
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

        return sharedState.loggers.get(key);
    }

    function forceFlush(): IPromise<void> {
        if (_isShutdown) {
            handleWarn(_handlers, "invalid attempt to force flush after LoggerProvider shutdown");
            return Promise.resolve();
        }

        return sharedState.activeProcessor.forceFlush();
    }

    function shutdown(): IPromise<void> {
        if (_isShutdown) {
            handleWarn(_handlers, "shutdown may only be called once per LoggerProvider");
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
