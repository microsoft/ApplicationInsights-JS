// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, ISample, ITelemetryItem, MetricDataType, _eInternalMessageId, _throwInternal, eLoggingSeverity
} from "@microsoft/otel-core-js";
import { IScoreGenerator, createSamplingScoreGenerator } from "./SamplingScoreGenerators/SamplingScoreGenerator";

function _isSampledIn(envelope: ITelemetryItem, samplingPercentage: number, scoreGenerator: IScoreGenerator): boolean {
    let isSampledIn = false;

    if (samplingPercentage === null || samplingPercentage === undefined || samplingPercentage >= 100) {
        isSampledIn = true;
    } else if (envelope.baseType === MetricDataType) {
        // exclude MetricData telemetry from sampling
        isSampledIn = true;
    }

    if (!isSampledIn) {
        isSampledIn = scoreGenerator.getScore(envelope) < samplingPercentage;
    }
    
    return isSampledIn;
}

export function createSampler(sampleRate: number, logger?: IDiagnosticLogger): ISample {
    let _samplingScoreGenerator = createSamplingScoreGenerator();
    
    if (sampleRate > 100 || sampleRate < 0) {
        _throwInternal(logger, eLoggingSeverity.WARNING,
            _eInternalMessageId.SampleRateOutOfRange,
            "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.",
            { samplingRate: sampleRate }, true);
        sampleRate = 100;
    }

    let sampler: ISample & { generator: IScoreGenerator } = {
        sampleRate: sampleRate,
        generator: _samplingScoreGenerator,
        isSampledIn: function (envelope: ITelemetryItem) {
            return _isSampledIn(envelope, sampler.sampleRate, sampler.generator);
        }
    };

    return sampler;
}
