import { IConfig } from "@microsoft/applicationinsights-common";
import { FeatureOptInMode, IConfiguration, IFeatureOptIn } from "@microsoft/applicationinsights-core-js";
import { getValueByKey, isObject, objExtend, objForEachKey } from "@nevware21/ts-utils";
import { ICfgSyncCdnConfig } from "./Interfaces/ICfgSyncCdnConfig";
import { NonOverrideCfg } from "./Interfaces/ICfgSyncConfig";

/**
 * Delete a config key in the given cfg, if the config key exists in nonOverrideConfigs and its value is set to true
 * @param cfg cfg to modify
 * @param nonOverrideConfigs nonOverrideConfigs
 * @param curLevel cur config level, starting at 0
 * @param maxLevel max config level
 * @returns new copy of modified configs
 */
export function replaceByNonOverrideCfg<T=IConfiguration & IConfig, T1=NonOverrideCfg>(cfg: T , nonOverrideConfigs: T1, curLevel: number, maxLevel: number): T {
    try {
        let exceedMaxLevel = curLevel > maxLevel;
        if (exceedMaxLevel) {
            cfg = null;
        }
        let curCfg = curLevel == 0? objExtend({}, cfg): cfg;   // only copy cfg at the begining level
        if (curCfg && nonOverrideConfigs && !exceedMaxLevel) {
            objForEachKey(curCfg, (key) => {
                let nonOverrideVal = nonOverrideConfigs[key];
                if (!!nonOverrideVal) {
                    if (isObject(curCfg[key]) && isObject(nonOverrideVal)) {
                        curCfg[key] = replaceByNonOverrideCfg(curCfg[key], nonOverrideVal, ++curLevel, maxLevel);
                    } else {
                        delete curCfg[key];
                    }
                }
            });
        }
        return curCfg;
        
    } catch(e) {
        // eslint-disable-next-line no-empty
    }

    // if errors happen, do nothing
    return cfg;
}

export function getOptInFeatureVal(field: string, cdnCfg?: ICfgSyncCdnConfig, customOptInDetails?: IFeatureOptIn) {
    
    if (!cdnCfg || !cdnCfg.enabled || !customOptInDetails || !customOptInDetails[field]) {
        return null;
    }

    let cdnMode = null;
    let featureVal = null;
    let cdnConfig = null;

    if (!!cdnCfg) {
        cdnMode = cdnCfg.featureOptIn && cdnCfg.featureOptIn[field] || FeatureOptInMode.disable;
        if (cdnCfg.config && cdnMode !== FeatureOptInMode.disable) {
            cdnConfig = cdnCfg.config;
            featureVal = getValueByKey(cdnConfig, field);
        }
    }
    
    let details = customOptInDetails[field];
    let customMode = details.mode || FeatureOptInMode.disable;
    let customDefinedCdnMode = details.cdnStatus;
    
    // If custom feature opt-in mode is set to force, custom defined value will be used regarless of cdn settings
    if (customMode === FeatureOptInMode.force) {
        featureVal = details.cfgValue;
    } else if (customMode === FeatureOptInMode.optIn) {
        if (customDefinedCdnMode && customDefinedCdnMode !== cdnMode) {
            featureVal = details.cfgValue;
        }
    } else {
        featureVal = null;
    }
    return featureVal;
}
