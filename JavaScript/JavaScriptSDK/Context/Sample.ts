/// <reference path="../SamplingScoreGenerator.ts" />

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

            var score = SamplingScoreGenerator.getScore(envelope);

            return score < this.sampleRate;
        }
    }
}