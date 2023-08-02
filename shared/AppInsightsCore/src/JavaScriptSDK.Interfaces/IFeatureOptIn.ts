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
     * define CdnOptInMode where feature value can be overriden by cdn settings
     * if it is undefined, value of feature can be changed by any CdnOptInMode status
     * @default undefined
     */
    cdnStatus?: FeatureOptInMode
}

export interface IFeatureOptIn {[feature: string]: IFeatureOptInDetails}
