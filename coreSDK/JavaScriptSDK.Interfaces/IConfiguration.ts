/**
 * Configuration provided to SDK core
 */
export interface IConfiguration {
    instrumentationKey: string; // todo: update later for multi-tenant?
    
    endpointUrl: string;

    extensions: { [key: string]: any }; // extension configs
}