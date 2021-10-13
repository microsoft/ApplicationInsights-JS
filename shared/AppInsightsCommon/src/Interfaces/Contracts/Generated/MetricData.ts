// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Domain } from "./Domain";
import { DataPoint } from "./DataPoint";

/**
 * An instance of the Metric item is a list of measurements (single data points) and/or aggregations.
 */
export class MetricData implements Domain {

    /**
     * Schema version
     */
    public ver: number = 2;

    /**
     * List of metrics. Only one metric in the list is currently supported by Application Insights storage. If multiple data points were sent only the first one will be used.
     */
    public metrics: DataPoint[] = [];

    /**
     * Collection of custom properties.
     */
    public properties: any = {};

    /**
     * Collection of custom measurements.
     */
    public measurements: any = {};

    constructor() {
    }
}
