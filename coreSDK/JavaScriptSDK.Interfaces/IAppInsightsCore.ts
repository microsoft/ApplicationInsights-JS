import { ITelemetryItem } from "./ITelemetryItem";
import { IChannelControls } from "./IChannelControls";
import { IPlugin } from "./ITelemetryPlugin";
import { IConfiguration } from "./IConfiguration";

"use strict";

export interface IAppInsightsCore {

    /*
    * Config object used to initialize AppInsights
    */
    config: IConfiguration;

    /*
    * Initialization queue. Contains functions to run when appInsights initializes
    */        
    initialize(config: IConfiguration, extensions: IPlugin[]): void;

    /*
    * Get transmission controls for controlling transmission behavior
    */
    getTransmissionControl(): IChannelControls;

    /*
    * Core track API
    */
    track(telemetryItem: ITelemetryItem);
}