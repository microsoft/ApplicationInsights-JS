// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// (Magic number) DJB algorithm can't work on shorter strings (results in poor distribution
const MIN_INPUT_LENGTH: number = 8;

export class HashCodeScoreGenerator {
    // We're using 32 bit math, hence max value is (2^31 - 1)
    public static INT_MAX_VALUE: number = 2147483647;

    public getHashCodeScore(key: string): number {
        const score = this.getHashCode(key) / HashCodeScoreGenerator.INT_MAX_VALUE;
        return score * 100;
    }

    public getHashCode(input: string): number {
        if (input === "") { return 0; }

        while (input.length < MIN_INPUT_LENGTH) {
            input = input.concat(input);
        }

        // 5381 is a magic number: http://stackoverflow.com/questions/10696223/reason-for-5381-number-in-djb-hash-function
        let hash: number = 5381;

        for (let i: number = 0; i < input.length; ++i) {
            hash = ((hash << 5) + hash) + input.charCodeAt(i);
            // 'hash' is of number type which means 53 bit integer (http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types-number-type)
            // 'hash & hash' will keep it 32 bit integer - just to make it clearer what the result is.
            hash = hash & hash;
        }

        return Math.abs(hash);
    }
}