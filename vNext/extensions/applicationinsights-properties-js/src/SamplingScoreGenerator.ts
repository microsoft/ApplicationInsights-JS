// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { HashCodeScoreGenerator } from './HashCodeScoreGenerator';
import { ITelemetryItem } from '@microsoft/applicationinsights-core-js';

export class SamplingScoreGenerator {
    private hashCodeGeneragor: HashCodeScoreGenerator;

    constructor() {
        this.hashCodeGeneragor = new HashCodeScoreGenerator();
    }

    public getSamplingScore(item: ITelemetryItem): number {
        var score: number = 0;
        if (item.ext && item.ext.user && item.ext.user.id) {
            score = this.hashCodeGeneragor.getHashCodeScore(item.ext.user.id);
        } else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
            score = this.hashCodeGeneragor.getHashCodeScore(item.ext.telemetryTrace.traceID);
        } else {
            // tslint:disable-next-line:insecure-random
            score = (Math.random() * 100);
        }

        return score;
    }
}