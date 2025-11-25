// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ContextTagKeys } from "@microsoft/applicationinsights-common";
import { ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { getHashCodeScore } from "./HashCodeScoreGenerator";

export interface IScoreGenerator {
    getScore(item: ITelemetryItem): number;
}

export function createSamplingScoreGenerator(): IScoreGenerator {
    let keys: ContextTagKeys = new ContextTagKeys();

    return {
        getScore: (item: ITelemetryItem): number => {
            let score: number = 0;
            if (item.tags && item.tags[keys.userId]) { // search in tags first, then ext
                score = getHashCodeScore(item.tags[keys.userId]);
            } else if (item.ext && item.ext.user && item.ext.user.id) {
                score = getHashCodeScore(item.ext.user.id);
            } else if (item.tags && item.tags[keys.operationId]) { // search in tags first, then ext
                score = getHashCodeScore(item.tags[keys.operationId]);
            } else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
                score = getHashCodeScore(item.ext.telemetryTrace.traceID);
            } else {
                // tslint:disable-next-line:insecure-random
                score = (Math.random() * 100);
            }
    
            return score;
        }
    };
}
