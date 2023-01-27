// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    arrForEach, arrIndexOf, dumpObj, isArray, isPlainObject, objDefineAccessors, objDefineProp, objForEachKey, objGetOwnPropertyDescriptor
} from "@nevware21/ts-utils";
import { CFG_HANDLER_LINK, throwInvalidAccess } from "./DynamicSupport";
import { IWatcherHandler, _IDynamicDetail } from "./IDynamicWatcher";
import { _IDynamicConfigHandlerState, _IDynamicGetter } from "./_IDynamicConfigHandlerState";

const arrayMethodsToPatch = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice"
];

function _patchArray<T>(state: _IDynamicConfigHandlerState<T>, target: any) {
    if (isArray(target)) {
        // Monkey Patch the methods that might change the array
        arrForEach(arrayMethodsToPatch, (method) => {
            let orgMethod = target[method];
            target[method] = function (...args: any[]) {
                const result = orgMethod.apply(this, args);

                // items may be added, removed or moved so need to make some new dynamic properties
                _makeDynamicObject(state, target);

                return result;
            }
        });
    }
}

function _getOwnPropGetter<T>(target: T, name: PropertyKey) {
    let propDesc = objGetOwnPropertyDescriptor(target, name);
    return propDesc && propDesc.get;
}

function _makeDynamicProperty<T, C, V = any>(state: _IDynamicConfigHandlerState<T>, theConfig: C, name: string, value: V): V {
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
    function _getProperty() {

        if (checkDynamic) {
            if (value && !value[CFG_HANDLER_LINK] && (isPlainObject(value) || isArray(value))) {
                // It doesn't look like it's already dynamic so lets make sure it's converted the object into a dynamic Config as well
                value = _makeDynamicObject(state, value);
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

            let isReferenced = _getProperty[state.rf];
            if(isPlainObject(value) || isArray(value)) {
                if (isReferenced) {
                    // Reassign the properties from the current value to the same properties from the newValue
                    // This will set properties not in the newValue to undefined
                    objForEachKey(value, (key) => {
                        value[key] = newValue[key];
                    });
    
                    // Now assign / re-assign value with all of the keys from newValue
                    objForEachKey(newValue, (key, theValue) => {
                        _setDynamicProperty(state, value, key, theValue);
                    });

                    // Now drop newValue so when we assign value later it keeps the existing reference
                    newValue = value;
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

            checkDynamic = false;
            if (!isReferenced && (isPlainObject(newValue) || isArray(newValue))) {
                // As the newValue is an object/array lets preemptively make it dynamic
                _makeDynamicObject(state, newValue);
            }

            // Now assign the internal "value" to the newValue
            value = newValue;

            // Cause any listeners to be scheduled for notification
            state.add(detail);
        }
    }

    objDefineAccessors(theConfig, detail.n, _getProperty, _setProperty, true);

    // Return the dynamic reference
    return _getProperty();
}

export function _setDynamicProperty<T, C, V = any>(state: _IDynamicConfigHandlerState<T>, target: C, name: string, value: V, inPlace?: boolean, rdOnly?: boolean): V {
    if (target) {
        // To be a dynamic property it needs to have a get function
        let getter = _getOwnPropGetter(target, name);
        let isDynamic = getter && !!getter[state.prop];
    
        if (!isDynamic) {
            value = _makeDynamicProperty(state, target, name, value);
            if (inPlace || rdOnly) {
                getter = _getOwnPropGetter(target, name);
            }
        } else {
            // Looks like it's already dynamic just assign the new value
            target[name] = value;
        }

        // Assign the optional flags if true
        if (inPlace) {
            getter[state.rf] = inPlace;
        }

        if (rdOnly) {
            getter[state.ro] = rdOnly;
        }
    }

    return value;
}

export function _makeDynamicObject<T>(state: _IDynamicConfigHandlerState<T>, target: any/*, newValues?: any*/) {
    // Assign target with new value properties (converting into dynamic properties in the process)
    objForEachKey(/*newValues || */target, (key, value) => {
        // Assign and/or make the property dynamic
        _setDynamicProperty(state, target, key, value);
    });

    if (!target[CFG_HANDLER_LINK]) {
        // Link the config back to the dynamic config details
        objDefineProp(target, CFG_HANDLER_LINK, {
            configurable: false,
            enumerable: false,
            get: function() {
                return state.hdlr;
            }
        });

        _patchArray(state, target);
    }

    return target;
}
