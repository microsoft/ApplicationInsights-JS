import { isBoolean, isNumber, isObject, isString } from '@microsoft/applicationinsights-core-js';
import { makeRegex, traverseAndReplace, toggleClassName, MAX_DEPTH, formatLogElements, getTargetName, getTargetKeys } from './helpers';
import { Util } from '@microsoft/applicationinsights-common';

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
        let theEl: HTMLElement = null;

        _self.isKeep = () => {
            return !!keep;
        }

        function _testValue(rg: RegExp, value: string) {
            if (rg && value) {
                return rg.exec(value) !== null;
            }

            return false;
        }

        function _testObj(rg: RegExp, value: any, excludedKeys: string[], includeFunctions: boolean): boolean {
            if (value !== null && value !== undefined && value !== '') {
                if (Util.isArray(value)) {
                    for (let lp = 0; lp < value.length; lp++) {
                        if (_testObj(rg, value[lp], excludedKeys, includeFunctions)) {
                            return true;
                        }
                    }
                } else if (isObject(value) || Util.isError(value)) {
                    let keys = getTargetKeys(value, excludedKeys, includeFunctions);
                    for (let lp = 0; lp < keys.length; lp++) {
                        let key = keys[lp];
                        if (_testValue(rg, key) || _testObj(rg, value[key], excludedKeys, includeFunctions)) {
                            return true;
                        }
                    }
                } else if (isString(value) || isNumber(value) || isBoolean(value)) {
                    return _testValue(rg, value.toString());
                }
            }

            return false;
        }

        _self.isMatch = (textFilter: string, excludedKeys: string[], includeFunctions: boolean) => {
            let rg = makeRegex(textFilter);
            if (rg) {
                if (_testValue(rg, key)) {
                    return true;
                }

                if (_testValue(rg, getTargetName(_self))) {
                    return true;
                }

                if (!searchContent) {
                    // Delaying creating the search optimization until needed -- for performance
                    searchContent = traverseAndReplace(target, MAX_DEPTH, level, [], excludedKeys, includeFunctions);
                }
                
                return _testObj(rg, searchContent, excludedKeys, includeFunctions);
            }

            return true;
        }

        _self.render = (textFilter: string, excludeKeys: string[], includeFunctions: boolean): HTMLElement => {
            if (!theEl || lastTextFilter !== textFilter) {
                lastTextFilter = textFilter;
                let ms: string = '' + tm;
                while (ms.length < 4) {
                    ms = "0" + ms;
                }

                ms = ms.replace(/(.)(\d{3})+$/g, '$1.$2s')
                while (ms.length <= 9) {
                    ms = ' ' + ms;
                }
                theEl = formatLogElements(target, `[${ms}]`, key, level, textFilter, excludeKeys, [], includeFunctions).root;
                toggleClassName(theEl, ' tree-root');
            }

            return theEl;
        }

        _self.getEl = () => {
            return theEl;
        }

        _self.getKind = () => {
            return kind;
        }
    }
}

