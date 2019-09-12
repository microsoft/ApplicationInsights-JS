// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/Base.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";

    export class Base extends Microsoft.Telemetry.Base implements ISerializable {
        
        /**
         * The data contract for serializing this object.
         */
        public aiDataContract = {};
    }
}