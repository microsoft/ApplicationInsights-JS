// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IOTelContext, IOTelSpan, IOTelSpanOptions, IOTelTracer, IOTelTracerProvider, IReadableSpan, eOTelSpanStatusCode,
    getContextActiveSpanContext, isSpanContext, isSpanContextValid
} from "@microsoft/otel-core-js";
import { ILazyValue, createDeferredCachedValue, isFunction } from "@nevware21/ts-utils";
import { createNonRecordingSpan } from "./nonRecordingSpan";
import { _noopVoid } from "./noopHelpers";
import { createNoopProxy } from "./noopProxy";

interface ITracerOptions {
    name: string;
    version?: string;
    schemaUrl?: string;
}

/**
 * Createa a Noop Context Manager that returns Noop Contexts, if no parent context is provided
 * the returned context will always return undefined for all values.
 * @returns - A new Noop Context Manager
 */
export function createNoopTracerProvider(): IOTelTracerProvider {

    function _startSpan(name: string, options?: IOTelSpanOptions, context?: IOTelContext): IReadableSpan {
        let opts = options || {};
        if (!opts.root) {
            let parentContext = context || getContextActiveSpanContext(context);
            if (isSpanContext(parentContext) && isSpanContextValid(parentContext)) {
                return createNonRecordingSpan(parentContext, name);
            }
        }

        return createNonRecordingSpan(null, name);
    }

    function _startActiveSpan<F extends (span: IOTelSpan) => ReturnType<F>>(name: string, arg2?: F | IOTelSpanOptions, arg3?: F | IOTelContext, arg4?: F): ReturnType<F> | undefined {
        let options: IOTelSpanOptions = null;
        let ctx: IOTelContext | undefined;
        let fn: F;

        if (isFunction(arg2)) {
            fn = arg2 as F;
        } else if (isFunction(arg3)) {
            options = arg2 as IOTelSpanOptions;
            fn = arg3 as F;
        } else {
            options = arg2 as IOTelSpanOptions;
            ctx = arg3 as IOTelContext;
            fn = arg4 as F;
        }

        let span = _startSpan(name, options);
        let useAsync = false;

        try {
            return fn(span);
        } catch (e) {
            if (span) {
                span.setStatus({ code: e ? eOTelSpanStatusCode.ERROR : eOTelSpanStatusCode.OK, message: e ? e.message : undefined });
            }
            throw e;
        } finally {
            // If the function returned a promise, we need to end the span when the promise resolves/rejects
            if (!useAsync && span) {
                span.end();
            }
        }
    }
    
    function _createNoopTracer(): IOTelTracer {
        return createNoopProxy<IOTelTracer>({
            props: {
                startSpan: { v: _startSpan },
                startActiveSpan: { v: _startActiveSpan }
            }
        });
    }
        
    let tracer: ILazyValue<IOTelTracer> = createDeferredCachedValue(_createNoopTracer);
    
    return createNoopProxy<IOTelTracerProvider>({
        props: {
            getTracer: {
                v: (name: string, version?: string): IOTelTracer => {
                    return tracer.v;
                }
            },
            forceFlush: { v: _noopVoid },
            shutdown: { v: _noopVoid }
        }
    });
}
