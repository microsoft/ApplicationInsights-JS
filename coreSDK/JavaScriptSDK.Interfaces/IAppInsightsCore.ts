/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />
/// <reference path="./IChannelControls.ts" />
/// <reference path="./ITelemetryPlugin.ts" />

module Microsoft.ApplicationInsights.Core {

    "use strict";

    export interface IAppInsights {

        /*
        * Config object used to initialize AppInsights
        */
        config: IConfig;

        /*
        * Initialization queue. Contains functions to run when appInsights initializes
        */        
        initialize(config: IConfiguration, extensions: ITelemetryPlugin[]): void;

        /*
        * Get transmission controls for controlling transmission behavior
        */
        GetTransmissionControl(): IChannelControls;

        /*
        * Core track API
        */
        track(telemetryItem: ITelemetryItem);
    }
}