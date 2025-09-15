// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrSlice, fnApply, isFunction, objDefine } from "@nevware21/ts-utils";
import { IOTelContext } from "../interfaces/context/IOTelContext";
import { IOTelContextManager } from "../interfaces/context/IOTelContextManager";

/**
 * Create a context manager using the provided parent context as the root context
 * if there is no active context.
 * @param parentContext - The parent / root context to use if there is no active context.
 * @returns
 */
export function createContextManager(parentContext?: IOTelContext): IOTelContextManager {
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
            enabled = false
            return theContextMgr;
        }
    };

    return theContextMgr
}
