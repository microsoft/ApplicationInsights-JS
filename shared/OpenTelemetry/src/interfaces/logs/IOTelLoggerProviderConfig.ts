// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelResource } from "../resources/IOTelResource";
import { IOTelLogRecordLimits } from "./IOTelLogRecordLimits";
import { IOTelLogRecordProcessor } from "./IOTelLogRecordProcessor";

export interface IOTelLoggerProviderConfig {
    /** Resource associated with trace telemetry  */
    resource?: IOTelResource;

    /**
     * How long the forceFlush can run before it is cancelled.
     * The default value is 30000ms
     */
    forceFlushTimeoutMillis?: number;

    /** Log Record Limits*/
    logRecordLimits?: IOTelLogRecordLimits;

    /** Log Record Processors */
    processors?: IOTelLogRecordProcessor[];
}
