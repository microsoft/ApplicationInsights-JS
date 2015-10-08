module Microsoft.ApplicationInsights {
    export class SamplingScoreGenerator {

        // We're using 32 bit math, hence max value is (2^31 - 1)
        public static INT_MAX_VALUE: number = 2147483647;

        public static getScore(envelope: Telemetry.Common.Envelope): number {
            var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
            var score: number = 0;
            if (envelope.tags[tagKeys.userId]) {
                score = SamplingScoreGenerator.getSamplingHashCode(envelope.tags[tagKeys.userId]) / SamplingScoreGenerator.INT_MAX_VALUE;
            } else if (envelope.tags[tagKeys.operationId]) {
                score = SamplingScoreGenerator.getSamplingHashCode(envelope.tags[tagKeys.operationId]) / SamplingScoreGenerator.INT_MAX_VALUE;
            } else {
                score = Math.random()
            }

            return score * 100;
        }

        public static getSamplingHashCode(input: string): number {
            if (input == "") { return 0; }

            // 5358 is a magic number: http://stackoverflow.com/questions/10696223/reason-for-5381-number-in-djb-hash-function
            var hash: number = 5381;

            for (var i: number = 0; i < input.length; ++i) {
                hash = ((hash << 5) + hash) + input.charCodeAt(i);
                // 'hash' is of number type which means 53 bit integer (http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types-number-type)
                // 'hash & hash' will keep it 32 bit integer - just to make it clearer what the result is.
                hash = hash & hash;
            }

            return Math.abs(hash);
        }
    }
} 