// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/Data.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";
    export class Data<TDomain> extends Microsoft.Telemetry.Data<TDomain> implements ISerializable {

        /**
         * The data contract for serializing this object.
         */
        public aiDataContract = {
            baseType: FieldType.Required,
            baseData: FieldType.Required
        }

        /**
         * Constructs a new instance of telemetry data.
         */
        constructor(type: string, data: TDomain) {
            super();

            this.baseType = type;
            this.baseData = data;
        }
    }
}