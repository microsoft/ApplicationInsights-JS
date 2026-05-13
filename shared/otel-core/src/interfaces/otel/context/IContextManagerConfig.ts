// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContext } from "./IOTelContext";

/**
 * Configuration interface for creating a context manager.
 *
 * @remarks
 * Error handlers are inherited from the SDK/core config (IOTelConfig/IOTelWebSdkConfig)
 * to avoid duplicating them in each component config.
 *
 * @since 4.0.0
 */
export interface IContextManagerConfig {
    /**
     * The parent / root context to use if there is no active context.
     */
    parentContext?: IOTelContext;
}
