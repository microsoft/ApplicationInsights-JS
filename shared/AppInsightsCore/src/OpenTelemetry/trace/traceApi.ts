import { fnBind } from "@nevware21/ts-utils";
import { setProtoTypeName } from "../../JavaScriptSDK/HelperFuncs";
import { UNDEFINED_VALUE } from "../../JavaScriptSDK/InternalConstants";
import { IDistributedTraceContext, IOTelContext, IOTelSpanContext } from "../../applicationinsights-core-js";
import { throwOTelError } from "../errors/OTelError";
import { IOTelApi } from "../interfaces/IOTelApi";
import { IOTelSpan } from "../interfaces/trace/IOTelSpan";
import { IOTelTraceApi } from "../interfaces/trace/IOTelTraceApi";
import { IOTelTracerProvider } from "../interfaces/trace/IOTelTracerProvider";
import {
    deleteContextSpan, getContextActiveSpanContext, getContextSpan, isSpanContextValid, setContextSpan, setContextSpanContext,
    wrapSpanContext
} from "./utils";

function _wrapSpanContext(otelApi: IOTelApi, spanContext: IOTelSpanContext) {
    otelApi.trace
}
/**
 * Create a new instance of the OpenTelemetry Trace API, this is bound to the
 * provided instance of the traceProvider (the {@link IOTelApi} instance),
 * to "change" (setGlobalTraceProvider) you MUST create a new instance of this API.
 * @param otelApi - The IOTelApi instance associated with this instance
 * @param dfTraceName - The default tracer name
 * @returns A new instance of the IOTelTraceApi for the provided ITelApi
 */
export function createTraceApi(otelApi: IOTelApi, dfTraceName: string): IOTelTraceApi {
    let traceProvider: IOTelTracerProvider = otelApi;
    if (!traceProvider) {
        throwOTelError("Must provide an otelApi instance");
    }

    let traceApi: IOTelTraceApi = setProtoTypeName({
        getTracer: fnBind(traceProvider.getTracer, traceProvider),

        // We use fnBind to automatically inject the "otelApi" argument as the first argument to the wrapSpanContext function
        wrapSpanContext: fnBind(wrapSpanContext, UNDEFINED_VALUE, [otelApi]) as unknown as (spanContext: IDistributedTraceContext | IOTelSpanContext) => IOTelSpan,

        isSpanContextValid: isSpanContextValid,

        deleteSpan: deleteContextSpan,

        getSpan: getContextSpan,

        getActiveSpan: (): IOTelSpan | undefined => {
            let theSpan: IOTelSpan | undefined;
            theSpan = getContextSpan(otelApi.context.active());

            return theSpan;
        },

        setSpanContext: fnBind(setContextSpanContext, UNDEFINED_VALUE, [otelApi]) as unknown as (context: IOTelContext, spanContext: IDistributedTraceContext | IOTelSpanContext) => IOTelContext,

        getSpanContext: getContextActiveSpanContext,

        setSpan: setContextSpan
    }, "OTelTraceApi");

    return traceApi;
}
