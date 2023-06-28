import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncConfig {
    disableAutoSync?: boolean; // default: false
    customEvtName?: string;
    receiveChanges?: boolean; //default: false
    cfgUrl?: string;
    onCfgChangeReceive?: (event?: ICfgSyncEvent) => void;
    overrideSyncFn?: (config?:IConfiguration & IConfig, customDetails?: any) => boolean;
    overrideFetchFn?: (url?: string) => Promise<Response> | void;
    // default endpoint, ikey and cs
    nonOverrideConfigs?: string[];
}

export interface ICfgSyncEvent {
    cfg?: IConfiguration & IConfig;
    customDetails?: any;
}

