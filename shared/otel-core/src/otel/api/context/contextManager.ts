// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrSlice, fnApply, isFunction, objDefine } from "@nevware21/ts-utils";
import { onConfigChange } from "../../../config/DynamicConfig";
import { IUnloadHook } from "../../../interfaces/ai/IUnloadHook";
import { IOTelConfig } from "../../../interfaces/otel/config/IOTelConfig";
import { IOTelContext } from "../../../interfaces/otel/context/IOTelContext";
import { IOTelContextManager } from "../../../interfaces/otel/context/IOTelContextManager";
import { handleWarn } from "../../../internal/handleErrors";

/**
 * Creates a context manager that tracks the active context for the current execution scope.
 *
 * The context manager maintains a stack-based active context, falling back to the
 * provided parent context when no context is explicitly active.
 *
 * @param config - Optional SDK/core config (IOTelConfig) for error handlers. If provided,
 *  it must already be a dynamic config so that `onConfigChange` can track changes.
 * @param parentContext - Optional parent / root context to use if there is no active context.
 * @returns An IOTelContextManager instance
 *
 * @remarks
 * - Supports `with()` for scoped context activation
 * - Supports `bind()` to associate a context with a callback
 * - Must be enabled via `enable()` before use
 * - Call `disable()` to clear active context, stop tracking, and unregister config listeners
 * - Error handlers are inherited from the SDK/core config
 *
 * @example
 * ```typescript
 * const ctxMgr = createContextManager(sdkConfig, rootContext);
 * ctxMgr.enable();
 *
 * ctxMgr.with(myContext, () => {
 *   // myContext is now active within this callback
 * });
 * ```
 *
 * @since 4.0.0
 */
export function createContextManager(config?: IOTelConfig, parentContext?: IOTelContext): IOTelContextManager {
    let _unloadHooks: IUnloadHook[] = [];

    // Error handlers are read from the SDK/core config via onConfigChange
    let _config: IOTelConfig = config || {};

    // Register for config changes using onConfigChange (works with already-dynamic config)
    if (config) {
        let _configUnload = onConfigChange(config, function () {
            _config = config;
        });
        _unloadHooks.push(_configUnload);
    }

    let enabled = false;
    let activeContext: IOTelContext | null;

    let theContextMgr: IOTelContextManager = {
        active: () => {
            return activeContext || parentContext;
        },
        with: function <A extends unknown[], F extends (...args: A) => ReturnType<F>>(context: IOTelContext, fn: F, thisArg?: ThisParameterType<F>, ..._args: A): ReturnType<F> {
            let oldContext = activeContext;
            activeContext = context || activeContext;
            try {
                return fnApply(fn, thisArg, arrSlice(arguments, 3));
            } finally {
                activeContext = oldContext;
            }
        },
        bind: <T>(context: IOTelContext, target: T): T => {
            if (isFunction(target)) {
                let boundFn = function (..._args: any[]) {
                    return theContextMgr.with(context, target as any, this, arrSlice(arguments));
                };

                return objDefine(boundFn as any, "length", {
                    v: target.length,
                    e: false,
                    w: false
                });
            }

            handleWarn(_config, "bind() called with non-function target, returning target as-is");
            return target;
        },
        enable: () => {
            if (!enabled) {
                enabled = true;
                activeContext = parentContext;
            }

            return theContextMgr;
        },
        disable: () => {
            activeContext = null;
            enabled = false;

            return theContextMgr;
        }
    };

    return theContextMgr;
}
