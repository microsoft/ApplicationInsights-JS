// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    CreateIteratorContext, ICachedValue, arrForEach, arrIndexOf, createCachedValue, createIterator, getLength, isFunction, isObject,
    isUndefined, iterForOf, objCreate, objDefine, objDefineProps, objForEachKey, objIs, objKeys, safe, strSplit
} from "@nevware21/ts-utils";
import { STR_EMPTY, UNDEFINED_VALUE } from "../../constants/InternalConstants";
import { eAttributeChangeOp } from "../../enums/otel/eAttributeChangeOp";
import { IUnloadHook } from "../../interfaces/ai/IUnloadHook";
import { IOTelAttributes, OTelAttributeValue } from "../../interfaces/otel/IOTelAttributes";
import { IAttributeChangeInfo, IAttributeContainer, eAttributeFilter } from "../../interfaces/otel/attribute/IAttributeContainer";
import { IOTelAttributeLimits } from "../../interfaces/otel/config/IOTelAttributeLimits";
import { IOTelConfig } from "../../interfaces/otel/config/IOTelConfig";
import { IOTelTraceCfg } from "../../interfaces/otel/config/IOTelTraceCfg";
import { handleAttribError } from "../../internal/commonUtils";

let _inheritedKey = "~[[inherited]]";
let _deletedKey = "~[[deleted]]";
let _containerId = 0;

type IAttributeBranch<V> = { [key: string]: IAttributeNode<V> };

const enum eAttributeSource {
    Local = 0,

    Inherited = 1
}

interface _AttributeFindDetail<V> {
    /**
     * The hosting container
     */
    c: IAttributeContainer;

    /**
     * The found key
     */
    k: string;

    /**
     * The local attribute node
     */
    n: IAttributeNode<V>;

    /**
     * The found value
     */
    v: V;

    /**
     * The attribute source (local or inherited)
     */
    s: eAttributeSource;

    /**
     * Identifies if this key should be considered to "exist" (is if present)
     */
    e: boolean;
}

interface IAttributeNode<V> {
    /**
     * The value of the attribute tree
     */
    v?: V;

    /**
     * Identifies that this is a leaf node in the attribute tree
     */
    n?: IAttributeBranch<V>;
    
    /**
     * Identifies that this node has been locally deleted
     */
    d?: boolean;
}

interface IAttributeIteratorState<V> {
    p: string;
    n: IAttributeBranch<V>;
    k: string[];
    i: number;
}

const enum AddAttributeResult {
    Success = 0,
    MaxAttribsExceeded = 1,
    BranchNodeExists = 2,
    LeafNodeExists = 3,
    EmptyKey = 4
}

interface IAddAttributeDetails<V> {
    r: AddAttributeResult;  // result
    a?: boolean;            // added (true if new attribute was added, false if existing was replaced)
    p?: V;                  // prev (the previous value if one existed)
}

function _noOpFunc() {
    // No-op function
}

function _addValue<V extends OTelAttributeValue>(container: IAttributeContainer<V>, target: IAttributeBranch<V>, theKey: string, value: V, maxAttribs: number, cfg: IOTelConfig): IAddAttributeDetails<V> {
    let errorHandlers = cfg.errorHandlers || {};
    if (theKey && getLength(theKey) > 0) {
        let key = theKey.split(".");
        let parts: string[] = [];
        let keyIndex = 0;
        
        let keyLen = getLength(key);
        while (keyIndex < keyLen) {
            let part = key[keyIndex];
            parts.push(part);
            
            if (keyIndex === keyLen - 1) {
                // last part
                if (target[part] && target[part].n) {
                    // This node already exists as a branch node
                    handleAttribError(errorHandlers, "Attribute key [" + parts.join(".") + "] already exists as a branch node", theKey, value);
                    return { r: AddAttributeResult.BranchNodeExists };
                }

                if (!target[part] || target[part].d) {
                    // Node doesn't exist or was deleted
                    if (container.size >= maxAttribs) {
                        // If the key is not already present, we have exceeded the limit
                        // But if it does exist in the hierarchy, we can replace it locally
                        if (!container.has(theKey)) {
                            handleAttribError(errorHandlers, "Maximum allowed attributes exceeded [" + maxAttribs + "]", theKey, value);
                            return { r: AddAttributeResult.MaxAttribsExceeded };
                        }
                    }

                    // Add new leaf node or restore deleted node
                    target[part] = {
                        v: value
                    };
                    return { r: AddAttributeResult.Success, a: true };
                } else {
                    // replace the value - capture the previous value
                    let previousValue = target[part].v;
                    target[part].v = value;
                    target[part].d = false; // Clear any deleted flag when setting value
                    return { r: AddAttributeResult.Success, a: false, p: previousValue };
                }
            }

            if (!target[part]) {
                target[part] = {
                    n: {}
                };
            }

            if (!target[part].n) {
                handleAttribError(errorHandlers, "Attribute key [" + parts.join(".") + "] already exists as a leaf node", theKey, value);
                return { r: AddAttributeResult.LeafNodeExists };
            }

            target = target[part].n;
            keyIndex++;
        }
    }

    handleAttribError(errorHandlers, "Attribute key is empty", theKey, value);
    return { r: AddAttributeResult.EmptyKey };
}

/**
 * Delete a specific attribute from the tree
 * @param target - The target branch to delete from
 * @param key - The key parts to delete
 * @returns true if the attribute was deleted, false if it didn't exist
 */
function _deleteValue<V extends OTelAttributeValue>(target: IAttributeBranch<V>, key: string[]): { d: boolean; p?: V } {
    if (key && getLength(key) > 0) {
        let keyIndex = 0;
        let keyLen = getLength(key);
        
        // Navigate to the parent of the target node, creating path if needed
        while (keyIndex < keyLen - 1) {
            let part = key[keyIndex++];
            
            if (!target[part]) {
                target[part] = {
                    n: {}
                };
            }

            if (!target[part].n) {
                // Path is blocked by a leaf node, can't delete
                return { d: false };
            }

            target = target[part].n;
        }
        
        // Now we're at the parent of the target node
        let lastPart = key[keyLen - 1];
        
        if (target[lastPart] && !target[lastPart].d && !target[lastPart].n) {
            // Node exists, is not already deleted, and is a leaf - delete it
            let prev = target[lastPart].v;
            target[lastPart].d = true; // Mark as deleted
            target[lastPart].v = UNDEFINED_VALUE; // Clear the value
            return { d: true, p: prev };
        } else if (!target[lastPart] || !target[lastPart].d) {
            // Node doesn't exist or is not already deleted - create a deleted marker
            // This is important for tracking inherited keys that are locally deleted
            // and for the edge case where inherited keys might be added later
            target[lastPart] = {
                d: true // Mark as deleted without a value
            };
            return { d: true };
        }
    }

    return { d: false };
}

/**
 * Find a local specific node (including if it's been deleted) in the attribute tree, or if it exists in an inherited source
 * @param container - The target attribute container to search in
 * @param key - The key to search for
 * @param filter - The filter to apply
 * @param cb - The callback function to execute when the node is found
 * @param nodes - The attribute branches to search in
 * @param inheritContainer - The inherited attribute container
 * @param inheritAttribObj - The inherited attribute object
 * @param otelCfg - Optional OpenTelemetry configuration
 * @returns The result of the callback function
 */
function _findDetail<V, T>(container: IAttributeContainer, key: string, filter: eAttributeFilter | undefined, cb: (detail?: _AttributeFindDetail<V>) => T, nodes: IAttributeBranch<V>, inheritContainer?: IAttributeContainer | null, inheritAttribObj?: IOTelAttributes | null, otelCfg?: IOTelConfig) {
    let theDetail: _AttributeFindDetail<V>;

    // Find the local node
    if (key && getLength(key) > 0) {
        let theNode: IAttributeNode<V> | undefined;
        let target = nodes;
        let keys = strSplit(key, ".");
        let keysLen = getLength(keys);
        let idx = 0;

        if (filter == eAttributeFilter.Local || filter === eAttributeFilter.LocalOrDeleted || isUndefined(filter)) {
            // Find any local node (if it exists)
            while (target && idx < keysLen) {
                let part = keys[idx++];
                let node = target[part];
                if (node && idx >= keysLen) {
                    // last part
                    theNode = node;
                    break;
                }

                if (!node || !node.n) {
                    // TODO - support wildcard(s) (when no node is found), likely need to refactor this to support multiple keys
                    break;
                }

                target = node.n;
            }

            // So if the caller didn't specify a filter then always return the found "value" (which will be undefined for a deleted key)
            // If they have specified a filter, then we need to respect that filter where Local and LocalOrDeleted are treated the same
            if (theNode) {
                theDetail = {
                    c: container,
                    k: key,
                    n: theNode,
                    v: theNode.d ? UNDEFINED_VALUE : theNode.v,
                    s: eAttributeSource.Local,
                    e: !theNode.d
                };
            }
        }

        // So we get here if
        // - We didn't find a node (no local overrides)
        // - The filter doesn't match (undefined, Local, LocalOrDeleted), so we didn't look for a node
        // So we just need to check if the filter is undefined or inherited and if so we are free
        // to look in the inherited sources
        if (!theDetail && (filter === eAttributeFilter.Inherited || isUndefined(filter))) {
            const inheritedValue = _getInheritedValue(key, inheritContainer, inheritAttribObj);
            if (inheritedValue) {
                theDetail = {
                    c: container,
                    k: key,
                    n: null,
                    v: inheritedValue.v as V,
                    s: eAttributeSource.Inherited,
                    e: true
                };
            }
        }
    }

    return cb(theDetail);
}

function _size<V>(target: IAttributeBranch<V>, inheritAttrib?: IOTelAttributes, inheritContainer?: IAttributeContainer): number {
    let count = 0;
    let seenKeys: string[] = [];

    // Use the iterator to count all unique attributes including inheritance
    let iter = _iterator(target, (prefix, key, _node) => {
        return prefix + key;
    }, undefined, inheritContainer || inheritAttrib);

    iterForOf(iter, (key) => {
        if (arrIndexOf(seenKeys, key) === -1) {
            seenKeys.push(key);
            count++;
        }
    });

    return count;
}

function _getStackEntry<V>(theNode: IAttributeBranch<V>, prefix: string): IAttributeIteratorState<V> | undefined {
    let entry: IAttributeIteratorState<V> | undefined;

    if (theNode) {
        let allKeys: string[] = objKeys(theNode);
        if (getLength(allKeys) > 0) {
            entry = {
                p: prefix,
                n: theNode,
                k: allKeys,
                i: -1
            };
        }
    }

    return entry;
}

function _iterator<V, T>(target: IAttributeBranch<V>, cb: (prefix: string, key: string, node: IAttributeNode<V>, source: eAttributeFilter) => T, otelCfg?: IOTelConfig, parentAttribs?: IOTelAttributes | IAttributeContainer, inclDeleted?: boolean): Iterator<T> {
    let stack: IAttributeIteratorState<V>[] = [];
    let visitedKeys: string[] | undefined = parentAttribs ? [] : UNDEFINED_VALUE;
    let inheritState: IAttributeIteratorState<any>;
    let inheritContainerIter: Iterator<[string, any, eAttributeFilter]>;
    let current = _getStackEntry(target, STR_EMPTY);        // Start with the root branch
    let inheritContainer: IAttributeContainer | undefined;
    let inheritAttribs: IOTelAttributes | undefined;

    // Used as the initializer for the iterator and the flag to indicate that the iterator is done
    let ctx: CreateIteratorContext<T> | null = {
        v: undefined,
        n: _moveNext
    }

    if (parentAttribs) {
        if (isAttributeContainer(parentAttribs)) {
            inheritContainer = parentAttribs;
        } else if (isObject(parentAttribs)) {
            inheritAttribs = parentAttribs;
        }
    }
    
    function _moveNext(): boolean {
        let thePrefix = STR_EMPTY;
        let theKey: string | undefined;
        let theNode: IAttributeNode<V> | undefined;
        let theSource = eAttributeFilter.Local;         // Default to local

        // Process entries from the current node
        while (current) {
            current.i++;
            if (current.i < getLength(current.k)) {
                // We have at least 1 key
                let key = current.k[current.i];
                // The key is "real" (we don't support null or undefined keys)
                let node = current.n[key];
                if (node) {
                    if (node.n) {
                        // We are at a branch node, so add the current node to the stack so we can continue traversing it later
                        stack.push(current);
                        current = _getStackEntry(node.n, current.p + key + ".");
                        
                        // If the branch is empty, continue with the next item from stack
                        if (!current) {
                            current = stack.pop();
                        }
                    } else {
                        // Leaf node
                        let fullKey = current.p + key;
                        if (visitedKeys && arrIndexOf(visitedKeys, fullKey) === -1) {
                            visitedKeys.push(fullKey);
                        }
                        
                        // If we are not deleted, then return this key
                        if (!node.d || inclDeleted) {
                            // Leaf node with value - not deleted
                            thePrefix = current.p;
                            theKey = key;
                            theNode = node;
                            theSource = node.d ? eAttributeFilter.LocalOrDeleted : eAttributeFilter.Local;
                            break;
                        }
                    }
                }
            } else {
                // No more keys to process at this level
                current = stack.pop();
            }
        }

        // We get here only after we have processed all keys of the current instance
        // Switch to processing inherited attributes if we have them
        if (!theNode && inheritAttribs) {
            if (!inheritState) {
                // Lazy initialize the inherited state
                inheritState = {
                    p: STR_EMPTY,
                    n: UNDEFINED_VALUE,
                    k: objKeys(inheritAttribs),
                    i: -1
                };
            }

            // Process inherited attributes that haven't been overridden or deleted
            while (inheritState.i < getLength(inheritState.k) - 1) {
                inheritState.i++;
                let key = inheritState.k[inheritState.i];
                if (arrIndexOf(visitedKeys, key) === -1) {
                    visitedKeys.push(key);
                    theKey = key;
                    theNode = { v: inheritAttribs[key] as V };
                    theSource = eAttributeFilter.Inherited;
                    break;
                }
            }
        }

        // Process inherited container if we have one and no other node was found
        if (!theNode && inheritContainer) {
            if (!inheritContainerIter) {
                // Initialize the container's iterator only once - this will include the full inheritance chain
                inheritContainerIter = inheritContainer.entries();
            }

            // Use the container's iterator to get next entry
            iterForOf(inheritContainerIter, (entry) => {
                let key = entry[0];
                if (arrIndexOf(visitedKeys, key) === -1) {
                    visitedKeys.push(key);
                    theKey = key;
                    theNode = { v: entry[1] as V };
                    theSource = eAttributeFilter.Inherited; // Always return Inherited for inherited container entries
                    return -1;
                }
            });
        }

        if (theNode) {
            ctx.v = cb(thePrefix, theKey, theNode, theSource);
        }
        
        return !theNode;
    }

    return createIterator<T>(ctx);
}

function _generateAttributes<V extends OTelAttributeValue>(container: IAttributeContainer<V>, target: IAttributeBranch<V>, otelCfg?: IOTelConfig, inheritAttrib?: IOTelAttributes | IAttributeContainer, showTree?: boolean): IOTelAttributes {
    // TODO: Look at making this return a proxy instead of a new object
    // This should be more effecient as it would make the property lookups lazy
    let attribs = objCreate(null) as { [key: string]: V | undefined };
    let deletedKeys: { [key: string]: V | undefined };

    if (showTree) {
        // Add Node Id
        objDefine(attribs, "#id", {
            v: container.id,
            w: false
        });
    }

    // Use the iterator properly - collect the key-value pairs
    let iter = _iterator(target, (prefix, key, node, source) => {
        let name = prefix + key;
        return { n: name, v: node.v as V, d: node.d, s: source };
    }, otelCfg, showTree ? null : inheritAttrib, showTree ? eAttributeFilter.LocalOrDeleted : UNDEFINED_VALUE);

    iterForOf(iter, (entry) => {
        let theNode = attribs;
        let theName = entry.n;
        
        if (entry.d) {
            if (!deletedKeys) {
                // Create separate objects for inherited and deleted attributes
                deletedKeys = objCreate(null);
                objDefine(attribs, _deletedKey, {
                    v: deletedKeys,
                    w: false
                });
            }

            theNode = deletedKeys;
        }

        if (theNode && !(theName in theNode)) {
            theNode[theName] = entry.v;
        }
    });

    if (inheritAttrib && showTree) {
        // Create separate objects for inherited and deleted attributes
        let inheritedKeys: any;

        // Add a tree showing the inherited attributes
        if (isAttributeContainer(inheritAttrib)) {
            inheritedKeys = (inheritAttrib as any)._attributes;
        } else {
            // Create separate objects for inherited and deleted attributes
            inheritedKeys = objCreate(null) as any;
            objForEachKey(inheritAttrib, (key, value) => {
                inheritedKeys[key] = value as V;
            });
        }

        objDefine(attribs, _inheritedKey, {
            v: inheritedKeys,
            w: false
        });
    }

    return attribs;
}

function _notifyListeners<V extends OTelAttributeValue>(listeners: ({ cb: (changeInfo: IAttributeChangeInfo<V>) => void })[], changeInfo: IAttributeChangeInfo<V>) {
    // Notify all registered listeners of changes
    if (listeners) {
        arrForEach(listeners, (listener) => {
            safe(listener.cb, [changeInfo]);
        });
    }
}

function _getInheritedValue<V>(key: string, inheritContainer?: IAttributeContainer | null, inheritAttribObj?: IOTelAttributes | null ): { v: V } | undefined {
    // Check inherited container first
    if (inheritContainer && inheritContainer.has(key)) {
        return { v: inheritContainer.get(key) as V };
    }

    // Then check inherited attributes object
    if (inheritAttribObj && key in inheritAttribObj) {
        return { v: inheritAttribObj[key] as V };
    }
}

function _createUnloadHook<V extends OTelAttributeValue>(listeners: { cb: (changeInfo: IAttributeChangeInfo<V>) => void }[], callback: (changeInfo: IAttributeChangeInfo<V>) => void): IUnloadHook {
    let cbInst = {
        cb: callback
    }

    listeners.push(cbInst);
    
    let unloadHook = {
        rm: () => {
            if (listeners && cbInst) {
                let index = arrIndexOf(listeners, cbInst);
                if (index >= 0) {
                    // Remove the current listener
                    listeners.splice(index, 1);
                }

                // Clear the cached values
                cbInst.cb = null;
                cbInst = null;

                // Optimization to drop all references and shortcut any future lookups
                unloadHook.rm = _noOpFunc;
            }
        }
    };

    return unloadHook;
}

/**
 * Creates a new attribute container with only configuration.
 *
 * @param otelCfg - The OpenTelemetry configuration containing trace configuration and limits
 * @returns A new IAttributeContainer instance with auto-generated container ID
 * @since 3.4.0
 * @example
 * ```typescript
 * const config = { traceCfg: { generalLimits: { attributeCountLimit: 64 } } };
 * const container = createAttributeContainer(config);
 * console.log(container.id); // ".0" (auto-generated)
 * ```
 */
export function createAttributeContainer<V extends OTelAttributeValue>(otelCfg: IOTelConfig): IAttributeContainer<V>;

/**
 * Creates a new attribute container with configuration and a name.
 *
 * @param otelCfg - The OpenTelemetry configuration containing trace configuration and limits
 * @param name - The name for the container (used in the container ID)
 * @returns A new IAttributeContainer instance with the specified name
 * @since 3.4.0
 * @example
 * ```typescript
 * const config = { traceCfg: { generalLimits: { attributeCountLimit: 64 } } };
 * const container = createAttributeContainer(config, "my-container");
 * console.log(container.id); // "my-container.0"
 * container.set("service.name", "my-service");
 * ```
 */
export function createAttributeContainer<V extends OTelAttributeValue>(otelCfg: IOTelConfig, name: string): IAttributeContainer<V>;

/**
 * Creates a new attribute container with configuration, name, and inheritance.
 *
 * @param otelCfg - The OpenTelemetry configuration containing trace configuration and limits
 * @param name - The name for the container (used in the container ID)
 * @param inheritAttrib - Parent attributes or container to inherit from
 * @returns A new IAttributeContainer instance that inherits from the specified parent
 * @since 3.4.0
 * @example
 * ```typescript
 * const config = { traceCfg: { generalLimits: { attributeCountLimit: 64 } } };
 * const parent = { "environment": "production", "region": "us-east-1" };
 * const child = createAttributeContainer(config, "child-container", parent);
 * console.log(child.get("environment")); // "production" (inherited)
 * child.set("service.name", "my-service"); // local attribute
 * ```
 */
export function createAttributeContainer<V extends OTelAttributeValue>(otelCfg: IOTelConfig, name: string, inheritAttrib: IOTelAttributes | IAttributeContainer): IAttributeContainer<V>;

/**
 * Creates a new attribute container with full configuration options.
 *
 * @param otelCfg - The OpenTelemetry configuration containing trace configuration and limits
 * @param name - The name for the container (used in the container ID)
 * @param inheritAttrib - Parent attributes or container to inherit from
 * @param attribLimits - Specific attribute limits to override configuration defaults
 * @returns A new IAttributeContainer instance with custom limits and inheritance
 * @since 3.4.0
 * @example
 * ```typescript
 * const config = { traceCfg: { generalLimits: { attributeCountLimit: 64 } } };
 * const parent = { "environment": "production" };
 * const customLimits = { attributeCountLimit: 32, attributeValueLengthLimit: 256 };
 * const container = createAttributeContainer(config, "limited-container", parent, customLimits);
 * // This container has stricter limits than the default configuration
 * ```
 */
export function createAttributeContainer<V extends OTelAttributeValue>(otelCfg: IOTelConfig, name: string, inheritAttrib: IOTelAttributes | IAttributeContainer, attribLimits: IOTelAttributeLimits): IAttributeContainer<V>;

/**
 * Creates a new attribute container that provides an efficient, observable key-value storage
 * for OpenTelemetry attributes with support for inheritance, limits, and change notifications.
 *
 * The container supports inherited attributes from parent containers or plain objects,
 * enforces attribute count and value size limits, and provides efficient iteration and access patterns.
 *
 * @param otelCfg - The OpenTelemetry configuration containing trace configuration and limits
 * @param name - Optional name for the container (used in the container ID)
 * @param inheritAttrib - Optional parent attributes or container to inherit from
 * @param attribLimits - Optional specific attribute limits to override configuration defaults
 * @returns A new IAttributeContainer instance with the specified configuration
 * @since 3.4.0
 * @example
 * ```typescript
 * const config = { traceCfg: { generalLimits: { attributeCountLimit: 64 } } };
 * const container = createAttributeContainer(config, "my-container");
 * container.set("service.name", "my-service");
 *
 * // With inheritance
 * const parent = { "environment": "production" };
 * const child = createAttributeContainer(config, "child-container", parent);
 * console.log(child.get("environment")); // "production"
 * ```
 */
export function createAttributeContainer<V extends OTelAttributeValue>(otelCfg: IOTelConfig, name?: string | null | undefined, inheritAttrib?: IOTelAttributes | IAttributeContainer, attribLimits?: IOTelAttributeLimits): IAttributeContainer<V> {
    let traceCfg: IOTelTraceCfg = otelCfg.traceCfg || {};
    let nodes: { [key: string]: IAttributeNode<V> } | null = null;
    let theSize: ICachedValue<number> | null = null;
    let theDropped: ICachedValue<number> | null = null;
    let limits: IOTelAttributeLimits = traceCfg.generalLimits || {};
    let maxAttribs: number = limits.attributeCountLimit || 128;
    let theAttributes: ICachedValue<IOTelAttributes>;
    let localAttributes: ICachedValue<IOTelAttributes>;
    let droppedAttribs = 0;
    let inheritContainer: IAttributeContainer | null = null;
    let inheritAttribObj: IOTelAttributes | null = null;
    let listeners: ({ cb: (changeInfo: IAttributeChangeInfo<V>) => void })[] | null = null;
    let parentListenerHook: IUnloadHook | null = null;
    let containerName: string = name || STR_EMPTY;
    
    if (attribLimits) {
        maxAttribs = attribLimits.attributeCountLimit || maxAttribs;
    }

    // Determine if inheritAttrib is a container or plain attributes object
    if (isAttributeContainer(inheritAttrib)) {
        inheritContainer = inheritAttrib;
    } else if (isObject(inheritAttrib)) {
        inheritAttribObj = inheritAttrib;
    }

    inheritAttrib = null;

    let inheritSrc = inheritAttribObj || inheritContainer;
    let container: IAttributeContainer<V> = {
        id: (containerName || STR_EMPTY) + "." + (_containerId++),
        size: 0,
        droppedAttributes: 0,
        attributes: UNDEFINED_VALUE,
        clear: () => {
            // Remove parent listener if exists
            if (parentListenerHook) {
                parentListenerHook.rm();
                parentListenerHook = null;
            }

            // Only inform children if we appear to have any keys or could possible inherit keys
            if (nodes || inheritContainer || inheritAttribObj) {
                // Inform any children (Synchronously) that we are about to clear all attributes
                // Called prior to clearing the nodes, so that children still have full access
                // to the current and inherited attributes
                _notifyListeners(listeners, { frm: container.id, op: eAttributeChangeOp.Clear });
            }

            nodes = null;
            theSize = null;
            theDropped = null;
            theAttributes = null;
            localAttributes = null;
            droppedAttribs = 0;
            inheritSrc = null;          // Clear the inherited attributes
            inheritContainer = null;    // Clear inherited container as well
            inheritAttribObj = null;    // Clear inherited attributes as well
        },
        get: (key: string, source?: eAttributeFilter) => {
            return _findDetail(container, key, source, (detail) => {
                // Just return the value (which will include deleted ones (as undefined)if the filter is set)
                return detail ? detail.v : UNDEFINED_VALUE;
            }, nodes, inheritContainer, inheritAttribObj, otelCfg);
        },
        has: (key: string, source?: eAttributeFilter) => {
            return _findDetail(container, key, source, (detail) => {
                // Note: We may still have a detail object if the key was deleted, so we need to
                // - Check if the detail is considered to "exist"
                // - If the source filter is LocalOrDeleted, then return that is "exists"
                return detail ? (detail.e || source === eAttributeFilter.LocalOrDeleted) : false;
            }, nodes, inheritContainer, inheritAttribObj, otelCfg);
        },
        set: (key: string, value: any) => {
            if (!nodes) {
                // Lazily create a container object
                nodes = objCreate(null);
            }

            let addResult = _addValue(container, nodes, key, value, maxAttribs, otelCfg);
            if (addResult.r === AddAttributeResult.Success) {
                theSize = null;         // invalidate any previously cached size
                theAttributes = null;   // invalidate any previously cached attributes
                localAttributes = null; // invalidate any previously cached local attributes

                // Determine operation type based on whether this was a new attribute or set
                let op = addResult.a ? eAttributeChangeOp.Add : eAttributeChangeOp.Set;
                let prevValue = addResult.p;

                if (op === eAttributeChangeOp.Add) {
                    // Special case, if we just added/changed it locally we need to lookup our parents to see if we are replacing (hiding)
                    // a previously inherited value and if so we need to notify our children that this was a set not an add (if the value changed)
                    const inheritedValue = _getInheritedValue(key, inheritContainer, inheritAttribObj);
                    if (inheritedValue) {
                        op = eAttributeChangeOp.Set;
                        prevValue = inheritedValue.v;
                    }
                }

                // Only notify children if the value has changed
                if (!objIs(value, prevValue)) {
                    
                    // Inform any children (Synchronously) that we have "changed" a value
                    // Unlike clear, this is called after the change is made, so children
                    // will need to "handle" the change accordingly
                    _notifyListeners(listeners, {
                        frm: container.id,
                        op: op,
                        k: key,
                        prev: prevValue,
                        val: value
                    });
                }
            } else if (addResult.r === AddAttributeResult.MaxAttribsExceeded) {
                theDropped = null;
                droppedAttribs++;
                _notifyListeners(listeners, {
                    frm: container.id,
                    op: eAttributeChangeOp.DroppedAttributes,
                    k: key,
                    val: value
                });
            }

            return addResult.r === AddAttributeResult.Success;
        },
        del: (key: string) => {

            // Find the node / value for this container
            return _findDetail(container, key, UNDEFINED_VALUE, (detail) => {
                // Check if the key exists locally (incl marked as deleted) or is inherited
                if (detail) {
                    // So the key exists either locally or in an inherited source
                    // - It may also exists but marked as deleted
                    if (!nodes) {
                        // Always create nodes structure if it doesn't exist since we need to track deleted keys
                        nodes = objCreate(null);
                    }

                    // Now lets mark this key as deleted locally
                    let deleteResult = _deleteValue(nodes, key.split("."));
                    if (deleteResult.d) {
                        theSize = null;         // invalidate any previously cached size
                        theAttributes = null;   // invalidate any previously cached attributes
                        localAttributes = null; // invalidate any previously cached local attributes
                    }

                    // Inform any children (Synchronously) that we have deleted a value
                    // This is important even if the key didn't exist locally, as it existed in inheritance
                    // chain and we need children (like snapshot containers) to know about the deletion to
                    // ignore any future inherited values.
                    _notifyListeners(listeners, {
                        frm: container.id,
                        op: eAttributeChangeOp.Delete,
                        k: key,
                        prev: detail.v
                    });

                    // Return true if we successfully marked it as deleted
                    return deleteResult.d;
                }

                return false;
            }, nodes, inheritContainer, inheritAttribObj, otelCfg);
        },
        keys: () => {
            return _iterator(nodes, (prefix, key, node, source) => {
                return prefix + key;
            }, otelCfg, inheritSrc);
        },
        entries: () => {
            return _iterator(nodes, (prefix, key, node, source) => {
                return [prefix + key, node.v, source] as [string, V, eAttributeFilter];
            }, otelCfg, inheritSrc);
        },
        values: () => {
            return _iterator(nodes, (_prefix, _key, node, _source) => {
                return node.v;
            }, otelCfg, inheritSrc);
        },
        forEach: (cb: (key: string, value: V, source?: eAttributeFilter) => void) => {
            let iter = _iterator(nodes, (prefix, key, node, source) => {
                cb(prefix + key, node.v, source);
                return true; // Return true to indicate the callback was executed
            }, otelCfg, inheritSrc);

            // Iterate over the entire container
            iterForOf(iter, _noOpFunc);
        },
        child: (name?: string, snapshot?: boolean) => {
            const childName = (name ? name : "child") + (snapshot ? "<-@[" : "<=[") + container.id + "]";
            return snapshot ? _createSnapshotContainer(otelCfg, childName, container, attribLimits) : createAttributeContainer(otelCfg, childName, container, attribLimits);
        },
        listen: (callback: (changeInfo: IAttributeChangeInfo<V>) => void): IUnloadHook => {
            if (!listeners) {
                listeners = [];
            }

            return _createUnloadHook(listeners, callback);
        }
    }

    function _listener(changeInfo: IAttributeChangeInfo<V>) {
        // Invalidate caches when parent changes
        let shouldNotify = true;

        // If a parent adds a new key, then if this instance has not replaced it
        // then we need to also inform our children
        if (changeInfo.op === eAttributeChangeOp.Add || changeInfo.op === eAttributeChangeOp.Set || changeInfo.op === eAttributeChangeOp.Delete) {
            theSize = null;
            theAttributes = null;
            localAttributes = null;

            // If we already have (or deleted) this key locally, then we don't need to notify children
            _findDetail(container, changeInfo.k, eAttributeFilter.LocalOrDeleted, (detail) => {
                // If we have a node (which also might be that it was deleted) then don't notify
                // If we didn't find a node then we still need to notify our children
                shouldNotify = !detail || !detail.n;
            }, nodes);
        } else if (changeInfo.op === eAttributeChangeOp.Clear) {
            theSize = null;
            theAttributes = null;
            localAttributes = null;

            // If the parent clears all of it's keys, we need to inform our children
            shouldNotify = true;
        } else if (changeInfo.op === eAttributeChangeOp.DroppedAttributes) {
            shouldNotify = true;
            theDropped = null;
        }

        if (shouldNotify) {
            _notifyListeners(listeners, changeInfo);
        }
    }
    
    // If we have a parent container, register a listener to stay connected to parent changes
    if (inheritContainer && isFunction(inheritContainer.listen)) {
        parentListenerHook = inheritContainer.listen(_listener);
    }

    return objDefineProps(container, {
        size: {
            g: () => {
                if (!theSize) {
                    theSize = createCachedValue(_size(nodes, inheritAttribObj, inheritContainer));
                }

                return theSize.v;
            }
        },
        droppedAttributes: {
            g: () => {
                if (!theDropped) {
                    theDropped = createCachedValue((inheritContainer ? inheritContainer.droppedAttributes : 0) + droppedAttribs);
                }

                return theDropped.v;
            }
        },
        attributes: {
            g: () => {
                if (!theAttributes) {
                    theAttributes = createCachedValue(_generateAttributes(container, nodes, otelCfg, inheritSrc));
                }

                return theAttributes.v;
            }
        },
        _attributes: {
            g: () => {
                if (!localAttributes) {
                    localAttributes = createCachedValue(_generateAttributes(container, nodes, otelCfg, inheritSrc, true));
                }

                return localAttributes.v;
            }
        }
    });
}

/**
 * Add all attributes from the source attributes or container to the target container.
 * This function has performance and memory implications as it immediately copies all key-value pairs
 * from the source to the target container, handling both plain attribute objects and other attribute
 * containers.
 *
 * @param container - The target container to add attributes to
 * @param attributes - The source attributes or container to copy from
 * @since 3.4.0
 * @example
 * ```typescript
 * const target = createAttributeContainer(config, "target");
 * const source = { key1: "value1", key2: "value2" };
 * addAttributes(target, source);
 *
 * // Or from another container
 * const sourceContainer = createAttributeContainer(config, "source");
 * sourceContainer.set("key3", "value3");
 * addAttributes(target, sourceContainer);
 * ```
 */
export function addAttributes(container: IAttributeContainer, attributes: IOTelAttributes | IAttributeContainer): void {
    if (isAttributeContainer(attributes)) {
        // Use the container's forEach for direct processing - more efficient than entries() iterator
        attributes.forEach((key, value, source) => {
            container.set(key, value);
        });
    } else if (attributes) {
        if (isFunction(attributes.entries)) {
            // Handle any type that has an entries function
            iterForOf((attributes as any).entries(), function(entry: [string, any]) {
                container.set(entry[0], entry[1]);
            });
        } else {
            // Handle as plain attributes object
            objForEachKey(attributes, function(key, value) {
                container.set(key, value);
            });
        }
    }
}

function _createSnapshotContainer(otelCfg: IOTelConfig, name: string | undefined, sourceContainer: IAttributeContainer, attribLimits?: IOTelAttributeLimits): IAttributeContainer {
    let newContainer = createAttributeContainer(otelCfg, name, sourceContainer, attribLimits);

    sourceContainer.listen((changeInfo) => {
        if (changeInfo.op === eAttributeChangeOp.Clear) {
            // Copy all parent keys to this container if not already present
            iterForOf((sourceContainer as any).entries(), function(entry: [string, any]) {
                let key = entry[0];
                // If the Key has not been set or explicitly deleted from the new Container, and the source Container
                // has the key (directly or inherited), then copy the value locally so we have a copy because our parent
                // some grand parent is clearing their collection of values. Note ideal as if it's a grand parent or higher
                // we end up duplicating the keys multiple times, but we only know about our direct ancestor
                // Note: Deleting locally hides any inherited value
                if (!newContainer.has(key, eAttributeFilter.LocalOrDeleted) && sourceContainer.has(key)) {
                    newContainer.set(key, entry[1]);
                }
            });
        } else if (changeInfo.op === eAttributeChangeOp.Add) {
            // For add operations add), we need to ensure that when the key is not already present on the current instance
            // that we hide the key so it's "not" inherited, by marking it as deleted.
            let key = changeInfo.k;
            if (!newContainer.has(key, eAttributeFilter.Local)) {
                newContainer.del(key);
            }
        } else if (changeInfo.op === eAttributeChangeOp.Set || changeInfo.op === eAttributeChangeOp.Delete) {
            // For set operations (change), preserve the previous value if we don't have it locally
            // For delete operations, if we don't have the key locally, preserve it with the deleted value
            let key = changeInfo.k;
            if (!newContainer.has(key, eAttributeFilter.LocalOrDeleted)) {
                newContainer.set(key, changeInfo.prev);
            }
        }
    });

    return newContainer;
}

/**
 * Creates a snapshot container based on the passed IOTelAttributes or IAttributeContainer.
 * The returned container effectively treats the source attributes as immutable as at the time of creation, you
 * may still add / update existing attributes without affecting the original source. And changes to the source
 * attributes / container will not be reflected from the new snapshot container, only changes made to the returned
 * container itself.
 *
 * Note: It implements this in a lazy manner, so changes made to the original source after the snapshot is taken will
 * cause the changed attributes to be copied into this snapshot container with it's original value and cause a local
 * version of the changed key (if not already been present) to be added, so when using the {@link IAttributeContainer#has} or
 * {@link IAttributeContainer#get} methods, with the optional source filter as {@link eAttributeFilter.Inherited} it will
 * only return attributes that were present and unchanged at the time of the snapshot. This means for those attributes you must
 * use the {@link eAttributeFilter.Local} as source filter (or leave it undefined) to access the local version.
 *
 * It is recommended that you always use {@link IAttributeContainer} instances for better memory and performance overheads,
 * for this specific function when you pass a {@link IOTelAttributes} instance it will create a copy of all present attributes
 * at the point of creation (not lazily).
 *
 * @param otelCfg - The OpenTelemetry configuration to use for the snapshot container
 * @param source - The source attributes or container to create a snapshot view from
 * @param attribLimits - Optional attribute limits to apply to the snapshot container
 * @returns An IAttributeContainer instance that will preserves the attributes and values from the source attributes / container
 * at creation time. The snapshot container will be named "snapshot(xxxx)" where xxxx is the source container ID, or "snapshot(...)" for non-container sources.
 * @since 3.4.0
 * @example
 * ```typescript
 * // Immediate copy for plain attributes
 * const attrs = { key1: "value1", key2: "value2" };
 * const snapshot = createAttributeSnapshot(attrs);
 * // snapshot.id will be "snapshot(...).N"
 * attrs.key1 = "changed"; // snapshot.get("key1") is still "value1"
 *
 * // Lazy copy-on-change for containers
 * const container = createAttributeContainer(config, "my-container");
 * container.set("key1", "value1");
 * const snapshot2 = createAttributeSnapshot(container);
 * // snapshot2.id will be "snapshot(my-container.N).M"
 * container.set("key1", "changed"); // snapshot2.get("key1") remains "value1" (previous value copied)
 * ```
 */
export function createAttributeSnapshot(otelCfg: IOTelConfig, name: string, source: IOTelAttributes | IAttributeContainer, attribLimits?: IOTelAttributeLimits): IAttributeContainer {
    let newContainer: IAttributeContainer;

    if (isAttributeContainer(source)) {
        newContainer = _createSnapshotContainer(otelCfg, (name || "child") + "<-@[" + source.id + "]", source, attribLimits);
    } else {
        newContainer = createAttributeContainer(otelCfg, (name || "child") + "<-@[(...)]", null, attribLimits);
        addAttributes(newContainer, source);
    }

    return newContainer;
}

/**
 * Helper function to identify if a passed argument is or implements the IAttributeContainer interface
 * @param value - The value to check
 * @returns true if the value implements IAttributeContainer interface, false otherwise
 * @since 3.4.0
 * @example
 * ```typescript
 * const container = createAttributeContainer(config, "test-container");
 * if (isAttributeContainer(container)) {
 *     // TypeScript now knows container is IAttributeContainer
 *     console.log(container.size);
 *     container.set("key", "value");
 * }
 *
 * // Check unknown object
 * function processContainer(obj: unknown) {
 *     if (isAttributeContainer(obj)) {
 *         obj.forEach((key, value) => console.log(key, value));
 *     }
 * }
 * ```
 */
export function isAttributeContainer(value: any): value is IAttributeContainer {
    return value &&
           isFunction(value.clear) &&
           isFunction(value.get) &&
           isFunction(value.has) &&
           isFunction(value.set) &&
           isFunction(value.del) &&
           isFunction(value.keys) &&
           isFunction(value.entries) &&
           isFunction(value.forEach) &&
           isFunction(value.values) &&
           isFunction(value.child) &&
           isFunction(value.listen) &&
           (isObject(value) || isFunction(value)) &&
           // Check for existence of the required properties, but don't cause them to be processed ("executed")
           ("id" in value) &&
           ("size" in value) &&
           ("droppedAttributes" in value) &&
           ("attributes" in value);
}
