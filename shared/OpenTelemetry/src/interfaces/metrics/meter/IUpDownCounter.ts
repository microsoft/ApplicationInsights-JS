import { IOTelAttributes } from "@microsoft/applicationinsights-core-js";

/**
 * UpDownCounter is a synchronous instrument and very similar to Counter except
 * that Add(increment) supports negative increments. It is generally useful for
 * capturing changes in an amount of resources used, or any quantity that rises
 * and falls during a request.
 */
export interface IUpDownCounter<AttributesTypes extends IOTelAttributes = IOTelAttributes> {
    /**
     * Adds the given value to the current value. Values can be positive or negative.
     * @param value the value to add.
     * @param attributes A set of attributes to associate with the value.
     */
    add(value: number, attributes?: AttributesTypes): void;
}
