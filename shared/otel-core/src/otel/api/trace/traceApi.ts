
import { IOTelApi } from "../../../interfaces/OTel/IOTelApi";
import { IOTelSpan } from "../../../interfaces/OTel/trace/IOTelSpan";
import { IOTelTraceApi } from "../../../interfaces/OTel/trace/IOTelTraceApi";
import { IOTelTracerOptions } from "../../../interfaces/OTel/trace/IOTelTracerOptions";
import { IOTelTracerProvider } from "../../../interfaces/OTel/trace/IOTelTracerProvider";
import { handleNotImplemented } from "../../../internal/otel/commonUtils";
import {
    deleteContextSpan, getContextActiveSpanContext, getContextSpan, isSpanContextValid, setContextSpan, setContextSpanContext,
    wrapSpanContext
} from "./utils";

/**
 * Create a new instance of the OpenTelemetry Trace API
 * @param otelApiCtx
 * @returns
 */
export function createTraceApi(otelApi: IOTelApi): IOTelTraceApi {
    let errorHandlers = otelApi.cfg.errorHandlers || {};
    let traceProvider: IOTelTracerProvider = otelApi;
    if (!traceProvider) {
        traceProvider = createNoopTraceProvider();
    }

    let traceApi: IOTelTraceApi = {
        setGlobalTracerProvider: (provider: IOTelTracerProvider) => {
            handleNotImplemented(errorHandlers, "setGlobalTracerProvider");
            return false;
        },

        getTracerProvider: () => {
            return traceProvider;
        },

        getTracer: (name: string, version?: string, options?: IOTelTracerOptions) => {
            return traceProvider.getTracer(name, version, options);
        },

        disable: () => {
            traceProvider = createNoopTraceProvider();
        },

        wrapSpanContext: wrapSpanContext,

        isSpanContextValid: isSpanContextValid,

        deleteSpan: deleteContextSpan,

        getSpan: getContextSpan,

        getActiveSpan: (): IOTelSpan | undefined => {
            let theSpan: IOTelSpan | undefined;
            theSpan = getContextSpan(otelApi.context.active());

            return theSpan;
        },

        setSpanContext: setContextSpanContext,

        getSpanContext: getContextActiveSpanContext,

        setSpan: setContextSpan
    };

    return traceApi;
}

function createNoopTraceProvider(): IOTelTracerProvider {
    throw new Error("Function not implemented.");
}
