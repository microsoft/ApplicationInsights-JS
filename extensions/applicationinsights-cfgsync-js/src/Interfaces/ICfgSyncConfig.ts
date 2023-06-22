import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncConfig {
    disableAutoSync?: boolean; // default: false
    customEvtNamespace?: string;
    receiveChanges?: boolean; //default: false
    cfgUrl?: string;
    onCfgChangeReceive?: (event?: ICfgSyncEvent) => void;
    overrideSyncFn?: (config?:IConfiguration & IConfig) => boolean;
    overrideFetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface ICfgSyncEvent {
    cfg?: IConfiguration & IConfig;
    customDetails?: any;
}