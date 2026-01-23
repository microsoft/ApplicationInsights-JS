// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { strNotSpecified } from "../../constants/Constants";
import { FieldType } from "../../enums/ai/Enums";
import { IDiagnosticLogger } from "../../interfaces/ai/IDiagnosticLogger";
import { IMetricData } from "../../interfaces/ai/contracts/IMetricData";
import { ISerializable } from "../../interfaces/ai/telemetry/ISerializable";
import { DataPoint } from "./Common/DataPoint";
import { dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString } from "./Common/DataSanitizer";

export class Metric implements IMetricData, ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
    public static dataType = "MetricData";

    public aiDataContract = {
        ver: FieldType.Required,
        metrics: FieldType.Required,
        properties: FieldType.Default
    }

    /**
     * Schema version
     */
    public ver: number; /* 2 */

    /**
     * List of metrics. Only one metric in the list is currently supported by Application Insights storage. If multiple data points were sent only the first one will be used.
     */
    public metrics: DataPoint[]; /* [] */
 
    /**
     * Collection of custom properties.
     */
    properties: any; /* {} */
 
    /**
     * Collection of custom measurements.
     */
    measurements: any; /* {} */
 
    /**
     * Constructs a new instance of the MetricTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name: string, value: number, count?: number, min?: number, max?: number, stdDev?: number, properties?: any, measurements?: { [key: string]: number }) {
        let _self = this;
        _self.ver = 2;
        const dataPoint = new DataPoint();
        dataPoint.count = count > 0 ? count : undefined;
        dataPoint.max = isNaN(max) || max === null ? undefined : max;
        dataPoint.min = isNaN(min) || min === null ? undefined : min;
        dataPoint.name = dataSanitizeString(logger, name) || strNotSpecified;
        dataPoint.value = value;
        dataPoint.stdDev = isNaN(stdDev) || stdDev === null ? undefined : stdDev;

        _self.metrics = [dataPoint];
        _self.properties = dataSanitizeProperties(logger, properties);
        _self.measurements = dataSanitizeMeasurements(logger, measurements);
    }
}
