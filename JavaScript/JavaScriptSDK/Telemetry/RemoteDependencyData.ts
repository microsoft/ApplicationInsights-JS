/// <reference path="../../JavaScriptSDK.Interfaces/Telemetry/ISerializable.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/PageViewData.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/RemoteDependencyData.ts"/>
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class RemoteDependencyData extends AI.RemoteDependencyData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        public static dataType = "RemoteDependencyData";

        public static AjaxDependancyName = "Ajax";
        public static ResourceDependancyName = "Resource";

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
            resultCode: FieldType.Default,
            measurements: FieldType.Default
        }

        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        constructor(id: string, absoluteUrl: string, commandName: string, value: number, success: boolean, resultCode: number, method?: string, properties?: Object, measurements?: Object, dependencyTypeName?: string) {
            super();

            this.id = id;
            this.name = this.formatDependencyName(method, absoluteUrl);
            this.commandName = Common.DataSanitizer.sanitizeUrl(commandName);
            this.value = value;
            this.success = success;  
            this.resultCode = resultCode + "";

            this.dependencyKind = AI.DependencyKind.Http;
            this.dependencyTypeName = RemoteDependencyData.AjaxDependancyName;

            if (dependencyTypeName) {
                this.dependencyKind = AI.DependencyKind.Other;
                this.dependencyTypeName = dependencyTypeName;
            }

            this.properties = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeProperties(properties);
            this.measurements = ApplicationInsights.Telemetry.Common.DataSanitizer.sanitizeMeasurements(measurements);
        }

        private formatDependencyName(method: string, absoluteUrl: string) {
            if (method) {
                return method.toUpperCase() + " " + absoluteUrl;
            } else {
                return absoluteUrl;
            }
        }
    }
}