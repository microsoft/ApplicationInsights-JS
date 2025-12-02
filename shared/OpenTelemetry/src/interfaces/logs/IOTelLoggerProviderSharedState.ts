// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelResource } from "../resources/IOTelResource";
import { IOTelLogRecordLimits } from "./IOTelLogRecordLimits";
import { IOTelLogRecordProcessor } from "./IOTelLogRecordProcessor";
import { IOTelLogger } from "./IOTelLogger";

export interface IOTelLoggerProviderSharedState {
    /**
     * Cache of loggers keyed by instrumentation scope identity.
     */
    readonly loggers: Map<string, IOTelLogger>;
    /**
     * Active processor responsible for handling emitted log records.
     */
    activeProcessor: IOTelLogRecordProcessor;
    /**
     * All processors registered with the provider for fan-out processing.
     */
    readonly registeredLogRecordProcessors: IOTelLogRecordProcessor[];
    /**
     * Resource describing the entity producing telemetry.
     */
    readonly resource: IOTelResource;
    /**
     * Timeout applied when forcing processors to flush.
     */
    readonly forceFlushTimeoutMillis: number;
    /**
     * Limits applied to log records created by the provider.
     */
    readonly logRecordLimits: Required<IOTelLogRecordLimits>;
}
