// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IUnloadHook } from "../../JavaScriptSDK.Interfaces/IUnloadHook";
import { eAttributeChangeOp } from "../enums/eAttributeChangeOp";
import { IOTelAttributes, OTelAttributeValue } from "../interfaces/IOTelAttributes";

/**
 * Identifies the source of an attribute value in iterator operations
 * @since 3.4.0
 */
export const enum eAttributeFilter {
    /**
     * The attribute exists local to the current container instance
     */
    Local = 0,

    /**
     * The attribute does not exist locally and is inherited from a parent container or attributes object
     */
    Inherited = 1,

    /**
     * The attribute exists or has been deleted locally (only) to the current container instance
     */
    LocalOrDeleted = 2
}

export type AttributeFilter = number | eAttributeFilter;

/**
 * Information about what changed in an attribute container
 */
export interface IAttributeChangeInfo<V  extends OTelAttributeValue = OTelAttributeValue> {
    /**
     * The Id of the container that is initiated the change (not the immediate sender -- which is always the parent)
     * As children only receive listener notifications from their parent in reaction to both changes
     * they make and any changes they receive from their parent
     */
    frm: string;

    /**
     * Operation type that occurred
     */
    op: eAttributeChangeOp;
    
    /**
     * The key that was changed (only present for 'set' operations)
     */
    k?: string;
    
    /**
     * The old value (only present for 'set' operations when replacing existing value)
     */
    prev?: V;
    
    /**
     * The new value (only present for 'set' operations)
     */
    val?: V;
}

/**
 * Interface for an attribute container
 * @since 3.4.0
 */
export interface IAttributeContainer<V extends OTelAttributeValue = OTelAttributeValue> {
    /**
     * Unique identifier for the attribute container
     */
    readonly id: string;

    /**
     * The number of attributes that have been set
     * @returns The number of attributes that have been set
     */
    readonly size: number;

    /**
     * The number of attributes that were dropped due to the attribute limit being reached
     * @returns The number of attributes that were dropped due to the attribute limit being reached
     */
    readonly droppedAttributes: number;

    /**
     * Return a snapshot of the current attributes, including inherited ones.
     * This value is read-only and reflects the state of the attributes at the time of access,
     * and the returned instance will not change if any attributes are modified later, you will need
     * to access the attributes property again to get the latest state.
     *
     * Note: As this causes a snapshot to be taken, it is an expensive operation as it enumerates all
     * attributes, so you SHOULD use this property sparingly.
     * @returns A read-only snapshot of the current attributes
     */
    readonly attributes: IOTelAttributes;

    /**
     * Clear all existing attributes from the container, this will also remove any inherited attributes
     * from this instance only (it will not change the inherited attributes / container(s))
     */
    clear: () => void;
    
    /**
     * Get the value of an attribute by key
     * @param key - The attribute key to retrieve
     * @param source - Optional filter to only check attributes from a specific source (Local or Inherited)
     * @returns The attribute value if found, undefined otherwise
     */
    get: (key: string, source?: eAttributeFilter) => V | undefined;
    
    /**
     * Check if an attribute exists by key
     * @param key - The attribute key to check
     * @param source - Optional filter to only check attributes from a specific source (Local or Inherited)
     * @returns True if the attribute exists, false otherwise
     */
    has: (key: string, source?: eAttributeFilter) => boolean;
    
    /**
     * Set the value of an attribute by key on this instance.
     * @param key - The attribute key to set
     * @param value - The value to assign to the named attribute
     * @returns true if the value was successfully set / replaced
     */
    set: (key: string, value: V) => boolean;
    
    /**
     * Delete an existing attribute, if the key doesn't exist this will return false. If the key does
     * exist then it will be removed from this instance and any inherited value will be hidden (even if
     * the inherited value changes)
     * @param key - The attribute key to delete
     * @returns True if the attribute was deleted, false if it didn't exist (which includes if it has already been deleted)
     */
    del: (key: string) => boolean;
    
    /**
     * The keys() method returns a new iterator object that contains the existing keys for each element
     * in this attribute container. It will return all locally set keys first and then the inherited keys.
     * When a key exists in both the local and inherited attributes, only the local key will be returned.
     * If the key has been deleted locally, it will not be included in the iterator.
     * @returns An iterator over the keys of the attribute container
     */
    keys: () => Iterator<string>;

    /**
     * The entries() method of returns a new iterator object that contains the [key, value, source?] tuples for
     * each attribute, it returns all existing attributes of this instance including all inherited ones. If the
     * same key exists in both the local and inherited attributes, only the first (non-deleted) tuple will be returned.
     * If the key has been deleted, it will not be included in the iterator.
     *
     * The source value of the tuple identifies the origin of the attribute (Local or Inherited).
     * @returns An iterator over the entries of the attribute container
     */
    entries: () => Iterator<[string, V, eAttributeFilter]>;

    /**
     * The forEach() method of executes a provided function once per each key/value pair in this attribute container,
     * it will process all local attributes first, then the inherited attributes.  If the same key exists in both the
     * local and inherited attributes, only the first (non-deleted) key/value pair will be processed.
     * If a key has been deleted, it will not be included in the set of processed key/value pairs.
     * @param callback - The function to execute for each key/value pair
     * @param thisArg - Optional value to use as `this` when executing `callback`
     */
    forEach: (callback: (key: string, value: V, source?: eAttributeFilter) => void, thisArg?: any) => void;

    /**
     * The values() method returns a new iterator instance that contains the values for each element in this
     * attribute container. It will return all locally set values first and then the inherited values. If the
     * same key is present in both the local or inherited attributes only the first (non-deleted) value will be
     * returned. If a key has been deleted, it will not be included in the iterator.
     * @returns An iterator over the values of the attribute container
     */
    values: () => Iterator<V>;

    /**
     * Register a callback listener for any attribute changes, this will include local and inherited changes.
     * @param callback - Function to be called when attributes change, receives change information
     * @returns IUnloadHook instance with rm() function to remove this listener, once called it will never be invoked again
     */
    listen: (callback: (changeInfo: IAttributeChangeInfo<V>) => void) => IUnloadHook;

    /**
     * Create a child attribute container that inherits from this one, optionally taking a snapshot
     * so that any future changes to the parent container do not affect the child container.
     * The child will use all of the configuration from the parent container.
     * @param name - Optional name for the child container
     * @param snapshot - If true, the child container will be a snapshot of the current state
     * @returns A new attribute container instance
     */
    child: (name?: string, snapshot?: boolean) => IAttributeContainer
}
