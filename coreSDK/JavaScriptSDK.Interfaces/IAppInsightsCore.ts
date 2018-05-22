/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />
/// <reference path="./IChannelControls.ts" />
/// <reference path="./ITelemetryPlugin.ts" />
/// <reference path="./IConfig.ts" />

import { ITelemetryItem } from "./ITelemetryItem";
import { IChannelControls } from "./IChannelControls";
import { ITelemetryPlugin } from "./ITelemetryPlugin";
import { IConfiguration } from "./IConfiguration";


export interface IAppInsightsCore {

    /*
    * Config object used to initialize AppInsights
    */
    config: IConfiguration;

    /*
    * Initialization queue. Contains functions to run when appInsights initializes
    */        
    initialize(config: IConfiguration, extensions: ITelemetryPlugin[]): void;

    /*
    * Get transmission controls for controlling transmission behavior
    */
    getTransmissionControl(): IChannelControls;

    /*
    * Core track API
    */
    track(telemetryItem: ITelemetryItem);
}

export interface Snippet {
    queue: Array<() => void>;
    config: IConfiguration;
    extensions: ITelemetryPlugin[];
}