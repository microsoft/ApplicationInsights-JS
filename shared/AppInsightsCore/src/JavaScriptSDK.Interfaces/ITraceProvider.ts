// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelApi } from "../OpenTelemetry/interfaces/IOTelApi";
import { IOTelSpanOptions } from "../OpenTelemetry/interfaces/trace/IOTelSpanOptions";
import { IReadableSpan } from "../OpenTelemetry/interfaces/trace/IReadableSpan";
import { IConfiguration } from "./IConfiguration";
import { IDistributedTraceContext } from "./IDistributedTraceContext";

/**
 * A trace provider interface that enables different SKUs to provide their own
 * span implementations while being managed by the core SDK.
 *
 * This follows the OpenTelemetry TraceProvider pattern, allowing the core to
 * delegate span creation to the appropriate implementation based on the SDK variant.
 *
 * @since 3.4.0
 */
export interface ITraceProvider {
    /**
     * The OpenTelemetry API instance associated with this trace provider.
     * This provides access to the tracer provider and other OpenTelemetry functionality.
     * @since 3.4.0
     */
    readonly api: IOTelApi;
    
    /**
     * Creates a new span with the given name and options.
     *
     * @param name - The name of the span
     * @param options - Options for creating the span (kind, attributes, startTime)
     * @param parent - Optional parent context. If not provided, uses the current active trace context
     * @returns A new span instance specific to this provider's implementation
     * @since 3.4.0
     */
    createSpan(name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan;

    /**
     * Gets the provider identifier for debugging and logging purposes.
     * @returns A string identifying this trace provider implementation
     * @since 3.4.0
     */
    getProviderId(): string;

    /**
     * Determines if this provider is available and ready to create spans.
     * @returns true if the provider can create spans, false otherwise
     * @since 3.4.0
     */
    isAvailable(): boolean;
}

/**
 * Interface for OpenTelemetry trace operations.
 * This interface provides span creation, context management, and trace provider operations
 * that are common across different SDK implementations (Core, AISKU, etc.).
 *
 * @since 3.4.0
 */
export interface ITraceHost<CfgType extends IConfiguration = IConfiguration> {

    /*
    * Config object that was used to initialize AppInsights / ITraceHost
    */
    readonly config: CfgType;

    /**
     * Gets the current distributed trace active context for this instance
     * @param createNew - Optional flag to create a new instance if one doesn't currently exist, defaults to true. By default this
     * will use any located parent as defined by the {@link IConfiguration.traceHdrMode} configuration for each new instance created.
     */
    getTraceCtx(createNew?: boolean): IDistributedTraceContext | null;

    /**
     * Sets the current distributed trace context for this instance if available
     */
    setTraceCtx(newTraceCtx: IDistributedTraceContext | null | undefined): void;

    /**
     * Start a new span with the given name and optional parent context.
     *
     * Note: This method only creates and returns the span. It does not automatically
     * set the span as the active trace context. Context management should be handled
     * separately using setTraceCtx() if needed.
     *
     * @param name - The name of the span
     * @param options - Options for creating the span (kind, attributes, startTime)
     * @param parent - Optional parent context. If not provided, uses the current active trace context
     * @returns A new span instance, or null if no trace provider is available
     * @since 3.4.0
     */
    startSpan(name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan | null;

    /**
     * Return the current active span, if no trace provider is available null will be returned
     * @returns The current active span or null if no trace provider is available
     * @since 3.4.0
     */
    activeSpan(): IReadableSpan | null;

    /**
     * Set the current Active Span, if no trace provider is available the span will be not be set as the active span.
     * @param span - The span to set as the active span
     * @returns An ISpanScope instance that provides the current scope, the span will always be the span passed in
     * even when no trace provider is available
     * @since 3.4.0
     */
    setActiveSpan(span: IReadableSpan): ISpanScope

    /**
     * Get the current trace provider.
     *
     * @returns The current trace provider, or null if none is set
     * @since 3.4.0
     */
    getTraceProvider(): ITraceProvider | null;
}

/**
 * Represents the execution scope for a span, combining the trace instance and the active span.
 * This interface is used as the context for executing functions within a span's scope.
 *
 * @since 3.4.0
 */
export interface ISpanScope<T extends ITraceHost = ITraceHost> {
    /**
     * The trace host (core or AISKU instance).
     * @since 3.4.0
     */
    readonly host: T;

    /**
     * The active span for this execution scope.
     * @since 3.4.0
     */
    readonly span: IReadableSpan;

    /**
     * The previously active span before this scope was created, if any.
     * @since 3.4.0
     */
    readonly prvSpan?: IReadableSpan;

    /**
     * Restores the previous active span in the trace instance.
     * @since 3.4.0
     */
    restore(): void;
}
