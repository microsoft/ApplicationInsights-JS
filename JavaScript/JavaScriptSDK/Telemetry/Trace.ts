// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/MessageData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class Trace extends AI.MessageData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
        public static dataType = "MessageData";

        public aiDataContract = {
            ver: FieldType.Required,
            message: FieldType.Required,
            severityLevel: FieldType.Default,
            properties: FieldType.Default
        };

        /**
         * Constructs a new instance of the TraceTelemetry object
         */
        constructor(message: string, properties?: any, severityLevel?: AI.SeverityLevel) {
            super();
            message = message || Util.NotSpecified;
            this.message = Common.DataSanitizer.sanitizeMessage(message);
            this.properties = Common.DataSanitizer.sanitizeProperties(properties);

            if (severityLevel) {
                this.severityLevel = severityLevel;
            }
        }
    }
}