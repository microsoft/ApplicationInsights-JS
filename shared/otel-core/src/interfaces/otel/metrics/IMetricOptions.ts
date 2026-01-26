// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMetricAdvice } from "./IMetricAdvice";
import { eValueType } from "./eValueType";

/**
 * Options needed for metric creation
 */
export interface IMetricOptions {
    /**
     * The description of the Metric.
     * @default ''
     */
    description?: string;
    
    /**
     * The unit of the Metric values.
     * @default ''
     */
    unit?: string;
    
    /**
     * Indicates the type of the recorded value.
     * @default {@link eValueType.DOUBLE}
     */
    valueType?: eValueType;
    
    /**
     * The advice influencing aggregation configuration parameters.
     * @experimental
     */
    advice?: IMetricAdvice;
}
