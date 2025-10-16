// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IWatcherHandler, _IDynamicConfigHandlerState, _IDynamicDetail, _IDynamicGetter } from "@microsoft/applicationinsights-common";
import {
    arrForEach, arrIndexOf, dumpObj, isArray, objDefine, objDefineProp, objForEachKey, objGetOwnPropertyDescriptor
} from "@nevware21/ts-utils";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { UNDEFINED_VALUE } from "../JavaScriptSDK/InternalConstants";
import { CFG_HANDLER_LINK, _canMakeDynamic, blockDynamicConversion, throwInvalidAccess } from "./DynamicSupport";

export const enum _eSetDynamicPropertyFlags {
    inPlace = 0,
    readOnly = 1,
    blockDynamicProperty = 2
}

const arrayMethodsToPatch = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice"
];

export const _throwDynamicError = (logger: IDiagnosticLogger, name: string, desc: string, e: Error) => {
    logger && logger.throwInternal(eLoggingSeverity.DEBUG, _eInternalMessageId.DynamicConfigException, `${desc} [${name}] failed - ` + dumpObj(e));
};

function _patchArray<T>(state: _IDynamicConfigHandlerState<T>, target: any, name: string) {
    if (isArray(target)) {
        // Monkey Patch the methods that might change the array
        arrForEach(arrayMethodsToPatch, (method) => {
            let orgMethod = target[method];
            target[method] = function (...args: any[]) {
                const result = orgMethod.apply(this, args);

                // items may be added, removed or moved so need to make some new dynamic properties
                _makeDynamicObject(state, target, name, "Patching");

                return result;
            }
        });
    }
}

function _getOwnPropGetter<T>(target: T, name: PropertyKey) {
    let propDesc = objGetOwnPropertyDescriptor(target, name);
    return propDesc && propDesc.get;
}

function _createDynamicProperty<T, C, V = any>(state: _IDynamicConfigHandlerState<T>, theConfig: C, name: string, value: V): void {
    // Does not appear to be dynamic so lets make it so
    let detail: _IDynamicDetail<T> = {
        n: name,
        h: [],
        trk: function (handler: IWatcherHandler<T>) {
            if (handler && handler.fn) {
                if (arrIndexOf(detail.h, handler) === -1) {
                    // Add this handler to the collection that should be notified when the value changes
                    detail.h.push(handler);
                }

                state.trk(handler, detail);
            }
        },
        clr: function(handler: IWatcherHandler<T>) {
            let idx = arrIndexOf(detail.h, handler);
            if (idx !== -1) {
                detail.h.splice(idx, 1);
            }
        }
    }

    // Flag to optimize lookup response time by avoiding additional function calls
    let checkDynamic = true;
    let isObjectOrArray = false;

    function _getProperty() {

        if (checkDynamic) {
            isObjectOrArray = isObjectOrArray || _canMakeDynamic(_getProperty, state, value);

            // Make sure that if it's an object that we make it dynamic
            if (value && !value[CFG_HANDLER_LINK] && isObjectOrArray) {
                // It doesn't look like it's already dynamic so lets make sure it's converted the object into a dynamic Config as well
                value = _makeDynamicObject(state, value, name, "Converting");
            }

            // If it needed to be converted it now has been
            checkDynamic = false;
        }

        // If there is an active handler then add it to the tracking set of handlers
        let activeHandler = state.act;
        if (activeHandler) {
            detail.trk(activeHandler);
        }

        return value;
    }
    
    // Tag this getter as our dynamic property and provide shortcut for notifying a change
    _getProperty[state.prop] = {
        chng: function() {
            state.add(detail);
        }
    };

    function _setProperty(newValue: V) {
        if (value !== newValue) {
            if (!!_getProperty[state.ro] && !state.upd) {
                // field is marked as readonly so return false
                throwInvalidAccess("[" + name + "] is read-only:" + dumpObj(theConfig));
            }

            if (checkDynamic) {
                isObjectOrArray = isObjectOrArray || _canMakeDynamic(_getProperty, state, value);
                checkDynamic = false;
            }

            // The value must be a plain object or an array to enforce the reference (in-place updates)
            let isReferenced = isObjectOrArray && _getProperty[state.rf];

            if(isObjectOrArray) {
                // We are about to replace a plain object or an array
                if (isReferenced) {
                    // Reassign the properties from the current value to the same properties from the newValue
                    // This will set properties not in the newValue to undefined
                    objForEachKey(value, (key) => {
                        value[key] = newValue ? newValue[key] : UNDEFINED_VALUE;
                    });
    
                    // Now assign / re-assign value with all of the keys from newValue
                    try {
                        objForEachKey(newValue, (key, theValue) => {
                            _setDynamicProperty(state, value, key, theValue);
                        });

                        // Now drop newValue so when we assign value later it keeps the existing reference
                        newValue = value;
                    } catch (e) {
                        // Unable to convert to dynamic property so just leave as non-dynamic
                        _throwDynamicError((state.hdlr || {}).logger, name, "Assigning", e);
                        // Mark as not an object or array so we don't try and do this again
                        isObjectOrArray = false;
                    }

                } else if (value && value[CFG_HANDLER_LINK]) {
                    // As we are replacing the value, if it's already dynamic then we need to notify the listeners
                    // for every property it has already
                    objForEachKey(value, (key) => {
                        // Check if the value is dynamic
                        let getter = _getOwnPropGetter(value, key);
                        if (getter) {
                            // And if it is tell it's listeners that the value has changed
                            let valueState: _IDynamicGetter = getter[state.prop];
                            valueState && valueState.chng();
                        }
                    });
                }
            }

            if (newValue !== value) {
                let newIsObjectOrArray = newValue && _canMakeDynamic(_getProperty, state, newValue);
                if (!isReferenced && newIsObjectOrArray) {
                    // As the newValue is an object/array lets preemptively make it dynamic
                    newValue = _makeDynamicObject(state, newValue, name, "Converting");
                }

                // Now assign the internal "value" to the newValue
                value = newValue;
                isObjectOrArray = newIsObjectOrArray;
            }

            // Cause any listeners to be scheduled for notification
            state.add(detail);
        }
    }

    objDefine<any>(theConfig, detail.n, { g: _getProperty, s: _setProperty });
}

export function _setDynamicProperty<T, C, V = any>(state: _IDynamicConfigHandlerState<T>, target: C, name: string, value: V): C {
    if (target) {
        // To be a dynamic property it needs to have a get function
        let getter = _getOwnPropGetter(target, name);
        let isDynamic = getter && !!getter[state.prop];
    
        if (!isDynamic) {
            _createDynamicProperty(state, target, name, value);
        } else {
            // Looks like it's already dynamic just assign the new value
            target[name] = value;
        }
    }

    return target;
}

export function _setDynamicPropertyState<T, C>(state: _IDynamicConfigHandlerState<T>, target: C, name: string, flags?: { [key in _eSetDynamicPropertyFlags]?: boolean }): C {
    if (target) {
        // To be a dynamic property it needs to have a get function
        let getter = _getOwnPropGetter(target, name);
        let isDynamic = getter && !!getter[state.prop];
        let inPlace = flags && flags[_eSetDynamicPropertyFlags.inPlace];
        let rdOnly = flags && flags[_eSetDynamicPropertyFlags.readOnly];
        let blkProp = flags && flags[_eSetDynamicPropertyFlags.blockDynamicProperty];
    
        if (!isDynamic) {
            if (blkProp) {
                try {
                    // Attempt to mark the target as blocked from conversion
                    blockDynamicConversion(target);
                } catch (e) {
                    _throwDynamicError((state.hdlr || {}).logger, name, "Blocking", e);
                }
            }

            try {
                // Make sure it's dynamic so that we can tag the property as per the state
                _setDynamicProperty(state, target, name, target[name]);
                getter = _getOwnPropGetter(target, name);
            } catch (e) {
                // Unable to convert to dynamic property so just leave as non-dynamic
                _throwDynamicError((state.hdlr || {}).logger, name, "State", e);
            }
        }

        // Assign the optional flags if true
        if (inPlace) {
            getter[state.rf] = inPlace;
        }

        if (rdOnly) {
            getter[state.ro] = rdOnly;
        }

        if (blkProp) {
            getter[state.blkVal] = true;
        }
    }

    return target;
}

export function _makeDynamicObject<T>(state: _IDynamicConfigHandlerState<T>, target: any, name: string, desc: string) {
    try {
        // Assign target with new value properties (converting into dynamic properties in the process)
        objForEachKey(target, (key, value) => {
            // Assign and/or make the property dynamic
            _setDynamicProperty(state, target, key, value);
        });

        if (!target[CFG_HANDLER_LINK]) {
            // Link the config back to the dynamic config details
            objDefineProp(target, CFG_HANDLER_LINK, {
                get: function() {
                    return state.hdlr;
                }
            });

            _patchArray(state, target, name);
        }
    } catch (e) {
        // Unable to convert to dynamic property so just leave as non-dynamic
        _throwDynamicError((state.hdlr || {}).logger, name, desc, e);
    }

    return target;
}
