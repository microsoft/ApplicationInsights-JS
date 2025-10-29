// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ICachedValue, createCachedValue, newSymbol, objCreate, objDefine } from "@nevware21/ts-utils";
import { IOTelContext } from "../../interfaces/context/IOTelContext";

let _InternalContextKey: ICachedValue<symbol>

/**
 * Creates a new context with the given parent, if a value does not exist
 * in the current context it will look in the parent context. When setting
 * or deleting a value, it will only affect the current context.
 * @param parent - The optional parent context.
 * @returns A new context instance.
 */
export function createContext(parent?: IOTelContext): IOTelContext {
    let theValues = objCreate(null);
    let theContext = {
        getValue: _getValue,
        setValue: _setValue,
        deleteValue: _deleteValue
    };

    if (!_InternalContextKey) {
        // Created as a new symbol so it's unique to this context regardless of the parent
        // And any other context that may have been created or loaded into some other scope (bundle, etc.)
        _InternalContextKey = createCachedValue(newSymbol("OTelSdk$InternalContextKey"));
    }

    objDefine(theContext as any, _InternalContextKey.v, {
        e: false,
        v: theValues
    });

    function _getValue(key: symbol) {
        let theValue: unknown;
        if (key in theValues) {
            theValue = theValues[key];
        } else if (parent) {
            // Bring the value up from the parent and cache it
            theValue = theValues[key] = parent.getValue(key);
        }

        return theValue;
    }

    function _setValue(key: symbol, value: unknown) {
        let newContext = createContext(parent);
        ((newContext as any)[_InternalContextKey.v])[key] = value;
        return theContext;
    }

    function _deleteValue(key: symbol) {
        // Set the value to undefined to indicate it was deleted
        // Also cache the "deleted" value so we don't go back to the parent
        return _setValue(key, undefined);
    }

    return theContext;
}
