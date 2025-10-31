// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelAttributes } from "../IOTelAttributes";

export interface IOTelLoggerOptions {
    /**
     * The schemaUrl of the tracer or instrumentation library
     */
    schemaUrl?: string;

    /**
     * The instrumentation scope attributes to associate with emitted telemetry
     */
    scopeAttributes?: IOTelAttributes;

    /**
     * Specifies whether the Trace Context should automatically be passed on to the LogRecords emitted by the Logger.
     */
    includeTraceContext?: boolean;
}
