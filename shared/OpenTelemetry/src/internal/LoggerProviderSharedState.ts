// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecordLimits } from "../interfaces/logs/IOTelLogRecordLimits";
import { IOTelLogRecordProcessor } from "../interfaces/logs/IOTelLogRecordProcessor";
import { IOTelLogger } from "../interfaces/logs/IOTelLogger";
import { NoopLogRecordProcessor } from "../interfaces/logs/IOTelNoopLogRecordProcessor";
import { IOTelResource } from "../interfaces/resources/IOTelResource";
import { MultiLogRecordProcessor } from "../sdk/IOTelMultiLogRecordProcessor";

export class LoggerProviderSharedState {
    readonly loggers: Map<string, IOTelLogger> = new Map();
    activeProcessor: IOTelLogRecordProcessor;
    readonly registeredLogRecordProcessors: IOTelLogRecordProcessor[] = [];

    constructor(
    readonly resource: IOTelResource,
    readonly forceFlushTimeoutMillis: number,
    readonly logRecordLimits: Required<IOTelLogRecordLimits>,
    readonly processors: IOTelLogRecordProcessor[]
    ) {
        if (processors.length > 0) {
            this.registeredLogRecordProcessors = processors;
            this.activeProcessor = new MultiLogRecordProcessor(
                this.registeredLogRecordProcessors,
                this.forceFlushTimeoutMillis
            );
        } else {
            this.activeProcessor = new NoopLogRecordProcessor();
        }
    }
}
