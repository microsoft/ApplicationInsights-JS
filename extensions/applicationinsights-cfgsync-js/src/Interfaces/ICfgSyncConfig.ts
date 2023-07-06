import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncConfig {
    disableAutoSync?: boolean; // default: false
    customEvtName?: string;
    receiveChanges?: boolean; //default: false
    cfgUrl?: string;
    onCfgChangeReceive?: (event?: ICfgSyncEvent) => void;
    overrideSyncFn?: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;
    overrideFetchFn?: SendGetFunction;
    // default endpoint, ikey and cs
    nonOverrideConfigs?: NonOverrideCfg;
    // if it is set to 0, then fetch will only execute once
    // default 30 mins, 30*60*1000ms
    scheduleFetchTimeout?: number;
}

export interface ICfgSyncEvent {
    cfg?: IConfiguration & IConfig;
    customDetails?: any;
}

export type NonOverrideCfg<T = IConfiguration & IConfig> = {
    [key in keyof T]?: boolean | NonOverrideCfg<T[key]> | undefined; // only top level
}
export type OnCompleteCallback = (status: number, response?: string, isAutoSync?: boolean) => void;
export type SendGetFunction = (url: string, oncomplete: OnCompleteCallback, isAutoSync?: boolean) => void;
