/// <reference path="../Contracts/Generated/PageViewData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Contracts/Generated/RemoteDependencyData.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class RemoteDependencyData extends AI.RemoteDependencyData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.RemoteDependencyData";
        public static dataType = "RemoteDependencyData";

        public aiDataContract = {
            ver: true,
            name: false,
            kind: true,
            value: false,
            count: false,
            min: false,
            max: false,
            stdDev: false,
            dependencyKind: false,
            success: false,
            async: false,
            dependencySource: false,
            commandName: false,
            dependencyTypeName: false,
            properties: false,
        }

        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        constructor(absoluteUrl: string, isAsync: boolean, totalTime: number, success: boolean) {
            super();

            this.dependencyKind = AI.DependencyKind.Http;
            this.dependencyTypeName = "Ajax";
            this.async = isAsync;
            this.value = totalTime;
            this.commandName = absoluteUrl;
            this.name = absoluteUrl;
            this.success = success;
        }
    }
}