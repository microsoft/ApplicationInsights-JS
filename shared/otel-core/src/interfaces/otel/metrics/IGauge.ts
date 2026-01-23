// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelAttributes } from "../IOTelAttributes";

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
