// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ICachedValue, fnBind, getDeferred } from "@nevware21/ts-utils";
import { UNDEFINED_VALUE } from "../../../constants/InternalConstants";
import { IDistributedTraceContext } from "../../../interfaces/ai/IDistributedTraceContext";
import { IOTelApi } from "../../../interfaces/otel/IOTelApi";
import { ITraceApi } from "../../../interfaces/otel/trace/IOTelTraceApi";
import { IOTelTracerProvider } from "../../../interfaces/otel/trace/IOTelTracerProvider";
import { IReadableSpan } from "../../../interfaces/otel/trace/IReadableSpan";
import { setProtoTypeName } from "../../../utils/HelperFuncs";
import { throwOTelError } from "../errors/OTelError";
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
