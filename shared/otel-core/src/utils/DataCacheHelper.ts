// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objDefine } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../constants/InternalConstants";
import { normalizeJsName } from "./HelperFuncsCore";
import { newId } from "./RandomHelper";

const version = "#version#";
let instanceName = "." + newId(6);
let _dataUid = 0;

export interface IDataCache {
    id: string;
    accept: (target: any) => boolean,
    get: <T>(target: any, name: string, defValue?: T, addDefault?: boolean) => T;
    kill: (target: any, name: string) => void;
}

// Accepts only:
//  - Node
//    - Node.ELEMENT_NODE
//    - Node.DOCUMENT_NODE
//  - Object
//    - Any
function _canAcceptData(target: any) {
    return target.nodeType === 1 || target.nodeType === 9 || !( +target.nodeType );
}

function _getCache(data: IDataCache, target: Node) {
    let theCache = target[data.id];
    if (!theCache) {
        theCache = {};

        try {
            if (_canAcceptData(target)) {
                objDefine<any>(target, data.id, {
                    e: false,
                    v: theCache
                });
            }
        } catch (e) {
            // Not all environments allow extending all objects, so just ignore the cache in those cases
        }
    }

    return theCache;
}

export function createUniqueNamespace(name: string, includeVersion: boolean = false): string {
    return normalizeJsName(name + (_dataUid++) + (includeVersion ? "." + version : STR_EMPTY) + instanceName);
}

export function createElmNodeData(name?: string) {

    let data = {
        id: createUniqueNamespace("_aiData-" + (name || STR_EMPTY) + "." + version),
        accept: function (target: any) {
            return _canAcceptData(target);
        },
        get: function <T>(target: any, name: string, defValue?: T, addDefault?: boolean): T {
            let theCache = target[data.id];
            if (!theCache) {
                if (addDefault) {
                    // Side effect is adds the cache
                    theCache = _getCache(data, target);
                    theCache[normalizeJsName(name)] = defValue;
                }

                return defValue;
            }

            return theCache[normalizeJsName(name)];
        },
        kill: function(target: any, name: string) {
            if (target && target[name]) {
                try {
                    delete target[name];
                } catch (e) {
                    // Just cleaning up, so if this fails -- ignore
                }
            }
        }
    };

    return data;
}
