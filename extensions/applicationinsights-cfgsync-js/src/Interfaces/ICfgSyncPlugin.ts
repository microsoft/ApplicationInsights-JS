import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export declare interface ICfgSyncPlugin {
    setCfg(config?:IConfiguration & IConfig): boolean;
    sync(customDetails?: any): boolean;
    updateEventListenerName(eventName?: string): boolean;
    enableAutoSync(val?: boolean): void;
    enableReceiveChanges(val?: boolean): void;
}