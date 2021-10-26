// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { HashCodeScoreGenerator } from "./HashCodeScoreGenerator";
import { ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { ContextTagKeys } from "@microsoft/applicationinsights-common";

export class SamplingScoreGenerator {

    public getSamplingScore: (item: ITelemetryItem) => number;

    constructor() {
        let _self = this;
        let hashCodeGenerator: HashCodeScoreGenerator = new HashCodeScoreGenerator();
        let keys: ContextTagKeys = new ContextTagKeys();

        _self.getSamplingScore = (item: ITelemetryItem): number => {
            let score: number = 0;
            if (item.tags && item.tags[keys.userId]) { // search in tags first, then ext
                score = hashCodeGenerator.getHashCodeScore(item.tags[keys.userId]);
            } else if (item.ext && item.ext.user && item.ext.user.id) {
                score = hashCodeGenerator.getHashCodeScore(item.ext.user.id);
            } else if (item.tags && item.tags[keys.operationId]) { // search in tags first, then ext
                score = hashCodeGenerator.getHashCodeScore(item.tags[keys.operationId]);
            } else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
                score = hashCodeGenerator.getHashCodeScore(item.ext.telemetryTrace.traceID);
            } else {
                // tslint:disable-next-line:insecure-random
                score = (Math.random() * 100);
            }
    
            return score;
        }
    }
}