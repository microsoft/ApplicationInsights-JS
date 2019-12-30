// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IDiagnosticLogger } from '../JavaScriptSDK.Interfaces/IDiagnosticLogger';
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { CoreUtils } from "./CoreUtils";
import { ProcessTelemetryContext } from './ProcessTelemetryContext';

let _isFunction = CoreUtils.isFunction;
let getPlugin = "getPlugin";

/**
 * BaseTelemetryPlugin provides a basic implementation of the ITelemetryPlugin interface so that plugins
 * can avoid implementation the same set of boiler plate code as well as provide a base
 * implementation so that new default implementations can be added without breaking all plugins.
 */
export abstract class BaseTelemetryPlugin implements ITelemetryPlugin {

    /**
     * Call back for telemetry processing before it it is sent
     * @param env - This is the current event being reported
     * @param itemCtx - This is the context for the current request, ITelemetryPlugin instances 
     * can optionally use this to access the current core instance or define / pass additional information
     * to later plugins (vs appending items to the telemetry item)
     */
    public processNext: (env: ITelemetryItem, itemCtx: IProcessTelemetryContext) => void;

    /**
     * Set next extension for telemetry processing
     */
    public setNextPlugin: (next: ITelemetryPlugin|ITelemetryPluginChain) => void;

    /**
     * Returns the current diagnostic logger that can be used to log issues, if no logger is currently
     * assigned a new default one will be created and returned.
     */
    public diagLog: (itemCtx?:IProcessTelemetryContext) => IDiagnosticLogger;

    /**
     * Returns whether the plugin has been initialized
     */
    public isInitialized: () => boolean;

    public identifier: string;
    public version?: string;

    /**
     * Holds the core instance that was used during initialization
     */
    public core: IAppInsightsCore;              

    priority: number;

    /**
     * Helper to return the current IProcessTelemetryContext, if the passed argument exists this just
     * returns that value (helps with minification for callers), otherwise it will return the configured
     * context or a temporary one.
     * @param currentCtx - [Optional] The current execution context
     */
    protected _getTelCtx: (currentCtx?:IProcessTelemetryContext) => IProcessTelemetryContext;

    /**
     * Internal helper to allow setting of the internal initialized setting for inherited instances and unit testing
     */
    protected setInitialized: (isInitialized: boolean) => void;

    /**
     * Internal helper to initialize the instance
     */
    private _baseTelInit: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => void;

    constructor() {
        let _self = this;
        let _isinitialized = false;
        let _rootCtx: IProcessTelemetryContext = null; // Used as the root context, holding the current config and initialized core
        let _nextPlugin:ITelemetryPlugin|ITelemetryPluginChain = null; // Used for backward compatibility where plugins don't call the main pipeline

        _self.core = null;

        _self.diagLog = (itemCtx:IProcessTelemetryContext): IDiagnosticLogger => {
            return _self._getTelCtx(itemCtx).diagLog();
        }

        _self.isInitialized = () => {
            return _isinitialized;
        }

        _self.setInitialized = (isInitialized: boolean):void => {
            _isinitialized = isInitialized;
        }

        // _self.getNextPlugin = () => DO NOT IMPLEMENT
        // Sub-classes of this base class *should* not be relying on this value and instead
        // should use processNext() function. If you require access to the plugin use the
        // IProcessTelemetryContext.getNext().getPlugin() while in the pipeline, Note getNext() may return null.

        _self.setNextPlugin = (next: ITelemetryPlugin|ITelemetryPluginChain) => {
            _nextPlugin = next;
        };

        _self.processNext = (env: ITelemetryItem, itemCtx: IProcessTelemetryContext) => {
            if (itemCtx) {
                // Normal core execution sequence
                itemCtx.processNext(env);
            } else if (_nextPlugin && _isFunction(_nextPlugin.processTelemetry)) {
                // Looks like backward compatibility or out of band processing. And as it looks 
                // like a ITelemetryPlugin or ITelemetryPluginChain, just call processTelemetry
                _nextPlugin.processTelemetry(env, null);
            }
        };

        _self._getTelCtx = (currentCtx:IProcessTelemetryContext = null) => {
            let itemCtx:IProcessTelemetryContext = currentCtx;
            if (!itemCtx) {
                let rootCtx = _rootCtx || new ProcessTelemetryContext(null, {}, _self.core);
                // tslint:disable-next-line: prefer-conditional-expression
                if (_nextPlugin && _nextPlugin[getPlugin]) {
                    // Looks like a chain object
                    itemCtx = rootCtx.createNew(null, _nextPlugin[getPlugin]);
                } else {
                    itemCtx = rootCtx.createNew(null, _nextPlugin as ITelemetryPlugin);
                }
            }
            
            return itemCtx;
        }

        _self._baseTelInit = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) => { 
            if (config) {
                // Make sure the extensionConfig exists
                config.extensionConfig = config.extensionConfig || [];
            }
    
            if (!pluginChain && core) {
                // Get the first plugin from the core
                pluginChain = core.getProcessTelContext().getNext();
            }
    
            let nextPlugin:IPlugin = _nextPlugin as IPlugin;
            if (_nextPlugin && _nextPlugin[getPlugin]) {
                // If it looks like a proxy/chain then get the plugin
                nextPlugin = _nextPlugin[getPlugin]();
            }

            // Support legacy plugins where core was defined as a property
            _self.core = core;
            _rootCtx = new ProcessTelemetryContext(pluginChain, config, core, nextPlugin);
            _isinitialized = true;
        }
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain): void {
        this._baseTelInit(config, core, extensions, pluginChain);
    }

    public abstract processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;
}
