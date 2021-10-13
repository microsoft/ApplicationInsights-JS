// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IEs3CheckKeyword } from "./Interfaces";

export function isSourceMapEnabled(options:any) {
    if (options) {
      return options.sourceMap !== false && options.sourcemap !== false;
    }
  
    return false;
}

// Need to mock this rather than rely on JavaScript String.prototype.padEnd() as it doesn't always
// exists in the build / test infrastructure
export function padEnd(input:string, len:number, fill:string) {
    let value = input||"";
    while (value.length < len) {
        value += fill;
    }
  
    if (value.length > len) {
        value = value.substring(0, len);
    }
  
    return value;
}
  
export function isNullOrUndefined(value: any): boolean
{
    return value === undefined || value === null || typeof value === "undefined";
}

export function isNullOrWhitespace(value:string) {
    if (value) {
        return value.replace(/\s/g, "").length < 1;
    }
  
    return true;
}

export function isIgnore(id:string, keyword:IEs3CheckKeyword, _isTransform:boolean) {
    let result = false;
    
    if (keyword.ignoreIds) {
        for (let ignoreIdx in keyword.ignoreIds) {
            let ignoreMatch = keyword.ignoreIds[ignoreIdx];
            if (id && id.indexOf(ignoreMatch) !== -1) {
                result = true;
                break;
            }
        }
    }

    return result;
}

export function isIgnoreFuncMatch(funcMatch:string, keyword:IEs3CheckKeyword) {
    let result = false;
    if (funcMatch && keyword.ignoreFuncMatch) {
        for (let ignoreIdx in keyword.ignoreFuncMatch) {
            let ignoreMatch = keyword.ignoreFuncMatch[ignoreIdx];
            if (ignoreMatch) {
                if (typeof ignoreMatch === "string" && funcMatch.indexOf(ignoreMatch) !== -1) {
                    result = true;
                    break;
                } else if (ignoreMatch instanceof RegExp) {
                    let match = ignoreMatch.exec(funcMatch);
                    if (match && match.length > 0) {
                        result = true;
                        break;
                    }
                }
            }
        }
    }

    return result;
}
