/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />

module Microsoft.ApplicationInsights.Core {

    "use strict";

    /**
     * Configuration provided to SDK core
     */
    export interface ITelemetryPlugin {
        processTelemetry: (env: ITelemetryItem) => void;
        start: (config: IConfiguration) => void;
        identifier: string;
        setNextPlugin: (next: ITelemetryPlugin) => void;
    }
}