// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrSlice, objDefineProps } from "@nevware21/ts-utils";
import { IOTelContext } from "../interfaces/context/IOTelContext";
import { IOTelContextManager } from "../interfaces/context/IOTelContextManager";
import { IOTelSpan } from "../interfaces/trace/IOTelSpan";
import { IOTelSpanOptions } from "../interfaces/trace/IOTelSpanOptions";
import { IOTelTracer } from "../interfaces/trace/IOTelTracer";
import { IOTelTracerCtx } from "../interfaces/trace/IOTelTracerCtx";
import { setContextSpan } from "./utils";

interface ITracerOptions {
    name: string;
    version?: string;
    schemaUrl?: string;
}

/**
 * Creates a new Tracer instance using the provided {@link IOTelTracerCtx} to obtain
 * the current context and context manager and to start new spans.
 * @param tracerCtx - The current {@link IOTelTracerCtx} instance
 * @returns A new Tracer instance
 */
export function createTracer(tracerCtx: IOTelTracerCtx, tracerOptions: ITracerOptions): IOTelTracer {

    function _startSpan(name: string, options?: IOTelSpanOptions, context?: IOTelContext): IOTelSpan {
        return tracerCtx.startSpan(name, options, context || tracerCtx.ctxMgr.active());
    }

    function _startActiveSpan<F extends (span: IOTelSpan) => ReturnType<F>>(name: string, arg2?: F | IOTelSpanOptions, arg3?: F | IOTelContext, arg4?: F): ReturnType<F> | undefined {
    
        let theArgs = arrSlice(arguments);
        let cnt = theArgs.length;
        let opts: IOTelSpanOptions | undefined;
        let ctx: IOTelContext | undefined;
        let fn: F;
        let ctxMgr: IOTelContextManager = tracerCtx.ctxMgr;
    
        if (cnt == 2) {
            fn = arg2 as F;
        } else if (cnt == 3) {
            opts = arg2 as IOTelSpanOptions | undefined;
            fn = arg3 as F;
        } else if (cnt >= 4) {
            opts = arg2 as IOTelSpanOptions | undefined;
            ctx = arg3 as IOTelContext | undefined;
            fn = arg4 as F;
        }

        if (fn) {
            let theCtx = ctx || ctxMgr.active();
            let span = _startSpan(name, opts, theCtx);
            let theContext = setContextSpan(theCtx, span);

            return ctxMgr.with(theContext, fn, undefined, span);
        }
    }

    let tracer = objDefineProps<IOTelTracer>({} as IOTelTracer, {
        startSpan: {
            v: _startSpan
        },
        startActiveSpan: {
            v: _startActiveSpan
        }
    });

    return tracer;
}
