import { FeatureOptInMode } from "../JavaScriptSDK.Enums/FeatureOptInEnums";

export interface IFeatureOptInDetails {
    /**
     * sets feature opt-in mode
     * @default undefined
     */
    mode?: FeatureOptInMode;
    /**
     * set feature value of current feature
     * @default undefined
     */
    cfgValue?: any;
    /**
     * define if should block any changes from cdn cfg, if set to true, cfgValue will be applied under all scenarios
     * @default false
     */
    blockCdnCfg?: boolean;
}

export interface IFeatureOptIn {[feature: string]: IFeatureOptInDetails}
