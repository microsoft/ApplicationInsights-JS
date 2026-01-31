// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { fnApply, isFunction } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../../constants/InternalConstants";
import { ISpanScope, ITraceHost } from "../../../interfaces/ai/ITraceProvider";
import { IOTelSpanOptions } from "../../../interfaces/otel/trace/IOTelSpanOptions";
import { IOTelTracer } from "../../../interfaces/otel/trace/IOTelTracer";
import { IReadableSpan } from "../../../interfaces/otel/trace/IReadableSpan";
import { setProtoTypeName } from "../../../utils/HelperFuncs";
import { startActiveSpan } from "./utils";

/**
 * @internal
 * Create a tracer implementation.
 * @param host - The ApplicationInsights core instance
 * @returns A tracer object
 */
export function _createTracer(host: ITraceHost, name?: string): IOTelTracer {
    let tracer: IOTelTracer = setProtoTypeName({
        startSpan(spanName: string, options?: IOTelSpanOptions): IReadableSpan | null {
            // Note: context is not used / needed for Application Insights / 1DS
            if (host) {
                return host.startSpan(spanName, options);
            }

            return null;
        },
        startActiveSpan<F extends (span: IReadableSpan, scope?: ISpanScope<ITraceHost>) => ReturnType<F>>(name: string, fnOrOptions?: F | IOTelSpanOptions, fn?: F): ReturnType<F> {
            // Figure out which parameter order was passed
            let theFn: F | null = null;
            let opts: IOTelSpanOptions | null = null;

            if (isFunction(fnOrOptions)) {
                // startActiveSpan<F extends (span: IReadableSpan) => unknown>(name: string, fn: F): ReturnType<F>;
                theFn = fnOrOptions;
            } else {
                // startActiveSpan<F extends (span: IReadableSpan) => unknown>(name: string, options: IOTelSpanOptions, fn: F): ReturnType<F>; or
                opts = fnOrOptions as IOTelSpanOptions;
                theFn = fn;
            }

            if (theFn) {
                return startActiveSpan(host, name, opts, (spanScope: ISpanScope<ITraceHost>) => {
                    return fnApply(theFn, spanScope, [spanScope.span, spanScope]);
                });
            }
        }
    }, "OTelTracer" + (name ? (" (" + name + ")") : STR_EMPTY));

    return tracer;
}
