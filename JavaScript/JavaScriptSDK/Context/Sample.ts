module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class Sample {
        public sampleRate: number;

        // We're using 32 bit math, hence max value is (2^31 - 1)
        public INT_MAX_VALUE: number = 2147483647;

        constructor(sampleRate: number) {
            if (sampleRate > 100 || sampleRate < 0) {
                _InternalLogging.throwInternalUserActionable(LoggingSeverity.WARNING, "Sampling rate is out of range (0..100): '" + sampleRate
                    + "'. Sampling will be disabled, you may be sending too much data which may affect your AI service level.");
                this.sampleRate = 100;
            }

            this.sampleRate = sampleRate;
        }

        /**
        * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
        */
        public isSampledIn(envelope: Telemetry.Common.Envelope): boolean {            
            if (this.sampleRate == 100) return true;
                        
            // TODO: extract to SamplingScoreGenerator
            var score = this.getScore(envelope);
            
            return score * 100 < this.sampleRate;
        }

        public getScore(envelope: Telemetry.Common.Envelope): number {            
            var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
            var score: number = 0;
            if (envelope.tags[tagKeys.userId]) {
                score = Sample.getSamplingHashCode(envelope.tags[tagKeys.userId]) / this.INT_MAX_VALUE;
            } else if (envelope.tags[tagKeys.operationId]) {
                score = Sample.getSamplingHashCode(envelope.tags[tagKeys.operationId]) / this.INT_MAX_VALUE;
            } else {
                score = Math.random()
            }

            return score;
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