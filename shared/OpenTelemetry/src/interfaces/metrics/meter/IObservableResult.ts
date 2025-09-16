import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";

/**
 * Interface for observable result
 */
export interface IObservableResult<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Records the current value for the metric instrument.
     * @param value The measurement value
     * @param attributes A set of attributes to associate with the value
     */
    observe(value: number, attributes?: AttributesTypes): void;
}

/**
 * BatchObservableResult provides a way to observe multiple metrics in a batch.
 */
export interface IBatchObservableResult<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Records the current value for a specific metric instrument.
     * @param metric The metric to observe
     * @param value The measurement value
     * @param attributes A set of attributes to associate with the value
     */
    observe(metric: object, value: number, attributes?: AttributesTypes): void;
}
