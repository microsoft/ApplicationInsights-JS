// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { padEnd, isNullOrWhitespace } from "./Utils";
import { IEs3CheckKeyword, IEs3Keyword } from "./Interfaces";

export function formatError(keyword:IEs3CheckKeyword|IEs3Keyword, funcName:string, errorMsg:string, code:string, pos:number, id:string, entry:string) {
    let lines = code.split(/(?:\r\n|\n\r|\r|\n)/);
    let lineNumber = 0;
    let count = pos;
    while (count > 0) {
        lineNumber ++;
        count = code.lastIndexOf("\n", count - 1);
    }
  
    let lineStart = code.lastIndexOf("\n", pos);
    let column = lineStart !== -1 ? (pos - lineStart) : pos + 1;
  
    var message = (keyword.errorTitle || "Invalid ES3 function") + " [" + funcName + "] found on line [" + lineNumber + "], column [" + column + "], position [" + pos + "] during " + (entry||"<processing>") + " - " + (id||"") + "\n";
    if (errorMsg) {
        message += errorMsg.replace("%funcName%", funcName) + "\n";
    }
  
    let marker = padEnd("", funcName.length, "^");
    let line = lineNumber - 6;
    if (line > 0) {
        message += " ...\n";
    }
  
    count = 0;
    while (count < 10 && line < lines.length-1) {
        count++;
        if (line >= 0) {
            let number = padEnd("" + (line + 1), 4, " ");
            message += number + ":" + lines[line] + "\n";
            if (line === lineNumber-1) {
                message += padEnd("", column + 4, " ") + marker + "\n";
            }
        }
  
        line++;
    }
  
    if (line < lines.length-1) {
        message += " ...\n";
    }
  
    if ((keyword as IEs3Keyword).extract && !isNullOrWhitespace(funcName)) {
        let match;
        let matchCount = 0;

        /* tslint:disable:no-conditional-assignment */
        while ((match = (keyword as IEs3Keyword).extract.exec(code))) {
            if (matchCount === 0) {
                message += "\nMatch checks\n";
            }

            matchCount++;
            if (match[0].length > 0) {
                message += "Match " + matchCount + " tag Groups for " + funcName + "\n";
                message += "--=( Complete Matched Content )=--\n";
                message += match[0];
                message += "\n--------------------------------\n";
                for(let lp = 1; lp < match.length; lp++) {
                    if (match[lp]) {
                        message += "" + lp + ": " + (match[lp] || "").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
                        message += "\n";
                    }
                }
                message += "\n";
            }
        }
    }
  
    return message;
}
