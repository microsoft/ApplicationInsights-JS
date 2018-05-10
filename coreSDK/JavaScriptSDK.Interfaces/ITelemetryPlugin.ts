/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />

module Microsoft.ApplicationInsights.Core {

    "use strict";

    export interface ITelemetryPlugin {
        ProcessTelemetry: (env: ITelemetryItem) => void;
        Start: (config: IConfiguration) => void;
        Identifier: string;
        SetNextPlugin: (next: ITelemetryPlugin) => void;
    }
}