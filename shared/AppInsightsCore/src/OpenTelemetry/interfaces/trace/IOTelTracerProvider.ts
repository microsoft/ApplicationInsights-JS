import { IOTelTracer } from "./IOTelTracer";
import { IOTelTracerOptions } from "./IOTelTracerOptions";

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
}
  