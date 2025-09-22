// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelSpanOptions } from "../OpenTelemetry/interfaces/trace/IOTelSpanOptions";
import { IReadableSpan } from "../OpenTelemetry/interfaces/trace/IReadableSpan";
import { IDistributedTraceContext } from "./IDistributedTraceContext";

/**
 * A trace provider interface that enables different SKUs to provide their own
 * span implementations while being managed by the core SDK.
 *
 * This follows the OpenTelemetry TraceProvider pattern, allowing the core to
 * delegate span creation to the appropriate implementation based on the SDK variant.
 */
export interface ITraceProvider {
    /**
     * Creates a new span with the given name and options.
     *
     * @param name - The name of the span
     * @param options - Options for creating the span (kind, attributes, startTime)
     * @param parent - Optional parent context. If not provided, uses the current active trace context
     * @returns A new span instance specific to this provider's implementation
     */
    createSpan(name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan;

    /**
     * Return the current active span
     */
    activeSpan(): IReadableSpan | null;

    /**
     * Set the current Active Span
     * @param span - The span to set as the active span
     */
    setActiveSpan(span: IReadableSpan): void

    /**
     * Gets the provider identifier for debugging and logging purposes.
     * @returns A string identifying this trace provider implementation
     */
    getProviderId(): string;

    /**
     * Determines if this provider is available and ready to create spans.
     * @returns true if the provider can create spans, false otherwise
     */
    isAvailable(): boolean;
}
