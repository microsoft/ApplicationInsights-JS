import { ICachedValue, fnBind, getDeferred } from "@nevware21/ts-utils";
import { IDistributedTraceContext } from "../../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { setProtoTypeName } from "../../JavaScriptSDK/HelperFuncs";
import { UNDEFINED_VALUE } from "../../JavaScriptSDK/InternalConstants";
import { throwOTelError } from "../errors/OTelError";
import { IOTelApi } from "../interfaces/IOTelApi";
import { IOTelTracerProvider } from "../interfaces/trace/IOTelTracerProvider";
import { IReadableSpan } from "../interfaces/trace/IReadableSpan";
import { ITraceApi } from "../interfaces/trace/ITraceApi";
import { isSpanContextValid, wrapSpanContext } from "./utils";

/**
 * @internal
 * Create a new instance of the OpenTelemetry Trace API, this is bound to the
 * provided instance of the traceProvider (the {@link IOTelApi} instance),
 * to "change" (setGlobalTraceProvider) you MUST create a new instance of this API.
 * @param otelApi - The IOTelApi instance associated with this instance
 * @returns A new instance of the ITraceApi for the provided ITelApi
 */
export function _createTraceApi(otelApi: IOTelApi): ICachedValue<ITraceApi> {
    let traceProvider: IOTelTracerProvider = otelApi;
    if (!traceProvider) {
        throwOTelError("Must provide an otelApi instance");
    }

    return getDeferred(() => {
        return setProtoTypeName({
            getTracer: fnBind(traceProvider.getTracer, traceProvider),

            // We use fnBind to automatically inject the "otelApi" argument as the first argument to the wrapSpanContext function
            wrapSpanContext: fnBind(wrapSpanContext, UNDEFINED_VALUE, [otelApi]) as unknown as (spanContext: IDistributedTraceContext) => IReadableSpan,

            isSpanContextValid: isSpanContextValid,

            getActiveSpan: (): IReadableSpan | undefined | null => {
                return otelApi.host ? otelApi.host.getActiveSpan() : null;
            },
            setActiveSpan(span: IReadableSpan | undefined | null) {
                return otelApi.host ? otelApi.host.setActiveSpan(span) : null;
            }
        }, "TraceApi");
    });
}
