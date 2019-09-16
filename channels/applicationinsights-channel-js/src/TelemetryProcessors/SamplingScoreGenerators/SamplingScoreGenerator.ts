// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { HashCodeScoreGenerator } from './HashCodeScoreGenerator';
import { ITelemetryItem } from '@microsoft/applicationinsights-core-js';
import { ContextTagKeys } from '@microsoft/applicationinsights-common';

export class SamplingScoreGenerator {
    private hashCodeGeneragor: HashCodeScoreGenerator;
    private keys: ContextTagKeys;

    constructor() {
        this.hashCodeGeneragor = new HashCodeScoreGenerator();
        this.keys = new ContextTagKeys();
    }

    public getSamplingScore(item: ITelemetryItem): number {
        let score: number = 0;
        if (item.tags && item.tags[this.keys.userId]) { // search in tags first, then ext
            score = this.hashCodeGeneragor.getHashCodeScore(item.tags[this.keys.userId]);
        } else if (item.ext && item.ext.user && item.ext.user.id) {
            score = this.hashCodeGeneragor.getHashCodeScore(item.ext.user.id);
        } else if (item.tags && item.tags[this.keys.operationId]) { // search in tags first, then ext
            score = this.hashCodeGeneragor.getHashCodeScore(item.tags[this.keys.operationId]);
        } else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
            score = this.hashCodeGeneragor.getHashCodeScore(item.ext.telemetryTrace.traceID);
        } else {
            // tslint:disable-next-line:insecure-random
            score = (Math.random() * 100);
        }

        return score;
    }
}