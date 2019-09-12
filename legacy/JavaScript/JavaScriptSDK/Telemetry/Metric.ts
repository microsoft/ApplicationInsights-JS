// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Telemetry/ISerializable.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/MetricData.ts" />
/// <reference path="../Serializer.ts" />
/// <reference path="./Common/DataSanitizer.ts" />
/// <reference path="./Common/DataPoint.ts" />

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Metric extends AI.MetricData implements ISerializable {

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

            var dataPoint = new Microsoft.ApplicationInsights.Telemetry.Common.DataPoint();
            dataPoint.count = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint.name = Common.DataSanitizer.sanitizeString(name) || Util.NotSpecified;
            dataPoint.value = value;

            this.metrics = [dataPoint];
            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
        }
    }
}