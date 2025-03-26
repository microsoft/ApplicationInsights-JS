// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    asString, isArray, isDefined, isNullOrUndefined, isObject, isPlainObject, isUndefined, objForEachKey, objHasOwn
} from "@nevware21/ts-utils";
import { IConfigCheckFn, IConfigDefaultCheck, IConfigDefaults, IConfigSetFn } from "./IConfigDefaults";
import { IDynamicConfigHandler } from "./IDynamicConfigHandler";

function _isConfigDefaults<C, T>(value: any): value is IConfigDefaultCheck<C, C[keyof C], T> {
    return (value && isObject(value) && (value.isVal || value.fb || objHasOwn(value, "v") || objHasOwn(value, "mrg") || objHasOwn(value, "ref") || value.set));
}

function _getDefault<C, T>(dynamicHandler: IDynamicConfigHandler<T>, theConfig: C, cfgDefaults: IConfigDefaultCheck<C, C[keyof C], T>): C[keyof C] | IConfigDefaults<C[keyof C], C> {
    let defValue: C[keyof C] | IConfigDefaults<C[keyof C], C>;
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
            } else if (dynamicHandler) {
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
 * Recursively resolve the default value
 * @param dynamicHandler
 * @param theConfig
 * @param cfgDefaults
 * @returns
 */
function _resolveDefaultValue<C, T>(dynamicHandler: IDynamicConfigHandler<T>, theConfig: C, cfgDefaults: C[keyof C] | IConfigDefaultCheck<C, C[keyof C]>): C[keyof C] {
    let theValue: C[keyof C] = cfgDefaults as C[keyof C];
    
    if (cfgDefaults && _isConfigDefaults<C, T>(cfgDefaults)) {
        theValue = _getDefault<C, T>(dynamicHandler, theConfig, cfgDefaults) as C[keyof C];
    }

    if (theValue) {
        if (_isConfigDefaults<C, T>(theValue)) {
            theValue = _resolveDefaultValue<C, T>(dynamicHandler, theConfig, theValue);
        }

        let newValue: any;
        if (isArray(theValue)) {
            newValue = [];
            newValue.length = theValue.length;
        } else if (isPlainObject(theValue)) {
            newValue = {} as T;
        }

        if (newValue) {
            objForEachKey(theValue, (key, value) => {
                if (value && _isConfigDefaults(value)) {
                    value = _resolveDefaultValue<C, T>(dynamicHandler, theConfig, value) as any;
                }
    
                newValue[key] = value;
            });

            theValue = newValue;
        }
    }

    return theValue as C[keyof C];
}

/**
 * Applies the default value on the config property and makes sure that it's dynamic
 * @param theConfig
 * @param name
 * @param defaultValue
 */
export function _applyDefaultValue<T, C>(dynamicHandler: IDynamicConfigHandler<T>, theConfig: C, name: string, defaultValue: C[keyof C] | IConfigDefaultCheck<C, C[keyof C], T>) {
    // Resolve the initial config value from the provided value or use the defined default
    let isValid: IConfigCheckFn<C[keyof C]>;
    let setFn: IConfigSetFn<C, C[keyof C]>;
    let defValue: C[keyof C] | IConfigDefaults<C[keyof C], C>;
    let cfgDefaults: IConfigDefaultCheck<C, C[keyof C]> = defaultValue as IConfigDefaultCheck<C, C[keyof C]>;
    let mergeDf: boolean;
    let reference: boolean;
    let readOnly: boolean;
    let blkDynamicValue: boolean;

    if (_isConfigDefaults<C, T>(cfgDefaults)) {
        // looks like a IConfigDefault
        isValid = cfgDefaults.isVal;
        setFn = cfgDefaults.set;
        readOnly = cfgDefaults.rdOnly;
        blkDynamicValue = cfgDefaults.blkVal;
        mergeDf = cfgDefaults.mrg;
        reference = cfgDefaults.ref;
        if (!reference && isUndefined(reference)) {
            reference = !!mergeDf;
        }

        defValue = _getDefault(dynamicHandler, theConfig, cfgDefaults);
    } else {
        defValue = defaultValue as C[keyof C];
    }

    if (blkDynamicValue) {
        // Mark the property so that any value assigned will be blocked from conversion, we need to do this
        // before assigning or fetching the value to ensure it's not converted
        dynamicHandler.blkVal(theConfig, name);
    }

    // Set the value to the default value;
    let theValue: any;
    let usingDefault = true;

    let cfgValue = theConfig[name];
    // try and get and user provided values
    if (cfgValue || !isNullOrUndefined(cfgValue)) {
        // Use the defined theConfig[name] value
        theValue = cfgValue;
        usingDefault = false;

        // The values are different and we have a special default value check, which is used to
        // override config values like empty strings to continue using the default
        if (isValid && theValue !== defValue && !isValid(theValue)) {
            theValue = defValue;
            usingDefault = true;
        }

        if (setFn) {
            theValue = setFn(theValue, defValue as C[keyof C], theConfig);
            usingDefault = theValue === defValue;
        }
    }

    if (!usingDefault) {
        if (isPlainObject(theValue) || isArray(defValue)) {
            // we are using the user supplied value and it's an object
            if (mergeDf && defValue && (isPlainObject(defValue) || isArray(defValue)) ) {
                // Resolve/apply the defaults
                objForEachKey(defValue, (dfName: string, dfValue: any) => {
                    // Sets the value and makes it dynamic (if it doesn't already exist)
                    _applyDefaultValue(dynamicHandler, theValue, dfName, dfValue);
                });
            }
        }
    } else if (defValue) {
        // Just resolve the default
        theValue = _resolveDefaultValue(dynamicHandler, theConfig, defValue);
    } else {
        theValue = defValue;
    }

    // if (theValue && usingDefault && (isPlainObject(theValue) || isArray(theValue))) {
    //     theValue = _cfgDeepCopy(theValue);
    // }

    // Needed to ensure that the (potentially) new field is dynamic even if null/undefined
    dynamicHandler.set(theConfig, name, theValue);
    if (reference) {
        dynamicHandler.ref(theConfig, name);
    }

    if (readOnly) {
        dynamicHandler.rdOnly(theConfig, name);
    }
}
