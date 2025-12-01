// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createNoopLogRecordProcessor } from "../api/noop/noopLogRecordProcessor";
import { IOTelLogRecordLimits } from "../interfaces/logs/IOTelLogRecordLimits";
import { IOTelLogRecordProcessor } from "../interfaces/logs/IOTelLogRecordProcessor";
import { IOTelLogger } from "../interfaces/logs/IOTelLogger";
import { IOTelResource } from "../interfaces/resources/IOTelResource";
import { createMultiLogRecordProcessor } from "../sdk/IOTelMultiLogRecordProcessor";

export interface IOTelLoggerProviderSharedState {
    readonly loggers: Map<string, IOTelLogger>;
    activeProcessor: IOTelLogRecordProcessor;
    readonly registeredLogRecordProcessors: IOTelLogRecordProcessor[];
    readonly resource: IOTelResource;
    readonly forceFlushTimeoutMillis: number;
    readonly logRecordLimits: Required<IOTelLogRecordLimits>;
}

export function createLoggerProviderSharedState(
    resource: IOTelResource,
    forceFlushTimeoutMillis: number,
    logRecordLimitsConfig: Required<IOTelLogRecordLimits>,
    processors: IOTelLogRecordProcessor[]
): IOTelLoggerProviderSharedState {
    const loggers = new Map<string, IOTelLogger>();
    const registeredLogRecordProcessors: IOTelLogRecordProcessor[] = processors;
    const hasProcessors = registeredLogRecordProcessors.length > 0;
    const activeProcessor = hasProcessors
        ? createMultiLogRecordProcessor(registeredLogRecordProcessors, forceFlushTimeoutMillis)
        : createNoopLogRecordProcessor();

    return {
        loggers,
        activeProcessor,
        registeredLogRecordProcessors,
        resource,
        forceFlushTimeoutMillis,
        logRecordLimits: logRecordLimitsConfig
    };
}
