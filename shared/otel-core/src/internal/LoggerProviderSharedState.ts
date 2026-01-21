// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecordLimits } from "../interfaces/logs/IOTelLogRecordLimits";
import { IOTelLogRecordProcessor } from "../interfaces/logs/IOTelLogRecordProcessor";
import { IOTelLogger } from "../interfaces/logs/IOTelLogger";
import { IOTelLoggerProviderSharedState } from "../interfaces/logs/IOTelLoggerProviderSharedState";
import { IOTelResource } from "../interfaces/resources/IOTelResource";
import { createMultiLogRecordProcessor } from "../sdk/OTelMultiLogRecordProcessor";

export function createLoggerProviderSharedState(
    resource: IOTelResource,
    forceFlushTimeoutMillis: number,
    logRecordLimitsConfig: Required<IOTelLogRecordLimits>,
    processors: IOTelLogRecordProcessor[]
): IOTelLoggerProviderSharedState {
    const loggers = new Map<string, IOTelLogger>();
    const registeredLogRecordProcessors: IOTelLogRecordProcessor[] = processors || [];
    const hasProcessors = registeredLogRecordProcessors.length > 0;
    
    if (!hasProcessors) {
        // This was previously creating a noop processor, but to reduce bundle size we are no longer doing that automatically.
        // So this forces the consumer to explicitly add a processor or use a noop processor if they want that behavior.
    }
    
    const activeProcessor = createMultiLogRecordProcessor(registeredLogRecordProcessors, forceFlushTimeoutMillis);

    return {
        loggers,
        activeProcessor,
        registeredLogRecordProcessors,
        resource,
        forceFlushTimeoutMillis,
        logRecordLimits: logRecordLimitsConfig
    };
}
