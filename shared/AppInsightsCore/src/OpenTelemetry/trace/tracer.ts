// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { fnApply, isFunction } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { setProtoTypeName } from "../../JavaScriptSDK/HelperFuncs";
import { STR_EMPTY } from "../../JavaScriptSDK/InternalConstants";
import { IOTelSpanOptions } from "../interfaces/trace/IOTelSpanOptions";
import { IOTelTracer } from "../interfaces/trace/IOTelTracer";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";

/**
 * Create a tracer implementation.
 * @param core - The ApplicationInsights core instance
 * @returns A tracer object
 * @internal
 */
export function createTracer(core: IAppInsightsCore, name?: string): IOTelTracer {
    let tracer: IOTelTracer = setProtoTypeName({
        startSpan(spanName: string, options?: IOTelSpanOptions): IReadableSpan | null {
            // Note: context is not used / needed for Application Insights / 1DS
            if (core) {
                return core.startSpan(spanName, options);
            }

            return null;
        },
        startActiveSpan<F extends (span: IReadableSpan) => unknown>(name: string, fnOrOptions?: F | IOTelSpanOptions, fn?: F): ReturnType<F> {
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
                const span = tracer.startSpan(name, opts);
                if (span) {
                    try {
                        return fnApply(theFn, [span]);
                    } finally {
                        span.end();
                    }
                }
            }

            return;
        }
    }, "OTelTracer" + (name ? (" (" + name + ")") : STR_EMPTY));

    return tracer;
}
