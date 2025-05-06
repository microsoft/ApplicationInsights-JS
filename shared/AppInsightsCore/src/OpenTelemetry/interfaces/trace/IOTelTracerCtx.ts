// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "../context/IOTelContext";
import { IOTelContextManager } from "../context/IOTelContextManager";
import { IOTelSpan } from "./IOTelSpan";
import { IOTelSpanOptions } from "./IOTelSpanOptions";
import { IReadableSpan } from "./IReadableSpan";

/**
 * The context for the current IOTelSdk instance and it's configuration
 * @since 3.4.0
 */
export interface IOTelTracerCtx {
    /**
     * The current {@link IOTelContextManager} instance to use for the {@link IOTelTracer} instance
     * being created via the {@link createTracer} helper, this is effectively.
     * @returns The ContextManager instance
     */
    ctxMgr: IOTelContextManager;
    
    /**
     * Starts a new {@link IReadableSpan}. Start the span without setting it on context.
     *
     * This method do NOT modify the current Context.
     *
     * @param name - The name of the span
     * @param options - SpanOptions used for span creation
     * @param context - Context to use to extract parent
     * @returns Span The newly created span
     * @example
     *     const span = tracer.startSpan('op');
     *     span.setAttribute('key', 'value');
     *     span.end();
     */
    startSpan: (name: string, options?: IOTelSpanOptions, context?: IOTelContext) => IOTelSpan | IReadableSpan;
}
