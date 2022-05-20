// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { strShimUndefined } from "@microsoft/applicationinsights-shims";
import { getPerformance } from "./EnvUtils";
import { dateNow } from "./HelperFuncs";
import { STR_EMPTY } from "./InternalConstants";
import { random32 } from "./RandomHelper";

// Added to help with minfication
export const Undefined = strShimUndefined;

export function newGuid(): string {
    const uuid = generateW3CId();

    return uuid.substring(0, 8) + "-" + uuid.substring(8, 12) + "-" + uuid.substring(12, 16) + "-" + uuid.substring(16, 20) + "-" + uuid.substring(20);
}

/**
 * Return the current value of the Performance Api now() function (if available) and fallback to dateNow() if it is unavailable (IE9 or less)
 * https://caniuse.com/#search=performance.now
 */
export function perfNow(): number {
    let perf = getPerformance();
    if (perf && perf.now) {
        return perf.now();
    }

    return dateNow();
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
        return value.substring(start >= 0 ? start : 0, len) === search;
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
    return oct.substr(0, 8) + oct.substr(9, 4) + "4" + oct.substr(13, 3) + clockSequenceHi + oct.substr(16, 3) + oct.substr(19, 12);
}
