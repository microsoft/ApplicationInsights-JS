import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";

/**
 * Counter is the most common synchronous instrument. This instrument supports
 * an `Add(increment)` function for reporting a sum, and is restricted to
 * non-negative increments. The default aggregation is Sum, as for any additive
 * instrument.
 */
export interface ICounter<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Adds the given value to the current value. Values cannot be negative.
     * @param value the value to add.
     * @param attributes A set of attributes to associate with the value.
     */
    add(value: number, attributes?: AttributesTypes): void;
}
