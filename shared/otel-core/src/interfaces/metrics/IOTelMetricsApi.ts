// This file has been commented out as it should NOT reference OpenTelemetry API directly
// This is causing build / test issues due to OpenTeelemetry API initializing global state
// import { Meter, MeterOptions, MeterProvider } from "@opentelemetry/api";

// /**
//  * IOTelMetricsApi provides an interface definition for the OpenTelemetry MetricsAPI
//  */
// export interface IOTelMetricsApi {
//     /**
//      * Set the current global metrics provider for the current API instance.
//      * @param provider - The {@link MeterProvider} to be set as the global metrics provider for this API instance
//      *
//      * @returns true if the metrics provider was successfully registered, else false
//      */
//     setGlobalMeterProvider(provider: MeterProvider): boolean;

//     /**
//      * Returns the global meter provider for this API instance.
//      */
//     getMeterProvider(): MeterProvider;

//     /**
//      * Returns a meter from the global meter provider for this API instance.
//      * @param name - The name of the meter or instrumentation library.
//      * @param version - The required version of the meter.
//      * @param options - The options of the meter library.
//      * @returns Meter A Meter with the given name and version
//      */
//     getMeter(name: string, version?: string, options?: MeterOptions): Meter;

//     /**
//      * Remove the global meter provider from this API instance
//      */
//     disable(): void;

// }
