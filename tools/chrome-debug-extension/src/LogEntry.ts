// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { isArray, isBoolean, isError, isNumber, isObject, isString, objToString } from "@microsoft/otel-core-js";
import { MAX_DEPTH, formatLogElements, getTargetKeys, getTargetName, makeRegex, toggleClassName, traverseAndReplace } from "./helpers";

export class LogEntry {
    isKeep: () => boolean;
    isMatch: (textFilter: string, excludedKeys: string[], includeFunctions: boolean) => boolean;
    render: (searchText: string, excludeKeys: string[], includeFunctions: boolean) => HTMLElement;
    getEl: () => HTMLElement;
    getKind: () => string;

    constructor(target: Object, tm: number, key?: string, level?: number, kind?: string, keep?: boolean) {
        let _self = this;
        let searchContent: any = null;
        let lastTextFilter: string;
        let theEl: HTMLElement;

        _self.isKeep = () => {
            return !!keep;
        }

        function _testValue(rg: RegExp, value: string | undefined) {
            if (rg && value) {
                return rg.exec(value) !== null;
            }

            return false;
        }

        function _testObj(rg: RegExp, value: any, excludedKeys: string[], includeFunctions: boolean): boolean {
            if (value !== null && value !== undefined && value !== "") {
                if (isArray(value)) {
                    for (let lp = 0; lp < value.length; lp++) {
                        if (_testObj(rg, value[lp], excludedKeys, includeFunctions)) {
                            return true;
                        }
                    }
                } else if (isObject(value) || isError(value)) {
                    let keys = getTargetKeys(value, excludedKeys, includeFunctions);
                    for (let lp = 0; lp < keys.length; lp++) {
                        let key = keys[lp];
                        if (_testValue(rg, key) || _testObj(rg, value[key], excludedKeys, includeFunctions)) {
                            return true;
                        }
                    }
                } else if (isString(value) || isNumber(value) || isBoolean(value)) {
                    return _testValue(rg, objToString(value));
                }
            }

            return false;
        }

        _self.isMatch = (textFilter: string, excludedKeys: string[], includeFunctions: boolean) => {
            let rg = makeRegex(textFilter, false);
            if (rg) {
                if (key && _testValue(rg, key)) {
                    return true;
                }

                if (_testValue(rg, getTargetName(_self))) {
                    return true;
                }

                if (!searchContent) {
                    // Delaying creating the search optimization until needed -- for performance
                    searchContent = traverseAndReplace(target, MAX_DEPTH, level as number, [], excludedKeys, includeFunctions);
                }
                
                return _testObj(rg, searchContent, excludedKeys, includeFunctions);
            }

            return true;
        }

        _self.render = (textFilter: string, excludeKeys: string[], includeFunctions: boolean): HTMLElement => {
            if (!theEl || lastTextFilter !== textFilter) {
                lastTextFilter = textFilter;
                theEl = formatLogElements(target, "", key || "", level || 0, textFilter, excludeKeys, [], includeFunctions).root;
                toggleClassName(theEl, " tree-root");
            }

            return theEl;
        }

        _self.getEl = () => {
            return theEl;
        }

        _self.getKind = () => {
            return kind as string;
        }
    }
}
