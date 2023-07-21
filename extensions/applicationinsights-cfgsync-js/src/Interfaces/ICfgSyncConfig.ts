import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncConfig {
    /**
     * Identifies whether instance should receive or broadcast config changes
     * Default to broadcast
     */
    syncMode?: ICfgSyncMode;
    /**
     * Identifies event name that changes will be sent out with. And all listener instances will listen to event details under this name.
     * Default to cfgsync.
     */
    customEvtName?: string;
     /**
     * Identifies endpoint to get config rather than core config.
     * Default to null.
     * If set, any core config changes will be ignored.
     */
    cfgUrl?: string;
    /**
     * Overrides callback function to handle event details when changes are received via eventListener.
     */
    onCfgChangeReceive?: (event?: ICfgSyncEvent) => void;
    /**
     * Overrides sync() function to broadcast changes.
     */
    overrideSyncFn?: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;
    /**
     * Overrides fetch function to get config from cfgUrl.
     */
    overrideFetchFn?: SendGetFunction;
    /**
     * Identifies configs that should NOT be changed by other instances.
     * Default to {instrumentationKey: true, connectionString: true, endpointUrl: true }
     */
    nonOverrideConfigs?: NonOverrideCfg;
    /**
     * Identifies time interval (in ms) that should fetch from cfgUrl.
     * Default to 30 mins, 30*60*1000ms.
     * If set to 0, fetch will only be called once during initialization.
     */
    scheduleFetchTimeout?: number;
}

export const enum ICfgSyncMode {
    /**
     * Instance will NOT receive config changes or broadcast changes
     */
    None = 0,
    /**
     * Instance will only broadcast config changes but NOT receive changes
     */
    Broadcast = 1,
    /**
     * Instance will only receive config changes but NOT broadcast changes
     */
    Receive = 2
}

export interface ICfgSyncEvent {
     /**
     * Identifies config changes are expected to send out to other instances.
     */
    cfg?: IConfiguration & IConfig;
     /**
     * Identifies additional details that are expected to send out with config changes.
     */
    customDetails?: any;
}

export type NonOverrideCfg<T = IConfiguration & IConfig> = {
    /**
     * Identifies config that should NOT be changed when the config is set to TRUE.
     * If it is set to undefined, null or false, changes will be applied to this config.
     * Default: undefined
     */
    [key in keyof T]?: boolean | NonOverrideCfg<T[key]> | undefined;
}
export type OnCompleteCallback = (status: number, response?: string, isAutoSync?: boolean) => void;
export type SendGetFunction = (url: string, oncomplete: OnCompleteCallback, isAutoSync?: boolean) => void;