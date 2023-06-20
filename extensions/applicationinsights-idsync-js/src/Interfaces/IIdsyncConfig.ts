import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface IIdsyncConfig {
    disableAutoSync?: boolean; // default: false
    customEvtNamespace?: string;
    overrideSyncFunc?: (config?:IConfiguration & IConfig) => boolean;
}