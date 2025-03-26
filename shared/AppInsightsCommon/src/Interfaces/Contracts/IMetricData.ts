// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDataPoint } from "./IDataPoint";
import { IDomain } from "./IDomain";

/**
 * An instance of the Metric item is a list of measurements (single data points) and/or aggregations.
 */
export interface IMetricData extends IDomain {

    /**
     * Schema version
     */
    ver: number; /* 2 */

    /**
     * List of metrics. Only one metric in the list is currently supported by Application Insights storage. If multiple data points were sent only the first one will be used.
     */
    metrics: IDataPoint[]; /* [] */

    /**
     * Collection of custom properties.
     */
    properties: any; /* {} */

    /**
     * Collection of custom measurements.
     */
    measurements: any; /* {} */
}
