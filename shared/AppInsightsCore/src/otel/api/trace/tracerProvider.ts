// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { ITraceHost } from "../../../interfaces/ai/ITraceProvider";
import { IOTelTracer } from "../../../interfaces/otel/trace/IOTelTracer";
import { IOTelTracerProvider } from "../../../interfaces/otel/trace/IOTelTracerProvider";
import { _createTracer } from "./tracer";

/**
 * @internal
 * Create a trace implementation with tracer caching.
 * @param core - The ApplicationInsights core instance
 * @returns A trace object
 */
export function _createTracerProvider(host: ITraceHost): IOTelTracerProvider {
    let tracers: { [key: string]: IOTelTracer } = {};

    return {
        getTracer(name: string, version?: string): IOTelTracer {
            const tracerKey = (name|| "ai-web") + "@" + (version || "unknown");
            
            if (!tracers[tracerKey]) {
                tracers[tracerKey] = _createTracer(host);
            }
            
            return tracers[tracerKey];
        },
        forceFlush(): IPromise<void> | void {
            // Nothing to flush
            return;
        },
        shutdown(): IPromise<void> | void {
            // Just clear the locally cached IOTelTracer instances so they can be garbage collected
            tracers = {};
            host = null;
            return;
        }
    };
}
