// This file has been commented out as it should NOT reference OpenTelemetry API directly
// This is causing build / test issues due to OpenTeelemetry API initializing global state
// import { Baggage, BaggageEntry, TextMapGetter, TextMapPropagator, TextMapSetter } from "@opentelemetry/api";
// import { IOTelContext } from "../context/IOTelContext";

// /**
//  * IOTelPropagationApi provides an interface definition for the OpenTelemetry PropagationAPI
//  */
// export interface IOTelPropagationApi {
//     /**
//      * Set the current propagator for the current API instance.
//      * @param provider - The {@link TextMapPropagator} to be set as the global metrics provider for this API instance
//      *
//      * @returns true if the propgator was successfully registered, else false
//      */
//     setGlobalPropagator(propagator: TextMapPropagator): boolean;

//     /**
//      * Inject context into a carrier to be propagated inter-process
//      *
//      * @param context - Context carrying tracing data to inject
//      * @param carrier - carrier to inject context into
//      * @param setter - Function used to set values on the carrier
//      */
//     inject<Carrier>(context: IOTelContext, carrier: Carrier, setter?: TextMapSetter<Carrier>): void;

//     /**
//      * Extract context from a carrier
//      *
//      * @param context - Context which the newly created context will inherit from
//      * @param carrier - Carrier to extract context from
//      * @param getter - Function used to extract keys from a carrier
//      */
//     extract<Carrier>(context: IOTelContext, carrier: Carrier, getter?: TextMapGetter<Carrier>): IOTelContext;

//     /**
//      * Return a list of all fields which may be used by the propagator.
//      */
//     fields(): string[];

//     /** Remove the global propagator */
//     disable(): void;

//     createBaggage(entries?: Record<string, BaggageEntry>): Baggage;

//     getBaggage(context: IOTelContext): Baggage | undefined;

//     getActiveBaggage(): Baggage | undefined;

//     setBaggage(context: IOTelContext, baggage: Baggage): IOTelContext;

//     deleteBaggage(context: IOTelContext): IOTelContext;
// }
