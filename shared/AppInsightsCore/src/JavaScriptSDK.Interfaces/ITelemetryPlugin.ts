// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITelemetryItem } from "./ITelemetryItem";
import { IConfiguration } from "./IConfiguration";
import { IAppInsightsCore } from "./IAppInsightsCore";
import { IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "./IProcessTelemetryContext";
import { ITelemetryPluginChain } from "./ITelemetryPluginChain";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";
import { ITelemetryUpdateState } from "./ITelemetryUpdateState";

export interface ITelemetryProcessor {
    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    processTelemetry: (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => void;
   
    /**
     * The the plugin should re-evaluate configuration and update any cached configuration settings or
     * plugins. If implemented this method will be called whenever a plugin is added or removed and if
     * the configuration has bee updated.
     * @param updateCtx - This is the context that should be used during updating.
     * @param updateState - The details / state of the update process, it holds details like the current and previous configuration.
     * @returns boolean - true if the plugin has or will call updateCtx.processNext(), this allows the plugin to perform any asynchronous operations.
     */
    update?: (updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) => void | boolean;
}

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPlugin extends ITelemetryProcessor, IPlugin {
    /**
     * Set next extension for telemetry processing, this is not optional as plugins should use the
     * processNext() function of the passed IProcessTelemetryContext instead. It is being kept for
     * now for backward compatibility only.
     */
    setNextPlugin?: (next: ITelemetryPlugin | ITelemetryPluginChain) => void;
    
    /**
     * Priority of the extension
     */
    readonly priority: number;
}

export interface IPlugin {
    /**
     * Initialize plugin loaded by SDK
     * @param config - The config for the plugin to use
     * @param core - The current App Insights core to use for initializing this plugin instance
     * @param extensions - The complete set of extensions to be used for initializing the plugin
     * @param pluginChain - [Optional] specifies the current plugin chain which identifies the
     * set of plugins and the order they should be executed for the current request.
     */
    initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain) => void;
    
    /**
     * Returns a value that indicates whether the plugin has already been previously initialized.
     * New plugins should implement this method to avoid being initialized more than once.
     */
    isInitialized?: () => boolean;

    /**
     * Tear down the plugin and remove any hooked value, the plugin should be removed so that it is no longer initialized and
     * therefore could be re-initialized after being torn down. The plugin should ensure that once this has been called any further
     * processTelemetry calls are ignored and it just calls the processNext() with the provided context.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @returns boolean - true if the plugin has or will call processNext(), this for backward compatibility as previously teardown was synchronous and returned nothing.
     */
    teardown?: (unloadCtx: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => void | boolean;

    /**
     * Extension name
     */
    readonly identifier: string;

    /**
     * Plugin version (available in data.properties.version in common schema)
     */
    readonly version?: string;
}
