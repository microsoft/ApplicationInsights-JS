import { doAwait, doFinally } from "@nevware21/ts-async";
import { arrSlice, fnApply, isFunction, isObject, isPromiseLike } from "@nevware21/ts-utils";
import { createDistributedTraceContext, isDistributedTraceContext } from "../../../core/TelemetryHelpers";
import { eOTelSpanKind } from "../../../enums/otel/OTelSpanKind";
import { eOTelSpanStatusCode } from "../../../enums/otel/OTelSpanStatus";
import { IAppInsightsCore } from "../../../interfaces/ai/IAppInsightsCore";
import { IConfiguration } from "../../../interfaces/ai/IConfiguration";
import { IDistributedTraceContext, IDistributedTraceInit } from "../../../interfaces/ai/IDistributedTraceContext";
import { ISpanScope, ITraceHost } from "../../../interfaces/ai/ITraceProvider";
import { IOTelApi } from "../../../interfaces/otel/IOTelApi";
import { ITraceCfg } from "../../../interfaces/otel/config/IOTelTraceCfg";
import { IOTelSpanCtx } from "../../../interfaces/otel/trace/IOTelSpanCtx";
import { IOTelSpanOptions } from "../../../interfaces/otel/trace/IOTelSpanOptions";
import { IReadableSpan } from "../../../interfaces/otel/trace/IReadableSpan";
import { isValidSpanId, isValidTraceId } from "../../../utils/TraceParent";
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
 * Note: The callback will be executed even if the span is null.
 * @param traceHost - The current trace host instance (core or AISKU instance)
 * @param span - The span to set as the active span during the execution of the callback
 * @param fn - the callback function
 * @param thisArg - the `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @param _args - Additional arguments to be passed to the function
 */
export function withSpan<T extends ITraceHost, A extends unknown[], F extends (this: ThisParameterType<F> | ISpanScope<T>, ...args: A) => ReturnType<F>>(traceHost: T, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>, ..._args: A) : ReturnType<F>;

/**
 * Execute the callback `fn` function with the passed span as the active span
 * Note: The callback will be executed even if the span is null.
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
 * Note: The callback will be executed even if the span is null.
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
 * Note: The callback will be executed even if the span is null.
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
 * Note: The callback will be executed even if the span is null.
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
 * Creates and starts a new span, sets it as the active span in the current context,
 * and executes a provided function within this context.
 *
 * This method creates a span, makes it active during the execution of the provided
 * function, and automatically ends the span when the function completes (or throws).
 * This provides automatic span lifecycle management and context propagation. If the function
 * is asynchronous the span will be ended when the returned Promise resolves or rejects.
 * Note: The callback will be executed even if the traceHost is unable to create a span (returns null).
 * @param name - The name of the span, should be descriptive of the operation being traced
 * @param fn - The function to execute within the span's active context
 * @param thisArg - The `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @returns The result of executing the provided function
 * @remarks
 * - The span is automatically ended when the function completes or throws an exception
 * - The span becomes the active parent for any spans created within the function
 * - If the function throws an error, the span status is automatically set to ERROR
 * - This is the recommended method for most tracing scenarios due to automatic lifecycle management
 * - Multiple overloads available for different parameter combinations
 */
export function startActiveSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => ReturnType<F>>(traceHost: T, name: string, fn: F, thisArg?: ThisParameterType<F>): ReturnType<F>;

/**
 * Creates and starts a new span, sets it as the active span in the current context,
 * and executes a provided function within this context.
 *
 * This method creates a span, makes it active during the execution of the provided
 * function, and automatically ends the span when the function completes (or throws).
 * This provides automatic span lifecycle management and context propagation. If the function
 * is asynchronous the span will be ended when the returned Promise resolves or rejects.
 * Note: The callback will be executed even if the traceHost is unable to create a span (returns null).
 * @param name - The name of the span, should be descriptive of the operation being traced
 * @param options - Optional configuration for span creation (parent context, attributes, etc.)
 * @param fn - The function to execute within the span's active context
 * @param thisArg - The `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @returns The result of executing the provided function
 * @remarks
 * - The span is automatically ended when the function completes or throws an exception
 * - The span becomes the active parent for any spans created within the function
 * - If the function throws an error, the span status is automatically set to ERROR
 * - This is the recommended method for most tracing scenarios due to automatic lifecycle management
 * - Multiple overloads available for different parameter combinations
 */
export function startActiveSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => ReturnType<F>>(traceHost: T, name: string, options: IOTelSpanOptions, fn: F, thisArg?: ThisParameterType<F>): ReturnType<F>;

/**
 * Creates and starts a new span, sets it as the active span in the current context,
 * and executes a provided function within this context.
 *
 * This method creates a span, makes it active during the execution of the provided
 * function, and automatically ends the span when the function completes (or throws).
 * This provides automatic span lifecycle management and context propagation. If the function
 * is asynchronous the span will be ended when the returned Promise resolves or rejects.
 * Note: The callback will be executed even if the traceHost is unable to create a span (returns null).
 * @remarks
 * This overloaded version supports both optional span creation options and the `this` argument for the callback.
 * @param name - The name of the span, should be descriptive of the operation being traced
 * @param optionsOrFn - Optional configuration for span creation (parent context, attributes, etc.) or the function to execute within the span's active context
 * @param maybeFnOrThis - The function to execute within the span's active context or the `this` argument for the callback
 * @param thisArg - The `this` argument for the callback. If not provided, ISpanScope is used as `this`
 * @returns The result of executing the provided function
 * @remarks
 * - The span is automatically ended when the function completes or throws an exception
 * - The span becomes the active parent for any spans created within the function
 * - If the function throws an error, the span status is automatically set to ERROR
 * - This is the recommended method for most tracing scenarios due to automatic lifecycle management
 * - Multiple overloads available for different parameter combinations
 */
export function startActiveSpan<T extends ITraceHost, F extends (this: ThisParameterType<F> | ISpanScope<T>, scope?: ISpanScope<T>) => ReturnType<F>>(traceHost: T, name: string, optionsOrFn: IOTelSpanOptions | F, maybeFnOrThis?: F | ThisParameterType<F>, thisArg?: ThisParameterType<F>): ReturnType<F> {
    let options: IOTelSpanOptions = null;
    let fn: F;
    let that: ThisParameterType<F> = thisArg;

    if (isFunction(optionsOrFn)) {
        fn = optionsOrFn as F;
    } else {
        options = optionsOrFn as IOTelSpanOptions;
        fn = maybeFnOrThis as F;
        that = thisArg || (maybeFnOrThis as ThisParameterType<F>);
    }

    let span = traceHost.startSpan(name, options);
    let useAsync = false;

    try {
        let result = useSpan(traceHost, span, (scope: ISpanScope): ReturnType<F> => {
            return fnApply(fn, that, [scope]);
        });

        if (isPromiseLike(result)) {
            useAsync = true;

            return doAwait(result,
                (value) => value,
                (reason) => {
                    if (span) {
                        span.setStatus({ code: reason ? eOTelSpanStatusCode.ERROR : eOTelSpanStatusCode.OK, message: reason ? reason.message || reason : undefined });
                    }
                },
                () => {
                    if (span) {
                        span.end();
                    }
                }) as ReturnType<F>;
        }

        return result;
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
