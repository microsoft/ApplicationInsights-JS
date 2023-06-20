import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export declare interface IIdsyncPlugin {
    onMainInstChange(config?:IConfiguration & IConfig): boolean;
    sync(customDetails?: any): boolean; // TODO: should change any type here
}