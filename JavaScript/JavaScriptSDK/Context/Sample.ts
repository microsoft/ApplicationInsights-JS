module Microsoft.ApplicationInsights.Context {
    "use strict";

    export class Sample {
        public sampleRate: number;

        public INT_MAX_VALUE: number = Math.pow(2, 32) - 1;

        constructor(sampleRate: number) {
            if (sampleRate > 100 || sampleRate < 0) {
                _InternalLogging.throwInternalUserActionable(LoggingSeverity.CRITICAL, "Sampling rate is out of range (0..100): '" + sampleRate
                    + "'. Sampling will be disabled, you may be sending too much data which may affect your AI service level.");
                this.sampleRate = 100;
            }

            this.sampleRate = sampleRate;
        }

        public IsSampledIn(envelope: Telemetry.Common.Envelope): boolean {            
            if (this.sampleRate == 100) return true;
                        
            // TODO: extract to SamplingScoreGenerator
            var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
            var score: number = 0;
            if (envelope.tags[tagKeys.userId] != "") {
                score = Sample.GetSamplingHashCode(envelope.tags[tagKeys.userId]) / this.INT_MAX_VALUE;
            } else if (envelope.tags[tagKeys.operationId] != "") {
                score = Sample.GetSamplingHashCode(envelope.tags[tagKeys.operationId]) / this.INT_MAX_VALUE;
            } else {
                score = Math.random()
            }
            
            return score * 100 < this.sampleRate;
        }

        public static GetSamplingHashCode(input: string): number {
            if (input == "") { return 0; }

            var hash: number = 5381;

            for (var i: number = 0; i < input.length; ++i) {
                hash = ((hash << 5) + hash) + input.charCodeAt(i);
                hash = hash & hash;
            }

            return Math.abs(hash);
        }
    }
}