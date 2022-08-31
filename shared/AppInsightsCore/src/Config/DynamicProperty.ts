// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    arrForEach, dumpObj, isArray, objDefineAccessors, objDefineProp, objForEachKey, objGetOwnPropertyDescriptor
} from "@nevware21/ts-utils";
import { isPlainObject } from "../JavaScriptSDK/HelperFuncs";
import { UNDEFINED_VALUE } from "../JavaScriptSDK/InternalConstants";
import { CFG_HANDLER_LINK, throwInvalidAccess } from "./DynamicSupport";
import { IWatcherHandler, _IDynamicDetail } from "./IDynamicWatcher";
import { _IDynamicConfigHandlerState } from "./_IDynamicConfigHandlerState";

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

function _makeDynamicProperty<T, C, V = any>(state: _IDynamicConfigHandlerState<T>, theConfig: C, name: string, value: V) {
    // Does not appear to be dynamic so lets make it so
    let detail: _IDynamicDetail<T> = {
        n: name,
        h: [],
        add: function (handler: IWatcherHandler<T>) {
            if (handler && handler.fn && detail.h.indexOf(handler) === -1) {
                detail.h.push(handler);
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
            detail.add(activeHandler);
        }

        return value;
    }
    
    // Tag this getting as our dynamic property
    _getProperty[state.prop] = true;

    function _setProperty(newValue: V) {
        if (value !== newValue) {
            if (!!_setProperty[state.ro] && state.upd) {
                // field is marked as readonly so return false
                throwInvalidAccess("[" + name + "] is sealed from " + dumpObj(theConfig));
            }

            // As we are replacing the value, if already dynamic then we need to notify any listeners that changes
            // are happening
            if (value && value[CFG_HANDLER_LINK]) {
                // For objects / arrays, we can indirectly inform any listeners by just changing the value to undefined
                // This will trigger any listeners by simply calling their version of the setter.
                if (isPlainObject(value)) {
                    objForEachKey(value, (key) => {
                        value[key] = UNDEFINED_VALUE;
                    });
                } else if (isArray(value)) {
                    arrForEach(value, (propValue, idx) => {
                        value[idx] = UNDEFINED_VALUE;
                    });
                }
            }

            checkDynamic = false;
            if (isPlainObject(newValue) || isArray(newValue)) {
                _makeDynamicObject(state, newValue);
            }

            value = newValue;

            // Cause any listeners to be scheduled for notification
            state.add(detail);
        }
    }

    objDefineAccessors(theConfig, detail.n, _getProperty, _setProperty, true);
}

export function _setDynamicProperty<T, C, V = any>(state: _IDynamicConfigHandlerState<T>, target: C, name: string, value: V) {
    if (target) {
        let isDynamic = false;
        // To be a dynamic property it needs to have a get function
        let propDesc = objGetOwnPropertyDescriptor(target, name);
        if (propDesc && propDesc.get) {
            isDynamic = !!propDesc.get[state.prop];
        }
    
        if (!isDynamic) {
            _makeDynamicProperty(state, target, name, value);
        } else {
            // Looks like it's already dynamic and a different value so just assign the new value
            target[name] = value;
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
