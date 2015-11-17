/// <reference path="../Contracts/Generated/MetricData.ts" />
/// <reference path="./Common/DataSanitizer.ts" />
/// <reference path="./Common/DataPoint.ts" />

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Metric extends AI.MetricData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.Metric";
        public static dataType = "MetricData";

        public aiDataContract = {
            ver: FieldType.Required,
            metrics: FieldType.Required,
            properties: FieldType.Default,
        }

        /**
         * Constructs a new instance of the MetricTelemetry object
         */
        constructor(name: string, value: number, count?: number, min?: number, max?: number, properties?: Object) {
            super();

            var dataPoint = new Microsoft.ApplicationInsights.Telemetry.Common.DataPoint();
            dataPoint.count = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint.name = Common.DataSanitizer.sanitizeString(name);
            dataPoint.value = value;

            this.metrics = [dataPoint];
            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
        }
    }
}