/// <reference path="../Contracts/Generated/EventData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Event extends AI.EventData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.Event";
        public static dataType = "EventData";

        public aiDataContract = {
            ver: true,
            name: true,
            properties: false,
            measurements: false,
        }

        /**
         * Constructs a new instance of the EventTelemetry object
         */
        constructor(name: string, properties?: Object, measurements?: Object) {
            
            super();

            this.name = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeString(name);
            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
            this.measurements = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(measurements);
        }
    }
}