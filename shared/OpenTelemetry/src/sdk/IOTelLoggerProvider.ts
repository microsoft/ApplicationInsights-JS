// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { NOOP_LOGGER } from "../api/noop/noopLogger";
import { IOTelLogger } from "../interfaces/logs/IOTelLogger";
import { IOTelLoggerOptions } from "../interfaces/logs/IOTelLoggerOptions";
import { IOTelLoggerProvider } from "../interfaces/logs/IOTelLoggerProvider";
import { IOTelLoggerProviderConfig } from "../interfaces/logs/IOTelLoggerProviderConfig";
import { LoggerProviderSharedState } from "../internal/LoggerProviderSharedState";
import { Logger } from "./IOTelLogger";
import { loadDefaultConfig, reconfigureLimits } from "./config";

export const DEFAULT_LOGGER_NAME = "unknown";

export class LoggerProvider implements IOTelLoggerProvider {
    private _isShutdown: boolean = false;
    private readonly _sharedState: LoggerProviderSharedState;

    constructor(config: IOTelLoggerProviderConfig = {}) {
        const mergedConfig = { ...loadDefaultConfig(), ...config };
        this._sharedState = new LoggerProviderSharedState(
            config.resource ?? { attributes: {} } as any,
            mergedConfig.forceFlushTimeoutMillis,
            reconfigureLimits(mergedConfig.logRecordLimits),
            config?.processors ?? []
        );
    }

    /**
     * Get a logger with the configuration of the LoggerProvider.
     */
    public getLogger(
        name: string,
        version?: string,
        options?: IOTelLoggerOptions
    ): IOTelLogger {
        if (this._isShutdown) {
            console.warn("A shutdown LoggerProvider cannot provide a Logger");
            return NOOP_LOGGER;
        }

        if (!name) {
            console.warn("Logger requested without instrumentation scope name.");
        }
        const loggerName = name || DEFAULT_LOGGER_NAME;
        const key = `${loggerName}@${version || ""}:${options?.schemaUrl || ""}`;
        if (!this._sharedState.loggers.has(key)) {
            this._sharedState.loggers.set(
                key,
                new Logger(
                    { name: loggerName, version, schemaUrl: options?.schemaUrl },
                    this._sharedState
                )
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this._sharedState.loggers.get(key)!;
    }

    /**
     * Notifies all registered LogRecordProcessor to flush any buffered data.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    public forceFlush(): Promise<void> {
        // do not flush after shutdown
        if (this._isShutdown) {
            console.warn("invalid attempt to force flush after LoggerProvider shutdown");
            return Promise.resolve();
        }
        return this._sharedState.activeProcessor.forceFlush();
    }

    /**
     * Flush all buffered data and shut down the LoggerProvider and all registered
     * LogRecordProcessor.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    public shutdown(): Promise<void> {
        if (this._isShutdown) {
            console.warn("shutdown may only be called once per LoggerProvider");
            return Promise.resolve();
        }
        this._isShutdown = true;
        return this._sharedState.activeProcessor.shutdown();
    }
}
