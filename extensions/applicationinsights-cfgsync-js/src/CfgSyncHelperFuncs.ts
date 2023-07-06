import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { isArray, isFunction, isObject, objExtend, objForEachKey } from "@nevware21/ts-utils";
import { NonOverrideCfg } from "./Interfaces/ICfgSyncConfig";

export function replaceByNonOverrideCfg<T=IConfiguration & IConfig>(cfg: T , nonOverrideConfigs: NonOverrideCfg, curLevel: number, maxLevel: number): T {
    try {
        if (curLevel > maxLevel || !cfg) {
            return null;
        }
        let curCfg = objExtend({}, cfg);
        if (nonOverrideConfigs) {
            objForEachKey(nonOverrideConfigs, (key, val) => {
                if (!!val) {
                    let subCfg = curCfg[key];
                    if (isObject(subCfg) && !isFunction(subCfg) && !isArray(subCfg)) {
                        curCfg[key] = replaceByNonOverrideCfg(subCfg, nonOverrideConfigs[key], ++curLevel, maxLevel);
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
    return null;
}
