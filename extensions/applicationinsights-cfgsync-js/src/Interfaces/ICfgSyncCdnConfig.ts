import { CdnFeatureMode, IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncCdnConfig {
    /**
     * Identifies whether cfgSync plugin should be enabled or not
     * @default false
     */
    enabled?: boolean;
    /**
     * Identifies fields of IConfiguration should be opt-in or disabled
     * NOTE: should use flat string for fields, for example, if you want to use extensionConfig.Analytics.disableAjaxTrackig as one opt-in field,
     * you should use "extensionConfig.Analytics.disableAjaxTrackig" as field name and the dynamicOptIn object will look like the following:
     * @example dynamicOptIn: {["extensionConfig.Analytics.disableAjaxTrackig"]:1}
     * @default undefined
     */
    featureOptIn?: {[field: string]: ICdnFeatureOptIn};
    /**
     * Identifies IConfiguration that will be used for IConfigSync Plugin, especially throttleMgr Config
     * @default undefined
     */
    config?: IConfiguration;
    /**
     * Identifies fields of IConfiguration should be overridden (not in use currently)
     * only override for opt-in instances when enabled is set to true
     * NOTE: should use flat string for fields, for example, if you want to use extensionConfig.Ananlytics.disableAjaxTrackig as one opt-in field,
     * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name
     * TODO: add implementations on this config
     * @example overrides:{"endpointUrl":{"endpoint1":"endpoint2", "endpoint3":"endpoint4"}, "extensionConfig.Analytics.disableAjaxTrackig":{"true": false}}
     * @default undefined
     */
    overrides?: {[field: string]: {[value: string]: any}};
}

export interface ICdnFeatureOptIn {
    /**
     * Identifies current cdn opt in mode
     */
    mode: CdnFeatureMode,
    /**
     * Identifies value should be set for the feature
     * Default: undefined
     */
    value?: any
}