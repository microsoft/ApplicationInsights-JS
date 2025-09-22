import { IAppInsightsCore } from "../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IOTelConfig } from "./config/IOTelConfig";
import { IOTelTracerProvider } from "./trace/IOTelTracerProvider";
import { ITraceApi } from "./trace/ITraceApi";

/**
 * The main OpenTelemetry API interface that provides access to all OpenTelemetry functionality.
 * This interface extends the IOTelTracerProvider and serves as the entry point for OpenTelemetry operations.
 * 
 * @example
 * ```typescript
 * // Get a tracer from the API instance
 * const tracer = otelApi.getTracer("my-component");
 * 
 * // Create a span
 * const span = tracer.startSpan("operation");
 * 
 * // Access context manager
 * const currentContext = otelApi.context.active();
 * 
 * // Access trace API
 * const activeSpan = otelApi.trace.getActiveSpan();
 * ```
 * 
 * @since 3.4.0
 */
export interface IOTelApi extends IOTelTracerProvider {
    /**
     * The configuration object that contains all OpenTelemetry-specific settings.
     * This includes tracing configuration, error handlers, and other OpenTelemetry options.
     * 
     * @remarks
     * Changes to this configuration after initialization may not take effect until
     * the next telemetry operation, depending on the implementation.
     */
    cfg: IOTelConfig;

    /**
     * The current {@link IAppInsightsCore} instance for this IOTelApi instance, this is effectively
     * the OpenTelemetry ContextAPI instance without the static methods.
     * @returns The ContextManager instance
     */
    core: IAppInsightsCore;
    
    /**
     * The current {@link ITraceApi} instance for this IOTelApi instance, this is
     * effectively the OpenTelemetry TraceAPI instance without the static methods.
     * @returns The current {@link ITraceApi} instance
     */
    trace: ITraceApi;

    // propagation?: IOTelPropagationApi;

    // metrics?: IOTelMetricsApi;
}
