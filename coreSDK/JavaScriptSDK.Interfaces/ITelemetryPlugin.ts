/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />

import { ITelemetryItem } from "./ITelemetryItem";
import { IConfiguration } from "./IConfiguration";

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPlugin {
    processTelemetry: (env: ITelemetryItem) => void;
    start: (config: IConfiguration) => void;
    identifier: string;
    setNextPlugin: (next: ITelemetryPlugin) => void;
    priority: number;
}