import { fnBind } from "@nevware21/ts-utils";
import { IDistributedTraceContext } from "../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { setProtoTypeName } from "../../JavaScriptSDK/HelperFuncs";
import { UNDEFINED_VALUE } from "../../JavaScriptSDK/InternalConstants";
import { createDistributedTraceContext, isDistributedTraceContext } from "../../JavaScriptSDK/TelemetryHelpers";
import { throwOTelError } from "../errors/OTelError";
import { IOTelApi } from "../interfaces/IOTelApi";
import { IOTelTracerProvider } from "../interfaces/trace/IOTelTracerProvider";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { ITraceApi } from "../interfaces/trace/ITraceApi";
import { createNonRecordingSpan, isSpanContextValid, wrapSpanContext } from "./utils";

/**
 * Create a new instance of the OpenTelemetry Trace API, this is bound to the
 * provided instance of the traceProvider (the {@link IOTelApi} instance),
 * to "change" (setGlobalTraceProvider) you MUST create a new instance of this API.
 * @param otelApi - The IOTelApi instance associated with this instance
 * @param dfTraceName - The default tracer name
 * @returns A new instance of the ITraceApi for the provided ITelApi
 */
export function createTraceApi(otelApi: IOTelApi, dfTraceName: string): ITraceApi {
    let traceProvider: IOTelTracerProvider = otelApi;
    if (!traceProvider) {
        throwOTelError("Must provide an otelApi instance");
    }

    let activeSpan: IReadableSpan;

    let traceApi: ITraceApi = setProtoTypeName({
        getTracer: fnBind(traceProvider.getTracer, traceProvider),

        // We use fnBind to automatically inject the "otelApi" argument as the first argument to the wrapSpanContext function
        wrapSpanContext: fnBind(wrapSpanContext, UNDEFINED_VALUE, [otelApi]) as unknown as (spanContext: IDistributedTraceContext) => IReadableSpan,

        isSpanContextValid: isSpanContextValid,

        getActiveSpan: (): IReadableSpan | undefined | null => {
            if (!activeSpan) {
                // If there is no active span, return a non-recording span
                activeSpan = createNonRecordingSpan(otelApi, dfTraceName, otelApi.core && otelApi.core.getTraceCtx ? otelApi.core.getTraceCtx() : null);
            }
            
            return activeSpan;
        },
        setActiveSpan(span: IReadableSpan | undefined | null) {
            activeSpan = span;
            let theSpanContext: IDistributedTraceContext = null;
            if (span) {
                let core = otelApi.core;
                
                let otelSpanContext: IDistributedTraceContext = null;
                if (span.spanContext) {
                    // May be a valid IDistributedTraceContext or an OpenTelemetry SpanContext
                    otelSpanContext = span.spanContext();
                } else if ((span as any).context) {
                    // Legacy OpenTelemetry API support (Note: The returned context won't be a valid IDistributedTraceContext)
                    otelSpanContext = (span as any).context();
                }

                if (otelSpanContext) {
                    if (isDistributedTraceContext(otelSpanContext)) {
                        theSpanContext = otelSpanContext;
                    } else {
                        // Support Spans from other libraries that may not be using the IDistributedTraceContext
                        // If the spanContext is not a valid IDistributedTraceContext then we need to create a new one
                        // and optionally set the parentSpanContext if it exists

                        // Grab the current trace context from the core SDK to treat as the parent context
                        if (core && core.getTraceCtx) {
                            theSpanContext = core.getTraceCtx();
                        }

                        // Create a new context using the current trace context as the parent
                        theSpanContext = createDistributedTraceContext(theSpanContext);

                        let parentContext: any = span.parentSpanContext;
                        if (!parentContext) {
                            if (span.parentSpanId) {
                                parentContext = {
                                    traceId: (otelSpanContext as any).traceId,
                                    spanId: span.parentSpanId
                                };
                            }
                        }

                        // Was there a defined parent context and is it different from the current basic context
                        if (parentContext && parentContext.traceId !== theSpanContext.traceId && parentContext.spanId !== theSpanContext.spanId && parentContext.traceFlags !== theSpanContext.traceFlags) {
                            // Assign the parent details to this new context
                            theSpanContext.traceId = parentContext.traceId;
                            theSpanContext.spanId = parentContext.spanId;
                            theSpanContext.traceFlags = parentContext.traceFlags;

                            // Now create a new "Child" context which is extending the parent context
                            theSpanContext = createDistributedTraceContext(theSpanContext);
                        }

                        theSpanContext.traceId = (otelSpanContext as any).traceId;
                        theSpanContext.spanId = (otelSpanContext as any).spanId;
                        theSpanContext.traceFlags = (otelSpanContext as any).traceFlags;
                    }
                }

                // Set the current trace context for the core SDK
                // This is REQUIRED for the SDK to correctly associate telemetry with the current span context
                otelApi.core && otelApi.core.setTraceCtx(theSpanContext);
            }
        }
    }, "TraceApi");

    return traceApi;
}
