import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";

/**
 * Histogram metric instrument to record a distribution of values.
 */
export interface IHistogram<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Records a measurement
     * @param value The measurement value
     * @param attributes A set of attributes to associate with the value
     */
    record(value: number, attributes?: AttributesTypes): void;
}
