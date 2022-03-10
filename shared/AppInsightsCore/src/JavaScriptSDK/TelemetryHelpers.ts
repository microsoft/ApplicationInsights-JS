// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { arrForEach, isFunction } from "./HelperFuncs";
import { strCore, strIsInitialized, strPriority, strProcessTelemetry, strSetNextPlugin, strTeardown } from "./InternalConstants";
import { createElmNodeData } from "./DataCacheHelper";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";

export interface IPluginState {
    core?: IAppInsightsCore;
    isInitialized?: boolean;
    tearDown?: boolean;
    disabled?: boolean;
}

const pluginStateData = createElmNodeData("plugin");

export function _getPluginState(plugin: IPlugin): IPluginState {
    return pluginStateData.get<IPluginState>(plugin, "state", {}, true)
}

/**
 * Initialize the queue of plugins
 * @param plugins - The array of plugins to initialize and setting of the next plugin
 * @param config The current config for the instance
 * @param core THe current core instance
 * @param extensions The extensions
 */
export function initializePlugins(processContext: IProcessTelemetryContext, extensions: IPlugin[]) {

    // Set the next plugin and identified the uninitialized plugins
    let initPlugins: ITelemetryPlugin[] = [];
    let lastPlugin: ITelemetryPlugin = null;
    let proxy: ITelemetryPluginChain = processContext.getNext();
    let pluginState: IPluginState;
    while (proxy) {
        let thePlugin = proxy.getPlugin();
        if (thePlugin) {
            if (lastPlugin &&
                    isFunction(lastPlugin[strSetNextPlugin]) &&
                    isFunction(thePlugin[strProcessTelemetry])) {
                // Set this plugin as the next for the previous one
                lastPlugin[strSetNextPlugin](thePlugin);
            }

            let isInitialized = false;
            if (isFunction(thePlugin[strIsInitialized])) {
                isInitialized = thePlugin[strIsInitialized]();
            } else {
                pluginState = _getPluginState(thePlugin);
                isInitialized = pluginState[strIsInitialized];
            }

            if (!isInitialized) {
                initPlugins.push(thePlugin);
            }

            lastPlugin = thePlugin;
            proxy = proxy.getNext();
        }
    }

    // Now initialize the plugins
    arrForEach(initPlugins, thePlugin => {
        let core = processContext.core();

        thePlugin.initialize(
            processContext.getCfg(),
            core,
            extensions,
            processContext.getNext());

        pluginState = _getPluginState(thePlugin);

        // Only add the core to the state if the plugin didn't set it (doesn't extent from BaseTelemetryPlugin)
        if (!thePlugin[strCore] && !pluginState[strCore]) {
            pluginState[strCore] = core;
        }

        pluginState[strIsInitialized] = true;
        delete pluginState[strTeardown];
    });
}

export function sortPlugins<T = IPlugin>(plugins:T[]) {
    // Sort by priority
    return plugins.sort((extA, extB) => {
        let result = 0;
        let bHasProcess = isFunction(extB[strProcessTelemetry]);
        if (isFunction(extA[strProcessTelemetry])) {
            result = bHasProcess ? extA[strPriority] - extB[strPriority] : 1;
        } else if (bHasProcess) {
            result = -1;
        }

        return result;
    });
    // sort complete
}