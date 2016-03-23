/// <reference path="../Contracts/Generated/PageViewData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Contracts/Generated/RemoteDependencyData.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class RemoteDependencyData extends AI.RemoteDependencyData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        public static dataType = "RemoteDependencyData";

        public aiDataContract = {
            id: FieldType.Required,
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
            resultCode: FieldType.Default
        }

        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        constructor(id: string, name: string, commandName: string, value: number, success: boolean, resultCode: number) {
            super();

            this.id = id;
            this.name = name;
            this.commandName = Common.DataSanitizer.sanitizeUrl(commandName);
            this.value = value;
            this.success = success;  
            this.resultCode = resultCode + "";
                      
            this.dependencyKind = AI.DependencyKind.Http;
            this.dependencyTypeName = "Ajax";
        }
    }
}