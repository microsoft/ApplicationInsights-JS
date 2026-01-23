// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { FieldType } from "../../../enums/AppInsights/Enums";
import { DataPointType } from "../../../interfaces/AppInsights/contracts/DataPointType";
import { IDataPoint } from "../../../interfaces/AppInsights/contracts/IDataPoint";
import { ISerializable } from "../../../interfaces/AppInsights/telemetry/ISerializable";

export class DataPoint implements IDataPoint, ISerializable {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract = {
        name: FieldType.Required,
        kind: FieldType.Default,
        value: FieldType.Required,
        count: FieldType.Default,
        min: FieldType.Default,
        max: FieldType.Default,
        stdDev: FieldType.Default
    }

    /**
     * Name of the metric.
     */
    public name: string;

    /**
     * Metric type. Single measurement or the aggregated value.
     */
    public kind: DataPointType = DataPointType.Measurement;
 
    /**
     * Single value for measurement. Sum of individual measurements for the aggregation.
     */
    public value: number;
 
    /**
     * Metric weight of the aggregated metric. Should not be set for a measurement.
     */
    public count: number;
 
    /**
     * Minimum value of the aggregated metric. Should not be set for a measurement.
     */
    public min: number;
 
    /**
     * Maximum value of the aggregated metric. Should not be set for a measurement.
     */
    public max: number;
 
    /**
     * Standard deviation of the aggregated metric. Should not be set for a measurement.
     */
    public stdDev: number;
}
