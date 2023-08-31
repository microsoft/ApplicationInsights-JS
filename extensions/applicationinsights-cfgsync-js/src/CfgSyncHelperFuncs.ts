import { IConfig } from "@microsoft/applicationinsights-common";
import {
    CdnFeatureMode, FeatureOptInMode, IAppInsightsCore, IConfiguration, IFeatureOptIn
} from "@microsoft/applicationinsights-core-js";
import { isNullOrUndefined, isObject, objExtend, objForEachKey, setValueByKey } from "@nevware21/ts-utils";
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


//                                                     CDN Mode, value = B (CDN value = B)
//                                |--------------------------------------------------------------------------|-----------|
//                                |                    | none        | disabled    | enabled     | forceOn   | forceOff  |
//                                | ------------------ | ----------- | ----------- | ----------- | --------- | --------- |
// | User Mode, value = A         | none               | none        | disabled    | disabled    | enabled   | disabled  |
// (user Value = A)               | disabled           | disabled    | disabled    | disabled    | enabled   | disabled  |
//                                | enabled            | enabled     | disabled    | enabled     | enabled   | disabled  |
//                                | none(blockCdn)     | none        | none        | none        | none      | none      |
//                                | disabled(blockCdn) | disabled    | disabled    | disabled    | disabled  | disabled  |
//                                | enabled(blockCdn)  | enabled     | enabled     | enabled     | enabled   | enabled   |

// This matrix identifies how feature based overrides are selected (if present)
//                                cdn Mode (cdn Value = B)
//                   |---------------------------------------------------------------------------|
//                   |                    | none     | disabled | enabled  | forceOn  | forceOff |
//                   | ------------------ | ---------| ---------| ---------| ---------|----------|
// | User Mode       | none               | A        | A        | A || B   | B || A   | B || A   |
// (user Value = A)  | disabled           | A        | A        | A        | B || A   | B || A   |
//                   | enabled            | A        | A        | A || B   | B || A   | B || A   |
//                   | none(blockCdn)     | A        | A        | A        | A        | A        |
//                   | disabled(blockCdn) | A        | A        | A        | A        | A        |
//                   | enabled(blockCdn)  | A        | A        | A        | A        | A        |
// Note:
// Where the "value" is an object (map) of encoded key/values which will be used to override the real configuration
// A = either the user supplied enable/disable value (via the `config.featureOptIn[name]`) or if not defined by the user the SDK defaults of the same.
// B = The enable/disable value obtained from the CDN for the named feature
// These are evaluated based on the above matrix to either
// - A (Always the user/sdk value)
// - B (Always the value from the CDN)
// - A || B (If A is null or undefined use the value from the CDN (B) otherwise A)
// - B || A (If B is null or undefined use the user/SDK value otherwise use the value from the CDN)
//
// The result of the value may also be null / undefined, which means there are no overrides to apply when the feature is enabled
const FLD = "featureOptIn.";
const MODE = ".mode";
const EFLD = ".cfgValue";
const DFLD = ".disableCfgValue";

export function resolveCdnFeatureCfg(field: string, cdnCfg?: ICfgSyncCdnConfig, customOptInDetails?: IFeatureOptIn) {
    // cdn conifg value
    if (!cdnCfg || !cdnCfg.enabled) {
        return null;
    }
 
    let featureOptIn= cdnCfg.featureOptIn || {};
    let cdnFeature = featureOptIn[field] || {mode: CdnFeatureMode.none};
    let cdnMode = cdnFeature.mode;
    let cdnFeatureVal = cdnFeature.value;
    let cdnFeatureDisVal = cdnFeature.disableValue;
    let customOptIn = customOptInDetails || {};
    let customFeature = customOptIn[field] || {mode: FeatureOptInMode.disable}; // default custom mode is disable
    let customMode = customFeature.mode;
    let customFeatureVal = customFeature.cfgValue;
    let customFeatureDisVal = customFeature.disableCfgValue;
    let blockCdn = !!customFeature.blockCdnCfg;
    let mField = FLD + field + MODE;
    let vField = FLD + field + EFLD;
    let vDisField = FLD + field + DFLD;

    if (blockCdn) {
        return {
            [mField]: customMode,
            [vField]: customFeatureVal,
            [vDisField]: customFeatureDisVal
        };
    }

    if (cdnMode === CdnFeatureMode.forceOn) {
        return {
            [mField]: FeatureOptInMode.enable,
            [vField]: cdnFeatureVal || customFeatureVal,
            [vDisField]: cdnFeatureDisVal || customFeatureDisVal
        };
    }

    if (cdnMode === CdnFeatureMode.forceOff) {
        return {
            [mField]: FeatureOptInMode.disable,
            [vField]: cdnFeatureVal || customFeatureVal,
            [vDisField]: cdnFeatureDisVal || customFeatureDisVal
        };
    }

    if (cdnMode === CdnFeatureMode.disable || customMode === FeatureOptInMode.disable) {
        return {
            [mField]: FeatureOptInMode.disable,
            [vField]:  customFeatureVal || cdnFeatureVal,
            [vDisField]: customFeatureDisVal || cdnFeatureDisVal
        };
    }


    if (cdnMode === CdnFeatureMode.enable) {
        return {
            [mField]: FeatureOptInMode.enable,
            [vField]:  customFeatureVal || cdnFeatureVal,
            [vDisField]: customFeatureDisVal || cdnFeatureDisVal
        };
    }

    if (cdnMode === CdnFeatureMode.none && customMode === FeatureOptInMode.none) {
        return {
            [mField]: FeatureOptInMode.none
        };
    }

    return {
        [mField]: customMode,
        [vField]: customFeatureVal,
        [vDisField]: customFeatureDisVal
    };

}



// helper function to get cdn config with opt-in features
export function applyCdnfeatureCfg(cdnCfg: ICfgSyncCdnConfig, core: IAppInsightsCore) {
    try {
        if (!cdnCfg || !cdnCfg.enabled) {
            return null;
        }
        if (!cdnCfg.featureOptIn) {
            return cdnCfg.config;
        }
        let optInMap = cdnCfg.featureOptIn;
        let cdnConfig = cdnCfg.config || {};
        objForEachKey(optInMap, (key) => {
            let featureVal = resolveCdnFeatureCfg(key, cdnCfg, core.config.featureOptIn);
            if (!isNullOrUndefined(featureVal)) {
                objForEachKey(featureVal, (config, val) => {
                    setValueByKey(cdnConfig, config, val);
                });
                _overrideCdnCfgByFeature(key, featureVal, cdnConfig);
            }
        });
        return cdnConfig;
    } catch (e) {
        // eslint-disable-next-line no-empty
    }
    return null;
}

function _overrideCdnCfgByFeature(field: string, featureVal: any, config: IConfiguration & IConfig) {
    let mode = featureVal[FLD + field + MODE];
    let val =  featureVal[FLD + field + EFLD];
    let dVal=  featureVal[FLD + field + DFLD];
    let target = null;
    if (mode === FeatureOptInMode.enable) {
        target = val;
    }

    if (mode === FeatureOptInMode.disable) {
        target = dVal;
    }

    if (target) {
        objForEachKey(target, (key, cfg) => {
            setValueByKey(config, key, cfg);
        });
    }

}