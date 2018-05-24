///<reference path="../../node_modules/applicationinsights-common/bundle/aicommon.d.ts" />
import { MetricData } from '../../JavaScriptSDK.Interfaces/Contracts/Generated/MetricData';
import { ISerializable } from '../../JavaScriptSDK.Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Serializer';
import { DataPoint } from './Common/DataPoint';
import { SeverityLevel } from '../../JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel';
import { Util } from 'applicationinsights-common';

export class Metric extends MetricData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
    public static dataType = "MetricData";

    public aiDataContract = {
        ver: FieldType.Required,
        metrics: FieldType.Required,
        properties: FieldType.Default
    }

    /**
     * Constructs a new instance of the MetricTelemetry object
     */
    constructor(name: string, value: number, count?: number, min?: number, max?: number, properties?: any) {
        super();

        var dataPoint = new DataPoint();
        dataPoint.count = count > 0 ? count : undefined;
        dataPoint.max = isNaN(max) || max === null ? undefined : max;
        dataPoint.min = isNaN(min) || min === null ? undefined : min;
        dataPoint.name = DataSanitizer.sanitizeString(name) || Util.NotSpecified;
        dataPoint.value = value;

        this.metrics = [dataPoint];
        this.properties = DataSanitizer.sanitizeProperties(properties);
    }
}