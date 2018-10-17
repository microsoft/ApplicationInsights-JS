// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="./HashCodeScoreGenerator.ts" />
/// <reference path="../JavaScriptSDK.Interfaces/Contracts/Generated/Envelope.ts" />

module Microsoft.ApplicationInsights {
    export class SamplingScoreGenerator {
        private hashCodeGeneragor: HashCodeScoreGenerator;

        constructor() {
            this.hashCodeGeneragor = new HashCodeScoreGenerator();
        }

        public getSamplingScore(envelope: Microsoft.ApplicationInsights.IEnvelope): number {
            var tagKeys: AI.ContextTagKeys = new AI.ContextTagKeys();
            var score: number = 0;
            if (envelope.tags[tagKeys.userId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.userId]);
            } else if (envelope.tags[tagKeys.operationId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.operationId]);
            } else {
                // tslint:disable-next-line:insecure-random 
                score = Math.random()
            }

            return score;
        }
    }
} 