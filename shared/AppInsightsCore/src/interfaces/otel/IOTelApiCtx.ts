// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITraceHost } from "../ai/ITraceProvider";

/**
 * The context for the current IOTelApi instance linking it to the core SDK instance,
 * including access to the core dynamic configuration.
 *
 * Note: Passing the core instance within a context object to allow future expansion
 * without breaking changes or modifying signatures. Also allows easier mocking for tests.
 */
export interface IOTelApiCtx {
    /**
     * The host instance associated with this OTel API instance
     */
    host: ITraceHost;
}
