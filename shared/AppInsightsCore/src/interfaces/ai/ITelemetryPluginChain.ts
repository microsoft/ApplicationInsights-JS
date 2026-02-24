// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IProcessTelemetryUnloadContext } from "./IProcessTelemetryContext";
import { ITelemetryPlugin, ITelemetryProcessor } from "./ITelemetryPlugin";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPluginChain extends ITelemetryProcessor {

    /**
     * Returns the underlying plugin that is being proxied for the processTelemetry call
     */
    getPlugin: () => ITelemetryPlugin;

    /**
     * Returns the next plugin
     */
    getNext: () => ITelemetryPluginChain;

    /**
     * This plugin is being unloaded and should remove any hooked events and cleanup any global/scoped values, after this
     * call the plugin will be removed from the telemetry processing chain and will no longer receive any events..
     * @param unloadCtx - The unload context to use for this call.
     * @param unloadState - The details of the unload operation
     */
    unload?: (unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) => void;
}
