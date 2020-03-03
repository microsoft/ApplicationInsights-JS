// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITelemetryItem } from "./ITelemetryItem";
import { IConfiguration } from "./IConfiguration";
import { IAppInsightsCore } from "./IAppInsightsCore";
import { IProcessTelemetryContext } from './IProcessTelemetryContext';
import { ITelemetryPluginChain } from './ITelemetryPluginChain';

/**
 * Configuration provided to SDK core
 */
export interface ITelemetryPlugin extends IPlugin {
    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances 
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    processTelemetry: (env: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => void;
    
    /**
     * Set next extension for telemetry processing, this is not optional as plugins should use the 
     * processNext() function of the passed IProcessTelemetryContext instead. It is being kept for 
     * now for backward compatibility only.
     */
    setNextPlugin?: (next: ITelemetryPlugin | ITelemetryPluginChain) => void;
    
    /**
     * Priority of the extension
     */
    priority: number;
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
    initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => void;
    
    /**
     * Returns a value that indicates whether the plugin has already been previously initialized.
     * New plugins should implement this method to avoid being initialized more than once.
     */
    isInitialized?: () => boolean;

    /**
     * Tear down the plugin and remove any hooked value, the plugin should remove that it is no longer initialized and
     * therefore can be re-initialized after being torn down.
     */
    teardown?: () => void;

    /**
     * Extension name
     */
    identifier: string;

    /**
     * Plugin version (available in data.properties.version in common schema)
     */
    version?: string;
}
