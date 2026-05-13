// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { onConfigChange } from "../../../config/DynamicConfig";
import { IUnloadHook } from "../../../interfaces/ai/IUnloadHook";
import { IOTelTracer } from "../../../interfaces/otel/trace/IOTelTracer";
import { IOTelTracerProvider } from "../../../interfaces/otel/trace/IOTelTracerProvider";
import { ITracerProviderConfig } from "../../../interfaces/otel/trace/ITracerProviderConfig";
import { handleWarn } from "../../../internal/handleErrors";
import { _createTracer } from "./tracer";

/**
 * Creates a TracerProvider that manages Tracer instances with caching.
 *
 * Tracers are cached by name and version. Subsequent requests for a tracer with
 * the same name and version return the cached instance.
 *
 * @param config - The TracerProvider configuration with required dependencies injected.
 *  Must include `host` which provides span creation.
 * @returns An IOTelTracerProvider instance
 *
 * @remarks
 * - Delegates span creation to the configured `host.startSpan()`
 * - Error handlers are inherited from `host.config.errorHandlers`
 * - Local config caching uses `onConfigChange` callbacks
 * - Call `shutdown()` to release cached tracers and unregister config listeners
 * - After shutdown, `getTracer()` returns null
 *
 * @since 3.4.0
 */
export function createTracerProvider(config: ITracerProviderConfig): IOTelTracerProvider {
    let _tracers: { [key: string]: IOTelTracer } = {};
    let _isShutdown = false;
    let _unloadHooks: IUnloadHook[] = [];

    // Get host and error handlers from host's config
    let _host = config.host;

    // Register for config changes using onConfigChange on the host's config
    if (_host && _host.config) {
        let _configUnload = onConfigChange(_host.config, function () {
            // Re-read from config in case host reference changed
            _host = config.host;
        });
        _unloadHooks.push(_configUnload);
    }

    return {
        getTracer(name: string, version?: string): IOTelTracer {
            if (_isShutdown) {
                handleWarn(_host && _host.config, "A shutdown TracerProvider cannot provide a Tracer");
                return null;
            }

            let tracerKey = (name || "ai-web") + "@" + (version || "unknown");

            if (!_tracers[tracerKey]) {
                _tracers[tracerKey] = _createTracer(_host, name);
            }

            return _tracers[tracerKey];
        },
        forceFlush(): IPromise<void> | void {
            // Nothing to flush
            return;
        },
        shutdown(): IPromise<void> | void {
            if (_isShutdown) {
                handleWarn(_host && _host.config, "shutdown may only be called once per TracerProvider");
                return;
            }

            _isShutdown = true;

            // Unregister config change listeners
            for (let i = 0; i < _unloadHooks.length; i++) {
                _unloadHooks[i].rm();
            }
            _unloadHooks = [];

            // Clear the locally cached IOTelTracer instances so they can be garbage collected
            _tracers = {};
            _host = null;
            return;
        }
    };
}
