/// <reference path="../Contracts/Generated/MessageData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Trace extends AI.MessageData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.Message";
        public static dataType = "MessageData";

        public aiDataContract = {
            ver: true,
            message: true,
            severityLevel: false,
            measurements: false,
            properties: false
        };

        /**
         * Constructs a new instance of the MetricTelemetry object
         */
        constructor(message: string, properties?: Object) {
            super();
            message = message || Util.NotSpecified;
            this.message = Common.DataSanitizer.sanitizeMessage(message);
            this.properties = Common.DataSanitizer.sanitizeProperties(properties);
        }
    }
}