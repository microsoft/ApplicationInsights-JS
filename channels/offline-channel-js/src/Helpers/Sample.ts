import { ContextTagKeys, ISample, Metric } from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, ITelemetryItem, _eInternalMessageId, eLoggingSeverity, safeGetLogger
} from "@microsoft/applicationinsights-core-js";

// ************************************************************************************************************
// TODO: move to common


const MIN_INPUT_LENGTH: number = 8;

export class HashCodeScoreGenerator {
    // We're using 32 bit math, hence max value is (2^31 - 1)
    public static INT_MAX_VALUE: number = 2147483647;

    public getHashCodeScore(key: string): number {
        const score = this.getHashCode(key) / HashCodeScoreGenerator.INT_MAX_VALUE;
        return score * 100;
    }

    public getHashCode(input: string): number {
        if (input === "") {
            return 0;
        }

        while (input.length < MIN_INPUT_LENGTH) {
            input = input.concat(input);
        }

        // 5381 is a magic number: http://stackoverflow.com/questions/10696223/reason-for-5381-number-in-djb-hash-function
        let hash: number = 5381;

        for (let i: number = 0; i < input.length; ++i) {
            hash = ((hash << 5) + hash) + input.charCodeAt(i);
            // 'hash' is of number type which means 53 bit integer (http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types-number-type)
            // 'hash & hash' will keep it 32 bit integer - just to make it clearer what the result is.
            hash = hash & hash;
        }

        return Math.abs(hash);
    }
}



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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.



export class Sample implements ISample {
    public sampleRate: number;

    // We're using 32 bit math, hence max value is (2^31 - 1)
    public INT_MAX_VALUE: number = 2147483647;
    private samplingScoreGenerator: SamplingScoreGenerator;

    constructor(sampleRate: number, logger?: IDiagnosticLogger) {
        let _logger = logger || safeGetLogger(null);
        
        if (sampleRate > 100 || sampleRate < 0) {
            _logger.throwInternal(eLoggingSeverity.WARNING,
                _eInternalMessageId.SampleRateOutOfRange,
                "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.",
                { samplingRate: sampleRate }, true);
            sampleRate = 100;
        }

        this.sampleRate = sampleRate;
        this.samplingScoreGenerator = new SamplingScoreGenerator();
    }

    /**
    * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
    */
    public isSampledIn(envelope: ITelemetryItem): boolean {
        const samplingPercentage = this.sampleRate; // 0 - 100
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
