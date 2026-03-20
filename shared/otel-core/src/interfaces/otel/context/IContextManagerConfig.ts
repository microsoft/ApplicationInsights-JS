// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelErrorHandlers } from "../config/IOTelErrorHandlers";
import { IOTelContext } from "./IOTelContext";

/**
 * Configuration interface for creating a context manager.
 *
 * @since 4.0.0
 */
export interface IContextManagerConfig {
    /**
     * The parent / root context to use if there is no active context.
     */
    parentContext?: IOTelContext;

    /**
     * Error handlers for internal diagnostics.
     *
     * @see {@link IOTelErrorHandlers}
     */
    errorHandlers?: IOTelErrorHandlers;
}
