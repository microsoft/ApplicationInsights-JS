// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IOTelContext, IOTelContextManager, IOTelSpan, IOTelSpanOptions, IOTelTracer, IOTelTracerCtx, IOTelTracerProvider, createNonRecordingSpan,
    createTracer, getContextActiveSpanContext, isSpanContext, isSpanContextValid
} from "@microsoft/otel-core-js";
import { ILazyValue, createDeferredCachedValue, objDefineProps } from "@nevware21/ts-utils";
import { createNoopContextMgr } from "./noopContextMgr";
import { createNoopProxy } from "./noopProxy";

/**
 * Createa a Noop Context Manager that returns Noop Contexts, if no parent context is provided
 * the returned context will always return undefined for all values.
 * @returns - A new Noop Context Manager
 */
export function createNoopTracerProvider(): IOTelTracerProvider {

    function _startSpan(name: string, options?: IOTelSpanOptions, context?: IOTelContext): IOTelSpan {
        let opts = options || {};
        if (!opts.root) {
            let parentContext = context || getContextActiveSpanContext(context);
            if (isSpanContext(parentContext) && isSpanContextValid(parentContext)) {
                return createNonRecordingSpan(parentContext, name);
            }
        }

        return createNonRecordingSpan(null, name);
    }
       
    let noopMgr: ILazyValue<IOTelContextManager> = createDeferredCachedValue(() => createNoopContextMgr());
    let tracerCtx: IOTelTracerCtx = objDefineProps<IOTelTracerCtx>(
        {
            ctxMgr: null,
            startSpan: _startSpan
        }, {
            ctxMgr: {
                l: noopMgr
            },
            context: {
                g: () => noopMgr.v.active()
            }
        });

    let tracer: ILazyValue<IOTelTracer> = createDeferredCachedValue(() => createTracer(tracerCtx, { name: "NoopTracer" }));
    
    return createNoopProxy<IOTelTracerProvider>({
        props: {
            getTracer: {
                v: (name: string, version?: string): IOTelTracer => {
                    return tracer.v;
                }
            }
        }
    });
}
