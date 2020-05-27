// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IDiagnosticLogger } from '../JavaScriptSDK.Interfaces/IDiagnosticLogger';
import { IConfiguration } from '../JavaScriptSDK.Interfaces/IConfiguration';
import { ITelemetryItem } from '../JavaScriptSDK.Interfaces/ITelemetryItem';
import { IPlugin, ITelemetryPlugin } from '../JavaScriptSDK.Interfaces/ITelemetryPlugin';
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from '../JavaScriptSDK.Interfaces/ITelemetryPluginChain';
import { CoreUtils } from "./CoreUtils";
import { DiagnosticLogger } from "./DiagnosticLogger";
import { TelemetryPluginChain } from "./TelemetryPluginChain";

let _isNullOrUndefined = CoreUtils.isNullOrUndefined;

/**
 * Creates the instance execution chain for the plugins
 */
function _createProxyChain(plugins:IPlugin[], itemCtx:IProcessTelemetryContext) {
    let proxies:ITelemetryPluginChain[] = [];
    
    if (plugins && plugins.length > 0) {
        // Create the proxies and wire up the next plugin chain
        let lastProxy:TelemetryPluginChain = null;
        for (let idx = 0; idx < plugins.length; idx++) {
            let thePlugin = plugins[idx] as ITelemetryPlugin;
            if (thePlugin && CoreUtils.isFunction(thePlugin.processTelemetry)) {
                // Only add plugins that are processors
                let newProxy = new TelemetryPluginChain(thePlugin, itemCtx);
                proxies.push(newProxy);
                if (lastProxy) {
                    // Set this new proxy as the next for the previous one
                    lastProxy.setNext(newProxy);
                }
                
                lastProxy = newProxy;
            }
        }
    }

    return proxies.length > 0 ? proxies[0] : null;
}

function _copyProxyChain(proxy:ITelemetryPluginChain, itemCtx:IProcessTelemetryContext, startAt:IPlugin) {
    let plugins:IPlugin[] = [];
    let add = startAt ? false : true;

    if (proxy) {
        while (proxy) {
            let thePlugin = proxy.getPlugin();
            if (add || thePlugin === startAt) {
                add = true;
                plugins.push(thePlugin);
            }
            proxy = proxy.getNext();
        }
    }

    if (!add) {
        plugins.push(startAt);
    }
    
    return _createProxyChain(plugins, itemCtx);
}

function _copyPluginChain(srcPlugins:IPlugin[], itemCtx:IProcessTelemetryContext, startAt:IPlugin) {
    let plugins:IPlugin[] = srcPlugins;
    let add = false;
    if (startAt && srcPlugins) {
        plugins = [];
    
        CoreUtils.arrForEach(srcPlugins, thePlugin => {
            if (add || thePlugin === startAt) {
                add = true;
                plugins.push(thePlugin);
            }
        });
    }

    if (startAt && !add) {
        if (!plugins) {
            plugins = [];
        }
        plugins.push(startAt);
    }
    
    return _createProxyChain(plugins, itemCtx);
}

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
     * Create a new context using the core and config from the current instance
     */
    public createNew: (plugins?:IPlugin[]|ITelemetryPluginChain, startAt?:IPlugin) => IProcessTelemetryContext;

    /**
     * Creates a new Telemetry Item context with the current config, core and plugin execution chain
     * @param plugins - The plugin instances that will be executed
     * @param config - The current config
     * @param core - The current core instance
     */
    constructor(plugins:IPlugin[]|ITelemetryPluginChain, config: IConfiguration, core:IAppInsightsCore, startAt?:IPlugin) {
        let _self = this;
        let _nextProxy: ITelemetryPluginChain = null; // Null == No next plugin

        // There is no next element (null) vs not defined (undefined)
        if (startAt !== null) {
            if (plugins && CoreUtils.isFunction((plugins as ITelemetryPluginChain).getPlugin)) {
                // We have a proxy chain object
                _nextProxy = _copyProxyChain(plugins as ITelemetryPluginChain, _self, startAt||(plugins as ITelemetryPluginChain).getPlugin());
            } else {
                // We just have an array
                if (startAt) {
                    _nextProxy = _copyPluginChain(plugins as IPlugin[], _self, startAt);
                } else if (CoreUtils.isUndefined(startAt)) {
                    // Undefined means copy the existing chain
                    _nextProxy = _createProxyChain(plugins as IPlugin[], _self)
                }
            }
        }

        _self.core = () => {
            return core;
        };
        
        _self.diagLog = () => {
            let logger: IDiagnosticLogger = (core||{} as IAppInsightsCore).logger;
            if (!logger) {
                // Fallback so we always have a logger
                logger = new DiagnosticLogger(config||{});
            }

            return logger;
        };

        _self.getCfg = () => {
            return config;
        };

        _self.getExtCfg = <T>(identifier:string, defaultValue:T|any = {}) => {
            let theConfig:T;
            if (config) {
                let extConfig = config.extensionConfig;
                if (extConfig && identifier) {
                    theConfig = extConfig[identifier];
                }
            }
    
            return (theConfig ? theConfig : defaultValue) as T;
        };

        _self.getConfig = (identifier:string, field: string, defaultValue: number | string | boolean = false) => {
            let theValue;
            let extConfig = _self.getExtCfg(identifier, null);
            if (extConfig && !_isNullOrUndefined(extConfig[field])) {
                theValue = extConfig[field];
            } else if (config && !_isNullOrUndefined(config[field])) {
                theValue = config[field];
            }
    
            return !_isNullOrUndefined(theValue) ? theValue : defaultValue;
        };

        _self.hasNext = () => {
            return _nextProxy != null;
        };

        _self.getNext = () => {
            return _nextProxy;
        }

        _self.setNext = (nextPlugin:ITelemetryPluginChain) => {
            _nextProxy = nextPlugin;
        };

        _self.processNext = (env: ITelemetryItem) => {
            let nextPlugin = _nextProxy;

            if (nextPlugin) {
                // Automatically move to the next plugin
                _nextProxy = nextPlugin.getNext();
                nextPlugin.processTelemetry(env, _self);
            }
        };

        _self.createNew = (plugins:IPlugin[]|ITelemetryPluginChain = null, startAt?:IPlugin) => {
            return new ProcessTelemetryContext(plugins||_nextProxy, config, core, startAt);
        }
    }
}
