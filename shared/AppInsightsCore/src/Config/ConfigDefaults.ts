// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { asString, dumpObj, isArray, isDefined, isNullOrUndefined, isObject, objHasOwn } from "@nevware21/ts-utils";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { isPlainObject, objForEachKey } from "../JavaScriptSDK/HelperFuncs";
import { STR_NOT_DYNAMIC_ERROR } from "../JavaScriptSDK/InternalConstants";
import { CFG_HANDLER_LINK, _cfgDeepCopy, throwInvalidAccess } from "./DynamicSupport";
import { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "./IConfigDefaults";
import { IDynamicConfigHandler } from "./IDynamicConfigHandler";

function _getDefault<C, T>(dynamicHandler: IDynamicConfigHandler<T>, theConfig: C, cfgDefaults: IConfigDefaultCheck<C, C[keyof C]>): C[keyof C] {
    let defValue: C[keyof C];
    let isDefaultValid: (value: any) => boolean =  cfgDefaults.dfVal || isDefined;

    // There is a fallback config key so try and grab that first
    if (theConfig && cfgDefaults.fb) {
        let fallbacks = cfgDefaults.fb;
        if (!isArray(fallbacks)) {
            fallbacks = [ fallbacks ];
        }

        for (let lp = 0; lp < fallbacks.length; lp++) {
            let fallback = fallbacks[lp];

            let fbValue = theConfig[fallback as keyof C];
            if (isDefaultValid(fbValue)) {
                defValue = fbValue;
            } else {
                // Needed to ensure that the fallback value (and potentially) new field is also dynamic even if null/undefined
                fbValue = dynamicHandler.cfg[fallback as keyof T] as unknown as C[keyof C];
                if (isDefaultValid(fbValue)) {
                    defValue = fbValue;
                }

                // Needed to ensure that the fallback value (and potentially) new field is also dynamic even if null/undefined
                dynamicHandler.set(dynamicHandler.cfg, asString(fallback), fbValue);
            }

            if (isDefaultValid(defValue)) {
                // We have a valid default so break out of the look
                break;
            }
        }
    }

    // If the value is still not defined and we have a default value then use that
    if (!isDefaultValid(defValue) && isDefaultValid(cfgDefaults.v)) {
        defValue = cfgDefaults.v;
    }

    return defValue;
}

/**
 * Applies the default value on the config property and makes sure that it's dynamic
 * @param theConfig
 * @param name
 * @param defaultValue
 */
export function _applyDefaultValue<T extends IConfiguration, C>(theConfig: C, name: string, defaultValue: C[keyof C] | IConfigDefaultCheck<C, C[keyof C], T>) {
    let dynamicHandler: IDynamicConfigHandler<T> = theConfig[CFG_HANDLER_LINK];
    if (!dynamicHandler) {
        throwInvalidAccess(STR_NOT_DYNAMIC_ERROR + dumpObj(theConfig));
    }

    // Resolve the initial config value from the provided value or use the defined default
    let isValid: IConfigCheckFn<C[keyof C]>;
    let setFn: IConfigSetFn<C, C[keyof C]>;
    let defValue: C[keyof C];
    let cfgDefaults: IConfigDefaultCheck<C, C[keyof C]> = defaultValue as IConfigDefaultCheck<C, C[keyof C]>;

    if (cfgDefaults && isObject(cfgDefaults) && (cfgDefaults.isVal || cfgDefaults.set || cfgDefaults.fb || objHasOwn(cfgDefaults, "v"))) {
        // looks like a IConfigDefault
        isValid = cfgDefaults.isVal;
        setFn = cfgDefaults.set;

        defValue = _getDefault(dynamicHandler, theConfig, cfgDefaults);
    } else {
        defValue = defaultValue as C[keyof C];
    }

    // Set the value to the default value;
    let theValue: any = defValue;
    let usingDefault = true;

    let cfgValue = theConfig[name];
    // try and get and user provided values
    if (cfgValue || !isNullOrUndefined(cfgValue)) {
        // Use the defined theConfig[name] value
        theValue = cfgValue;
        usingDefault = false;
    }

    if (!usingDefault) {
        // The values are different and we have a special default value check, which is used to
        // override config values like empty strings to continue using the default
        if (isValid && theValue !== defValue && !isValid(theValue)) {
            theValue = defValue;
            usingDefault = true;
        }
        
        if (setFn) {
            theValue = setFn(theValue, defValue, theConfig);
            usingDefault = theValue === defValue;
        }
    }

    if (theValue && usingDefault && (isPlainObject(theValue) || isArray(theValue))) {
        theValue = _cfgDeepCopy(theValue);
    }

    // Needed to ensure that the (potentially) new field is dynamic even if null/undefined
    dynamicHandler.set(theConfig, name, theValue);
}

export function applyDefaults<C>(theConfig: C, defaultValues: IConfigDefaults<C>): C {
    if (defaultValues) {
        if (theConfig && !theConfig[CFG_HANDLER_LINK] && (isPlainObject(theConfig) || isArray(theConfig))) {
            throwInvalidAccess(STR_NOT_DYNAMIC_ERROR + dumpObj(theConfig))
        }
    
        // Resolve/apply the defaults
        objForEachKey(defaultValues, (name, value) => {
            // Sets the value and makes it dynamic (if it doesn't already exist)
            _applyDefaultValue(theConfig, name, value);
        });
    }

    return theConfig;
}
