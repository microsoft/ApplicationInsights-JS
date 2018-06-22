"use strict";

import { ITelemetryItem } from "./ITelemetryItem";
import { IConfiguration } from "./IConfiguration";
import { IAppInsightsCore } from "./IAppInsightsCore";

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPlugin extends IPlugin {
    /**
    * Call back for telemetry processing before it it is sent
    */
    processTelemetry: (env: ITelemetryItem) => void;

    /**
    * Extension name
    */
    identifier: string;

    /**
    * Set next extension for telemetry processing
    */
    setNextPlugin: (next: ITelemetryPlugin) => void;

    /**
    * Priority of the extension
    */
    priority: number;
}

export interface IPlugin {
    /**
    * Initialize plugin loaded by SDK
    */
    initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => void;


}