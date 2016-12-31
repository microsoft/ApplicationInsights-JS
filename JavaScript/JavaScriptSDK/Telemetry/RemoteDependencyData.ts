/// <reference path="../../JavaScriptSDK.Interfaces/Telemetry/ISerializable.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/PageViewData.ts" />
/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/RemoteDependencyData.ts"/>
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class RemoteDependencyData extends AI.RemoteDependencyData implements ISerializable {

        public static envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        public static dataType = "RemoteDependencyData";

        public aiDataContract = {
            id: FieldType.Required,
            ver: FieldType.Required,
            name: FieldType.Default,
            resultCode: FieldType.Default,
            duration: FieldType.Default,
            success: FieldType.Default,
            data: FieldType.Default,
            target: FieldType.Default,
            type: FieldType.Default,
            properties: FieldType.Default,
            measurements: FieldType.Default,

            kind: FieldType.Required,
            value: FieldType.Default,
            count: FieldType.Default,
            min: FieldType.Default,
            max: FieldType.Default,
            stdDev: FieldType.Default,
            dependencyKind: FieldType.Default,
            async: FieldType.Default,
            dependencySource: FieldType.Default,
            commandName: FieldType.Default,
            dependencyTypeName: FieldType.Default,
        }

        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        constructor(id: string, absoluteUrl: string, commandName: string, value: number, success: boolean, resultCode: number, method?: string, properties?: Object, measurements?: Object) {
            super();

            this.id = id;
            this.target = UrlHelper.parseUrl(absoluteUrl).hostname;
            this.value = value;
            this.duration = value + "";
            this.success = success;  
            this.resultCode = resultCode + "";
            this.dependencyKind = AI.DependencyKind.Http;

            this.type = this.dependencyTypeName = "Ajax";
            this.data = this.commandName = Common.DataSanitizer.sanitizeUrl(this.formatDependencyName(method, absoluteUrl));

            if (this.commandName != null) {
                var indexOfSearchString: number = this.commandName.indexOf("?");
                this.name = this.commandName.substr(0, indexOfSearchString < 0 ? this.commandName.length : indexOfSearchString);
            } else {
                this.name = absoluteUrl;
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