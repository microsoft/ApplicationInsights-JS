/// <reference path="../../Contracts/Generated/DataPoint.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";
    export class DataPoint extends AI.DataPoint implements ISerializable {

        /**
         * The data contract for serializing this object.
         */
        public aiDataContract = {
            name: true,
            kind: false,
            value: true,
            count: false,
            min: false,
            max: false,
            stdDev: false
        }
    }
}