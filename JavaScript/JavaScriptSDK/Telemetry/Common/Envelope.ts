// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/Envelope.ts" />
/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/Base.ts" />
/// <reference path="../../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";
    export class Envelope extends Microsoft.Telemetry.Envelope implements IEnvelope {

        /**
         * The data contract for serializing this object.
         */
        public aiDataContract;

        /**
         * Constructs a new instance of telemetry data.
         */
        constructor(data: Microsoft.Telemetry.Base, name: string) {
            super();

            this.name = Common.DataSanitizer.sanitizeString(name) || Util.NotSpecified;
            this.data = data;
            this.time = Util.toISOStringForIE8(new Date());

            this.aiDataContract = {
                time: FieldType.Required,
                iKey: FieldType.Required,
                name: FieldType.Required,
                sampleRate: () => {
                    return (this.sampleRate == 100) ? FieldType.Hidden : FieldType.Required;
                },
                tags: FieldType.Required,
                data: FieldType.Required
            };
        }
    }
}