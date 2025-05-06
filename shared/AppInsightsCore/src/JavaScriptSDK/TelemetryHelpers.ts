// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, isFunction, objDefineProps } from "@nevware21/ts-utils";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IDistributedTraceContext } from "../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { IProcessTelemetryContext, IProcessTelemetryUnloadContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { IUnloadableComponent } from "../JavaScriptSDK.Interfaces/IUnloadableComponent";
import { IW3cTraceState } from "../JavaScriptSDK.Interfaces/IW3cTraceState";
import { IOTelSpanContext } from "../applicationinsights-core-js";
import { generateW3CId } from "./CoreUtils";
import { createElmNodeData } from "./DataCacheHelper";
import { getLocation } from "./EnvUtils";
import { STR_CORE, STR_EMPTY, STR_PRIORITY, STR_PROCESS_TELEMETRY, UNDEFINED_VALUE } from "./InternalConstants";
import { isValidSpanId, isValidTraceId } from "./W3cTraceParent";
import { createW3cTraceState } from "./W3cTraceState";

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
 * @param config - The current config for the instance
 * @param core - THe current core instance
 * @param extensions - The extensions
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
            if (lastPlugin && lastPlugin.setNextPlugin && thePlugin.processTelemetry) {
                // Set this plugin as the next for the previous one
                lastPlugin.setNextPlugin(thePlugin);
            }

            pluginState = _getPluginState(thePlugin);

            let isInitialized = !!pluginState.isInitialized;
            if (thePlugin.isInitialized) {
                isInitialized = thePlugin.isInitialized();
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

        // Only add the core to the state if the plugin didn't set it (doesn't extend from BaseTelemetryPlugin)
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
            let bHasProcess = extB[STR_PROCESS_TELEMETRY];
            if (extA[STR_PROCESS_TELEMETRY]) {
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

function isDistributedTraceContext(obj: any): obj is IDistributedTraceContext {
    return obj &&
        isFunction(obj.getName) &&
        isFunction(obj.getTraceId) &&
        isFunction(obj.getSpanId) &&
        isFunction(obj.getTraceFlags) &&
        isFunction(obj.setName) &&
        isFunction(obj.setTraceId) &&
        isFunction(obj.setSpanId) &&
        isFunction(obj.setTraceFlags);
}

/**
 * Creates a IDistributedTraceContext which optionally also "sets" the value on a parent
 * @param parent - An optional parent {@link IDistributedTraceContext} or {@link IOTelSpanContext} to use as
 * the parent context, the traceId and spanId will be set to the parent context values if they are valid.
 * The {@link IDistributedTraceContext.parent} will only be set if the parent is a {@link IDistributedTraceContext},
 * if the parent is a {@link IOTelSpanContext} then the parent will be set to null.
 * @returns A new IDistributedTraceContext instance that uses an internal temporary object
 */
export function createDistributedTraceContext(parent?: IDistributedTraceContext | IOTelSpanContext): IDistributedTraceContext {
    let parentCtx: IDistributedTraceContext = null;
    let spanContext: IOTelSpanContext = null;
    let traceId = (parent && isValidTraceId(parent.traceId)) ? parent.traceId : generateW3CId();
    let spanId = (parent && isValidSpanId(parent.spanId)) ? parent.spanId : STR_EMPTY;
    let traceFlags = parent ? parent.traceFlags : UNDEFINED_VALUE
    let isRemote = parent ? parent.isRemote : false;
    let pageName = STR_EMPTY;
    let traceState: IW3cTraceState = null;

    if (parent) {
        if (isDistributedTraceContext(parent)) {
            parentCtx = parent;
            pageName = parentCtx.getName();
        } else {
            spanContext = parent;
        }
    }

    if (!pageName) {
        pageName = "_unknown_";
        // If we have a location, use that as the page name
        let location = getLocation();
        if (location && location.pathname) {
            pageName = location.pathname + (location.hash || "");
        }
    }

    function _getName(): string {
        return pageName;
    }

    function _setPageNameFn(updateParent: boolean) {
        return function (newValue: string): void {
            if (updateParent) {
                parentCtx && parentCtx.setName(newValue);
            }

            pageName = newValue;
        };
    }

    function _getTraceId(): string {
        return traceId;
    }

    function _setTraceIdFn(updateParent: boolean) {
        return function (newValue: string): void {
            if (updateParent) {
                parentCtx && parentCtx.setTraceId(newValue);
            }

            if (isValidTraceId(newValue)) {
                traceId = newValue
            }
        };
    }

    function _getSpanId(): string {
        return spanId;
    }

    function _setSpanIdFn(updateParent: boolean) {
        return function (newValue: string): void {
            if (updateParent) {
                parentCtx && parentCtx.setSpanId(newValue);
            }

            if (isValidSpanId(newValue)) {
                spanId = newValue
            }
        };
    }

    function _getTraceFlags(): number {
        return traceFlags;
    }

    function _setTraceFlagsFn(updateParent: boolean) {
        return function (newTraceFlags?: number): void {
            if (updateParent) {
                parentCtx && parentCtx.setTraceFlags(newTraceFlags);
            }

            traceFlags = newTraceFlags;
        };
    }

    function _getTraceState(): IW3cTraceState {
        if (!traceState) {
            if (spanContext && spanContext.traceState) {
                traceState = createW3cTraceState(spanContext.traceState.serialize() || STR_EMPTY, parentCtx ? parentCtx.traceState : undefined);
            } else {
                traceState = createW3cTraceState(STR_EMPTY, parentCtx ? parentCtx.traceState : undefined);
            }
        }

        return traceState;
    }

    let traceCtx: IDistributedTraceContext = {
        getName: _getName,
        setName: _setPageNameFn(true),
        getTraceId: _getTraceId,
        setTraceId: _setTraceIdFn(true),
        getSpanId: _getSpanId,
        setSpanId: _setSpanIdFn(true),
        getTraceFlags: _getTraceFlags,
        setTraceFlags: _setTraceFlagsFn(true),
        traceId,
        spanId,
        traceFlags,
        traceState,
        isRemote,
        pageName
    };

    return objDefineProps<IDistributedTraceContext>(traceCtx, {
        pageName: {
            g: _getName,
            s: _setPageNameFn(false)
        },
        traceId: {
            g: _getTraceId,
            s: _setTraceIdFn(false)
        },
        spanId: {
            g: _getSpanId,
            s: _setSpanIdFn(false)
        },
        traceFlags: {
            g: _getTraceFlags,
            s: _setTraceFlagsFn(false)
        },
        isRemote: {
            v: isRemote,
            w: false

        },
        traceState: {
            g: _getTraceState
        },
        parentCtx: {
            g: () => parentCtx
        }
    });
}
