// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { DataPointType } from "./DataPointType";

/**
 * Metric data single measurement.
 */
export interface IDataPoint {

    /**
     * Name of the metric.
     */
    name: string;

    /**
     * Metric type. Single measurement or the aggregated value.
     */
    kind: DataPointType;

    /**
     * Single value for measurement. Sum of individual measurements for the aggregation.
     */
    value: number;

    /**
     * Metric weight of the aggregated metric. Should not be set for a measurement.
     */
    count: number;

    /**
     * Minimum value of the aggregated metric. Should not be set for a measurement.
     */
    min: number;

    /**
     * Maximum value of the aggregated metric. Should not be set for a measurement.
     */
    max: number;

    /**
     * Standard deviation of the aggregated metric. Should not be set for a measurement.
     */
    stdDev: number;
}
