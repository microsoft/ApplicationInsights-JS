/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />

"use strict";

import { ITelemetryItem } from "./ITelemetryItem";
import { IConfiguration } from "./IConfiguration";
import { IAppInsightsCore } from "./IAppInsightsCore";

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPlugin {
    /**
    * Call back for telemetry processing before it it is sent
    */
    processTelemetry: (env: ITelemetryItem) => void;

    /**
    * Extensions loaded in SDK
    */
    initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: ITelemetryPlugin[]) => void;

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