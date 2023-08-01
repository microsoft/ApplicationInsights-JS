import { IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncCdnConfig {
    /**
     * Identifies whether cfgSync plugin should be enabled or not
     * @default false
     */
    enabled?: boolean;
    /**
     * Identifies fields of IConfiguration should be checked for opt-in purpose
     * CfgSync plugin will only be enabled if value of the field is listed in the array
     * NOTE: should use flat string for fields, for example, if you want to use extensionConfig.Analytics.disableAjaxTrackig as one opt-in field,
     * you should use "extensionConfig.Analytics.disableAjaxTrackig" as field name and the dynamicOptIn object will look like the following:
     * @example dynamicOptIn: {["extensionConfig.Analytics.disableAjaxTrackig"]:[true]}
     * @default undefined, cfgSync plugin will be enabled for all instances (if enabled is set to true)
     */
    dynamicOptIn?: {[field: string]: any[]};
    /**
     * Identifies IConfiguration that will be used for IConfigSync Plugin, especially throttleMgr Config
     * @default undefined
     */
    config?: IConfiguration;
    /**
     * Identifies fields of IConfiguration should be overridden
     * only override for opt-in instances when enabled is set to true
     * NOTE: should use flat string for fields, for example, if you want to use extensionConfig.Ananlytics.disableAjaxTrackig as one opt-in field,
     * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name
     * @example overrides:{"endpointUrl":{"endpoint1":"endpoint2", "endpoint3":"endpoint4"}, "extensionConfig.Analytics.disableAjaxTrackig":{"true": false}}
     * @default undefined
     */
    overrides?: {[field: string]: {[value: string]: any}};
}