// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ICachedValue, WellKnownSymbols, arrForEach, arrIndexOf, createCachedValue, createDeferredCachedValue, getKnownSymbol, isArray,
    isFunction, isNullOrUndefined, isString, objDefine, objDefineProps, safe, strSplit
} from "@nevware21/ts-utils";
import { STR_EMPTY } from "../constants/InternalConstants";
import { IW3cTraceState } from "../interfaces/ai/IW3cTraceState";
import { findMetaTags, findNamedServerTimings } from "../utils/EnvUtils";

const MAX_TRACE_STATE_MEMBERS = 32;
const MAX_TRACE_STATE_LEN = 512;

// https://www.w3.org/TR/trace-context-1/#key
const LCALPHA = "[a-z]";
const LCALPHA_DIGIT = "[a-z\\d]";
const LCALPHA_DIGIT_UNDERSCORE_DASH_STAR_SLASH = "[a-z\\d_\\-*\\/]";
const SIMPLE_KEY = "(" + LCALPHA + LCALPHA_DIGIT_UNDERSCORE_DASH_STAR_SLASH + "{0,255})";
const TENANT_ID = "(" + LCALPHA_DIGIT + LCALPHA_DIGIT_UNDERSCORE_DASH_STAR_SLASH + "{0,240})";
const SYSTEM_ID = "(" + LCALPHA + LCALPHA_DIGIT_UNDERSCORE_DASH_STAR_SLASH + "{0,13})";
const MULTI_TENANT_KEY = "(" + TENANT_ID + "@" + SYSTEM_ID + ")";

// https://www.w3.org/TR/trace-context-1/#value
const NBLK_CHAR = "\x21-\x2B\\--\x3C\x3E-\x7E";
const TRACESTATE_VALUE = "[\x20" + NBLK_CHAR + "]{0,255}[" + NBLK_CHAR + "]";

// https://www.w3.org/TR/trace-context-1/#tracestate-header
const TRACESTATE_KVP_REGEX = new RegExp("^\\s*((?:" + SIMPLE_KEY + "|" + MULTI_TENANT_KEY + ")=(" + TRACESTATE_VALUE + "))\\s*$");

/**
 * @internal
 * @ignore
 * Identifies the components of a multi-tenant key
 */
interface ITraceStateMultiTenantKey {
    tenantId: string;
    systemId: string;
}

/**
 * @internal
 * @ignore
 * Identifies the member entry type
 */
const enum eTraceStateKeyType {
    simple = 0,
    multiTenant = 1,

    /**
     * Internal flag the identifies that the associated key has been deleted
     */
    deleted = 2
}

/**
 * @internal
 * @ignore
 * Represents the parsed trace state member
 */
interface ITraceStateMember {
    /**
     * Identifies the type of identified key, simple or multi-tenant
     */
    readonly type: eTraceStateKeyType;

    /**
     * The full key of the trace state member
     */
    readonly key: string;

    /**
     * When the {@link #type} is {@link eTraceStateKeyType.multiTenant}, the tenantId and systemId will be populated
     * with the values from the key, otherwise this entry will be undefined or null and should be ignored.
     */
    readonly multiTenant?: ITraceStateMultiTenantKey;

    /**
     * The value associated with the trace state member.
     * If the type is {@link eTraceStateKeyType.deleted} then the value should be ignored
     * and will likely be undefined.
     */
    readonly value?: string;
}

/**
 * @internal
 * Parse a trace state key/value pair
 * @param value - the key/value pair as a string
 * @returns The trace state member if valid, otherwise null
 */
function _parseListMember(value: string): ITraceStateMember | null {
    if (value) {
        TRACESTATE_KVP_REGEX.lastIndex = 0; // Reset the regex to ensure we start from the beginning
        let match = TRACESTATE_KVP_REGEX.exec(value);
        if (match && match.length >= 7 && match[1] && match[6]) {
            let type = match[3] ? eTraceStateKeyType.multiTenant : eTraceStateKeyType.simple;
            let multiTenant: ITraceStateMultiTenantKey = null;
            if (type === eTraceStateKeyType.multiTenant) {
                multiTenant = {
                    tenantId: match[4],
                    systemId: match[5]
                };
            }
            let parts: ITraceStateMember = {
                type: type,
                key: match[2],
                multiTenant: multiTenant,
                value: match[6]
            };
    
            return parts;
        }
    }

    return null;
}

/**
 * @internal
 * Parse the trace state list from a string
 * @param value - the list of trace states as a string
 * @returns An array of trace state members
 */
function _parseTraceStateList(value?: string): ITraceStateMember[] {
    let items: ITraceStateMember[] = [];

    if (value) {
        let addedKeys: string[] = [];
        arrForEach(strSplit(value, ","), (member) => {
            let parts = _parseListMember(member);
            if (parts) {
                // As per the spec, the first occurrence of a key is the one that should be used
                // as all new entries are added to the front (left) of the list
                if (arrIndexOf(addedKeys, parts.key) === -1) {
                    items.push(parts);
                    addedKeys.push(parts.key);

                    if (items.length >= MAX_TRACE_STATE_MEMBERS) {
                        // The trace state list should not exceed 32 members
                        return -1;
                    }
                }
            }
        });
    }

    return items;
}

function _indexOf(items: ITraceStateMember[], key: string): number {
    for (let lp = 0; lp < items.length; lp++) {
        if (items[lp].key === key) {
            return lp;
        }
    }

    return -1;
}

function _keys(items: ITraceStateMember[], parent?: IW3cTraceState | null): string[] {
    let keys: string[] = [];
    let delKeys: string[] = [];
    arrForEach(items, (member) => {
        if (member.value != null) {
            keys.push(member.key);
        } else {
            delKeys.push(member.key);
        }
    });

    if (parent) {
        // Get and add parent keys that are not in the current list or marked as deleted
        arrForEach(parent.keys, (key) => {
            if (arrIndexOf(keys, key) === -1 && arrIndexOf(delKeys, key) === -1) {
                keys.push(key);
            }
        });
    }

    return keys;
}

/**
 * @internal
 * Identifies if the provided items are empty, meaning it has no keys or values.
 * @param items - The items to check
 * @param parent - The parent trace state to check for keys
 * @returns true if the items are empty, false otherwise
 */
function _isEmpty(items: ITraceStateMember[], parent?: IW3cTraceState | null): boolean {
    let delKeys: string[];
    let isEmpty = true;

    if (items && items.length > 0) {
        arrForEach(items, (member) => {
            if (member.value != null) {
                isEmpty = false;
            } else {
                if (!delKeys) {
                    delKeys = [];
                }

                // If the value is null then this is a deleted key, so we can ignore it
                delKeys.push(member.key);
            }
        });
    }

    if (isEmpty && parent) {
        isEmpty = parent.isEmpty;
        if (!isEmpty && delKeys && delKeys.length > 0) {
            // If the parent is not empty then we need to check if any of the keys are in the deleted list
            isEmpty = true;
            arrForEach(parent.keys, (key) => {
                if (arrIndexOf(delKeys, key) === -1) {
                    isEmpty = false;
                    return -1; // Break out of the loop
                }
            });
        }
    }

    return isEmpty;
}

/**
 * Identifies if the provided value looks like a distributed trace state instance
 * @param value - The value to check
 * @returns - True if the value looks like a distributed trace state instance
 */
export function isW3cTraceState(value: any): value is IW3cTraceState {
    return !!(value && isArray(value.keys) && isFunction(value.get) && isFunction(value.set) && isFunction(value.del) && isFunction(value.hdrs));
}

/**
 * Creates a new mutable {@link IW3cTraceState} instance, optionally inheriting from the parent trace state
 * and optionally using the provided encoded string value as the initial trace state.
 * Calls to {@link IW3cTraceState.set} and {@link IW3cTraceState.del} will modify the current instance
 * which means that any child instance that is using this instance as a parent will also be indirectly
 * modified unless the child instance has overridden the value associated with the modified key.
 * @since 3.4.0
 * @param value - The string value for the trace state
 * @param parent - The parent trace state to inherit any existing keys from.
 * @returns - A new distributed trace state instance
 */
export function createW3cTraceState(value?: string | null, parent?: IW3cTraceState | null): IW3cTraceState {
    let cachedItems: ICachedValue<ITraceStateMember[]> = createDeferredCachedValue(() => safe(_parseTraceStateList, [value || STR_EMPTY]).v || []);

    function _get(key: string): string | undefined {
        let value: string | undefined;
        let theItems = cachedItems.v;
        let idx = _indexOf(theItems, key);
        if (idx !== -1) {
            let itmValue = theItems[idx].value;
            if (itmValue != null) {
                // Special case for the value being null, which means the key was deleted
                value = itmValue;
            }
        } else if (parent) {
            // Get the value from the parent if it exists
            value = parent.get(key);
        }
        
        return value;
    }
    
    function _setMember(member: ITraceStateMember): number {
        if (member) {
            let theItems = cachedItems.v;
            let idx = _indexOf(theItems, member.key);
            if (idx !== -1) {
                // Move the item to the front of the list, removing the previous instance
                theItems.splice(idx, 1);
            }

            theItems.unshift(member);
            // We need to re-create the cached value as during testing the cached lazy value
            // may get re-evaluated resetting the items to the original value
            cachedItems = createCachedValue(theItems);

            return 0;
        }

        return -1;
    }

    function _set(key: string, value: string | null): number {
        let member: ITraceStateMember | null;
        if (key && isString(key) && !isNullOrUndefined(value) && isString(value)) {
            member = _parseListMember(key + "=" + value); // Validate the key/value pair before adding it to the state
        }

        return _setMember(member);
    }
    
    function _del(key: string) {
        _setMember({
            type: eTraceStateKeyType.deleted,
            key: key
        });
    }
    
    function _headers(maxHeaders?: number, maxKeys?: number, maxLen?: number): string[] {
        let results: string[] = [];
        let result = STR_EMPTY;
        let numKeys = 0;
        let len = 0;

        // Default to the max values if not provided
        maxKeys = maxKeys || MAX_TRACE_STATE_MEMBERS;

        // Default to the max length if not provided
        maxLen = maxLen || MAX_TRACE_STATE_LEN;

        let theItems = cachedItems.v;
        arrForEach(_keys(theItems, parent), (key) => {
            let value = _get(key);
            if (!isNullOrUndefined(value) && isString(value)) {
                numKeys++;
                let val = key + "=" + value;
                let valLen = val.length;
                if (len + 1 + valLen >= maxLen) {
                    // Don't exceed the max length for any single combined header value
                    results.push(result);

                    if (maxHeaders && results.length <= maxHeaders) {
                        // Don't exceed the max number of entries
                        return -1;
                    }

                    result = STR_EMPTY;
                    len = 0;
                }

                if (result.length > 0) {
                    result += ",";
                    len++;
                }

                result += val;
                len += valLen;

                if (numKeys >= maxKeys) {
                    // Only allow the first maxKeys members
                    return -1;
                }
            }
        });

        if (result) {
            results.push(result);
        }

        return results;
    }

    let traceStateList: IW3cTraceState = {
        keys: [],
        isEmpty: false,
        get: _get,
        set: _set,
        del: _del,
        hdrs: _headers,
        child: () => createW3cTraceState(null, traceStateList)
    };

    function _toString() {
        let headers = traceStateList.hdrs(1);
        return headers.length > 0 ? headers[0] : STR_EMPTY;
    }

    objDefineProps<IW3cTraceState>(traceStateList, {
        "keys": {
            g: () => _keys(cachedItems.v, parent)
        },
        "isEmpty": {
            g: () => _isEmpty(cachedItems.v, parent)
        },
        "toString": {
            v: _toString,
            e: false // Do not allow the toString to be enumerated
        },
        "_p": {
            v: parent,
            e: false // Do not allow the parent to be enumerated
        }
    });


    objDefine(traceStateList, getKnownSymbol(WellKnownSymbols.toStringTag), { g: _toString });

    return traceStateList;
}

/**
 * Create a new independent instance of IW3cTraceState that contains a snapshot of all current key/value pairs
 * from the provided instance and any parent instances. The returned instance will have no parent and will be completely
 * independent from any future changes to the original instance or its parent chain.
 * This is useful when you need to capture the current state and ensure it remains unchanged regardless of
 * future modifications to the parent instances.
 * @since 3.4.0
 * @param traceState - The trace state instance to snapshot
 * @returns A new independent instance of IW3cTraceState with all current key/value pairs captured
 */
export function snapshotW3cTraceState(traceState: IW3cTraceState): IW3cTraceState {
    // Create a new independent instance with no parent
    // This ensures the returned instance is completely independent from future changes
    let snapshot = createW3cTraceState(null, null);
    
    if (traceState) {
        let theKeys = traceState.keys;
        
        // Iterate over the keys in reverse order to maintain correct precedence
        // Since set() adds items to the front, we need to add them in reverse order
        // to preserve the original key ordering where newer keys take precedence
        for (let i = theKeys.length - 1; i >= 0; i--) {
            let key = theKeys[i];
            let value = traceState.get(key);
            if (!isNullOrUndefined(value) && isString(value)) {
                // Use the set function to add the key/value pair to the snapshot
                // This leverages the existing validation and formatting logic
                snapshot.set(key, value);
            }
        }
    }

    return snapshot;
}

/**
 * Helper function to fetch the passed traceparent from the page, looking for it as a meta-tag or a Server-Timing header.
 * @since 3.4.0
 * @param selectIdx - If the found value is comma separated which is the preferred entry to select, defaults to the first
 * @returns
 */
export function findW3cTraceState(): IW3cTraceState {
    const name = "tracestate";
    let traceState: IW3cTraceState = null;
    let metaTags = findMetaTags(name);
    if (metaTags.length > 0) {
        traceState = createW3cTraceState(metaTags.join(","));
    }

    if (!traceState) {
        let serverTimings = findNamedServerTimings(name);
        if (serverTimings.length > 0) {
            traceState = createW3cTraceState(serverTimings.join(","));
        }
    }

    return traceState;
}
