// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SamplingScoreGenerator } from './SamplingScoreGenerators/SamplingScoreGenerator';
import { ISample, Metric } from '@microsoft/applicationinsights-common';
import { ITelemetryItem, IDiagnosticLogger, _InternalMessageId, LoggingSeverity, DiagnosticLogger, CoreUtils } from '@microsoft/applicationinsights-core-js';

export class Sample implements ISample {
    public sampleRate: number;
    private samplingScoreGenerator: SamplingScoreGenerator;
    private _logger: IDiagnosticLogger;

    // We're using 32 bit math, hence max value is (2^31 - 1)
    public INT_MAX_VALUE: number = 2147483647;

    constructor(sampleRate: number, logger?: IDiagnosticLogger) {
        if (CoreUtils.isNullOrUndefined(logger)) {
            this._logger = new DiagnosticLogger();
        } else {
            this._logger = logger;
        }
        if (sampleRate > 100 || sampleRate < 0) {
            this._logger.throwInternal(LoggingSeverity.WARNING,
                _InternalMessageId.SampleRateOutOfRange,
                "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.",
                { samplingRate: sampleRate }, true);
            this.sampleRate = 100;
        }

        this.sampleRate = sampleRate;
        this.samplingScoreGenerator = new SamplingScoreGenerator();
    }

    /**
    * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
    */
    public isSampledIn(envelope: ITelemetryItem): boolean {
        let samplingPercentage = this.sampleRate; // 0 - 100
        let isSampledIn = false;

        if (samplingPercentage === null || samplingPercentage === undefined || samplingPercentage >= 100) {
            return true;
        } else if (envelope.baseType === Metric.dataType) {
            // exclude MetricData telemetry from sampling
            return true;
        }

        isSampledIn = this.samplingScoreGenerator.getSamplingScore(envelope) < samplingPercentage;
        return isSampledIn;
    }
}