"use strict";

/**
 * Configuration provided to SDK core
 */
export interface IConfiguration {

    /**
    * Instrumentation key of resource
    */
    instrumentationKey: string; // todo: update later for multi-tenant?
    
    /**
    * Endpoint where telemetry data is sent
    */
    endpointUrl?: string;

    /**
    * Extension configs loaded in SDK
    */
    extensions?: { [key: string]: any }; // extension configs
}