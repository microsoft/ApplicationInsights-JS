import { fnBind } from "@nevware21/ts-utils";
import { setProtoTypeName } from "../../JavaScriptSDK/HelperFuncs";
import { UNDEFINED_VALUE } from "../../JavaScriptSDK/InternalConstants";
import { IDistributedTraceContext } from "../../applicationinsights-core-js";
import { throwOTelError } from "../errors/OTelError";
import { IOTelApi } from "../interfaces/IOTelApi";
import { IOTelTracerProvider } from "../interfaces/trace/IOTelTracerProvider";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { ITraceApi } from "../interfaces/trace/ITraceApi";
import { isSpanContextValid, wrapSpanContext } from "./utils";

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

    let activeSpan: IReadableSpan = null;

    let traceApi: ITraceApi = setProtoTypeName({
        getTracer: fnBind(traceProvider.getTracer, traceProvider),

        // We use fnBind to automatically inject the "otelApi" argument as the first argument to the wrapSpanContext function
        wrapSpanContext: fnBind(wrapSpanContext, UNDEFINED_VALUE, [otelApi]) as unknown as (spanContext: IDistributedTraceContext) => IReadableSpan,

        isSpanContextValid: isSpanContextValid,

        getActiveSpan: (): IReadableSpan | undefined | null => {
            return activeSpan;
        },
        setActiveSpan(span: IReadableSpan | undefined | null) {
            activeSpan = span;
        },
    }, "TraceApi");

    return traceApi;
}
