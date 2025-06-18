import { CdnFeatureMode, IConfiguration } from "@microsoft/applicationinsights-core-js";

export interface ICfgSyncCdnConfig {
    /**
     * Identifies whether cfgSync plugin should be enabled or not
     * @default false
     */
    enabled?: boolean;
    /**
     * Identifies if the feature should be opt-in or disabled and sets configuration values
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
    * Identifies override configuration values when given feature is enabled
    * NOTE: should use flat string for fields, for example, if you want to set value for extensionConfig.Ananlytics.disableAjaxTrackig in configurations,
    * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name: {["extensionConfig.Analytics.disableAjaxTrackig"]:1}
    * Default: undefined
    */
    onCfg?: {[field: string]: any};
    /**
      * Identifies override configuration values when given feature is disabled
      * NOTE: should use flat string for fields, for example, if you want to set value for extensionConfig.Ananlytics.disableAjaxTrackig in configurations,
      * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name: {["extensionConfig.Analytics.disableAjaxTrackig"]:1}
      * Default: undefined
      */
    offCfg?: {[field: string]: any};
    
}
