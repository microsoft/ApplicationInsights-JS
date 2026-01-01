import { doFinally } from "@nevware21/ts-async";
import { arrSlice, fnApply, isFunction, isObject, isPromiseLike } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IConfiguration } from "../../JavaScriptSDK.Interfaces/IConfiguration";
import { IDistributedTraceContext, IDistributedTraceInit } from "../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { ISpanScope, ITraceHost } from "../../JavaScriptSDK.Interfaces/ITraceProvider";
import { createDistributedTraceContext, isDistributedTraceContext } from "../../JavaScriptSDK/TelemetryHelpers";
import { isValidSpanId, isValidTraceId } from "../../JavaScriptSDK/W3cTraceParent";
import { eOTelSpanKind } from "../enums/trace/OTelSpanKind";
import { IOTelApi } from "../interfaces/IOTelApi";
import { ITraceCfg } from "../interfaces/config/ITraceCfg";
import { IOTelSpanCtx } from "../interfaces/trace/IOTelSpanCtx";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { createSpan } from "./span";

/**
 * Internal helper to execute a callback function with a span set as the active span.
 * Handles both synchronous and asynchronous (Promise-based) callbacks, ensuring
 * the previous active span is properly restored after execution.
 * @param scope - The span scope instance
 * @param fn - The callback function to execute
 * @param thisArg - The `this` context for the callback
 * @param args - Array of arguments to pass to the callback
 * @returns The result of the callback function
 */
function _executeWithActiveSpan<S extends ISpanScope, R>(
    scope: S,
    fn: (...args: any) => any,
    thisArg: any,
    args: any[]
): R {
    let isAsync = false;
    try {
        let result = fnApply(fn, thisArg || scope, args);
        if (isPromiseLike(result)) {
            isAsync = true;
            return doFinally(result, function () {
                // Restore previous active span after promise settles (resolves or rejects)
                if (scope) {
                    scope.restore();
                }
            }) as any;
        }
        return result;
    } finally {
        // Restore previous active span only if result is not a promise
        // (promises handle restoration in their callbacks)
        if (scope && !isAsync) {
            scope.restore();
        }
    }
}

/**
 * Execute the callback `fn` function with the passed span as the active span
 * @param traceHost - The current trace host instance (core or AISKU instance)
 * @param span - The span to set as the active span during the execution of the callback
 * @param fn - the callback function
 * @param thisArg - the `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @param _args - Additional arguments to be passed to the function
 */
export function withSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>, ...args: A) => ReturnType<F>>(traceHost: T, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>, ..._args: A) : ReturnType<F>;

/**
 * Execute the callback `fn` function with the passed span as the active span
 * @param traceHost - The current trace host instance (core or AISKU instance)
 * @param span - The span to set as the active span during the execution of the callback
 * @param fn - the callback function
 * @param thisArg - the `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @returns the result of the function
 */
export function withSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>,...args: A) => ReturnType<F>>(traceHost: T, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>): ReturnType<F> {
    const scope = traceHost.setActiveSpan(span);
    return _executeWithActiveSpan(scope, fn, thisArg, arrSlice(arguments, 4));
}

/**
 * Execute the callback `fn` function with the passed span as the active span. The callback receives
 * an ISpanScope object as its first parameter and the `this` context (when no thisArg is provided).
 * @param traceHost - The current trace host instance (core or AISKU instance)
 * @param span - The span to set as the active span during the execution of the callback
 * @param fn - the callback function that receives an ISpanScope
 * @param thisArg - the `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @returns The result of the function
 */
export function useSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope: ISpanScope<T>) => ReturnType<F>>(traceHost: T, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>) : ReturnType<F>;

/**
 * Execute the callback `fn` function with the passed span as the active span. The callback receives
 * an ISpanScope object as its first parameter and the `this` context (when no thisArg is provided).
 * @param traceHost - The current trace host instance (core or AISKU instance)
 * @param span - The span to set as the active span during the execution of the callback
 * @param fn - the callback function that receives an ISpanScope and additional arguments
 * @param thisArg - the `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @param _args - Additional arguments to be passed to the function
 * @returns The result of the function
 */
export function useSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>, scope: ISpanScope<T>, ...args: A) => ReturnType<F>>(traceHost: T, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>, ..._args: A) : ReturnType<F>;

/**
 * Execute the callback `fn` function with the passed span as the active span. The callback receives
 * an ISpanScope object as its first parameter and the `this` context (when no thisArg is provided).
 * @param traceHost - The current trace host instance (core or AISKU instance)
 * @param span - The span to set as the active span during the execution of the callback
 * @param fn - the callback function that receives an ISpanScope and additional arguments
 * @param thisArg - the `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @param _args - Additional arguments to be passed to the function
 */
export function useSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>, scope: ISpanScope<T>, ...args: A) => ReturnType<F>>(traceHost: T, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>): ReturnType<F> {
    let scope = traceHost.setActiveSpan(span);
    return _executeWithActiveSpan(scope, fn, thisArg, [scope].concat(arrSlice(arguments, 4)));
}

/**
 * Returns true if the passed spanContext of type  {@link IDistributedTraceContext} or {@link IDistributedTraceInit} is valid.
 * @return true if this {@link IDistributedTraceContext} is valid.
 */
/*#__NO_SIDE_EFFECTS__*/
export function isSpanContextValid(spanContext: IDistributedTraceContext | IDistributedTraceInit): boolean {
    return spanContext ? (isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId)) : false;
}
  
/**
 * Wrap the given {@link IDistributedTraceContext} in a new non-recording {@link IReadableSpan}
 *
 * @param spanContext - span context to be wrapped
 * @returns a new non-recording {@link IReadableSpan} with the provided context
 */
export function wrapSpanContext(otelApi: IOTelApi, spanContext: IDistributedTraceContext | IDistributedTraceInit): IReadableSpan {
    if (!isDistributedTraceContext(spanContext)) {
        spanContext = createDistributedTraceContext(spanContext);
    }
    
    // Return a non-recording span
    return createNonRecordingSpan(otelApi, "wrapped(\"" + spanContext.spanId + "\")", spanContext);
}

/**
 * Return a non-recording span based on the provided spanContext using the otelApi instance as the
 * owning instance.
 * @param otelApi - The otelApi to use for creating the non-Recording Span
 * @param spanName - The span name to associated with the span
 * @param spanContext - The Span context to use for the span
 * @returns A new span that is marked as a non-recording span
 */
export function createNonRecordingSpan(otelApi: IOTelApi, spanName: string, spanContext: IDistributedTraceContext): IReadableSpan {
    // Return a non-recording span
    let spanCtx: IOTelSpanCtx = {
        api: otelApi,
        spanContext: spanContext,
        isRecording: false
    };
    
    return createSpan(spanCtx, spanName, eOTelSpanKind.INTERNAL);
}

/**
 * Identifies whether the span is an {@link IReadableSpan} or not
 * @param span - The span to check
 * @returns true if the span is an {@link IReadableSpan} otherwise false
 */
/*#__NO_SIDE_EFFECTS__*/
export function isReadableSpan(span: any): span is IReadableSpan {
    return !!span &&
        isObject(span) &&
        "name" in span &&
        "kind" in span &&
        isFunction(span.spanContext) &&
        "duration" in span &&
        "ended" in span &&
        "startTime" in span &&
        "endTime" in span &&
        "attributes" in span &&
        "links" in span &&
        "events" in span &&
        "status" in span &&
        // "resource" in span &&
        // "instrumentationScope" in span &&
        "droppedAttributesCount" in span &&
        isFunction(span.isRecording) &&
        isFunction(span.setStatus) &&
        isFunction(span.updateName) &&
        isFunction(span.setAttribute) &&
        isFunction(span.setAttributes) &&
        isFunction(span.end) &&
        isFunction(span.recordException);
}

function _getTraceCfg(context: IOTelApi | ITraceHost | IConfiguration): ITraceCfg {
    let traceCfg: ITraceCfg = null;
    if (context) {
        if ((context as IOTelApi).cfg && (context as IOTelApi).host) {
            traceCfg = (context as IOTelApi).cfg.traceCfg;
        } else if (isFunction((context as IAppInsightsCore).initialize) && (context as IAppInsightsCore).config) {
            traceCfg = (context as IAppInsightsCore).config.traceCfg;
        } else if ((context as IConfiguration).traceCfg) {
            traceCfg = (context as IConfiguration).traceCfg;
        }
    }

    return traceCfg;
}

/**
 * Set the suppress tracing flag on the context
 * @param context - The context to set the suppress tracing flag on
 * @returns The context with the suppress tracing flag set
 * @remarks This is used to suppress tracing for the current context and all child contexts
 */
/*#__NO_SIDE_EFFECTS__*/
export function suppressTracing<T = IOTelApi | IAppInsightsCore | IConfiguration>(context: T): T {
    let traceCfg = _getTraceCfg(context);
    if (traceCfg) {
        traceCfg.suppressTracing = true;
    }

    return context;
}

/**
 * Remove the suppress tracing flag from the context
 * @param context - The context to remove the suppress tracing flag from
 * @returns The context with the suppress tracing flag removed
 * @remarks This is used to remove the suppress tracing flag from the current context and all child
 * contexts. This is used to restore tracing after it has been suppressed
 */
/*#__NO_SIDE_EFFECTS__*/
export function unsuppressTracing<T = IOTelApi | IAppInsightsCore | IConfiguration>(context: T): T {
    let traceCfg = _getTraceCfg(context);
    if (traceCfg) {
        traceCfg.suppressTracing = false;
    }

    return context;
}

/**
 * Check if the tracing is suppressed for the current context
 * @param context - The context to check for the suppress tracing flag
 * @returns true if tracing is suppressed for the current context otherwise false
 * @remarks This is used to check if tracing is suppressed for the current context and all child
 */
/*#__NO_SIDE_EFFECTS__*/
export function isTracingSuppressed<T = IOTelApi | IAppInsightsCore | IConfiguration>(context: T): boolean {
    let result = false;
    let traceCfg = _getTraceCfg(context);
    if (traceCfg) {
        result = !!traceCfg.suppressTracing;
    }

    return result;
}
