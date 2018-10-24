// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SamplingScoreGenerator } from '../SamplingScoreGenerator';
import { ISample } from '../Interfaces/Context/ISample';
import { IEnvelope } from 'applicationinsights-common';
import { ITelemetryItem, IDiagnosticLogger, _InternalMessageId, LoggingSeverity, DiagnosticLogger, CoreUtils } from 'applicationinsights-core-js';

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
        // return true as sampling will move to different extension
        return true;
    }
}