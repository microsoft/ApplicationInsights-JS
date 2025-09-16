import { IOTelConfig, IOTelContextManager, IOTelTracerProvider } from "@microsoft/applicationinsights-core-js";
import { IOTelMetricsApi } from "./metrics/IOTelMetricsApi";
import { IOTelPropagationApi } from "./propagation/IOTelPropagationApi";
import { IOTelTraceApi } from "./trace/IOTelTraceApi";

export interface IOTelApi extends IOTelTracerProvider {
    cfg: IOTelConfig;

    /**
     * The current ContextManager instance for this IOTelApi instance, this is effectively
     * the OpenTelemetry ContextAPI instance without the static methods.
     * @returns The ContextManager instance
     */
    context: IOTelContextManager;
    
    /**
     * The current {@link IOTelTraceApi} instance for this IOTelApi instance, this is
     * effectively the OpenTelemetry TraceAPI instance without the static methods.
     * @returns The current {@link IOTelTraceApi} instance
     */
    trace: IOTelTraceApi;

    propagation?: IOTelPropagationApi;

    metrics?: IOTelMetricsApi;
}
