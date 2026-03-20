// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrSlice, fnApply, isFunction, objDefine } from "@nevware21/ts-utils";
import { createDynamicConfig } from "../../../config/DynamicConfig";
import { IUnloadHook } from "../../../interfaces/ai/IUnloadHook";
import { IOTelErrorHandlers } from "../../../interfaces/otel/config/IOTelErrorHandlers";
import { IContextManagerConfig } from "../../../interfaces/otel/context/IContextManagerConfig";
import { IOTelContext } from "../../../interfaces/otel/context/IOTelContext";
import { IOTelContextManager } from "../../../interfaces/otel/context/IOTelContextManager";
import { handleWarn } from "../../../internal/handleErrors";

/**
 * Creates a context manager that tracks the active context for the current execution scope.
 *
 * The context manager maintains a stack-based active context, falling back to the
 * configured parent context when no context is explicitly active.
 *
 * @param config - Optional configuration for the context manager including parent context
 *  and error handlers.
 * @returns An IOTelContextManager instance
 *
 * @remarks
 * - Supports `with()` for scoped context activation
 * - Supports `bind()` to associate a context with a callback
 * - Must be enabled via `enable()` before use
 * - Call `disable()` to clear active context, stop tracking, and unregister config listeners
 * - Local config caching uses `onConfigChange` callbacks
 *
 * @example
 * ```typescript
 * const ctxMgr = createContextManager({
 *   parentContext: rootContext,
 *   errorHandlers: myErrorHandlers
 * });
 * ctxMgr.enable();
 *
 * ctxMgr.with(myContext, () => {
 *   // myContext is now active within this callback
 * });
 * ```
 *
 * @since 4.0.0
 */
export function createContextManager(config?: IContextManagerConfig): IOTelContextManager {
    let _cfg = config || {};
    let _unloadHooks: IUnloadHook[] = [];

    // Local cached values — updated via onConfigChange
    let _handlers: IOTelErrorHandlers;
    let parentContext: IOTelContext;

    // Register for config changes — save the returned IUnloadHook
    let _configUnload = createDynamicConfig(_cfg).watch(function () {
        _handlers = _cfg.errorHandlers || {};
        parentContext = _cfg.parentContext;
    });
    _unloadHooks.push(_configUnload);

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

            handleWarn(_handlers, "bind() called with non-function target, returning target as-is");
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

            // Unregister config change listeners
            for (let i = 0; i < _unloadHooks.length; i++) {
                _unloadHooks[i].rm();
            }
            _unloadHooks = [];

            return theContextMgr;
        }
    };

    return theContextMgr;
}
