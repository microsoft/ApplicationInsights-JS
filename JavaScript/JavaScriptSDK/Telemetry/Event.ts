// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Telemetry/ISerializable.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/EventData.ts" />
/// <reference path="../Serializer.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Event extends AI.EventData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
        public static dataType = "EventData";

        public aiDataContract = {
            ver: FieldType.Required,
            name: FieldType.Required,
            properties: FieldType.Default,
            measurements: FieldType.Default
        }

        /**
         * Constructs a new instance of the EventTelemetry object
         */
        constructor(name: string, properties?: any, measurements?: any) {
            
            super();

            this.name = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(name) || Util.NotSpecified;
            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
            this.measurements = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(measurements);
        }
    }
}