/// <reference path="../SamplingScoreGenerator.ts" />
/// <reference path="../Contracts/Generated/Envelope.ts" />
/// <reference path="ISample.ts" />

module Microsoft.ApplicationInsights.Context {

    "use strict";

    export class Sample implements ISample {
        public sampleRate: number;
        private samplingScoreGenerator: SamplingScoreGenerator;

        // We're using 32 bit math, hence max value is (2^31 - 1)
        public INT_MAX_VALUE: number = 2147483647;

        constructor(sampleRate: number) {
            if (sampleRate > 100 || sampleRate < 0) {
                _InternalLogging.throwInternalUserActionable(LoggingSeverity.WARNING, new _InternalLogMessage(
                    _InternalMessageId.USRACT_SampleRateOutOfRange,
                    "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.",
                    { samplingRate: sampleRate }));
                this.sampleRate = 100;
            }
                        
            this.sampleRate = sampleRate;
            this.samplingScoreGenerator = new SamplingScoreGenerator();
        }

        /**
        * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
        */
        public isSampledIn(envelope: Microsoft.Telemetry.Envelope): boolean {
            if (this.sampleRate == 100) return true;

            var score = this.samplingScoreGenerator.getSamplingScore(envelope);

            return score < this.sampleRate;
        }
    }
}