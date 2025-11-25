// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { IOTelTracer } from "./IOTelTracer";

export declare interface IOTelTracerOptions {
    /**
     * The schemaUrl of the tracer or instrumentation library
     */
    schemaUrl?: string;
}

/**
 * OpenTelemetry Trace API for getting tracers.
 * This provides the standard OpenTelemetry trace API entry point.
 */
export interface IOTelTracerProvider {
    /**
     * Returns a Tracer, creating one if one with the given name and version is
     * not already created. This may return
     * - The same Tracer instance if one has already been created with the same name and version
     * - A new Tracer instance if one has not already been created with the same name and version
     * - A non-operational Tracer if the provider is not operational
     *
     * @param name - The name of the tracer or instrumentation library.
     * @param version - The version of the tracer or instrumentation library.
     * @param options - The options of the tracer or instrumentation library.
     * @returns Tracer A Tracer with the given name and version
     */
    getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer;

    /**
     * Forces the tracer provider to flush any buffered data.
     * @returns A promise that resolves when the flush is complete.
     */
    forceFlush?: () => IPromise<void> | void;

    /**
     * Shuts down the tracer provider and releases any resources.
     * @returns A promise that resolves when the shutdown is complete.
     */
    shutdown?: () => IPromise<void> | void;
}
