// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelAttributes } from "../IOTelAttributes";

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
