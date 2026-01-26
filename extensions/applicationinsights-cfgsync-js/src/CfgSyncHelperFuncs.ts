import { CdnFeatureMode, FeatureOptInMode, IAppInsightsCore, IConfig, IConfiguration, IFeatureOptIn } from "@microsoft/otel-core-js";
import { isNullOrUndefined, isObject, objExtend, objForEachKey, setValueByKey } from "@nevware21/ts-utils";
import { ICfgSyncCdnConfig } from "./Interfaces/ICfgSyncCdnConfig";
import { NonOverrideCfg } from "./Interfaces/ICfgSyncConfig";

/**
 * Delete a config key in the given cfg, if the config key exists in nonOverrideConfigs and its value is set to true
 * @param cfg - cfg to modify
 * @param nonOverrideConfigs - nonOverrideConfigs
 * @param curLevel - cur config level, starting at 0
 * @param maxLevel - max config level
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
// | User Mode, value = A         | none               | none        | disabled    | enabled     | enabled   | disabled  |
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
const F = "featureOptIn.";
const M = ".mode";
const ON = ".onCfg";
const OFF = ".offCfg";

export function resolveCdnFeatureCfg(field: string, cdnCfg?: ICfgSyncCdnConfig, userOptInDetails?: IFeatureOptIn) {
    // cdn conifg value
    if (!cdnCfg || !cdnCfg.enabled) {
        return null;
    }

    let cdnFt = (cdnCfg.featureOptIn || {})[field] || {mode: CdnFeatureMode.none};
    let cdnM = cdnFt.mode;
    let cdnOnV = cdnFt.onCfg;
    let cdnOffV = cdnFt.offCfg;
    let userFt = (userOptInDetails || {})[field] || {mode: FeatureOptInMode.disable}; // default user mode is disable
    let userM = userFt.mode;
    let userOnV= userFt.onCfg;
    let userOffV= userFt.offCfg;
    let blockCdn = !!userFt.blockCdnCfg;
    let mFld = F + field + M;
    let onFld = F + field + ON;
    let offFld = F + field + OFF;

    let mode = userM;
    let onV =  userOnV;
    let offV = userOffV;

    if (!blockCdn) {
        if (cdnM === CdnFeatureMode.forceOn || cdnM === CdnFeatureMode.forceOff) {

            mode = (cdnM == CdnFeatureMode.forceOn? FeatureOptInMode.enable : FeatureOptInMode.disable);
            onV = cdnOnV || userOnV;
            offV = cdnOffV || userOffV;

        } else if (cdnM === CdnFeatureMode.disable || userM === FeatureOptInMode.disable) {
            
            mode = FeatureOptInMode.disable;
            onV =  userOnV || cdnOnV;
            offV = userOffV || cdnOffV;

        } else if (cdnM === CdnFeatureMode.enable) {
            mode = FeatureOptInMode.enable;
            onV =  userOnV || cdnOnV;
            offV = userOffV || cdnOffV;

        } else if (cdnM === CdnFeatureMode.none && userM === FeatureOptInMode.none) {
            mode = FeatureOptInMode.none;
        }

    }
    
    return {
        [mFld]: mode,
        [onFld]: onV,
        [offFld]: offV
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

function _overrideCdnCfgByFeature(field: string, ftVal: any, config: IConfiguration & IConfig) {
    let mode = ftVal[F + field + M];
    let val =  ftVal[F + field + ON];
    let dVal=  ftVal[F + field + OFF];
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
