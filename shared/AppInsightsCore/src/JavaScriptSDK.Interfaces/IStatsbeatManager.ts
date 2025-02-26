import { IAppInsightsCore } from "./IAppInsightsCore";
import { IConfiguration } from "./IConfiguration";
import { IPlugin } from "./ITelemetryPlugin";
import { ITelemetryPluginChain } from "./ITelemetryPluginChain";

/**
 * Defines the Statsbeat manager interface for tracking internal SDK performance metrics.
 */
export interface IStatsbeatManager {
    initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain, endpoint?: string): void;
    isInitialized(): boolean;
    countRequest(endpoint: string, duration: number, success: boolean): void;
    countException(endpoint: string): void;
    countThrottle(endpoint: string): void;
    countRetry(endpoint: string): void;
    trackShortIntervalStatsbeats(): void;
}
