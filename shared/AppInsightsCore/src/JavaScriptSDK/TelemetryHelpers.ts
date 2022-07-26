// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IDistributedTraceContext } from "../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { IProcessTelemetryContext, IProcessTelemetryUnloadContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { ITraceParent } from "../JavaScriptSDK.Interfaces/ITraceParent";
import { IUnloadableComponent } from "../JavaScriptSDK.Interfaces/IUnloadableComponent";
import { createElmNodeData } from "./DataCacheHelper";
import { arrForEach, isFunction } from "./HelperFuncs";
import { STR_CORE, STR_PRIORITY, STR_PROCESS_TELEMETRY } from "./InternalConstants";
import { isValidSpanId, isValidTraceId } from "./W3cTraceParent";

export interface IPluginState {
    core?: IAppInsightsCore;
    isInitialized?: boolean;
    teardown?: boolean;
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
                    isFunction(lastPlugin.setNextPlugin) &&
                    isFunction(thePlugin.processTelemetry)) {
                // Set this plugin as the next for the previous one
                lastPlugin.setNextPlugin(thePlugin);
            }

            let isInitialized = false;
            if (isFunction(thePlugin.isInitialized)) {
                isInitialized = thePlugin.isInitialized();
            } else {
                pluginState = _getPluginState(thePlugin);
                isInitialized = pluginState.isInitialized;
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
        let core = processContext[STR_CORE]();

        thePlugin.initialize(
            processContext.getCfg(),
            core,
            extensions,
            processContext.getNext());

        pluginState = _getPluginState(thePlugin);

        // Only add the core to the state if the plugin didn't set it (doesn't extent from BaseTelemetryPlugin)
        if (!thePlugin[STR_CORE] && !pluginState[STR_CORE]) {
            pluginState[STR_CORE] = core;
        }

        pluginState.isInitialized = true;
        delete pluginState.teardown;
    });
}

export function sortPlugins<T = IPlugin>(plugins:T[]) {
    // Sort by priority
    return plugins.sort((extA, extB) => {
        let result = 0;
        if (extB) {
            let bHasProcess = isFunction(extB[STR_PROCESS_TELEMETRY]);
            if (isFunction(extA[STR_PROCESS_TELEMETRY])) {
                result = bHasProcess ? extA[STR_PRIORITY] - extB[STR_PRIORITY] : 1;
            } else if (bHasProcess) {
                result = -1;
            }
        } else {
            result = extA ? 1 : -1;
        }

        return result;
    });
    // sort complete
}

/**
 * Teardown / Unload helper to perform teardown/unloading operations for the provided components synchronously or asynchronously, this will call any
 * _doTeardown() or _doUnload() functions on the provided components to allow them to finish removal.
 * @param components - The components you want to unload
 * @param unloadCtx - This is the context that should be used during unloading.
 * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
 * @param asyncCallback - An optional callback that the plugin must call if it returns true to inform the caller that it has completed any async unload/teardown operations.
 * @returns boolean - true if the plugin has or will call asyncCallback, this allows the plugin to perform any asynchronous operations.
 */
export function unloadComponents(components: any | IUnloadableComponent[], unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void): void | boolean {
    let idx = 0;

    function _doUnload(): void | boolean {
        while (idx < components.length) {
            let component = components[idx++];
            if (component) {
                let func = component._doUnload || component._doTeardown;
                if (isFunction(func)) {
                    if (func.call(component, unloadCtx, unloadState, _doUnload) === true) {
                        return true;
                    }
                }
            }
        }
    }

    return _doUnload();
}


/**
 * Creates a IDistributedTraceContext which optionally also "sets" the value on a parent
 * @param parentCtx - An optional parent distributed trace instance
 * @returns A new IDistributedTraceContext instance that uses an internal temporary object
 */
export function createDistributedTraceContext(parentCtx?: IDistributedTraceContext): IDistributedTraceContext {
    let trace: ITraceParent = {} as ITraceParent;

    return {
        getName: (): string => {
            return (trace as any).name;
        },
        setName: (newValue: string): void => {
            parentCtx && parentCtx.setName(newValue);
            (trace as any).name = newValue;
        },
        getTraceId: (): string => {
            return trace.traceId;
        },
        setTraceId: (newValue: string): void => {
            parentCtx && parentCtx.setTraceId(newValue);
            if (isValidTraceId(newValue)) {
                trace.traceId = newValue
            }
        },
        getSpanId: (): string => {
            return trace.spanId;
        },
        setSpanId: (newValue: string): void => {
            parentCtx && parentCtx.setSpanId(newValue);
            if (isValidSpanId(newValue)) {
                trace.spanId = newValue
            }
        },
        getTraceFlags: (): number => {
            return trace.traceFlags;
        },
        setTraceFlags: (newTraceFlags?: number): void => {
            parentCtx && parentCtx.setTraceFlags(newTraceFlags);
            trace.traceFlags = newTraceFlags
        }
    };
}
