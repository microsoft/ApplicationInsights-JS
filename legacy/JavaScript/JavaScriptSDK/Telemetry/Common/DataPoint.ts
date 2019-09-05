// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/DataPoint.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";
    export class DataPoint extends AI.DataPoint implements ISerializable {

        /**
         * The data contract for serializing this object.
         */
        public aiDataContract = {
            name: FieldType.Required,
            kind: FieldType.Default,
            value: FieldType.Required,
            count: FieldType.Default,
            min: FieldType.Default,
            max: FieldType.Default,
            stdDev: FieldType.Default
        }
    }
}