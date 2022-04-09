// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EnumValue } from "../JavaScriptSDK.Enums/EnumHelperFuncs";
import { isFunction, isNullOrUndefined, isUndefined, objExtend, objForEachKey, objFreeze } from "./HelperFuncs";
import { ConfigDefaults, ConfigValue, IMappedConfig } from "../JavaScriptSDK.Interfaces/IMappedConfig";
import { ConfigEnum, eConfigEnum } from "../JavaScriptSDK.Enums/ConfigEnums";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";

const strStringType = "string";
const strMappedCfg = "__aiCfg"
const strOrgConfig = "_orgCfg";
const strSetDefaults = "setDefaults";
const strGetFieldName = "getName";
const strAddNames = "addNames";
const strCfg = "cfg";

function _createConfigMapper(cfgNames: EnumValue, _config: any, useExisting: boolean): IMappedConfig {
    let theConfig = _config ? (useExisting ? _config : objExtend(true, {}, _config)) : {};
    let theNames: EnumValue[] = [];

    if (!cfgNames) {
        cfgNames = ConfigEnum;
    }

    theNames.push(cfgNames);

    let mappedConfig: IMappedConfig = {
        [strCfg]: theConfig,                     // This will become the resolved config, all defaults and values will be set on this object
        [strOrgConfig]: () => _config || {},
        [strAddNames]: _addNames,
        [strGetFieldName]: _getFieldName,
        [strSetDefaults]: _setDefaults
    };

    theConfig[strMappedCfg] = mappedConfig;

    function _addNames<N extends EnumValue>(names: N) {
        theNames.push(names);
    }

    function _getFieldName(field: any): string {
        let name: any;
        if (typeof field !== strStringType) {
            for (let lp = 0; lp < theNames.length; lp++) {
                name = theNames[lp][field];
                if (name && typeof name === strStringType) {
                    break;
                }
            }
        }
    
        return name || field;
    }

    function _setDefaults<N>(cfgDefaults: ConfigDefaults<N>, applyNow?: boolean) {
        if (cfgDefaults) {
            objForEachKey(cfgDefaults, (field, defValue) => {
                let cfgName = _getFieldName(field);
                if (!isUndefined(cfgName)) {
                    // Gets the original value
                    let theValue = theConfig[cfgName] as ConfigValue;
            
                    // We have a default or default lookup function
                    let newValue = theValue;
                    if (isFunction(defValue)) {
                        newValue = defValue.call(mappedConfig, theValue);
                    } else if (isUndefined(theValue)) {
                        newValue = defValue;
                    }
            
                    if (newValue !== theValue) {
                        theConfig[cfgName] = newValue;
                    }
                }
            });
        }
    }
    
    return objFreeze(mappedConfig);
}

/**
 * Get (or create) the current mapped config
 * @param config - The current config reference or mapped config
 * @param names - The default names to apply when creating a new instance, if not supplied ConfigEnum will be used
 * @param useExisting - Should the passed config be wrapped (true) or should it be copied and disconnected
 * @returns
 */
export function getMappedConfig<C, N extends EnumValue>(config: C | IMappedConfig, names?: N, useExisting?: boolean): IMappedConfig {
    let mappedConfig: IMappedConfig = config ? config[strMappedCfg] || config : null;
    if (!mappedConfig || !mappedConfig[strCfg]) {
        mappedConfig = _createConfigMapper(names, config, useExisting || isUndefined(useExisting));
    }

    return mappedConfig;
}

/**
 * Get the mapped config value, if null or undefined any supplied defaultValue will be returned.
 * @param field - The name of the field as the named enum value (number) or the string name.
 * @param defaultValue - The default value to return if the config field is not present, null or undefined.
 */
export function getIdCfgValue<V, E extends EnumValue, C = IConfiguration>(config: IMappedConfig | IConfiguration, identifier: string, field: /*keyof E |*/ E[keyof E]/* | keyof C | string*/ | eConfigEnum, defaultValue?: V): V {
    let theValue: V;
    let mappedConfig: IMappedConfig = config[strMappedCfg] || getMappedConfig(config, null, true);
    if (mappedConfig) {
        let fieldName = mappedConfig[strGetFieldName](field);
        let fullCfg: C = mappedConfig[strCfg];
        let theConfig: C = fullCfg;
        let extConfig = fullCfg[ConfigEnum[eConfigEnum.extensionConfig]];
        if (extConfig && identifier) {
            theConfig = extConfig[identifier];
        }

        theValue = theConfig && theConfig[fieldName];
        if (isNullOrUndefined(theValue)) {
            theValue = fullCfg && fullCfg[fieldName];
        }

        return !isNullOrUndefined(theValue) ? theValue : defaultValue;
    }
}

/**
 * Get the mapped config value, if null or undefined any supplied defaultValue will be returned.
 * @param field - The name of the field as the named enum value (number) or the string name.
 * @param defaultValue - The default value to return if the config field is not present, null or undefined.
 */
export function getCfgValue<V, E extends EnumValue, C = IConfiguration>(config: IMappedConfig/* | IConfiguration*/, field: /*keyof E |*/ E[keyof E]/* | keyof C | string*/ | eConfigEnum, defaultValue?: V): V {
    let theValue: V;
    let mappedConfig: IMappedConfig = config[strMappedCfg] || config;
    if (mappedConfig) {
        let theConfig: C = mappedConfig[strCfg];
        theValue = theConfig && theConfig[mappedConfig[strGetFieldName](field)];
    }
    
    return !isNullOrUndefined(theValue) ? theValue : defaultValue;
}

/**
 * Set the mapped config value to the provided value parameter when replaceSrc function is not supplied or returns true, if it returns false
 * the original value will not be overwritten.
 * @param field - The name of the field as the named enum value (number) or the string name.
 * @param value - The value to set as mapped (named) value within the config
 * @param replaceSrc - Optional callback function to evaluate whether the original source value should be replaced (not supplied or returns true).
 */
export function setCfgValue<V, E extends EnumValue, C = IConfiguration>(config: IMappedConfig | IConfiguration, field: /*keyof E |*/ E[keyof E]/* | keyof C | string*/ | eConfigEnum, value: V, replaceSrc?: ((this: IMappedConfig, value: V) => boolean) | null): V {
    let theValue = value;
    let mappedConfig: IMappedConfig = config[strMappedCfg] || getMappedConfig(config, null, true);
    if (mappedConfig) {
        let theConfig: C = mappedConfig[strCfg];
        let fieldName = mappedConfig[strGetFieldName](field);
        if (theConfig) {
            theValue = theConfig[fieldName];
            if (theValue !== value && (!replaceSrc || replaceSrc.call(mappedConfig, theValue))) {
                theValue = value;
                theConfig[fieldName] = theValue;
            }
        }
    }

    return theValue;
}