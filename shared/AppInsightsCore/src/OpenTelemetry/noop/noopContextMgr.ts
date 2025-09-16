// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrSlice, fnApply } from "@nevware21/ts-utils";
import { IOTelContext } from "../interfaces/context/IOTelContext";
import { IOTelContextManager } from "../interfaces/context/IOTelContextManager";
import { _noopThis } from "./noopHelpers";
import { createNoopProxy } from "./noopProxy";

/**
 * Createa a Noop Context Manager that returns Noop Contexts, if no parent context is provided
 * the returned context will always return undefined for all values.
 * @param parentContext - The parent context to use as the root context
 * @returns - A new Noop Context Manager
 */
export function createNoopContextMgr(parentContext?: IOTelContext): IOTelContextManager {
    function _getValue(key: symbol): unknown {
        return parentContext ? parentContext.getValue(key) : undefined;
    }

    return createNoopProxy<IOTelContextManager>({
        props: {
            active: {
                v: () => createNoopProxy<IOTelContext>({
                    props: {
                        getValue: { v: _getValue },
                        setValue: { v: _noopThis<IOTelContext> as IOTelContext["setValue"] },
                        deleteValue: { v: _noopThis<IOTelContext> as IOTelContext["deleteValue"] }
                    }
                })
            },
            with: {
                v: function <A extends unknown[], F extends (...args: A) => ReturnType<F>>(_context: IOTelContext, fn: F, thisArg?: ThisParameterType<F>): ReturnType<F> {
                    return fnApply(fn, thisArg, arrSlice(arguments, 3));
                } as any
            },
            bind: { v: (_context, target) => target },
            enable: { v: _noopThis<IOTelContextManager> as IOTelContextManager["enable"] },
            disable: { v: _noopThis<IOTelContextManager> as IOTelContextManager["disable"] }
        }
    });
}
