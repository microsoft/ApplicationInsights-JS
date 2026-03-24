// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { isFunction } from "@nevware21/ts-utils";
import { createDynamicConfig } from "../../../config/DynamicConfig";
import { IUnloadHook } from "../../../interfaces/ai/IUnloadHook";
import { IOTelErrorHandlers } from "../../../interfaces/otel/config/IOTelErrorHandlers";
import { IOTelSpan } from "../../../interfaces/otel/trace/IOTelSpan";
import { IOTelSpanOptions } from "../../../interfaces/otel/trace/IOTelSpanOptions";
import { IOTelTracer } from "../../../interfaces/otel/trace/IOTelTracer";
import { IOTelTracerProvider } from "../../../interfaces/otel/trace/IOTelTracerProvider";
import { ITracerProviderConfig } from "../../../interfaces/otel/trace/ITracerProviderConfig";
import { IReadableSpan } from "../../../interfaces/otel/trace/IReadableSpan";
import { handleWarn } from "../../../internal/handleErrors";
import { _createTracer } from "./tracer";

/**
 * Non-recording tracer returned after shutdown.
 * All operations are safe no-ops that return null spans.
 */
let _NOOP_TRACER: IOTelTracer = {
    startSpan: function (_name: string, _options?: IOTelSpanOptions): IReadableSpan | null {
        return null;
    },
    startActiveSpan: function <F extends (span: IOTelSpan) => ReturnType<F>>(name: string, arg2?: F | IOTelSpanOptions, arg3?: F, arg4?: F): ReturnType<F> | undefined {
        let fn: F;
        if (isFunction(arg2)) {
            fn = arg2 as F;
        } else if (isFunction(arg3)) {
            fn = arg3 as F;
        } else {
            fn = arg4 as F;
        }

        return fn ? fn(null) : undefined;
    }
};

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
 * - Error handlers are obtained from `config.errorHandlers`
 * - Local config caching uses `onConfigChange` callbacks
 * - Call `shutdown()` to release cached tracers and unregister config listeners
 *
 * @since 3.4.0
 */
export function createTracerProvider(config: ITracerProviderConfig): IOTelTracerProvider {
    let _tracers: { [key: string]: IOTelTracer } = {};
    let _isShutdown = false;
    let _unloadHooks: IUnloadHook[] = [];

    // Local cached values — updated via onConfigChange
    let _handlers: IOTelErrorHandlers;
    let _host = config.host;

    // Register for config changes — save the returned IUnloadHook
    let _configUnload = createDynamicConfig(config).watch(function () {
        _handlers = config.errorHandlers || {};
        _host = config.host;
    });
    _unloadHooks.push(_configUnload);

    return {
        getTracer(name: string, version?: string): IOTelTracer {
            if (_isShutdown) {
                handleWarn(_handlers, "A shutdown TracerProvider cannot provide a Tracer");
                return _NOOP_TRACER;
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
                handleWarn(_handlers, "shutdown may only be called once per TracerProvider");
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
