// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Interface for telemetry trace context.
 * @deprecated Use {@link ITraceHost.getTraceCtx | appInsights.getTraceCtx()} or {@link ITraceHost.getTraceCtx | appInsights.core.getTraceCtx()} instead to get / set the
 * current trace context. This returns an {@link IDistributedTraceContext} which supports distributed tracing and
 * allows the core to manage the trace context.
 *
 * To replace the entire trace context, use {@link ITraceHost.setTraceCtx | appInsights.core.setTraceCtx()}.
 *
 * @see {@link https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/IDistributedTraceContext.html | IDistributedTraceContext Typedoc}
 * @see {@link https://microsoft.github.io/ApplicationInsights-JS/webSdk/applicationinsights-core-js/interfaces/ITraceHost.html#getTraceCtx | getTraceCtx Typedoc}
 */
export interface ITelemetryTrace {
    /**
     * The trace ID for this telemetry context. A 32 lowercase hex character string.
     * @deprecated Use {@link IDistributedTraceContext.traceId} instead via `appInsights.getTraceCtx().traceId`.
     *
     * @example
     * ```typescript
     * // Old (deprecated)
     * let traceId = context.telemetryTrace.traceID;
     *
     * // New (recommended) - using the standard SKU (AISKU)
     * let traceCtx = appInsights.getTraceCtx();
     * let traceId = traceCtx.traceId;
     * traceCtx.traceId = "00000000000000000000000000000001";
     *
     * // Or when using the core directly
     * let traceCtx = appInsights.core.getTraceCtx();
     * ```
     */
    traceID?: string;

    /**
     * The parent span ID. A 16 lowercase hex character string.
     * @deprecated Use {@link IDistributedTraceContext.spanId} instead via `appInsights.getTraceCtx().spanId`.
     *
     * @example
     * ```typescript
     * // Old (deprecated)
     * let parentId = context.telemetryTrace.parentID;
     *
     * // New (recommended) - using the standard SKU (AISKU)
     * let traceCtx = appInsights.getTraceCtx();
     * let spanId = traceCtx.spanId;
     * traceCtx.spanId = "0000000000000001";
     *
     * // Or when using the core directly
     * let traceCtx = appInsights.core.getTraceCtx();
     * ```
     */
    parentID?: string;

    /**
     * An integer representation of the W3C TraceContext trace-flags.
     * @deprecated Use {@link IDistributedTraceContext.traceFlags} instead via `appInsights.getTraceCtx().traceFlags`.
     *
     * @example
     * ```typescript
     * // Old (deprecated)
     * let flags = context.telemetryTrace.traceFlags;
     *
     * // New (recommended) - using the standard SKU (AISKU)
     * let traceCtx = appInsights.getTraceCtx();
     * let flags = traceCtx.traceFlags;
     * traceCtx.traceFlags = 1; // sampled
     *
     * // Or when using the core directly
     * let traceCtx = appInsights.core.getTraceCtx();
     * ```
     *
     * @see {@link https://www.w3.org/TR/trace-context/#trace-flags | W3C TraceContext trace-flags}
     */
    traceFlags?: number;

    /**
     * The operation/page name for this trace context.
     * @deprecated Use {@link IDistributedTraceContext.pageName} instead via `appInsights.getTraceCtx().pageName`.
     *
     * @example
     * ```typescript
     * // Old (deprecated)
     * let name = context.telemetryTrace.name;
     *
     * // New (recommended) - using the standard SKU (AISKU)
     * let traceCtx = appInsights.getTraceCtx();
     * let pageName = traceCtx.pageName;
     * traceCtx.pageName = "my-page";
     *
     * // Or when using the core directly
     * let traceCtx = appInsights.core.getTraceCtx();
     * ```
     */
    name?: string;
}
