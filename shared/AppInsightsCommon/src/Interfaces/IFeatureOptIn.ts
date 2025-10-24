// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { FeatureOptInMode } from "../Enums/FeatureOptInEnums";

export interface IFeatureOptInDetails {
    /**
     * sets feature opt-in mode
     * @default undefined
     */
    mode?: FeatureOptInMode;
    /**
     * Identifies configuration override values when given feature is enabled
     * NOTE: should use flat string for fields, for example, if you want to set value for extensionConfig.Ananlytics.disableAjaxTrackig in configurations,
     * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name: \{["extensionConfig.Analytics.disableAjaxTrackig"]:1\}
     * Default: undefined
     */
    onCfg?: {[field: string]: any};
    /**
     * Identifies configuration override values when given feature is disabled
     * NOTE: should use flat string for fields, for example, if you want to set value for extensionConfig.Ananlytics.disableAjaxTrackig in configurations,
     * you should use "extensionConfig.Ananlytics.disableAjaxTrackig" as field name: \{["extensionConfig.Analytics.disableAjaxTrackig"]:1\}
     * Default: undefined
     */
    offCfg?: {[field: string]: any};
    /**
     * define if should block any changes from cdn cfg, if set to true, cfgValue will be applied under all scenarios
     * @default false
     */
    blockCdnCfg?: boolean;
}

export interface IFeatureOptIn {[feature: string]: IFeatureOptInDetails}
