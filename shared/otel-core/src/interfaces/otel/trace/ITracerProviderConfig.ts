// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITraceHost } from "../../ai/ITraceProvider";
import { IOTelErrorHandlers } from "../config/IOTelErrorHandlers";

/**
 * Configuration interface for creating a TracerProvider.
 *
 * @remarks
 * The TracerProvider manages Tracer instances and delegates span creation
 * to the configured trace host.
 *
 * @since 4.0.0
 */
export interface ITracerProviderConfig {
    /**
     * The trace host that provides span creation and context management.
     *
     * @see {@link ITraceHost}
     */
    host: ITraceHost;

    /**
     * Error handlers for internal diagnostics.
     *
     * @see {@link IOTelErrorHandlers}
     */
    errorHandlers?: IOTelErrorHandlers;
}
