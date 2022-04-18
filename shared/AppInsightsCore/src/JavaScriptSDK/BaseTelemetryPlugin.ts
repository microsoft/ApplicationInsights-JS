// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IProcessTelemetryContext, IProcessTelemetryUnloadContext, IProcessTelemetryUpdateContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { createProcessTelemetryContext, createProcessTelemetryUnloadContext, createProcessTelemetryUpdateContext } from "./ProcessTelemetryContext";
import { arrForEach, isArray, isFunction, isNullOrUndefined, proxyFunctionAs, setValue } from "./HelperFuncs";
import { strExtensionConfig } from "./Constants";
import { createUnloadHandlerContainer, IUnloadHandlerContainer, UnloadHandler } from "./UnloadHandlerContainer";
import { IInstrumentHook } from "../JavaScriptSDK.Interfaces/IInstrumentHooks";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { TelemetryUnloadReason } from "../JavaScriptSDK.Enums/TelemetryUnloadReason";
import { ITelemetryUpdateState } from "../JavaScriptSDK.Interfaces/ITelemetryUpdateState";
import { TelemetryUpdateReason } from "../JavaScriptSDK.Enums/TelemetryUpdateReason";
import { strDoTeardown, strIsInitialized, strSetNextPlugin } from "./InternalConstants";

let strGetPlugin = "getPlugin";

/**
 * BaseTelemetryPlugin provides a basic implementation of the ITelemetryPlugin interface so that plugins
 * can avoid implementation the same set of boiler plate code as well as provide a base
 * implementation so that new default implementations can be added without breaking all plugins.
 */
export abstract class BaseTelemetryPlugin implements ITelemetryPlugin {
    
    public identifier: string;
    public version?: string;

    /**
     * Holds the core instance that was used during initialization
     */
    public core: IAppInsightsCore;

    priority: number;

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
    public setNextPlugin: (next: ITelemetryPlugin | ITelemetryPluginChain) => void;

    /**
     * Returns the current diagnostic logger that can be used to log issues, if no logger is currently
     * assigned a new default one will be created and returned.
     */
    public diagLog: (itemCtx?:IProcessTelemetryContext) => IDiagnosticLogger;

    /**
     * Returns whether the plugin has been initialized
     */
    public isInitialized: () => boolean;

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
     * Teardown / Unload hook to allow implementations to perform some additional unload operations before the BaseTelemetryPlugin
     * finishes it's removal.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @param asyncCallback - An optional callback that the plugin must call if it returns true to inform the caller that it has completed any async unload/teardown operations.
     * @returns boolean - true if the plugin has or will call asyncCallback, this allows the plugin to perform any asynchronous operations.
     */
    protected _doTeardown?: (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void) => void | boolean;

    /**
     * Extension hook to allow implementations to perform some additional update operations before the BaseTelemetryPlugin finishes it's removal
     * @param updateCtx - This is the context that should be used during updating.
     * @param updateState - The details / state of the update process, it holds details like the current and previous configuration.
     * @param asyncCallback - An optional callback that the plugin must call if it returns true to inform the caller that it has completed any async update operations.
     * @returns boolean - true if the plugin has or will call asyncCallback, this allows the plugin to perform any asynchronous operations.
     */
    protected _doUpdate?: (updateCtx?: IProcessTelemetryUpdateContext, updateState?: ITelemetryUpdateState, asyncCallback?: () => void) => void | boolean;

    constructor() {
        let _self = this;           // Setting _self here as it's used outside of the dynamicProto as well

        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _isinitialized: boolean;
        let _rootCtx: IProcessTelemetryContext; // Used as the root context, holding the current config and initialized core
        let _nextPlugin: ITelemetryPlugin | ITelemetryPluginChain; // Used for backward compatibility where plugins don't call the main pipeline
        let _unloadHandlerContainer: IUnloadHandlerContainer;
        let _hooks: IInstrumentHook[];

        _initDefaults();

        dynamicProto(BaseTelemetryPlugin, _self, (_self) => {

            _self.initialize = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain): void => {
                _setDefaults(config, core, pluginChain);
                _isinitialized = true;
            }

            _self.teardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                // If this plugin has already been torn down (not operational) or is not initialized (core is not set)
                // or the core being used for unload was not the same core used for initialization.
                let core = _self.core;
                if (!core || (unloadCtx && core !== unloadCtx.core())) {
                    // Do Nothing as either the plugin is not initialized or was not initialized by the current core
                    return;
                }

                let result: void | boolean;
                let unloadDone = false;
                let theUnloadCtx = unloadCtx || createProcessTelemetryUnloadContext(null, core, _nextPlugin && _nextPlugin[strGetPlugin] ? _nextPlugin[strGetPlugin]() : _nextPlugin);
                let theUnloadState: ITelemetryUnloadState = unloadState || {
                    reason: TelemetryUnloadReason.ManualTeardown,
                    isAsync: false
                };

                function _unloadCallback() {
                    if (!unloadDone) {
                        unloadDone = true;

                        _unloadHandlerContainer.run(theUnloadCtx, unloadState);

                        // Remove all instrumentation hooks
                        arrForEach(_hooks, (fn) => {
                            fn.rm();
                        });
                        _hooks = [];

                        if (result === true) {
                            theUnloadCtx.processNext(theUnloadState);
                        }

                        _initDefaults();
                    }
                }

                if (!_self[strDoTeardown] || _self[strDoTeardown](theUnloadCtx, theUnloadState, _unloadCallback) !== true) {
                    _unloadCallback();
                } else {
                    // Tell the caller that we will be calling processNext()
                    result = true;
                }

                return result;
            };

            _self.update = (updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState) => {
                // If this plugin has already been torn down (not operational) or is not initialized (core is not set)
                // or the core being used for unload was not the same core used for initialization.
                let core = _self.core;
                if (!core || (updateCtx && core !== updateCtx.core())) {
                    // Do Nothing
                    return;
                }

                let result: void | boolean;
                let updateDone = false;
                let theUpdateCtx = updateCtx || createProcessTelemetryUpdateContext(null, core, _nextPlugin && _nextPlugin[strGetPlugin] ? _nextPlugin[strGetPlugin]() : _nextPlugin);
                let theUpdateState: ITelemetryUpdateState = updateState || {
                    reason: TelemetryUpdateReason.Unknown
                };

                function _updateCallback() {
                    if (!updateDone) {
                        updateDone = true;
                        _setDefaults(theUpdateCtx.getCfg(), theUpdateCtx.core(), theUpdateCtx.getNext());
                    }
                }

                if (!_self._doUpdate || _self._doUpdate(theUpdateCtx, theUpdateState, _updateCallback) !== true) {
                    _updateCallback();
                } else {
                    result = true;
                }

                return result;
            };
        
            _self._addHook = (hooks: IInstrumentHook | IInstrumentHook[]) => {
                if (hooks) {
                    if (isArray(hooks)) {
                        _hooks = _hooks.concat(hooks);
                    } else {
                        _hooks.push(hooks);
                    }
                }
            };

            proxyFunctionAs(_self, "_addUnloadCb", () => _unloadHandlerContainer, "add");
        });

        // These are added after the dynamicProto so that are not moved to the prototype

        _self.diagLog = (itemCtx:IProcessTelemetryContext): IDiagnosticLogger => {
            return _getTelCtx(itemCtx).diagLog();
        }

        _self[strIsInitialized] = () => {
            return _isinitialized;
        }

        _self.setInitialized = (isInitialized: boolean):void => {
            _isinitialized = isInitialized;
        }

        // _self.getNextPlugin = () => DO NOT IMPLEMENT
        // Sub-classes of this base class *should* not be relying on this value and instead
        // should use processNext() function. If you require access to the plugin use the
        // IProcessTelemetryContext.getNext().getPlugin() while in the pipeline, Note getNext() may return null.

        _self[strSetNextPlugin] = (next: ITelemetryPlugin | ITelemetryPluginChain) => {
            _nextPlugin = next;
        };

        _self.processNext = (env: ITelemetryItem, itemCtx: IProcessTelemetryContext) => {
            if (itemCtx) {
                // Normal core execution sequence
                itemCtx.processNext(env);
            } else if (_nextPlugin && isFunction(_nextPlugin.processTelemetry)) {
                // Looks like backward compatibility or out of band processing. And as it looks
                // like a ITelemetryPlugin or ITelemetryPluginChain, just call processTelemetry
                _nextPlugin.processTelemetry(env, null);
            }
        };

        _self._getTelCtx = _getTelCtx;
        
        function _getTelCtx(currentCtx:IProcessTelemetryContext = null) {
            let itemCtx:IProcessTelemetryContext = currentCtx;
            if (!itemCtx) {
                let rootCtx = _rootCtx || createProcessTelemetryContext(null, {}, _self.core);
                // tslint:disable-next-line: prefer-conditional-expression
                if (_nextPlugin && _nextPlugin[strGetPlugin]) {
                    // Looks like a chain object
                    itemCtx = rootCtx.createNew(null, _nextPlugin[strGetPlugin]);
                } else {
                    itemCtx = rootCtx.createNew(null, _nextPlugin as ITelemetryPlugin);
                }
            }
            
            return itemCtx;
        }

        function _setDefaults(config: IConfiguration, core: IAppInsightsCore, pluginChain: ITelemetryPluginChain) {
            if (config) {
                // Make sure the extensionConfig exists
                setValue(config, strExtensionConfig, [], null, isNullOrUndefined);
            }
    
            if (!pluginChain && core) {
                // Get the first plugin from the core
                pluginChain = core.getProcessTelContext().getNext();
            }
    
            let nextPlugin: IPlugin = _nextPlugin as IPlugin;
            if (_nextPlugin && _nextPlugin[strGetPlugin]) {
                // If it looks like a proxy/chain then get the plugin
                nextPlugin = _nextPlugin[strGetPlugin]();
            }

            // Support legacy plugins where core was defined as a property
            _self.core = core;
            _rootCtx = createProcessTelemetryContext(pluginChain, config, core, nextPlugin);
        }

        function _initDefaults() {
            _isinitialized = false;
            _self.core = null;
            _rootCtx = null;
            _nextPlugin = null;
            _hooks = [];
            _unloadHandlerContainer = createUnloadHandlerContainer();
        }
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Tear down the plugin and remove any hooked value, the plugin should be removed so that it is no longer initialized and
     * therefore could be re-initialized after being torn down. The plugin should ensure that once this has been called any further
     * processTelemetry calls are ignored and it just calls the processNext() with the provided context.
     * @param unloadCtx - This is the context that should be used during unloading.
     * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
     * @returns boolean - true if the plugin has or will call processNext(), this for backward compatibility as previously teardown was synchronous and returned nothing.
     */
    public teardown(unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState): void | boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public abstract processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void;

    /**
     * The the plugin should re-evaluate configuration and update any cached configuration settings.
     * @param updateCtx - This is the context that should be used during updating.
     * @param updateState - The details / state of the update process, it holds details like the current and previous configuration.
     * @returns boolean - true if the plugin has or will call updateCtx.processNext(), this allows the plugin to perform any asynchronous operations.
     */
    public update(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState): void | boolean{
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add an unload handler that will be called when the SDK is being unloaded
     * @param handler - the handler
     */
    protected _addUnloadCb(handler: UnloadHandler): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add this hook so that it is automatically removed during unloading
     * @param hooks - The single hook or an array of IInstrumentHook objects
     */
    protected _addHook(hooks: IInstrumentHook | IInstrumentHook[]): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
