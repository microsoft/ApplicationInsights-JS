import { IConfig } from "./IConfig";
import { IConfiguration, IAppInsightsCore, IPlugin, ITelemetryPluginChain } from "@microsoft/applicationinsights-core-js";

/**
 * Defines the Statsbeat manager interface for tracking internal SDK performance metrics.
 */
export interface IStatsbeatManager {
    initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain, endpoint?: string): void;
    isInitialized(): boolean;
    countRequest(endpoint: string, duration: number, success: boolean): void;
    countException(endpoint: string): void;
    countThrottle(endpoint: string): void;
    countRetry(endpoint: string): void;
    trackShortIntervalStatsbeats(): void;
}

/**
 * Factory function to create and retrieve a single Statsbeat instance.
 */
export function createStatsbeatManager(): IStatsbeatManager;
