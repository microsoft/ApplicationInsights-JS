/**
* Generate a random value between 0 and maxValue, max value should be limited to a 32-bit maximum.
* So maxValue(16) will produce a number from 0..16 (range of 17)
* @param maxValue - The max value for the range
*/
export declare function randomValue(maxValue: number): number;
/**
 * generate a random 32-bit number (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), defaults un-unsigned.
 * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
 */
export declare function random32(signed?: boolean): number;
/**
 * Seed the MWC random number generator with the specified seed or a random value
 * @param value - optional the number to used as the seed, if undefined, null or zero a random value will be chosen
 */
export declare function mwcRandomSeed(value?: number): void;
/**
 * Generate a random 32-bit number between (0x000000..0xFFFFFFFF) or (-0x80000000..0x7FFFFFFF), using MWC (Multiply with carry)
 * instead of Math.random() defaults to un-signed.
 * Used as a replacement random generator for IE to avoid issues with older IE instances.
 * @param signed - True to return a signed 32-bit number (-0x80000000..0x7FFFFFFF) otherwise an unsigned one (0x000000..0xFFFFFFFF)
 */
export declare function mwcRandom32(signed?: boolean): number;
/**
 * Generate random base64 id string.
 * The default length is 22 which is 132-bits so almost the same as a GUID but as base64 (the previous default was 5)
 * @param maxLength - Optional value to specify the length of the id to be generated, defaults to 22
 */
export declare function newId(maxLength?: number): string;
