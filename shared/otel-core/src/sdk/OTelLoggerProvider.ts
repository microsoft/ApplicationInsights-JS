// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { IOTelLogRecord } from "../interfaces/logs/IOTelLogRecord";
import { IOTelLogger } from "../interfaces/logs/IOTelLogger";
import { IOTelLoggerOptions } from "../interfaces/logs/IOTelLoggerOptions";
import { IOTelLoggerProvider } from "../interfaces/logs/IOTelLoggerProvider";
import { IOTelLoggerProviderConfig } from "../interfaces/logs/IOTelLoggerProviderConfig";
import { IOTelLoggerProviderSharedState } from "../interfaces/logs/IOTelLoggerProviderSharedState";
import { createLoggerProviderSharedState } from "../internal/LoggerProviderSharedState";
import { handleWarn } from "../internal/commonUtils";
import { IOTelErrorHandlers } from "../otel-core-js";
import { createResource } from "../resource/resource";
import { createLogger } from "./OTelLogger";
import { loadDefaultConfig, reconfigureLimits } from "./config";

export const DEFAULT_LOGGER_NAME = "unknown";

// Inline noop logger for shutdown scenarios
function _createInlineNoopLogger(): IOTelLogger {
    return {
        emit(_logRecord: IOTelLogRecord): void {
            // noop - logger is shut down
        }
    };
}

export function createLoggerProvider(
    config: IOTelLoggerProviderConfig = {}
): IOTelLoggerProvider & {
    forceFlush(): IPromise<void>;
    shutdown(): IPromise<void>;
    readonly _sharedState: IOTelLoggerProviderSharedState;
} {
    const defaults = loadDefaultConfig();
    const forceFlushTimeoutMillis = config.forceFlushTimeoutMillis !== undefined
        ? config.forceFlushTimeoutMillis
        : defaults.forceFlushTimeoutMillis;
    const logRecordLimits = config.logRecordLimits || defaults.logRecordLimits;

    let resource = config.resource;
    if (!resource) {
        resource = createResource({ cfg: { errorHandlers: {} }, attribs: [] });
    }

    const sharedState = createLoggerProviderSharedState(
        resource,
        forceFlushTimeoutMillis,
        reconfigureLimits(logRecordLimits),
        config && config.processors ? config.processors : []
    );

    let isShutdown = false;
    const handlers: IOTelErrorHandlers = {};

    function getLogger(
        name: string,
        version?: string,
        options?: IOTelLoggerOptions
    ): IOTelLogger {
        if (isShutdown) {
            handleWarn(handlers, "A shutdown LoggerProvider cannot provide a Logger");
            return _createInlineNoopLogger();
        }

        if (!name) {
            handleWarn(handlers, "Logger requested without instrumentation scope name.");
        }

        const loggerName = name || DEFAULT_LOGGER_NAME;
        const schemaUrl = options && options.schemaUrl;
        const key = `${loggerName}@${version || ""}:${schemaUrl || ""}`;
        if (!sharedState.loggers.has(key)) {
            sharedState.loggers.set(
                key,
                createLogger(
                    { name: loggerName, version, schemaUrl },
                    sharedState
                )
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return sharedState.loggers.get(key)!;
    }

    function forceFlush(): IPromise<void> {
        if (isShutdown) {
            handleWarn(handlers, "invalid attempt to force flush after LoggerProvider shutdown");
            return Promise.resolve();
        }

        return sharedState.activeProcessor.forceFlush();
    }

    function shutdown(): IPromise<void> {
        if (isShutdown) {
            handleWarn(handlers, "shutdown may only be called once per LoggerProvider");
            return Promise.resolve();
        }

        isShutdown = true;
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
