// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { IAppInsightsCore } from "../../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IOTelTracer } from "../interfaces/trace/IOTelTracer";
import { IOTelTracerProvider } from "../interfaces/trace/IOTelTracerProvider";
import { createTracer } from "./tracer";

/**
 * Create a trace implementation with tracer caching.
 * @param core - The ApplicationInsights core instance
 * @returns A trace object
 * @internal
 */
export function createTracerProvider(core: IAppInsightsCore): IOTelTracerProvider {
    let tracers: { [key: string]: IOTelTracer } = {};

    return {
        getTracer(name: string, version?: string): IOTelTracer {
            const tracerKey = `${name|| "ai-web"}@${version || "unknown"}`;
            
            if (!tracers[tracerKey]) {
                tracers[tracerKey] = createTracer(core);
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
            core = null;
            return;
        }            
    };
}
