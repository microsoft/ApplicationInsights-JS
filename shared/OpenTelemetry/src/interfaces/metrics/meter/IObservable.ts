import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";

/**
 * Base interface for all Observable metrics
 */
export interface IObservable<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Allows to define callbacks that will be called when metric data is collected
     */
    addCallback(): void;
    
    /**
     * Removes a callback
     */
    removeCallback(): void;
}
