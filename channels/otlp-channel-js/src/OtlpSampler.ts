// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ContextTagKeys, ISample, ITelemetryItem, MetricDataType } from "@microsoft/applicationinsights-core-js";
import { mathAbs } from "@nevware21/ts-utils";

const MIN_INPUT_LENGTH = 8;
const INT_MAX_VALUE = 2147483647;

function _getHashCodeScore(key: string): number {
    let score = 0;
    let input = key;

    if (input) {
        while (input.length < MIN_INPUT_LENGTH) {
            input = input.concat(input);
        }

        let hash = 5381;
        for (let lp = 0; lp < input.length; lp++) {
            hash = ((hash << 5) + hash) + input.charCodeAt(lp);
            hash = hash & hash;
        }

        score = mathAbs(hash) / INT_MAX_VALUE;
    }

    return score * 100;
}

/**
 * Creates a deterministic sampler matching the classic Sender's behavior.
 */
export function createOtlpSampler(sampleRate: number): ISample {
    let keys = new ContextTagKeys();

    return {
        sampleRate: sampleRate,
        isSampledIn: (item: ITelemetryItem): boolean => {
            if (sampleRate >= 100 || item.baseType === MetricDataType) {
                return true;
            }

            let score: number;
            if (item.tags && item.tags[keys.userId]) {
                score = _getHashCodeScore(item.tags[keys.userId]);
            } else if (item.ext && item.ext.user && item.ext.user.id) {
                score = _getHashCodeScore(item.ext.user.id);
            } else if (item.tags && item.tags[keys.operationId]) {
                score = _getHashCodeScore(item.tags[keys.operationId]);
            } else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
                score = _getHashCodeScore(item.ext.telemetryTrace.traceID);
            } else {
                score = Math.random() * 100;
            }

            return score < sampleRate;
        }
    };
}
