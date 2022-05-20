// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { isNullOrUndefined, isIgnoreFuncMatch, isIgnore } from "./Utils";
import { IEs5CheckKeyword, IEs5CheckRollupOptions } from "./Interfaces";
import { defaultEs5CheckTokens } from "./Es5Tokens";
import { formatError } from "./FormatError";

function visibleNewlines(value:string) {
    if (value) {
        return value.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    }

    return value;
}

export function checkResult(tokens:IEs5CheckKeyword[], result:string, id:string, entry:string, isTransform:boolean) {
    if (result) {
        let errorMessage = "";

        for (let idx in tokens) {
            let keyword:IEs5CheckKeyword = tokens[idx];
            if (!isIgnore(id, keyword, isTransform)) {
                for (let funcIdx in keyword.funcNames) {
                    let funcRegEx = keyword.funcNames[funcIdx];
                    if (funcRegEx) {
                        let funcMatch;
                        /* tslint:disable:no-conditional-assignment */
                        while ((funcMatch = funcRegEx.exec(result))) {
                            let funcName = funcMatch[0]||"";
                            if (funcName.length > 0 && !isIgnoreFuncMatch(funcName, keyword)) {
                                let newErrorMessage = formatError(keyword, funcName, keyword.errorMsg, result, funcMatch.index, id, entry);
                                if ((errorMessage.length + newErrorMessage.length) < 32768) {
                                    errorMessage += formatError(keyword, funcName, keyword.errorMsg, result, funcMatch.index, id, entry);
                                    errorMessage += "\n--------------------=([" + visibleNewlines(funcName) + "])=--------------------\n";
                                } else {
                                    errorMessage += "\n-------------------------------------------------------------------------------";
                                    errorMessage += "\n Too Many errors detected!";
                                    errorMessage += "\n-------------------------------------------------------------------------------";
                                    throw new Error(errorMessage);
                                }
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

export function es5Check(options:IEs5CheckRollupOptions = {}) {
    let tokens:IEs5CheckKeyword[] = defaultEs5CheckTokens.slice(0);
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
        name: "ai-rollup-es5check",
        renderChunk(code:string, chunk:any) {
            return doCheck(code, chunk.filename || chunk.fileName || chunk.name, "renderChunk", false);
        },
        transform(code:string, id:string) {
            return doCheck(code, id, "transform", true);
        }
    }
}