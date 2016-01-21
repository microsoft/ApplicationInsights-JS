/// <reference path="./HashCodeScoreGenerator.ts" />

module Microsoft.ApplicationInsights {
    export class SamplingScoreGenerator {
        private hashCodeGeneragor: HashCodeScoreGenerator;

        constructor() {
            this.hashCodeGeneragor = new HashCodeScoreGenerator();
        }

        public getSamplingScore(envelope: Telemetry.Common.Envelope): number {
            var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
            var score: number = 0;
            if (envelope.tags[tagKeys.userId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.userId]);
            } else if (envelope.tags[tagKeys.operationId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.operationId]);
            } else {
                score = Math.random()
            }

            return score;
        }
    }
} 