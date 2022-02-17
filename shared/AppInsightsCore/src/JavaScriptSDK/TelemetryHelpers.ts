// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { arrForEach, isFunction } from "./HelperFuncs";

let processTelemetry = "processTelemetry";
let priority = "priority";
let setNextPlugin = "setNextPlugin";
let isInitialized = "isInitialized";

/**
 * Initialize the queue of plugins
 * @param plugins - The array of plugins to initialize and setting of the next plugin
 * @param config The current config for the instance
 * @param core THe current core instance
 * @param extensions The extensions
 */
export function initializePlugins(processContext: IProcessTelemetryContext, extensions: IPlugin[]) {

    // Set the next plugin and identified the uninitialized plugins
    let initPlugins:ITelemetryPlugin[] = [];
    let lastPlugin:ITelemetryPlugin = null;
    let proxy:ITelemetryPluginChain = processContext.getNext();
    while (proxy) {
        let thePlugin = proxy.getPlugin();
        if (thePlugin) {
            if (lastPlugin &&
                    isFunction(lastPlugin[setNextPlugin]) &&
                    isFunction(thePlugin[processTelemetry])) {
                // Set this plugin as the next for the previous one
                lastPlugin[setNextPlugin](thePlugin);
            }

            if (!isFunction(thePlugin[isInitialized]) || !thePlugin[isInitialized]()) {
                initPlugins.push(thePlugin);
            }

            lastPlugin = thePlugin;
            proxy = proxy.getNext();
        }
    }

    // Now initialize the plugins
    arrForEach(initPlugins, thePlugin => {
        thePlugin.initialize(
            processContext.getCfg(),
            processContext.core(),
            extensions,
            processContext.getNext());
    });
}

export function sortPlugins<T = IPlugin>(plugins:T[]) {
    // Sort by priority
    return plugins.sort((extA, extB) => {
        let result = 0;
        let bHasProcess = isFunction(extB[processTelemetry]);
        if (isFunction(extA[processTelemetry])) {
            result = bHasProcess ? extA[priority] - extB[priority] : 1;
        } else if (bHasProcess) {
            result = -1;
        }

        return result;
    });
    // sort complete
}