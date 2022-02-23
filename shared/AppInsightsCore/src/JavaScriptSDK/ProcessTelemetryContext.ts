// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { GetExtCfgMergeType, IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { safeGetLogger } from "./DiagnosticLogger";
import { arrForEach, isArray, isFunction, isNullOrUndefined, isObject, objExtend, objForEachKey, objFreeze, objKeys, proxyFunctions } from "./HelperFuncs";
import { doPerf } from "./PerfManager";
import { LoggingSeverity, _InternalMessageId } from "../JavaScriptSDK.Enums/LoggingEnums";
import { dumpObj } from "./EnvUtils";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";

const strTelemetryPluginChain = "TelemetryPluginChain";
const strHasRunFlags = "_hasRun";
const strGetTelCtx = "_getTelCtx";

let _chainId = 0;

interface IInternalTelemetryPluginChain extends ITelemetryPluginChain {
    _id: string;
    _setNext: (nextPlugin: IInternalTelemetryPluginChain) => void;
}

function _getNextProxyStart(proxy: ITelemetryPluginChain, config: IConfiguration, core:IAppInsightsCore, startAt: IPlugin): ITelemetryPluginChain {
    while (proxy) {
        if (proxy.getPlugin() === startAt) {
            return proxy;
        }

        proxy = proxy.getNext();
    }

    // This wasn't found in the existing chain so create an isolated one with just this plugin
    return createTelemetryProxyChain([startAt], config, core);
}

/**
 * Creates a new Telemetry Item context with the current config, core and plugin execution chain
 * @param plugins - The plugin instances that will be executed
 * @param config - The current config
 * @param core - The current core instance
 */
export function createProcessTelemetryContext(telemetryChain: ITelemetryPluginChain, config: IConfiguration, core:IAppInsightsCore, startAt?: IPlugin): IProcessTelemetryContext {
    let _nextProxy: ITelemetryPluginChain = null; // Null == No next plugin
    let _onComplete: () => void = null;

    // There is no next element (null === last element) vs not defined (undefined)
    // We have a proxy chain object
    if (startAt) {
        // We have a special case where we want to start execution from this specific plugin
        _nextProxy = _getNextProxyStart(telemetryChain, config, core, startAt);
    } else {
        // Reuse the existing telemetry plugin chain (normal execution case)
        _nextProxy = telemetryChain;
    }

    let context: IProcessTelemetryContext = {
        core: () => {
            return core;
        },
        diagLog: () => {
            return safeGetLogger(core, config);
        },
        getCfg: () => {
            return config;
        },
        getExtCfg: _getExtCfg,
        getConfig: _getConfig,
        hasNext: () => {
            return _nextProxy != null;
        },
        getNext: () => {
            return _nextProxy;
        },
        setNext: (nextPlugin:ITelemetryPluginChain) => {
            _nextProxy = nextPlugin;
        },
        processNext: (env: ITelemetryItem) => {
            _processChain((nextPlugin) => {
                // Run the next plugin which will call "processNext()"
                nextPlugin.processTelemetry(env, context);
            });
        },
        iterate: _iterateChain,
        createNew: (plugins: IPlugin[] | ITelemetryPluginChain = null, startAt?: IPlugin) => {
            if (isArray(plugins)) {
                plugins = createTelemetryProxyChain(plugins, config, core, startAt);
            }

            return createProcessTelemetryContext(plugins || _nextProxy, config, core, startAt);
        },
        onComplete: (onComplete: () => void) => {
            _onComplete = onComplete;
        }
    };

    function _getExtCfg<T>(identifier: string, defaultValue: T|any = {}, mergeDefault: GetExtCfgMergeType = GetExtCfgMergeType.None) {
        let theConfig: T;
        if (config) {
            let extConfig = config.extensionConfig;
            if (extConfig && identifier) {
                theConfig = extConfig[identifier];
            }
        }

        if (!theConfig) {
            // Just use the defaults
            theConfig = defaultValue as T;
        } else if (isObject(defaultValue)) {
            if (mergeDefault !== GetExtCfgMergeType.None) {
                // Merge the defaults and configured values
                let newConfig = objExtend(true, defaultValue, theConfig);

                if (config && mergeDefault === GetExtCfgMergeType.MergeDefaultFromRootOrDefault) {
                    // Enumerate over the defaultValues and if not already populate attempt to
                    // find a value from the root config
                    objForEachKey(defaultValue, (field) => {
                        // for each unspecified field, set the default value
                        if (isNullOrUndefined(newConfig[field])) {
                            let cfgValue = config[field];
                            if (!isNullOrUndefined(cfgValue)) {
                                newConfig[field] = cfgValue;
                            }
                        }
                    });
                }
            }
        }

        return theConfig;
    }

    function _getConfig(identifier:string, field: string, defaultValue: number | string | boolean | string[] | RegExp[] | Function = false) {
        let theValue;
        let extConfig = _getExtCfg(identifier, null);
        if (extConfig && !isNullOrUndefined(extConfig[field])) {
            theValue = extConfig[field];
        } else if (config && !isNullOrUndefined(config[field])) {
            theValue = config[field];
        }

        return !isNullOrUndefined(theValue) ? theValue : defaultValue;
    }

    function _processChain(cb: (nextPlugin: ITelemetryPluginChain) => void) {
        let nextPlugin = _nextProxy;

        if (nextPlugin) {
            // Automatically move to the next plugin
            _nextProxy = nextPlugin.getNext();
            cb(nextPlugin);
        } else {
            if (_onComplete) {
                _onComplete();
                _onComplete = null;
            }
        }
    }

    function _iterateChain<T extends ITelemetryPlugin = ITelemetryPlugin>(cb: (plugin: T) => void) {
        while(_nextProxy) {
            _processChain((nextPlugin: ITelemetryPluginChain) => {
                let plugin = nextPlugin.getPlugin();
                if (plugin) {
                    // callback with the current on
                    cb(plugin as T);
                }
            });
        }
    }

    return context;
}

/**
 * Creates an execution chain from the array of plugins
 * @param plugins - The array of plugins that will be executed in this order
 * @param defItemCtx - The default execution context to use when no telemetry context is passed to processTelemetry(), this
 * should be for legacy plugins only. Currently, only used for passing the current core instance and to provide better error
 * reporting (hasRun) when errors occur.
 */
 export function createTelemetryProxyChain(plugins: IPlugin[], config: IConfiguration, core: IAppInsightsCore, startAt?: IPlugin): ITelemetryPluginChain {
    let firstProxy: ITelemetryPluginChain = null;
    let add = startAt ? false : true;

    if (isArray(plugins) && plugins.length > 0) {
        // Create the proxies and wire up the next plugin chain
        let lastProxy: IInternalTelemetryPluginChain = null;
        arrForEach(plugins, (thePlugin: ITelemetryPlugin) => {
            if (!add && startAt === thePlugin) {
                add = true;
            }

            if (add && thePlugin && isFunction(thePlugin.processTelemetry)) {
                // Only add plugins that are processors
                let newProxy = createTelemetryPluginProxy(thePlugin, config, core);
                if (!firstProxy) {
                    firstProxy = newProxy;
                }

                if (lastProxy) {
                    // Set this new proxy as the next for the previous one
                    lastProxy._setNext(newProxy as IInternalTelemetryPluginChain);
                }
                
                lastProxy = newProxy as IInternalTelemetryPluginChain;
            }
        });
    }

    if (startAt && !firstProxy) {
        // Special case where the "startAt" was not in the original list of plugins
        return createTelemetryProxyChain([startAt], config, core);
    }

    return firstProxy;
}

/**
 * Create the processing telemetry proxy instance, the proxy is used to abstract the current plugin to allow monitoring and
 * execution plugins while passing around the dynamic execution state (IProcessTelemetryContext), the proxy instance no longer
 * contains any execution state and can be reused between requests (this was not the case for 2.7.2 and earlier with the
 * TelemetryPluginChain class).
 * @param plugin - The plugin instance to proxy
 * @param config - The default execution context to use when no telemetry context is passed to processTelemetry(), this
 * should be for legacy plugins only. Currently, only used for passing the current core instance and to provide better error
 * reporting (hasRun) when errors occur.
 * @returns
 */
export function createTelemetryPluginProxy(plugin: ITelemetryPlugin, config: IConfiguration, core: IAppInsightsCore): ITelemetryPluginChain {
    let nextProxy: IInternalTelemetryPluginChain = null;
    let hasProcessTelemetry = isFunction(plugin.processTelemetry);
    let hasSetNext = isFunction(plugin.setNextPlugin);
    let chainId: string;
    if (plugin) {
        chainId = plugin.identifier + "-" + plugin.priority + "-" + _chainId++;
    } else {
        chainId = "Unknown-0-" + _chainId++;
    }
    let proxyChain: IInternalTelemetryPluginChain = {
        getPlugin: () => {
            return plugin;
        },
        getNext: () => {
            return nextProxy;
        },
        processTelemetry: _processTelemetry,
        _id: chainId,
        _setNext: (nextPlugin: IInternalTelemetryPluginChain) => {
            nextProxy = nextPlugin;
        }
    };

    function _processChain(
                itemCtx: IProcessTelemetryContext,
                processPluginFn: (itemCtx: IProcessTelemetryContext) => boolean,
                processProxyFn: (itemCtx: IProcessTelemetryContext) => void,
                name: string,
                details: () => any,
                isAsync: boolean) {

        // Make sure we have a context
        if (!itemCtx) {
            // Looks like a plugin didn't pass the (optional) context, so create a new one
            if (plugin && isFunction(plugin[strGetTelCtx])) {
                // This plugin extends from the BaseTelemetryPlugin so lets use it
                itemCtx = plugin[strGetTelCtx]();
            }

            if (!itemCtx) {
                // Create a temporary one
                itemCtx =  createProcessTelemetryContext(proxyChain, config, core);
            }
        }

        let identifier = plugin ? plugin.identifier : strTelemetryPluginChain;
        let hasRunContext = itemCtx[strHasRunFlags];
        if (!hasRunContext) {
            // Assign and populate
            hasRunContext = itemCtx[strHasRunFlags] = {};
        }

        doPerf(itemCtx.core(), () => identifier + ":" + name, () => {
            // Mark this component as having run
            hasRunContext[chainId] = true;
            let hasRun = false;

            // Ensure that we keep the context in sync
            itemCtx.setNext(nextProxy);

            if (plugin) {
                try {
                    // Set a flag on the next plugin so we know if it was attempted to be executed
                    let nextId = nextProxy ? nextProxy._id : "";
                    if (nextId) {
                        hasRunContext[nextId] = false;
                    }

                    hasRun = processPluginFn(itemCtx);
                } catch (error) {
                    let hasNextRun = nextProxy ? hasRunContext[nextProxy._id] : true;
                    if (hasNextRun) {
                        // The next plugin after us has already run so set this one as complete
                        hasRun = true;
                    }

                    if (!nextProxy || !hasNextRun) {

                        // Either we have no next plugin or the current one did not attempt to call the next plugin
                        // Which means the current one is the root of the failure so log/report this failure
                        itemCtx.diagLog().throwInternal(
                            LoggingSeverity.CRITICAL,
                            _InternalMessageId.PluginException,
                            "Plugin [" + plugin.identifier + "] failed during " + name + " - " + dumpObj(error) + ", run flags: " + dumpObj(hasRunContext));
                    }
                }
            }
            
            if (nextProxy && !hasRun) {
                // The underlying plugin is not defined, but we still want the next plugin to be executed.
                // So rather than leave the pipeline dead in the water we call the next plugin
                processProxyFn(itemCtx);
            }
        }, details, isAsync);
    }

    function _processTelemetry(env: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        _processChain(itemCtx, (itemCtx: IProcessTelemetryContext) => {
            if (!hasProcessTelemetry) {
                return false;
            }

            // Ensure that we keep the context in sync (for processNext()), just in case a plugin
            // doesn't calls processTelemetry() instead of itemContext.processNext() or some
            // other form of error occurred
            if (hasSetNext) {
                // Backward compatibility setting the next plugin on the instance
                plugin.setNextPlugin(nextProxy);
            }

            plugin.processTelemetry(env, itemCtx);

            return true;
        },
        (itemCtx: IProcessTelemetryContext) => {
            // The underlying plugin is either not defined or does not have a processTelemetry implementation
            // so we still want the next plugin to be executed.
            nextProxy.processTelemetry(env, itemCtx);
        },
        "processTelemetry", () => ({ item: env }), !((env as any).sync));
    }

    return objFreeze(proxyChain);
}

/**
 * This class will be removed!
 * @deprecated use createProcessTelemetryContext() instead
 */
export class ProcessTelemetryContext implements IProcessTelemetryContext {
    /**
     * Gets the current core config instance
     */
    public getCfg: () => IConfiguration;

    public getExtCfg: <T>(identifier:string, defaultValue?:T|any) => T;
                        
    public getConfig: (identifier:string, field: string, defaultValue?: number | string | boolean) => number | string | boolean;

    /**
     * Returns the IAppInsightsCore instance for the current request
     */
    public core: () => IAppInsightsCore;

    /**
     * Returns the current IDiagnosticsLogger for the current request
     */
    public diagLog: () => IDiagnosticLogger;

    /**
     * Helper to allow inherited classes to check and possibly shortcut executing code only
     * required if there is a nextPlugin
     */
    public hasNext: () => boolean;

    /**
     * Returns the next configured plugin proxy
     */
    public getNext: () => ITelemetryPluginChain;

    /**
     * Helper to set the next plugin proxy
     */
    public setNext: (nextCtx:ITelemetryPluginChain) => void;

    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    public processNext: (env: ITelemetryItem) => void;

    /**
     * Synchronously iterate over the context chain running the callback for each plugin, once
     * every plugin has been executed via the callback, any associated onComplete will be called.
     * @param callback - The function call for each plugin in the context chain
     */
    public iterate: <T extends ITelemetryPlugin = ITelemetryPlugin>(callback: (plugin: T) => void) => void;
 
    /**
    /**
     * Create a new context using the core and config from the current instance
     * @param plugins - The execution order to process the plugins, if null or not supplied
     *                  then the current execution order will be copied.
     * @param startAt - The plugin to start processing from, if missing from the execution
     *                  order then the next plugin will be NOT set.
     */
    public createNew: (plugins?:IPlugin[]|ITelemetryPluginChain, startAt?:IPlugin) => IProcessTelemetryContext;
 
    /**
     * Set the function to call when the current chain has executed all processNext or unloadNext items.
     */
    public onComplete: (onComplete: () => void) => void;
 
    /**
     * Creates a new Telemetry Item context with the current config, core and plugin execution chain
     * @param plugins - The plugin instances that will be executed
     * @param config - The current config
     * @param core - The current core instance
     */
    constructor(pluginChain: ITelemetryPluginChain, config: IConfiguration, core:IAppInsightsCore, startAt?:IPlugin) {
        let _self = this;

        let context = createProcessTelemetryContext(pluginChain, config, core, startAt);
        // Proxy all functions of the context to this object
        proxyFunctions(_self, context, objKeys(context) as any);
    }
}
