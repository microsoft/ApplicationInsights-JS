// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const charMap: { [key: string]: string } = {
    "<": "\\u003C",
    ">" : "\\u003E",
    "\\": "\\\\",
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
    "\0": "\\0",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029"
};

const sourceMap = /\/\/# sourceMappingURL=.*\.js\.map$/gm;

export function _escapeUnsupportedChars(value: any) {
    if (value) {
        value = value.replace(/[<>\\\b\f\n\r\t\0\u2028\u2029]/g, (match: string) => {
            return charMap[match];
        });
    }

    return value;
}

export function _ensureBoolean(value: any): boolean {
    if (value !== undefined) {
        value = !!value;
    }

    return value;
}

export function _ensureNumber(value: any): number {
    if (value !== undefined) {
        value = Number(value);
    }

    return value;
}

export function _getSourceMap(value: string): string[] {
    let rlt = "";
    let cleanedStr = value;
    if (value){
        let matches = value.match(sourceMap);
        // process when there is only one source map
        if (matches && matches.length === 1) {
            rlt = matches[0].trim();
            cleanedStr = value.replace(sourceMap, "");
        }
    }

    return [rlt, cleanedStr]
}