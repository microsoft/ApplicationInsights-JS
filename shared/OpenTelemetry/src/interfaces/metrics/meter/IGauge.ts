import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";

/**
 * Gauge metric instrument for recording current value.
 */
export interface IGauge<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Records a measurement
     * @param value The measurement value
     * @param attributes A set of attributes to associate with the value
     */
    record(value: number, attributes?: AttributesTypes): void;
}
