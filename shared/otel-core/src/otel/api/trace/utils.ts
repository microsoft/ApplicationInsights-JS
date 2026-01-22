import { isValidSpanId, isValidTraceId } from "@microsoft/applicationinsights-common";
import { ILazyValue, createDeferredCachedValue, isFunction, symbolFor } from "@nevware21/ts-utils";
import { IOTelContext } from "../../../interfaces/OTel/context/IOTelContext";
import { IOTelSpan } from "../../../interfaces/OTel/trace/IOTelSpan";
import { IOTelSpanContext } from "../../../interfaces/OTel/trace/IOTelSpanContext";
import { IReadableSpan } from "../../../interfaces/OTel/trace/IReadableSpan";
import { UNDEFINED_VALUE } from "../../../internal/otel/InternalConstants";
import { createNonRecordingSpan } from "./nonRecordingSpan";

const OTEL_SPAN_KEY = "OpenTelemetry Context Key SPAN";
const OTEL_SUPPRESS_TRACING_KEY = "OpenTelemetry SDK Context Key SUPPRESS_TRACING";
const SPAN_CONTEXT_KEY: ILazyValue<symbol> = (/* @__PURE__ */ createDeferredCachedValue<symbol>(() => symbolFor(OTEL_SPAN_KEY)));
const SUPPRESS_TRACING_CONTEXT_KEY: ILazyValue<symbol> = (/* @__PURE__ */ createDeferredCachedValue<symbol>(() => symbolFor(OTEL_SUPPRESS_TRACING_KEY)));

/**
 * Remove the span from a context returning a new context with the span removed
 * @param context - context to use as the parent span
 * @returns A new Context with the span removed
 */
/*#__NO_SIDE_EFFECTS__*/
export function deleteContextSpan(context: IOTelContext): IOTelContext {
    return context.deleteValue(SPAN_CONTEXT_KEY.v);
}

/**
 * Get the current span from a context if one exists
 * @param context - context to get span from
 * @returns The current span if one exists otherwise undefined
 */
/*#__NO_SIDE_EFFECTS__*/
export function getContextSpan(context: IOTelContext): IOTelSpan | undefined {
    return context.getValue(SPAN_CONTEXT_KEY.v) as IOTelSpan;
}

/**
 * Set the span on a context returning a new context with the span set
 *
 * @param context - The context to use as the parent
 * @param span - span to set active
 * @returns A new Context with the span set
 */
/*#__NO_SIDE_EFFECTS__*/
export function setContextSpan(context: IOTelContext, span: IOTelSpan): IOTelContext {
    return context.setValue(SPAN_CONTEXT_KEY.v, span);
}

/**
 * Wrap span context in a NoopSpan and set as span in a new context
 *
 * @param context - context to set active span on
 * @param spanContext - span context to be wrapped
 */
/*#__NO_SIDE_EFFECTS__*/
export function setContextSpanContext(context: IOTelContext, spanContext: IOTelSpanContext): IOTelContext {
    return setContextSpan(context, createNonRecordingSpan(spanContext));
}

/**
 * Get the active span's {@link IOTelSpanContext} if one exists for the provided {@link IOTelContext}
 *
 * @param context - The Context to get the SpanContext from
 * @returns The SpanContext if one exists otherwise undefined
 */
/*#__NO_SIDE_EFFECTS__*/
export function getContextActiveSpanContext(context: IOTelContext): IOTelSpanContext | undefined {
    let theSpan = getContextSpan(context);
    return theSpan ? theSpan.spanContext() : UNDEFINED_VALUE;
}
  
/**
 * Returns true if this {@link IOTelSpanContext} is valid.
 * @return true if this {@link IOTelSpanContext} is valid.
 */
/*#__NO_SIDE_EFFECTS__*/
export function isSpanContextValid(spanContext: IOTelSpanContext): boolean {
    return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
  
/**
 * Wrap the given {@link IOTelSpanContext} in a new non-recording {@link IReadableSpan}
 *
 * @param spanContext - span context to be wrapped
 * @returns a new non-recording {@link IOTelSpan} with the provided context
 */
/*#__NO_SIDE_EFFECTS__*/
export function wrapSpanContext(spanContext: IOTelSpanContext): IOTelSpan {
    return createNonRecordingSpan(spanContext);
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
        "droppedLinksCount" in span &&
        "droppedEventsCount" in span &&
        isFunction(span.isRecording) &&
        isFunction(span.addEvent) &&
        isFunction(span.addLink) &&
        isFunction(span.addLinks) &&
        isFunction(span.setStatus) &&
        isFunction(span.updateName) &&
        isFunction(span.setAttribute) &&
        isFunction(span.setAttributes) &&
        isFunction(span.end) &&
        isFunction(span.recordException);
}


/**
 * Set the suppress tracing flag on the context
 * @param context - The context to set the suppress tracing flag on
 * @returns The context with the suppress tracing flag set
 * @remarks This is used to suppress tracing for the current context and all child contexts
 */
/*#__NO_SIDE_EFFECTS__*/
export function suppressTracing(context: IOTelContext): IOTelContext {
    return context.setValue(SUPPRESS_TRACING_CONTEXT_KEY.v, true);
}

/**
 * Remove the suppress tracing flag from the context
 * @param context - The context to remove the suppress tracing flag from
 * @returns The context with the suppress tracing flag removed
 * @remarks This is used to remove the suppress tracing flag from the current context and all child
 * contexts. This is used to restore tracing after it has been suppressed
 */
/*#__NO_SIDE_EFFECTS__*/
export function unsuppressTracing(context: IOTelContext): IOTelContext {
    return context.deleteValue(SUPPRESS_TRACING_CONTEXT_KEY.v);
}

/**
 * Check if the tracing is suppressed for the current context
 * @param context - The context to check for the suppress tracing flag
 * @returns true if tracing is suppressed for the current context otherwise false
 * @remarks This is used to check if tracing is suppressed for the current context and all child
 */
/*#__NO_SIDE_EFFECTS__*/
export function isTracingSuppressed(context: IOTelContext): boolean {
    return context.getValue(SUPPRESS_TRACING_CONTEXT_KEY.v) === true;
}
