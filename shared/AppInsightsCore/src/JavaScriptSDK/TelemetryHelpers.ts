// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IPlugin, ITelemetryPlugin } from '../JavaScriptSDK.Interfaces/ITelemetryPlugin';
import { CoreUtils } from "./CoreUtils";
import { _InternalLogMessage } from "./DiagnosticLogger";
import { _InternalMessageId } from '../JavaScriptSDK.Enums/LoggingEnums';
import { ProcessTelemetryContext } from './ProcessTelemetryContext';
import { ITelemetryPluginChain } from '../JavaScriptSDK.Interfaces/ITelemetryPluginChain';

let _isFunction = CoreUtils.isFunction;
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
export function initializePlugins(processContext:ProcessTelemetryContext, extensions: IPlugin[]) {

    // Set the next plugin and identified the uninitialized plugins
    let initPlugins:ITelemetryPlugin[] = [];
    let lastPlugin:ITelemetryPlugin = null;
    let proxy:ITelemetryPluginChain = processContext.getNext();
    while (proxy) {
        let thePlugin = proxy.getPlugin();
        if (thePlugin) {
            if (lastPlugin &&
                    _isFunction(lastPlugin[setNextPlugin]) &&
                    _isFunction(thePlugin[processTelemetry])) {
                // Set this plugin as the next for the previous one
                lastPlugin[setNextPlugin](thePlugin);
            }

            if (!_isFunction(thePlugin[isInitialized]) || !thePlugin[isInitialized]()) {
                initPlugins.push(thePlugin);
            }

            lastPlugin = thePlugin;
            proxy = proxy.getNext();
        }
    }

    // Now initiatilize the plugins
    CoreUtils.arrForEach(initPlugins, thePlugin => {
        thePlugin.initialize(
            processContext.getCfg(), 
            processContext.core(), 
            extensions, 
            processContext.getNext());
    });
}

export function sortPlugins(plugins:IPlugin[]) {
    // Sort by priority
    return plugins.sort((extA, extB) => {
        let result = 0;
        let bHasProcess = _isFunction(extB[processTelemetry]);
        if (_isFunction(extA[processTelemetry])) {
            result = bHasProcess ? extA[priority] - extB[priority] : 1;
        } else if (bHasProcess) {
            result = -1;
        }

        return result;
    });
    // sort complete    
}