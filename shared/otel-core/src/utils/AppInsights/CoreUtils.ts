// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { strShimUndefined } from "@microsoft/applicationinsights-shims";
import { strSubstr, strSubstring } from "@nevware21/ts-utils";
import { STR_EMPTY } from "../../constants/InternalConstants";
import { random32 } from "./RandomHelper";

// Added to help with minfication
export const Undefined = strShimUndefined;

export function newGuid(): string {
    const uuid = generateW3CId();

    return strSubstring(uuid, 0, 8) + "-" + strSubstring(uuid, 8, 12) + "-" + strSubstring(uuid, 12, 16) + "-" + strSubstring(uuid, 16, 20) + "-" + strSubstring(uuid, 20);
}

/**
 * The strEndsWith() method determines whether a string ends with the characters of a specified string, returning true or false as appropriate.
 * @param value - The value to check whether it ends with the search value.
 * @param search - The characters to be searched for at the end of the value.
 * @returns true if the given search value is found at the end of the string, otherwise false.
 */
export function strEndsWith(value: string, search: string) {
    if (value && search) {
        let len = value.length;
        let start = len - search.length;
        return strSubstring(value, start >= 0 ? start : 0, len) === search;
    }

    return false;
}

/**
 * generate W3C trace id
 */
export function generateW3CId(): string {
    const hexValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

    // rfc4122 version 4 UUID without dashes and with lowercase letters
    let oct = STR_EMPTY, tmp;
    for (let a = 0; a < 4; a++) {
        tmp = random32();
        oct +=
            hexValues[tmp & 0xF] +
            hexValues[tmp >> 4 & 0xF] +
            hexValues[tmp >> 8 & 0xF] +
            hexValues[tmp >> 12 & 0xF] +
            hexValues[tmp >> 16 & 0xF] +
            hexValues[tmp >> 20 & 0xF] +
            hexValues[tmp >> 24 & 0xF] +
            hexValues[tmp >> 28 & 0xF];
    }

    // "Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively"
    const clockSequenceHi = hexValues[8 + (random32() & 0x03) | 0];
    return strSubstr(oct, 0, 8) + strSubstr(oct, 9, 4) + "4" + strSubstr(oct, 13, 3) + clockSequenceHi +strSubstr(oct, 16, 3) + strSubstr(oct, 19, 12);
}
