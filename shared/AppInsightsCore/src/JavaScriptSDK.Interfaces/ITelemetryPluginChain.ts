// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITelemetryItem } from "./ITelemetryItem";
import { IProcessTelemetryContext } from './IProcessTelemetryContext';
import { ITelemetryPlugin } from './ITelemetryPlugin';

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPluginChain {

    /**
     * Returns the underlying plugin that is being proxied for the processTelemetry call
     */
    getPlugin: () => ITelemetryPlugin;

    /**
     * Returns the next plugin
     */
    getNext: () => ITelemetryPluginChain;

    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances 
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    processTelemetry: (env: ITelemetryItem, itemCtx:IProcessTelemetryContext) => void;
}
