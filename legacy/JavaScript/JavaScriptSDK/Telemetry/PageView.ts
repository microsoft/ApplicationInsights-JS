// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/PageViewData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class PageView extends AI.PageViewData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
        public static dataType = "PageviewData";

        public aiDataContract = {            
            ver: FieldType.Required,
            name: FieldType.Default,
            url: FieldType.Default,
            duration: FieldType.Default,
            properties: FieldType.Default,
            measurements: FieldType.Default,
            id: FieldType.Default,
        }

        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        constructor(name?: string, url?: string, durationMs?: number, properties?: any, measurements?: any, id?: string) {
            super();

            this.id = Common.DataSanitizer.sanitizeId(id);
            this.url = Common.DataSanitizer.sanitizeUrl(url);
            this.name = Common.DataSanitizer.sanitizeString(name) || Util.NotSpecified;
            if (!isNaN(durationMs)) {
                this.duration = Util.msToTimeSpan(durationMs);
            }
            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
            this.measurements = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(measurements);
        }
    }
}