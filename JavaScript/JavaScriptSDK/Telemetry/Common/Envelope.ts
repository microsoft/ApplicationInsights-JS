/// <reference path="../../Contracts/Generated/Envelope.ts" />
/// <reference path="../../Contracts/Generated/Base.ts" />
/// <reference path="../../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry.Common {
    "use strict";
    export class Envelope extends Microsoft.Telemetry.Envelope implements ISerializable {

        /**
         * The data contract for serializing this object.
         */
        public aiDataContract;

        /**
         * Constructs a new instance of telemetry data.
         */
        constructor(data: Microsoft.Telemetry.Base, name: string) {
            super();

            this.name = name;
            this.data = data;
            this.time = Util.toISOStringForIE8(new Date());
            
            this.aiDataContract = {
                time: true,
                iKey: true,
                name: true,
                sampleRate: true,
                tags: true,
                data: true
            };
        }
    }
}