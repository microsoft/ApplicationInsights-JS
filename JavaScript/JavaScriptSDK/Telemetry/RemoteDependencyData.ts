/// <reference path="../Contracts/Generated/PageViewData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Contracts/Generated/RemoteDependencyData.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class RemoteDependencyData extends AI.RemoteDependencyData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.RemoteDependencyData";
        public static dataType = "RemoteDependencyData";

        public aiDataContract = {
            ver: FieldType.Required,
            name: FieldType.Default,
            kind: FieldType.Required,
            value: FieldType.Default,
            count: FieldType.Default,
            min: FieldType.Default,
            max: FieldType.Default,
            stdDev: FieldType.Default,
            dependencyKind: FieldType.Default,
            success: FieldType.Default,
            async: FieldType.Default,
            dependencySource: FieldType.Default,
            commandName: FieldType.Default,
            dependencyTypeName: FieldType.Default,
            properties: FieldType.Default,
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