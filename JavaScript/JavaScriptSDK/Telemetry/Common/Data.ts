/// <reference path="../../Contracts/Generated/Data.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";
    export class Data<TDomain> extends Microsoft.Telemetry.Data<TDomain> implements ISerializable {

        /**
         * The data contract for serializing this object.
         */
        public aiDataContract = {
            baseType: true,
            baseData: true
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