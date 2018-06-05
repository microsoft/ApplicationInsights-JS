/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />

"use strict";

import { ITelemetryItem } from "./ITelemetryItem";
import { IConfiguration } from "./IConfiguration";

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
    start: (config: IConfiguration) => void;

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