// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { isNullOrUndefined, isIgnoreFuncMatch, isIgnore } from "./Utils";
import { IEs3CheckKeyword, IEs3CheckRollupOptions } from "./Interfaces";
import { defaultEs3CheckTokens } from "./Es3Tokens";
import { formatError } from "./FormatError";

function visibleNewlines(value:string) {
    if (value) {
        return value.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    }

    return value;
}

export function checkResult(tokens:IEs3CheckKeyword[], result:string, id:string, entry:string, isTransform:boolean) {
    if (result) {
        let errorMessage = "";

        for (let idx in tokens) {
            let keyword:IEs3CheckKeyword = tokens[idx];
            if (!isIgnore(id, keyword, isTransform)) {
                for (let funcIdx in keyword.funcNames) {
                    let funcRegEx = keyword.funcNames[funcIdx];
                    if (funcRegEx) {
                        let funcMatch;
                        /* tslint:disable:no-conditional-assignment */
                        while ((funcMatch = funcRegEx.exec(result))) {
                            let funcName = funcMatch[0]||"";
                            if (funcName.length > 0 && !isIgnoreFuncMatch(funcName, keyword)) {
                                errorMessage += formatError(keyword, funcName, keyword.errorMsg, result, funcMatch.index, id, entry);
                                errorMessage += "\n--------------------=([" + visibleNewlines(funcName) + "])=--------------------\n";
                            }
                        }
                    }
                }
            }
        }

        if (errorMessage) {
            throw new Error(errorMessage);
        }
    }
}

export function es3Check(options:IEs3CheckRollupOptions = {}) {
    let tokens:IEs3CheckKeyword[] = defaultEs3CheckTokens.slice(0);
    if (options) {
        if (!isNullOrUndefined(options.ignoreDefault) && options.ignoreDefault) {
            tokens = [];
        }

        if (!isNullOrUndefined(options.keywords) && options.keywords.length > 0) {
            tokens = tokens.concat(options.keywords);
        }
    }

    function doCheck(code:string, id:string, entry:string, isTransform:boolean): any {
        // Check that the raw input doesn't include the tag
        checkResult(tokens, code, id, entry, isTransform);

        return null;
    }

    return {
        name: "ai-rollup-es3check",
        renderChunk(code:string, chunk:any) {
            return doCheck(code, chunk.filename || chunk.fileName || chunk.name, "renderChunk", false);
        },
        transform(code:string, id:string) {
            return doCheck(code, id, "transform", true);
        }
    }
}