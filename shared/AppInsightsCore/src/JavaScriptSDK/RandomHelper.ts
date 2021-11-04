// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { getCrypto, getMsCrypto, isIE }  from "./EnvUtils";
import { dateNow } from "./HelperFuncs";

const UInt32Mask = 0x100000000;
const MaxUInt32 = 0xffffffff;

// MWC based Random generator (for IE)
let _mwcSeeded = false;
let _mwcW = 123456789;
var _mwcZ = 987654321;

// Takes any integer
function _mwcSeed(seedValue: number) {
    if (seedValue < 0) {
        // Make sure we end up with a positive number and not -ve one.
        seedValue >>>= 0;
    }

    _mwcW = (123456789 + seedValue) & MaxUInt32;
    _mwcZ = (987654321 - seedValue) & MaxUInt32;
    _mwcSeeded = true;
}

function _autoSeedMwc() {
    // Simple initialization using default Math.random() - So we inherit any entropy from the browser
    // and bitwise XOR with the current milliseconds
    try {
        const now = dateNow() & 0x7fffffff;
        _mwcSeed(((Math.random() * UInt32Mask) ^ now) + now);
    } catch (e) {
        // Don't crash if something goes wrong
    }
}

/**
 * Generate a random value between 0 and maxValue, max value should be limited to a 32-bit maximum.
 * So maxValue(16) will produce a number from 0..16 (range of 17)
 * @param maxValue
 */
export function randomValue(maxValue: number) {
    if (maxValue > 0) {
        return Math.floor((random32() / MaxUInt32) * (maxValue + 1)) >>> 0;
    }

    return 0;
}

/**
 * generate a random 32-bit number (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), defaults un-unsigned.
 * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
 */
export function random32(signed?: boolean) {
    let value;
    let c = getCrypto() || getMsCrypto();
    if (c && c.getRandomValues) {
        // Make sure the number is converted into the specified range (-0x80000000..0x7FFFFFFF)
        value = c.getRandomValues(new Uint32Array(1))[0] & MaxUInt32;
    } else if (isIE()) {
        // For IE 6, 7, 8 (especially on XP) Math.random is not very random
        if (!_mwcSeeded) {
            // Set the seed for the Mwc algorithm
            _autoSeedMwc();
        }

        // Don't use Math.random for IE
        // Make sure the number is converted into the specified range (-0x80000000..0x7FFFFFFF)
        value = mwcRandom32() & MaxUInt32;
    } else {
        // Make sure the number is converted into the specified range (-0x80000000..0x7FFFFFFF)
        value = Math.floor((UInt32Mask * Math.random()) | 0);
    }

    if (!signed) {
        // Make sure we end up with a positive number and not -ve one.
        value >>>= 0;
    }

    return value;
}

/**
 * Seed the MWC random number generator with the specified seed or a random value
 * @param value - optional the number to used as the seed, if undefined, null or zero a random value will be chosen
 */
export function mwcRandomSeed(value?: number) {
    if (!value) {
        _autoSeedMwc();
    } else {
        _mwcSeed(value);
    }
}

/**
 * Generate a random 32-bit number between (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), using MWC (Multiply with carry)
 * instead of Math.random() defaults to un-signed.
 * Used as a replacement random generator for IE to avoid issues with older IE instances.
 * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
 */
export function mwcRandom32(signed?: boolean) {
    _mwcZ = (36969 * (_mwcZ & 0xFFFF) + (_mwcZ >> 16)) & MaxUInt32;
    _mwcW = (18000 * (_mwcW & 0xFFFF) + (_mwcW >> 16)) & MaxUInt32;

    let value = (((_mwcZ << 16) + (_mwcW & 0xFFFF)) >>> 0) & MaxUInt32 | 0;

    if (!signed) {
        // Make sure we end up with a positive number and not -ve one.
        value >>>= 0;
    }

    return value;
}

