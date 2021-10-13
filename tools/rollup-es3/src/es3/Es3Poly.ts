// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { isNullOrUndefined, isNullOrWhitespace, isSourceMapEnabled, isIgnore } from "./Utils";
import { defaultEs3Tokens } from "./Es3Tokens";
import { INamedGroups, IEs3Keyword, IEs3RollupOptions } from "./Interfaces";
import { checkResult } from "./Es3Check";
import MagicString from "magic-string";

// Start the temp name from the recent milliseconds -- this is to try and ensure that multiple runs which
// merge into the same resulting file *hopefully* avoid any temporary name clashes
let tempIndex = ((new Date()).getTime() & 0xFFFFFF);

function _escapeRegEx(str:string) {
    return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
}

function _replaceAll(str:string, value:string, newValue: string) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return str.replace(new RegExp(_escapeRegEx(value), "g"), newValue);
}

function _replaceToken(keyword:IEs3Keyword, code:string, theString:MagicString, _entry:string):boolean {
    let result = false;
    let extract:RegExp = keyword.extract;
    let replaceValue:string = keyword.replace || "";
    let checkGroups:number[] = keyword.checkGroups;

    if (!extract) {
        return result;
    }

    let match;
    /* tslint:disable:no-conditional-assignment */
    while ((match = extract.exec(code))) {
        let hasToken = true;
        if (checkGroups && checkGroups.length > 0) {
            for (let idx in checkGroups) {
                let value = match[checkGroups[idx]];
                if (isNullOrWhitespace(value)) {
                    hasToken = false;
                    break;
                }
            }
        }
  
        if (hasToken) {
            result = true;
            let start = match.index;
            let newValue = replaceValue || "";
            let nameUsed = false;

            if (keyword.namedGroups) {
                for (let idx in keyword.namedGroups) {
                    let namedGroup:INamedGroups = keyword.namedGroups[idx];
                    if (!isNullOrWhitespace(namedGroup.name)) {
                        let replace:string = match[namedGroup.idx] || "";
                        newValue = _replaceAll(newValue, "%" + namedGroup.name + "%", replace);
                    }
                }
            }

            if (!nameUsed) {
                let tempName = "aies3_" + tempIndex;
                tempIndex++;
                newValue = newValue.replace("%tempName%", tempName)
            }

            theString.overwrite(start, start + match[0].length, newValue);
        }
    }

    return result;
}

export function es3Poly(options:IEs3RollupOptions = {}) {
    let doReplace = true;
    let tokens:IEs3Keyword[] = defaultEs3Tokens.slice(0);
    if (options) {
        if (!isNullOrUndefined(options.ignoreDefault) && options.ignoreDefault) {
            tokens = [];
        }

        if (!isNullOrUndefined(options.keywords) && options.keywords.length > 0) {
            tokens = tokens.concat(options.keywords);
        }
        if (!isNullOrUndefined(options.checkOnly)) {
            doReplace = !options.checkOnly;
        }
    }

    function replaceTokens(code:string, id:string, entry:string, isTransform:boolean): MagicString {
        let changed = false;
        let theString = null;
        if (doReplace && code) {
            theString = new MagicString(code);
            for (let idx in tokens) {
                let keyword:IEs3Keyword = tokens[idx];
                if (keyword && !isIgnore(id, keyword, isTransform)) {
                    try {
                        if (_replaceToken(keyword, code, theString, entry)) {
                            changed = true;
                        }
                    } catch (e) {
                        // This occurs when we try and transform a chunk that has already been transformed
                        // So reassigning the values and attempt to replace again, this may cause any possible
                        // map file to mismatch the source code, however, the wrapped code should still be mostly correct
                        code = theString.toString();
                        theString = new MagicString(code);
                        if (_replaceToken(keyword, code, theString, entry)) {
                            changed = true;
                        }
                    }
                }
            }
        }

        return changed ? theString : null;
    }

    function doTransform(code:string, id:string, entry:string, isTransform:boolean) {
        let theString = replaceTokens(code, id, entry, isTransform);
        if (theString === null) {
            return null;
        }

        let result:any = { code: theString.toString() };
        if (isSourceMapEnabled(options)) {
            result.map = theString.generateMap({hires: true});
        }

        return result;
    }

    function doTransformAndCheck(code:string, id:string, entry:string, isTransform:boolean) {
        let result = doTransform(code, id, entry, isTransform);
        if (result) {
            // Do a final check of the string
            checkResult(tokens, result.code, id, entry, isTransform);
        } else {
            // Check that the raw input doesn't include the tag
            checkResult(tokens, code, id, entry, isTransform);
        }

        return result;
    }

    return {
        name: "ai-rollup-es3poly",
        renderChunk(code:string, chunk:any) {
            return doTransformAndCheck(code, chunk.filename, "renderChunk", false);
        },
        transform(code:string, id:string) {
            return doTransformAndCheck(code, id, "transform", true);
        }
    }
}