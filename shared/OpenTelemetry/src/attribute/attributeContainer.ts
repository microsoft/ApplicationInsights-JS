import {
    IOTelAttributeLimits, IOTelAttributes, IOTelConfig, IOTelTraceCfg, OTelAttributeValue
} from "@microsoft/applicationinsights-core-js";
import {
    CreateIteratorContext, ICachedValue, arrForEach, createCachedValue, createIterator, isFunction, objDefineProps, objEntries,
    objForEachKey, objKeys, strSplit
} from "@nevware21/ts-utils";
import { STR_EMPTY } from "../internal/InternalConstants";
import { handleAttribError } from "../internal/commonUtils";
import { IAttributeContainer } from "./IAttributeContainer";

type IAttributeBranch<V> = { [key: string]: IAttributeNode<V> };

interface IAttributeNode<V> {
    /**
     * The value of the attribute tree
     */
    v?: V;

    /**
     * Identifies that this is a leaf node in the attribute tree
     */
    n?: IAttributeBranch<V>;
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

function _addValue<V>(container: IAttributeContainer<V>, target: IAttributeBranch<V>, key: string[], value: V, maxAttribs: number, cfg: IOTelConfig): AddAttributeResult {
    let errorHandlers = cfg.errorHandlers || {};
    if (key && key.length > 0) {
        let part = key.shift();
        let parts: string[] = [];
        while (part) {
            parts.push(part);
            if (key.length === 0) {
                // last part
                if (target[part].n) {
                    // This node already exists as a branch node
                    handleAttribError(errorHandlers, "Attribute key [" + parts.join(".") + "] already exists as a branch node", key.join("."), value);
                    return AddAttributeResult.BranchNodeExists;
                }

                if (!target[part]) {
                    if (container.size >= maxAttribs) {
                        handleAttribError(errorHandlers, "Maximum allowed attributes exceeded [" + maxAttribs + "]", key.join("."), value);
                        return AddAttributeResult.MaxAttribsExceeded;
                    }

                    // Add new leaf node
                    target[part] = {
                        v: value
                    };
                } else {
                    // replace the value
                    target[part].v = value;
                }

                return AddAttributeResult.Success;
            }

            if (!target[part]) {
                target[part] = {
                    n: {}
                };
            }

            if (!target[part].n) {
                handleAttribError(errorHandlers, "Attribute key [" + parts.join(".") + "] already exists as a leaf node", key.join("."), value);
                return AddAttributeResult.LeafNodeExists;
            }

            target = target[part].n;
        }
    }

    handleAttribError(errorHandlers, "Attribute key is empty", key.join("."), value);

    return AddAttributeResult.EmptyKey;
}

/**
 * Find a specific node in the attribute tree
 * @param target
 * @param key
 * @param cb
 * @param supportWildcard
 * @returns
 */
function _find<V, T>(target: IAttributeBranch<V>, key: string, cb: (node?: IAttributeNode<V>) => T, otelCfg?: IOTelConfig): T {
    if (key && key.length > 0) {
        let keys = strSplit(key, ".");
        let part = keys.shift();
        while (target && part) {
            let node = target[part];
            if (!node) {
                // TODO - support wildcard(s), likely need to refactor this to support multiple keys
                break;
            }

            if (keys.length === 0) {
                // last part
                return cb(node);
            }

            if (!node || !node.n) {
                break;
            }

            target = node.n;
        }
    }

    return cb();
}

function _size<V>(target: IAttributeBranch<V>): number {
    let count = 0;
    objForEachKey(target, (_key, node) => {
        count++;
        if (node.n) {
            count += _size(node.n);
        }
    });

    return count;
}

function _iterator<V, T>(target: IAttributeBranch<V>, cb: (prefix: string, key: string, node: IAttributeNode<V>) => T, otelCfg?: IOTelConfig): Iterator<T> {
    let state: IAttributeIteratorState<V>[] = [];
    let current: IAttributeIteratorState<V> | null = {
        p: STR_EMPTY,
        n: target,
        k: objKeys(target),
        i: -1
    };

    // Used as the initializer for the iterator and the flag to indicate that the iterator is done
    let ctx: CreateIteratorContext<T> | null = {
        v: undefined,
        n: _moveNext
    }
    
    function _moveNext(): boolean {
        if (ctx && current) {
            current.i++;
            if (current.i < current.k.length) {
                let key = current.k[current.i];
                let node = current.n[key];
                if (!node || !node.n) {
                    // leaf node
                    ctx.v = cb(current.p, key, node);
                } else {
                    state.push(current);
                    current = {
                        p: current.p + key + ".",
                        n: node.n,
                        k: objKeys(node.n),
                        i: -1
                    };

                    return _moveNext();
                }
            } else {
                if (state.length > 0) {
                    current = state.pop();
                    return _moveNext();
                }

                // Clear the state and context
                ctx = null;
                current = null;
            }
        }

        return !ctx;
    }

    return createIterator<T>(ctx);
}

function _generateAttributes<V extends OTelAttributeValue>(target: IAttributeBranch<V>, otelCfg?: IOTelConfig): IOTelAttributes {
    // TODO: Look at making this return a proxy instead of a new object
    // This should be more effecient as it would make the property lookups lazy
    let attribs = {} as { [key: string]: V | undefined };

    let iter = _iterator(target, (prefix, key, node) => {
        let name = prefix + key;
        if (!(name in attribs)) {
            attribs[prefix + key] = node.v as V;
        }
    }, otelCfg);

    let next = iter.next();
    while (!next.done) {
        next = iter.next();
    }

    return attribs;
}

export function createAttributeContainer<V extends OTelAttributeValue>(otelCfg: IOTelConfig, inheritAttrib?: IOTelAttributes, attribLimits?: IOTelAttributeLimits ): IAttributeContainer<V> {
    let traceCfg: IOTelTraceCfg = otelCfg.traceCfg || {};
    let nodes: { [key: string]: IAttributeNode<V> } = {};
    let theSize: ICachedValue<number> | null = null;
    let limits = (traceCfg.generalLimits ||{});
    let maxAttribs: number = limits.attributeCountLimit || 128;
    let maxValueLen: number = limits.attributeValueLengthLimit;
    let theAttributes: ICachedValue<IOTelAttributes>;
    let droppedAttribs = 0;
    
    if (attribLimits) {
        maxAttribs = attribLimits.attributeCountLimit || maxAttribs;
        maxValueLen = attribLimits.attributeValueLengthLimit || maxValueLen;
    }

    let container: IAttributeContainer<V> = {
        clear: () => {
            nodes = {};
            theSize = null;
            theAttributes = null;
            droppedAttribs = 0;
        },
        get: (key: string) => {
            return _find(nodes, key, (node) => {
                if (node) {
                    return node.v;
                }
            }, otelCfg);
        },
        has: (key: string) => {
            return _find(nodes, key, (node) => {
                return !!node;
            }, otelCfg);
        },
        set: (key: string, value: any) => {
            let result = _addValue(container, nodes, key.split("."), value, maxAttribs, otelCfg);
            if (result === AddAttributeResult.Success) {
                theSize = null; // invalidate any previously cached size
                theAttributes = null; // invalidate any previously cached attributes
            } else if (result === AddAttributeResult.MaxAttribsExceeded) {
                droppedAttribs++;
            }

            return result === AddAttributeResult.Success;
        },
        keys: () => {
            return _iterator(nodes, (prefix, key, node) => {
                return prefix + key;
            }, otelCfg);
        },
        entries: () => {
            return _iterator(nodes, (prefix, key, node) => {
                return [prefix + key, node.v] as [string, V];
            }, otelCfg);
        },
        values: () => {
            return _iterator(nodes, (prefix, key, node) => {
                return node.v;
            }, otelCfg);
        },
        forEach: (cb: (key: string, value: V) => void) => {
            let iter = _iterator(nodes, (prefix, key, node) => {
                cb(prefix + key, node.v);
            }, otelCfg);

            let next = iter.next();
            while (!next.done) {
                next = iter.next();
            }
        },
        size: 0,
        droppedAttributes: 0,
        toAttributes: () => {
            if (!theAttributes) {
                theAttributes = createCachedValue(_generateAttributes(nodes, otelCfg));
            }

            return theAttributes.v;
        }
    }

    return objDefineProps(container, {
        size: {
            g: () => {
                if (!theSize) {
                    theSize = createCachedValue(_size(nodes));
                }

                return theSize.v;
            }
        },
        droppedAttributes: {
            g: () => droppedAttribs
        }
    });
}

export function addAttributes(container: IAttributeContainer, attributes: IOTelAttributes): void {
    if (attributes) {
        let entries = isFunction(attributes.entries) ? (attributes as any).entries() : objEntries(attributes);
        arrForEach(entries, (entry) => {
            container.set(entry[0], entry[1]);
        });
    }
}
