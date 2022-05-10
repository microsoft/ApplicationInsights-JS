// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { GetExtCfgMergeType, IBaseProcessingContext, IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { safeGetLogger, _throwInternal } from "./DiagnosticLogger";
import { arrForEach, isArray, isFunction, isNullOrUndefined, isObject, isUndefined, objExtend, objForEachKey, objFreeze, objKeys, proxyFunctions } from "./HelperFuncs";
import { doPerf } from "./PerfManager";
import { eLoggingSeverity, _eInternalMessageId } from "../JavaScriptSDK.Enums/LoggingEnums";
import { dumpObj } from "./EnvUtils";
import { strCore, strDisabled, strEmpty, strIsInitialized, strTeardown, strUpdate } from "./InternalConstants";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { ITelemetryUpdateState } from "../JavaScriptSDK.Interfaces/ITelemetryUpdateState";
import { _getPluginState } from "./TelemetryHelpers";

const strTelemetryPluginChain = "TelemetryPluginChain";
const strHasRunFlags = "_hasRun";
const strGetTelCtx = "_getTelCtx";

let _chainId = 0;

interface OnCompleteCallback {
    func: () => void;
    self: any;      // This for the function
    args: any[];    // Additional arguments for the function
}

interface IInternalTelemetryPluginChain extends ITelemetryPluginChain {
    _id: string;
    _setNext: (nextPlugin: IInternalTelemetryPluginChain) => void;
}

interface IInternalContext<T extends IBaseProcessingContext> {
    _next: () => ITelemetryPluginChain,

    // The public context that will be exposed
    ctx: T
}

function _getNextProxyStart<T, C = IConfiguration>(proxy: ITelemetryPluginChain, core: IAppInsightsCore, startAt: IPlugin): ITelemetryPluginChain {
    while (proxy) {
        if (proxy.getPlugin() === startAt) {
            return proxy;
        }

        proxy = proxy.getNext();
    }

    // This wasn't found in the existing chain so create an isolated one with just this plugin
    return createTelemetryProxyChain([startAt], core.config || {}, core);
}

/**
 * @ignore
 * @param telemetryChain
 * @param config
 * @param core
 * @param startAt - Identifies the next plugin to execute, if null there is no "next" plugin and if undefined it should assume the start of the chain
 * @returns
 */
function _createInternalContext<T extends IBaseProcessingContext>(telemetryChain: ITelemetryPluginChain, config: IConfiguration, core: IAppInsightsCore, startAt?: IPlugin): IInternalContext<T> {
    // We have a special case where we want to start execution from this specific plugin
    // or we simply reuse the existing telemetry plugin chain (normal execution case)
    let _nextProxy: ITelemetryPluginChain | null = null;  // By Default set as no next plugin
    let _onComplete: OnCompleteCallback[] = [];

    if (startAt !== null) {
        // There is no next element (null) vs not defined (undefined) so use the full chain
        _nextProxy = startAt ? _getNextProxyStart(telemetryChain, core, startAt) : telemetryChain;
    }

    let context: IInternalContext<T> = {
        _next: _moveNext,
        ctx: {
            core: () => {
                return core
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
                return !!_nextProxy;
            },
            getNext: () => {
                return _nextProxy;
            },
            setNext: (nextPlugin:ITelemetryPluginChain) => {
                _nextProxy = nextPlugin;
            },
            iterate: _iterateChain,
            onComplete: _addOnComplete
        } as T
    };

    function _addOnComplete(onComplete: () => void, that?: any, ...args: any[]) {
        if (onComplete) {
            _onComplete.push({
                func: onComplete,
                self: !isUndefined(that) ? that : context.ctx,
                args: args
            });
        }
    }

    function _moveNext() {
        let nextProxy = _nextProxy;

        // Automatically move to the next plugin
        _nextProxy = nextProxy ? nextProxy.getNext() : null;

        if (!nextProxy) {
            let onComplete = _onComplete;
            if (onComplete && onComplete.length > 0) {
                arrForEach(onComplete, (completeDetails) => {
                    try {
                        completeDetails.func.call(completeDetails.self, completeDetails.args);
                    } catch (e) {
                        _throwInternal(
                            core.logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.PluginException,
                            "Unexpected Exception during onComplete - " + dumpObj(e));
                    }
                });

                _onComplete = [];
            }
        }

        return nextProxy;
    }

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
                    // Enumerate over the defaultValues and if not already populated attempt to
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

                theConfig = newConfig;
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

    function _iterateChain<T extends ITelemetryPlugin = ITelemetryPlugin>(cb: (plugin: T) => void) {
        // Keep processing until we reach the end of the chain
        let nextPlugin: ITelemetryPluginChain;
        while(!!(nextPlugin = context._next())) {
            let plugin = nextPlugin.getPlugin();
            if (plugin) {
                // callback with the current on
                cb(plugin as T);
            }
        }
    }

    return context;
}

/**
 * Creates a new Telemetry Item context with the current config, core and plugin execution chain
 * @param plugins - The plugin instances that will be executed
 * @param config - The current config
 * @param core - The current core instance
 * @param startAt - Identifies the next plugin to execute, if null there is no "next" plugin and if undefined it should assume the start of the chain
 */
export function createProcessTelemetryContext(telemetryChain: ITelemetryPluginChain | null, config: IConfiguration, core:IAppInsightsCore, startAt?: IPlugin): IProcessTelemetryContext {
    let internalContext: IInternalContext<IProcessTelemetryContext> = _createInternalContext<IProcessTelemetryContext>(telemetryChain, config, core, startAt);
    let context = internalContext.ctx;

    function _processNext(env: ITelemetryItem) {
        let nextPlugin: ITelemetryPluginChain = internalContext._next();
        // Run the next plugin which will call "processNext()"
        nextPlugin && nextPlugin.processTelemetry(env, context);

        return !nextPlugin;
    }

    function _createNew(plugins: IPlugin[] | ITelemetryPluginChain | null = null, startAt?: IPlugin) {
        if (isArray(plugins)) {
            plugins = createTelemetryProxyChain(plugins, config, core, startAt);
        }

        return createProcessTelemetryContext(plugins || context.getNext(), config, core, startAt);
    }

    context.processNext = _processNext;
    context.createNew = _createNew;

    return context;
}

/**
 * Creates a new Telemetry Item context with the current config, core and plugin execution chain for handling the unloading of the chain
 * @param plugins - The plugin instances that will be executed
 * @param config - The current config
 * @param core - The current core instance
 * @param startAt - Identifies the next plugin to execute, if null there is no "next" plugin and if undefined it should assume the start of the chain
 */
export function createProcessTelemetryUnloadContext(telemetryChain: ITelemetryPluginChain, core: IAppInsightsCore, startAt?: IPlugin): IProcessTelemetryUnloadContext {
    let config = core.config || {};
    let internalContext: IInternalContext<IProcessTelemetryUnloadContext> = _createInternalContext<IProcessTelemetryUnloadContext>(telemetryChain, config, core, startAt);
    let context = internalContext.ctx;

    function _processNext(unloadState: ITelemetryUnloadState) {
        let nextPlugin: ITelemetryPluginChain = internalContext._next();
        nextPlugin && nextPlugin.unload(context, unloadState);

        return !nextPlugin;
    }

    function _createNew(plugins: IPlugin[] | ITelemetryPluginChain = null, startAt?: IPlugin): IProcessTelemetryUnloadContext {
        if (isArray(plugins)) {
            plugins = createTelemetryProxyChain(plugins, config, core, startAt);
        }

        return createProcessTelemetryUnloadContext(plugins || context.getNext(), core, startAt);
    }

    context.processNext = _processNext;
    context.createNew = _createNew

    return context;
}

/**
 * Creates a new Telemetry Item context with the current config, core and plugin execution chain for updating the configuration
 * @param plugins - The plugin instances that will be executed
 * @param config - The current config
 * @param core - The current core instance
 * @param startAt - Identifies the next plugin to execute, if null there is no "next" plugin and if undefined it should assume the start of the chain
 */
export function createProcessTelemetryUpdateContext(telemetryChain: ITelemetryPluginChain, core: IAppInsightsCore, startAt?: IPlugin): IProcessTelemetryUpdateContext {
    let config = core.config || {};
    let internalContext: IInternalContext<IProcessTelemetryUpdateContext> = _createInternalContext<IProcessTelemetryUpdateContext>(telemetryChain, config, core, startAt);
    let context = internalContext.ctx;

    function _processNext(updateState: ITelemetryUpdateState) {
        return context.iterate((plugin) => {
            if (isFunction(plugin.update)) {
                plugin.update(context, updateState);
            }
        });
    }

    function _createNew(plugins: IPlugin[] | ITelemetryPluginChain = null, startAt?: IPlugin) {
        if (isArray(plugins)) {
            plugins = createTelemetryProxyChain(plugins, config, core, startAt);
        }

        return createProcessTelemetryUpdateContext(plugins || context.getNext(), core, startAt);
    }

    context.processNext = _processNext;
    context.createNew = _createNew;

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
        unload: _unloadPlugin,
        update: _updatePlugin,
        _id: chainId,
        _setNext: (nextPlugin: IInternalTelemetryPluginChain) => {
            nextProxy = nextPlugin;
        }
    };

    function _getTelCtx() {
        let itemCtx: IProcessTelemetryContext;

        // Looks like a plugin didn't pass the (optional) context, so create a new one
        if (plugin && isFunction(plugin[strGetTelCtx])) {
            // This plugin extends from the BaseTelemetryPlugin so lets use it
            itemCtx = plugin[strGetTelCtx]();
        }

        if (!itemCtx) {
            // Create a temporary one
            itemCtx = createProcessTelemetryContext(proxyChain, config, core);
        }

        return itemCtx;
    }

    function _processChain<T extends IBaseProcessingContext>(
        itemCtx: T,
        processPluginFn: (itemCtx: T) => boolean,
        name: string,
        details: () => any,
        isAsync: boolean) {

        let hasRun = false;
        let identifier = plugin ? plugin.identifier : strTelemetryPluginChain;
        let hasRunContext = itemCtx[strHasRunFlags];
        if (!hasRunContext) {
            // Assign and populate
            hasRunContext = itemCtx[strHasRunFlags] = {};
        }

        // Ensure that we keep the context in sync
        itemCtx.setNext(nextProxy);

        if (plugin) {
            doPerf(itemCtx[strCore](), () => identifier + ":" + name, () => {
                // Mark this component as having run
                hasRunContext[chainId] = true;

                try {
                    // Set a flag on the next plugin so we know if it was attempted to be executed
                    let nextId = nextProxy ? nextProxy._id : strEmpty;
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
                        _throwInternal(
                            itemCtx.diagLog(),
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.PluginException,
                            "Plugin [" + identifier + "] failed during " + name + " - " + dumpObj(error) + ", run flags: " + dumpObj(hasRunContext));
                    }
                }
            }, details, isAsync);
        }

        return hasRun;
    }

    function _processTelemetry(env: ITelemetryItem, itemCtx: IProcessTelemetryContext) {
        itemCtx = itemCtx || _getTelCtx();

        function _callProcessTelemetry(itemCtx: IProcessTelemetryContext) {
            if (!plugin || !hasProcessTelemetry) {
                return false;
            }

            let pluginState = _getPluginState(plugin);
            if (pluginState.teardown || pluginState[strDisabled]) {
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

            // Process Telemetry is expected to call itemCtx.processNext() or nextPlugin.processTelemetry()
            return true;
        }

        if (!_processChain(itemCtx, _callProcessTelemetry, "processTelemetry", () => ({ item: env }), !((env as any).sync))) {
            // The underlying plugin is either not defined, not enabled or does not have a processTelemetry implementation
            // so we still want the next plugin to be executed.
            itemCtx.processNext(env);
        }
    }

    function _unloadPlugin(unloadCtx: IProcessTelemetryUnloadContext, unloadState: ITelemetryUnloadState) {

        function _callTeardown() {
            // Setting default of hasRun as false so the proxyProcessFn() is called as teardown() doesn't have to exist or call unloadNext().
            let hasRun = false;
            if (plugin) {
                let pluginState = _getPluginState(plugin);
                let pluginCore = plugin[strCore] || pluginState.core;
                // Only teardown the plugin if it was initialized by the current core (i.e. It's not a shared plugin)
                if (plugin && (!pluginCore || pluginCore === unloadCtx[strCore]()) && !pluginState[strTeardown]) {
                    // Handle plugins that don't extend from the BaseTelemetryPlugin
                    pluginState[strCore] = null;
                    pluginState[strTeardown] = true;
                    pluginState[strIsInitialized] = false;
    
                    if (plugin[strTeardown] && plugin[strTeardown](unloadCtx, unloadState) === true) {
                        // plugin told us that it was going to (or has) call unloadCtx.processNext()
                        hasRun = true;
                    }
                }
            }

            return hasRun;
        }

        if (!_processChain(unloadCtx, _callTeardown, "unload", () => {}, unloadState.isAsync)) {
            // Only called if we hasRun was not true
            unloadCtx.processNext(unloadState);
        }
    }

    function _updatePlugin(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) {

        function _callUpdate() {
            // Setting default of hasRun as false so the proxyProcessFn() is called as teardown() doesn't have to exist or call unloadNext().
            let hasRun = false;
            if (plugin) {
                let pluginState = _getPluginState(plugin);
                let pluginCore = plugin[strCore] || pluginState.core;

                // Only update the plugin if it was initialized by the current core (i.e. It's not a shared plugin)
                if (plugin && (!pluginCore || pluginCore === updateCtx[strCore]()) && !pluginState[strTeardown]) {
                    if (plugin[strUpdate] && plugin[strUpdate](updateCtx, updateState) === true) {
                        // plugin told us that it was going to (or has) call unloadCtx.processNext()
                        hasRun = true;
                    }
                }
            }

            return hasRun;
        }
        
        if (!_processChain(updateCtx, _callUpdate, "update", () => {}, false)) {
            // Only called if we hasRun was not true
            updateCtx.processNext(updateState);
        }
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
                        
    public getConfig: (identifier:string, field: string, defaultValue?: number | string | boolean | string[] | RegExp[] | Function) => number | string | boolean | string[] | RegExp[] | Function;

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
     * @returns boolean (true) if there is no more plugins to process otherwise false or undefined (void)
     */
    public processNext: (env: ITelemetryItem) => boolean | void;

    /**
     * Synchronously iterate over the context chain running the callback for each plugin, once
     * every plugin has been executed via the callback, any associated onComplete will be called.
     * @param callback - The function call for each plugin in the context chain
     */
    public iterate: <T extends ITelemetryPlugin = ITelemetryPlugin>(callback: (plugin: T) => void) => void;
 
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
    constructor(pluginChain: ITelemetryPluginChain, config: IConfiguration, core: IAppInsightsCore, startAt?:IPlugin) {
        let _self = this;

        let context = createProcessTelemetryContext(pluginChain, config, core, startAt);
        // Proxy all functions of the context to this object
        proxyFunctions(_self, context, objKeys(context) as any);
    }
}
