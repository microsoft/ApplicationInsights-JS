import { IConfig, IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncConfig {
    /**
     * Identifies whether instance should receive or broadcast config changes
     * @default Broadcast
     */
    syncMode?: ICfgSyncMode;
    /**
     * Event name for sending or listening to configuration change details
     * @default ai_cfgsync
     */
    customEvtName?: string;
     /**
     * CDN endpoint for fetching configuration. If cfgUrl is defined, instance will NOT listen to core configuration changes.
     * @default null
     */
    cfgUrl?: string;
    /**
     * Determines if fetching the CDN endpoint should be blocked or not.
     * @default false
     */
    blkCdnCfg?: boolean;
    /**
     *  Overrides callback function to handle event details when changes are received via event listener.
     * @default null
     */
    onCfgChangeReceive?: (event?: ICfgSyncEvent) => void;
    /**
     * Overrides sync() function to broadcast changes.
     * @default null
     */
    overrideSyncFn?: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;
    /**
     * Overrides fetch function to get config from cfgUrl when cfgUrl is defined.
     * @default null
     */
    overrideFetchFn?: SendGetFunction;
    /**
     * When current instance is set with syncMode: `Receive`, config fields under nonOverrideConfigs will NOT be changed by any config details sent out from other instances.
     * NOTE: this config will be ONLY applied during initialization, so it won't be changed dynamically
     * @default \{instrumentationKey:true,connectionString:true,endpointUrl:true\}
     */
    nonOverrideConfigs?: NonOverrideCfg;
    /**
     * Identifies the time interval (in milliseconds) for fetching config details from cfgUrl when cfgUrl is defined.
     * Default to 30 mins, 30*60*1000ms.
     * If set to 0, the fetch operation will only be called once during initialization.
     * @default 30mins (30*60*1000ms)
     */
    scheduleFetchTimeout?: number;

    /**
     * An internal flag to determine if sending requests with the internal endpoints as dependency requests.
     * @internal
     * @default false
     * @since 3.3.6
     */
    enableAjax?: boolean;
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
