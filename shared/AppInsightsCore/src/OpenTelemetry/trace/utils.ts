import { ILazyValue, arrSlice, createDeferredCachedValue, fnApply, isFunction, symbolFor } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IConfiguration } from "../../JavaScriptSDK.Interfaces/IConfiguration";
import { IDistributedTraceContext } from "../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { isValidSpanId, isValidTraceId } from "../../JavaScriptSDK/W3cTraceParent";
import { eOTelSpanKind } from "../enums/trace/OTelSpanKind";
import { IOTelApi } from "../interfaces/IOTelApi";
import { ITraceCfg } from "../interfaces/config/ITraceCfg";
import { IOTelSpanCtx } from "../interfaces/trace/IOTelSpanCtx";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { createSpan } from "./span";

const OTEL_SUPPRESS_TRACING_KEY = "OpenTelemetry SDK Context Key SUPPRESS_TRACING";
const SUPPRESS_TRACING_CONTEXT_KEY: ILazyValue<symbol> = (/* @__PURE__ */ createDeferredCachedValue<symbol>(() => symbolFor(OTEL_SUPPRESS_TRACING_KEY)));

export function withSpan<C extends IAppInsightsCore, A extends unknown[], F extends (...args: A) => ReturnType<F>>(core: C, span: IReadableSpan, fn: F, thisArg?: ThisParameterType<F>, ..._args: A) {
    let currentSpan = core.activeSpan();
    try {
        core.setActiveSpan(span);
        return fnApply(fn, thisArg, arrSlice(arguments, 4));
    } finally {
        core.setActiveSpan(currentSpan);
    }
}

/**
 * Returns true if this {@link IDistributedTraceContext} is valid.
 * @return true if this {@link IDistributedTraceContext} is valid.
 */
/*#__NO_SIDE_EFFECTS__*/
export function isSpanContextValid(spanContext: IDistributedTraceContext): boolean {
    return spanContext ? (isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId)) : false;
}
  
/**
 * Wrap the given {@link IDistributedTraceContext} in a new non-recording {@link IReadableSpan}
 *
 * @param spanContext - span context to be wrapped
 * @returns a new non-recording {@link IReadableSpan} with the provided context
 */
export function wrapSpanContext(otelApi: IOTelApi, spanContext: IDistributedTraceContext): IReadableSpan {
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
        "resource" in span &&
        "instrumentationScope" in span &&
        "droppedAttributesCount" in span &&
        isFunction(span.isRecording) &&
        isFunction(span.setStatus) &&
        isFunction(span.updateName) &&
        isFunction(span.setAttribute) &&
        isFunction(span.setAttributes) &&
        isFunction(span.end) &&
        isFunction(span.recordException);
}

function _getTraceCfg(context: IOTelApi | IAppInsightsCore | IConfiguration): ITraceCfg {
    let traceCfg: ITraceCfg = null;
    if (context) {
        if ((context as IOTelApi).cfg && (context as IOTelApi).core) {
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
