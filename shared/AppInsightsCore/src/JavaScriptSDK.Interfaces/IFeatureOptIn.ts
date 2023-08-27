import { FeatureOptInMode } from "../JavaScriptSDK.Enums/FeatureOptInEnums";

export interface IFeatureOptInDetails {
    /**
     * sets feature opt-in mode
     * @default undefined
     */
    mode?: FeatureOptInMode;
    /**
     * set config values of current feature
     * NOTE: should use flat string for fields, for example, if you want to set value for extensionConfig.Ananlytics.disableAjaxTrackig in configurations,
     * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name
     * @default undefined
     */
    cfgValue?: {[field: string]: any};
    /**
     * define if should block any changes from cdn cfg, if set to true, cfgValue will be applied under all scenarios
     * @default false
     */
    blockCdnCfg?: boolean;
}

export interface IFeatureOptIn {[feature: string]: IFeatureOptInDetails}
