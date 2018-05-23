/**
 * Telemety item supported in Core
 */
export interface ITelemetryItem {
    /**
     * Unique name of the telemetry item
     */ 
    name: string;

    /**
     * Timestamp when item was sent
     */ 
    timestamp: Date;

    /**
     * Telemetry type
     */ 
    baseType : string;

    /**
     * Identifier of the resource that uniquely identifies which resource data is sent to
     */ 
    instrumentationKey: string;

    /**
     * System context properties of the telemetry item, example: ip address, city etc
     */ 
    sytemProperties?: { [key: string]: any };

    /**
     * Telemetry properties pertaining to domain about which data is being captured. Example, duration, referrerUri for browser page
     * This is standard set by domain
     */
    domainProperties?: { [key: string]: any };


    /**
     * Custom properties to be captured about the telemetry item
     */
    customProperties?: { [key: string]: any };
}