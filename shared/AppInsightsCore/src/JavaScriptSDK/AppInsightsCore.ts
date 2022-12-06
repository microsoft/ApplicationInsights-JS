// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    ITimerHandler, arrAppend, arrForEach, arrIndexOf, deepExtend, dumpObj, hasDocument, isFunction, isNullOrUndefined, isPlainObject,
    objDeepFreeze, objDefineProp, objForEachKey, objFreeze, objHasOwn, scheduleInterval, scheduleTimeout, throwError
} from "@nevware21/ts-utils";
import { createDynamicConfig, onConfigChange } from "../Config/DynamicConfig";
import { IConfigDefaults } from "../Config/IConfigDefaults";
import { IDynamicConfigHandler, _IInternalDynamicConfigHandler } from "../Config/IDynamicConfigHandler";
import { IWatchDetails, WatcherFunction } from "../Config/IDynamicWatcher";
import { eEventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { TelemetryUnloadReason } from "../JavaScriptSDK.Enums/TelemetryUnloadReason";
import { TelemetryUpdateReason } from "../JavaScriptSDK.Enums/TelemetryUpdateReason";
import { IAppInsightsCore, ILoadedPlugin } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ICookieMgr } from "../JavaScriptSDK.Interfaces/ICookieMgr";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { IDistributedTraceContext } from "../JavaScriptSDK.Interfaces/IDistributedTraceContext";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { IPerfManager } from "../JavaScriptSDK.Interfaces/IPerfManager";
import { IProcessTelemetryContext, IProcessTelemetryUpdateContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { ITelemetryInitializerHandler, TelemetryInitializerFunction } from "../JavaScriptSDK.Interfaces/ITelemetryInitializers";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ITelemetryUnloadState } from "../JavaScriptSDK.Interfaces/ITelemetryUnloadState";
import { ITelemetryUpdateState } from "../JavaScriptSDK.Interfaces/ITelemetryUpdateState";
import { ILegacyUnloadHook, IUnloadHook } from "../JavaScriptSDK.Interfaces/IUnloadHook";
import { ChannelControllerPriority } from "./Constants";
import { createCookieMgr } from "./CookieMgr";
import { createUniqueNamespace } from "./DataCacheHelper";
import { getDebugListener } from "./DbgExtensionUtils";
import { DiagnosticLogger, _InternalLogMessage, _throwInternal, _warnToConsole } from "./DiagnosticLogger";
import { getSetValue, proxyFunctionAs, proxyFunctions, toISOString } from "./HelperFuncs";
import {
    STR_CHANNELS, STR_CREATE_PERF_MGR, STR_DISABLED, STR_EMPTY, STR_EXTENSIONS, STR_EXTENSION_CONFIG, UNDEFINED_VALUE
} from "./InternalConstants";
import { NotificationManager } from "./NotificationManager";
import { PerfManager, doPerf, getGblPerfMgr } from "./PerfManager";
import {
    createProcessTelemetryContext, createProcessTelemetryUnloadContext, createProcessTelemetryUpdateContext, createTelemetryProxyChain
} from "./ProcessTelemetryContext";
import { _getPluginState, createDistributedTraceContext, initializePlugins, sortPlugins } from "./TelemetryHelpers";
import { TelemetryInitializerPlugin } from "./TelemetryInitializerPlugin";
import { IUnloadHandlerContainer, UnloadHandler, createUnloadHandlerContainer } from "./UnloadHandlerContainer";

const strValidationError = "Plugins must provide initialize method";
const strNotificationManager = "_notificationManager";
const strSdkUnloadingError = "SDK is still unloading...";
const strSdkNotInitialized = "SDK is not initialized";
// const strPluginUnloadFailed = "Failed to unload plugin";

/**
 * The default settings for the config.
 * WE MUST include all defaults here to ensure that the config is created with all of the properties
 * defined as dynamic.
 */
const defaultConfig: IConfigDefaults<IConfiguration> = objDeepFreeze({
    cookieCfg: {},
    [STR_EXTENSIONS]: [],
    [STR_CHANNELS]: [],
    [STR_EXTENSION_CONFIG]: {},
    [STR_CREATE_PERF_MGR]: UNDEFINED_VALUE,
    loggingLevelConsole: eLoggingSeverity.DISABLED,
    diagnosticLogInterval: UNDEFINED_VALUE
});

/**
 * Helper to create the default performance manager
 * @param core
 * @param notificationMgr
 */
function _createPerfManager (core: IAppInsightsCore, notificationMgr: INotificationManager) {
    return new PerfManager(notificationMgr);
}

function _validateExtensions(logger: IDiagnosticLogger, channelPriority: number, allExtensions: IPlugin[]): { core: IPlugin[], channels: IChannelControls[] } {
    // Concat all available extensions
    let coreExtensions: ITelemetryPlugin[] = [];
    let channels: IChannelControls[] = [];

    // Check if any two extensions have the same priority, then warn to console
    // And extract the local extensions from the
    let extPriorities = {};

    // Extension validation
    arrForEach(allExtensions, (ext: ITelemetryPlugin) => {
        // Check for ext.initialize
        if (isNullOrUndefined(ext) || isNullOrUndefined(ext.initialize)) {
            throwError(strValidationError);
        }

        const extPriority = ext.priority;
        const identifier = ext.identifier;

        if (ext && extPriority) {
            if (!isNullOrUndefined(extPriorities[extPriority])) {
                _warnToConsole(logger, "Two extensions have same priority #" + extPriority + " - " + extPriorities[extPriority] + ", " + identifier);
            } else {
                // set a value
                extPriorities[extPriority] = identifier;
            }
        }

        // Split extensions to core and channels
        if (!extPriority || extPriority < channelPriority) {
            // Add to core extension that will be managed by AppInsightsCore
            coreExtensions.push(ext);
        } else {
            channels.push(ext);
        }
    });

    return {
        core: coreExtensions,
        channels: channels
    };
}

function _isPluginPresent(thePlugin: IPlugin, plugins: IPlugin[]) {
    let exists = false;

    arrForEach(plugins, (plugin) => {
        if (plugin === thePlugin) {
            exists = true;
            return -1;
        }
    });

    return exists;
}

function _deepMergeConfig(details: IWatchDetails<IConfiguration>, target: any, newValues: any, merge: boolean) {
    // Lets assign the new values to the existing config
    if (newValues) {
        objForEachKey(newValues, (key, value) => {
            if (merge) {
                if (isPlainObject(value) && isPlainObject(target[key])) {
                    // The target is an object and it has a value
                    _deepMergeConfig(details, target[key], value, merge);
                }
            }
    
            if (merge && isPlainObject(value) && isPlainObject(target[key])) {
                // The target is an object and it has a value
                _deepMergeConfig(details, target[key], value, merge);
            } else {
                // Just Assign (replace) and/or make the property dynamic
                details.set(target, key, value);
            }
        });
    }
}

function _findWatcher(listeners: { rm: () => void, w: WatcherFunction<IConfiguration>}[], newWatcher: WatcherFunction<IConfiguration>) {
    let theListener: { rm: () => void, w: WatcherFunction<IConfiguration>} = null;
    let idx: number = -1;
    arrForEach(listeners, (listener, lp) => {
        if (listener.w === newWatcher) {
            theListener = listener;
            idx = lp;
            return -1;
        }
    });

    return { i: idx, l: theListener };
}

function _addDelayedCfgListener(listeners: { rm: () => void, w: WatcherFunction<IConfiguration>}[], newWatcher: WatcherFunction<IConfiguration>) {
    let theListener = _findWatcher(listeners, newWatcher).l;

    if (!theListener) {
        theListener ={
            w: newWatcher,
            rm: () => {
                let fnd = _findWatcher(listeners, newWatcher);
                if (fnd.i !== -1) {
                    listeners.splice(fnd.i, 1);
                }
            }
        };
        listeners.push(theListener);
    }

    return theListener;
}

function _registerDelayedCfgListener(config: IConfiguration, listeners: { rm: () => void, w: WatcherFunction<IConfiguration>}[], logger: IDiagnosticLogger) {
    arrForEach(listeners, (listener) => {
        let unloadHdl = onConfigChange(config, listener.w, logger);
        delete listener.w;      // Clear the listener reference so it will get garbage collected.
        // replace the remove function
        listener.rm = () => {
            unloadHdl.rm();
        };
    });
}

export class AppInsightsCore implements IAppInsightsCore {
    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    /**
     * An array of the installed plugins that provide a version
     */
     public readonly pluginVersionStringArr: string[];
    
    /**
     * The formatted string of the installed plugins that contain a version number
     */
    public readonly pluginVersionString: string;

    /**
     * Returns a value that indicates whether the instance has already been previously initialized.
     */
    public isInitialized: () => boolean;

    /**
     * Function used to identify the get w parameter used to identify status bit to some channels
     */
    public getWParam: () => number;

    constructor() {
        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _configHandler: IDynamicConfigHandler<IConfiguration>;
        let _isInitialized: boolean;
        let _eventQueue: ITelemetryItem[];
        let _notificationManager: INotificationManager | null | undefined;
        let _perfManager: IPerfManager | null;
        let _cfgPerfManager: IPerfManager | null;
        let _cookieManager: ICookieMgr | null;
        let _pluginChain: ITelemetryPluginChain | null;
        let _configExtensions: IPlugin[];
        let _channelConfig: IChannelControls[][] | null | undefined;
        let _channels: IChannelControls[] | null;
        let _isUnloading: boolean;
        let _telemetryInitializerPlugin: TelemetryInitializerPlugin;
        let _internalLogsEventName: string | null;
        let _evtNamespace: string;
        let _unloadHandlers: IUnloadHandlerContainer;
        let _hooks: Array<ILegacyUnloadHook | IUnloadHook>;
        let _debugListener: INotificationListener | null;
        let _traceCtx: IDistributedTraceContext | null;
        let _instrumentationKey: string | null;
        let _cfgListeners: { rm: () => void, w: WatcherFunction<IConfiguration>}[];
        let _extensions: IPlugin[];
        let _pluginVersionStringArr: string[];
        let _pluginVersionString: string;
    
        /**
         * Internal log poller
         */
        let _internalLogPoller: ITimerHandler;
        let _internalLogPollerListening: boolean;

        dynamicProto(AppInsightsCore, this, (_self) => {

            // Set the default values (also called during teardown)
            _initDefaults();

            // Special internal method to allow the unit tests and DebugPlugin to hook embedded objects
            _self["_getDbgPlgTargets"] = () => {
                return [_extensions];
            };

            _self.isInitialized = () => _isInitialized;

            // Creating the self.initialize = ()
            _self.initialize = (config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                if (_isUnloading) {
                    throwError(strSdkUnloadingError);
                }
        
                // Make sure core is only initialized once
                if (_self.isInitialized()) {
                    throwError("Core cannot be initialized more than once");
                }

                _configHandler = createDynamicConfig(config, defaultConfig, logger || _self.logger, false);

                // Re-assigning the local config property so we don't have any references to the passed value and it can be garbage collected
                config = _configHandler.cfg;

                // This will be "re-run" if the referenced config properties are changed
                _addUnloadHook(_configHandler.watch((details) => {
                    _instrumentationKey = details.cfg.instrumentationKey;

                    if (isNullOrUndefined(_instrumentationKey)) {
                        throwError("Please provide instrumentation key");
                    }
                }));

                _notificationManager = notificationManager;

                _initDebugListener();
                _initPerfManager();

                _self.logger = logger || new DiagnosticLogger(config);
                _configHandler.logger = _self.logger;

                let cfgExtensions = config.extensions;

                // Extension validation
                _configExtensions = [];
                _configExtensions.push(...extensions, ...cfgExtensions);
                _channelConfig = config.channels;

                _initPluginChain(null);

                if (!_channels || _channels.length === 0) {
                    throwError("No " + STR_CHANNELS + " available");
                }
                
                if (_channels.length > 1) {
                    let teeController = _self.getPlugin("TeeChannelController");
                    if (!teeController || !teeController.plugin) {
                        _throwInternal(_self.logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "TeeChannel required");
                    }
                }

                _registerDelayedCfgListener(config, _cfgListeners, _self.logger);
                _cfgListeners = null;

                _isInitialized = true;
                _self.releaseQueue();

                _self.pollInternalLogs();
            };
        
            _self.getChannels = (): IChannelControls[] => {
                let controls: IChannelControls[] = [];
                if (_channels) {
                    arrForEach(_channels, (channel) => {
                        controls.push(channel);
                    });
                }

                return objFreeze(controls);
            };
        
            _self.track = (telemetryItem: ITelemetryItem) => {
                doPerf(_self.getPerfMgr(), () => "AppInsightsCore:track", () => {
                    if (telemetryItem === null) {
                        _notifyInvalidEvent(telemetryItem);
                        // throw error
                        throwError("Invalid telemetry item");
                    }
                    
                    // do basic validation before sending it through the pipeline
                    if (!telemetryItem.name && isNullOrUndefined(telemetryItem.name)) {
                        _notifyInvalidEvent(telemetryItem);
                        throwError("telemetry name required");
                    }
            
                    // setup default iKey if not passed in
                    telemetryItem.iKey = telemetryItem.iKey || _instrumentationKey;

                    // add default timestamp if not passed in
                    telemetryItem.time = telemetryItem.time || toISOString(new Date());

                    // Common Schema 4.0
                    telemetryItem.ver = telemetryItem.ver || "4.0";
            
                    if (!_isUnloading && _self.isInitialized()) {
                        // Process the telemetry plugin chain
                        _createTelCtx().processNext(telemetryItem);
                    } else {
                        // Queue events until all extensions are initialized
                        _eventQueue.push(telemetryItem);
                    }
                }, () => ({ item: telemetryItem }), !((telemetryItem as any).sync));
            };
        
            _self.getProcessTelContext = _createTelCtx;

            _self.getNotifyMgr = (): INotificationManager => {
                if (!_notificationManager) {
                    _addUnloadHook(_configHandler.watch((details) => {
                        _notificationManager = new NotificationManager(details.cfg);
                        // For backward compatibility only
                        _self[strNotificationManager] = _notificationManager;
                    }));
                }

                return _notificationManager;
            };

            /**
             * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
             * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
             * called.
             * @param listener - An INotificationListener object.
             */
            _self.addNotificationListener = (listener: INotificationListener): void => {
                _self.getNotifyMgr().addNotificationListener(listener);
            };
        
            /**
             * Removes all instances of the listener.
             * @param listener - INotificationListener to remove.
             */
            _self.removeNotificationListener = (listener: INotificationListener): void => {
                if (_notificationManager) {
                    _notificationManager.removeNotificationListener(listener);
                }
            }
        
            _self.getCookieMgr = (): ICookieMgr => {
                if (!_cookieManager) {
                    _addUnloadHook(_configHandler.watch((details) => {
                        _cookieManager = createCookieMgr(details.cfg, _self.logger);
                    }));
                }

                return _cookieManager;
            };

            _self.setCookieMgr = (cookieMgr: ICookieMgr) => {
                _cookieManager = cookieMgr;
            };

            _self.getPerfMgr = (): IPerfManager => {
                if (!_perfManager && !_cfgPerfManager) {
                    _addUnloadHook(_configHandler.watch((details) => {
                        if (details.cfg.enablePerfMgr) {
                            let createPerfMgr = details.cfg.createPerfMgr;
                            if (isFunction(createPerfMgr)) {
                                _cfgPerfManager = createPerfMgr(_self, _self.getNotifyMgr());
                            }
                        }
                    }));
                }

                return _perfManager || _cfgPerfManager || getGblPerfMgr();
            };

            _self.setPerfMgr = (perfMgr: IPerfManager) => {
                _perfManager = perfMgr;
            };

            _self.eventCnt = (): number => {
                return _eventQueue.length;
            };

            _self.releaseQueue = () => {
                if (_isInitialized && _eventQueue.length > 0) {
                    let eventQueue = _eventQueue;
                    _eventQueue = [];

                    arrForEach(eventQueue, (event: ITelemetryItem) => {
                        _createTelCtx().processNext(event);
                    });
                }
            };

            /**
             * Periodically check logger.queue for log messages to be flushed
             */
            _self.pollInternalLogs = (eventName?: string): ITimerHandler => {
                _internalLogsEventName = eventName || null;

                function _startLogPoller(config: IConfiguration) {
                    let interval: number = config.diagnosticLogInterval;
                    if (!interval || !(interval > 0)) {
                        interval = 10000;
                    }

                    _internalLogPoller && _internalLogPoller.cancel();
                    _internalLogPoller = scheduleInterval(() => {
                        _flushInternalLogs();
                    }, interval) as any;
                }

                if (!_internalLogPollerListening) {
                    _internalLogPollerListening = true;
                    // listen to the configuration
                    _addUnloadHook(_configHandler.watch((details) => {
                        _startLogPoller(details.cfg);
                    }));
                } else {
                    // We are being called again, so make sure the poller is running
                    _startLogPoller(_configHandler.cfg);
                }

                return _internalLogPoller;
            }

            /**
             * Stop polling log messages from logger.queue
             */
            _self.stopPollingInternalLogs = (): void => {
                if (_internalLogPoller) {
                    _internalLogPoller.cancel();
                    _internalLogPoller = null;
                    _flushInternalLogs();
                }
            }

            // Add addTelemetryInitializer
            proxyFunctions(_self, () => _telemetryInitializerPlugin, [ "addTelemetryInitializer" ]);

            _self.unload = (isAsync: boolean = true, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void => {
                if (!_isInitialized) {
                    // The SDK is not initialized
                    throwError(strSdkNotInitialized);
                }

                // Check if the SDK still unloading so throw
                if (_isUnloading) {
                    // The SDK is already unloading
                    throwError(strSdkUnloadingError);
                }

                let unloadState: ITelemetryUnloadState = {
                    reason: TelemetryUnloadReason.SdkUnload,
                    isAsync: isAsync,
                    flushComplete: false
                }

                let processUnloadCtx = createProcessTelemetryUnloadContext(_getPluginChain(), _self);
                processUnloadCtx.onComplete(() => {
                    let oldHooks = _hooks;
                    _hooks = [];

                    // Remove all registered unload hooks
                    arrForEach(oldHooks, (fn) => {
                        // allow either rm or remove callback function
                        try{
                            ((fn as IUnloadHook).rm || (fn as ILegacyUnloadHook).remove).call(fn);
                        } catch (e) {
                            _throwInternal(_self.logger, eLoggingSeverity.WARNING, _eInternalMessageId.PluginException, "Unloading:" + dumpObj(e));
                        }
                    });

                    _initDefaults();
                    unloadComplete && unloadComplete(unloadState);
                }, _self);

                function _doUnload(flushComplete: boolean) {
                    unloadState.flushComplete = flushComplete;
                    _isUnloading = true;

                    // Run all of the unload handlers first (before unloading the plugins)
                    _unloadHandlers.run(processUnloadCtx, unloadState);
                    
                    // Stop polling the internal logs
                    _self.stopPollingInternalLogs();

                    // Start unloading the components, from this point onwards the SDK should be considered to be in an unstable state
                    processUnloadCtx.processNext(unloadState);
                }

                if (!_flushChannels(isAsync, _doUnload, SendRequestReason.SdkUnload, cbTimeout)) {
                    _doUnload(false);
                }
            };

            _self.getPlugin = _getPlugin;

            _self.addPlugin = <T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting?: boolean, isAsync?: boolean, addCb?: (added?: boolean) => void): void => {
                if (!plugin) {
                    addCb && addCb(false);
                    _logOrThrowError(strValidationError);
                    return;
                }

                let existingPlugin = _getPlugin(plugin.identifier);
                if (existingPlugin && !replaceExisting) {
                    addCb && addCb(false);

                    _logOrThrowError("Plugin [" + plugin.identifier + "] is already loaded!");
                    return;
                }

                let updateState: ITelemetryUpdateState = {
                    reason: TelemetryUpdateReason.PluginAdded
                };

                function _addPlugin(removed: boolean) {
                    _configExtensions.push(plugin);
                    updateState.added = [plugin];

                    // Re-Initialize the plugin chain
                    _initPluginChain(updateState);
                    addCb && addCb(true);
                }

                if (existingPlugin) {
                    let removedPlugins: IPlugin[] = [existingPlugin.plugin];
                    let unloadState: ITelemetryUnloadState = {
                        reason: TelemetryUnloadReason.PluginReplace,
                        isAsync: !!isAsync
                    };

                    _removePlugins(removedPlugins, unloadState, (removed) => {
                        if (!removed) {
                            // Previous plugin was successfully removed or was not installed
                            addCb && addCb(false);
                        } else {
                            updateState.removed = removedPlugins
                            updateState.reason |= TelemetryUpdateReason.PluginRemoved;
                            _addPlugin(true);
                        }
                    });
                } else {
                    _addPlugin(false);
                }
            };

            _self.updateCfg = <T extends IConfiguration = IConfiguration>(newConfig: T, mergeExisting: boolean = true) => {
                let updateState: ITelemetryUpdateState;
                if (_self.isInitialized()) {
                    updateState = {
                        reason: TelemetryUpdateReason.ConfigurationChanged,
                        cfg: _configHandler.cfg,
                        oldCfg: deepExtend({}, _configHandler.cfg),
                        newConfig: deepExtend({}, newConfig),
                        merge: mergeExisting
                    };

                    newConfig = updateState.newConfig as T;
                    let cfg =  _configHandler.cfg;

                    // replace the immutable (if initialized) values
                    newConfig.extensions = cfg.extensions;
                    newConfig.channels = cfg.channels;
                }

                // We don't currently allow updating the extensions and channels via the update config
                // So overwriting any user provided values to reuse the existing values
                // Explicitly blocking any previous config watchers so that they don't get called because
                // of this bulk update (Probably not necessary)
                (_configHandler as _IInternalDynamicConfigHandler<IConfiguration>)._block((details) => {

                    // Lets assign the new values to the existing config either overwriting or re-assigning
                    let theConfig = details.cfg;
                    _deepMergeConfig(details, theConfig, newConfig, mergeExisting);

                    if (!mergeExisting) {
                        // Remove (unassign) the values "missing" from the newConfig and also not in the default config
                        objForEachKey(theConfig, (key) => {
                            if (!objHasOwn(newConfig, key)) {
                                // Set the value to undefined
                                details.set(theConfig, key, UNDEFINED_VALUE);
                            }
                        });
                    }

                    // Apply defaults to the new config
                    details.setDf(theConfig, defaultConfig as any);
                });

                // Now execute all of the listeners (synchronously) so they update their values immediately
                _configHandler.notify();

                if (updateState) {
                    _doUpdate(updateState);
                }
            };

            _self.evtNamespace = (): string => {
                return _evtNamespace;
            };

            _self.flush = _flushChannels;
        
            _self.getTraceCtx = (createNew?: boolean): IDistributedTraceContext | null => {
                if (!_traceCtx) {
                    _traceCtx = createDistributedTraceContext();
                }

                return _traceCtx;
            };

            _self.setTraceCtx = (traceCtx: IDistributedTraceContext): void => {
                _traceCtx = traceCtx || null;
            };

            _self.addUnloadHook = _addUnloadHook;

            // Create the addUnloadCb
            proxyFunctionAs(_self, "addUnloadCb", () => _unloadHandlers, "add");

            _self.onCfgChange = <T extends IConfiguration = IConfiguration>(handler: WatcherFunction<T>): IUnloadHook => {
                let unloadHook: IUnloadHook;
                if (!_isInitialized) {
                    unloadHook = _addDelayedCfgListener(_cfgListeners, handler);
                } else {
                    unloadHook = onConfigChange(_configHandler.cfg, handler, _self.logger);
                }

                return {
                    rm: () => {
                        unloadHook.rm();
                    }
                }
            };

            _self.getWParam = () => {
                return (hasDocument() || !!_configHandler.cfg.enableWParam) ? 0 : -1;
            };

            function _setPluginVersions() {
                _pluginVersionStringArr = [];

                if (_channelConfig) {
                    arrForEach(_channelConfig, (channels) => {
                        if (channels) {
                            arrForEach(channels, (channel) => {
                                if (channel.identifier && channel.version) {
                                    let ver = channel.identifier + "=" + channel.version;
                                    _pluginVersionStringArr.push(ver);
                                }
                            });
                        }
                    });
                }

                if (_configExtensions) {
                    arrForEach(_configExtensions, (ext) => {
                        if (ext && ext.identifier && ext.version) {
                            let ver = ext.identifier + "=" + ext.version;
                            _pluginVersionStringArr.push(ver);
                        }
                    });
                }
            }

            function _initDefaults() {
                _isInitialized = false;

                // Use a default logger so initialization errors are not dropped on the floor with full logging
                _configHandler = createDynamicConfig({}, defaultConfig, _self.logger);
                
                // Set the logging level to critical so that any critical initialization failures are displayed on the console
                _configHandler.cfg.loggingLevelConsole = eLoggingSeverity.CRITICAL;

                // Define _self.config
                objDefineProp(_self, "config", {
                    configurable: true,
                    enumerable: true,
                    get: () => _configHandler.cfg,
                    set: (newValue) => {
                        _self.updateCfg(newValue, false);
                    }
                });

                objDefineProp(_self, "pluginVersionStringArr", {
                    configurable: true,
                    enumerable: true,
                    get: () => {
                        if (!_pluginVersionStringArr) {
                            _setPluginVersions();
                        }

                        return _pluginVersionStringArr;
                    }
                });

                objDefineProp(_self, "pluginVersionString", {
                    configurable: true,
                    enumerable: true,
                    get: () => {
                        if (!_pluginVersionString) {
                            if (!_pluginVersionStringArr) {
                                _setPluginVersions();
                            }

                            _pluginVersionString = _pluginVersionStringArr.join(";");
                        }

                        return _pluginVersionString || STR_EMPTY;
                    }
                });

                _self.logger = new DiagnosticLogger(_configHandler.cfg);
                _extensions = [];

                _telemetryInitializerPlugin = new TelemetryInitializerPlugin();
                _eventQueue = [];
                _notificationManager = null;
                _perfManager = null;
                _cfgPerfManager = null;
                _cookieManager = null;
                _pluginChain = null;
                _configExtensions = [];
                _channelConfig = null;
                _channels = null;
                _isUnloading = false;
                _internalLogsEventName = null;
                _evtNamespace = createUniqueNamespace("AIBaseCore", true);
                _unloadHandlers = createUnloadHandlerContainer();
                _traceCtx = null;
                _instrumentationKey = null;
                _hooks = [];
                _cfgListeners = [];
                _pluginVersionString = null;
                _pluginVersionStringArr = null;
            }

            function _createTelCtx(): IProcessTelemetryContext {
                return createProcessTelemetryContext(_getPluginChain(), _configHandler.cfg, _self);
            }

            // Initialize or Re-initialize the plugins
            function _initPluginChain(updateState: ITelemetryUpdateState | null) {
                // Extension validation
                let theExtensions = _validateExtensions(_self.logger, ChannelControllerPriority, _configExtensions);
            
                _pluginChain = null;
                _pluginVersionString = null;
                _pluginVersionStringArr = null;
    
                // Get the primary channel queue and include as part of the normal extensions
                _channels = (_channelConfig || [])[0] ||[];
                
                // Add any channels provided in the extensions and sort them
                _channels = sortPlugins(arrAppend(_channels, theExtensions.channels));

                // Create an array of all extensions, including the _channels
                let allExtensions = arrAppend(sortPlugins(theExtensions.core), _channels);

                // Required to allow plugins to call core.getPlugin() during their own initialization
                _extensions = objFreeze(allExtensions);

                let rootCtx = _createTelCtx();
                
                // Initializing the channels first
                if (_channels && _channels.length > 0) {
                    initializePlugins(rootCtx.createNew(_channels), allExtensions);
                }

                // Now initialize the normal extensions (explicitly not including the _channels as this can cause duplicate initialization)
                initializePlugins(rootCtx, allExtensions);

                if (updateState) {
                    _doUpdate(updateState);
                }
            }

            function _getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
                let theExt: ILoadedPlugin<T> = null;
                let thePlugin: IPlugin = null;

                arrForEach(_extensions, (ext: any) => {
                    if (ext.identifier === pluginIdentifier && ext !== _telemetryInitializerPlugin) {
                        thePlugin = ext;
                        return -1;
                    }

                    // TODO: Check if the extension is an extension "host" (like the TeeChannel)
                    // So that if the extension is not found we can ask the "host" plugins for the plugin
                });

                // if (!thePlugin && _channelControl) {
                //     // Check the channel Controller
                //     thePlugin = _channelControl.getChannel(pluginIdentifier);
                // }

                if (thePlugin) {
                    theExt = {
                        plugin: thePlugin as T,
                        setEnabled: (enabled: boolean) => {
                            _getPluginState(thePlugin)[STR_DISABLED] = !enabled;
                        },
                        isEnabled: () => {
                            let pluginState = _getPluginState(thePlugin);
                            return !pluginState.teardown && !pluginState[STR_DISABLED];
                        },
                        remove: (isAsync: boolean = true, removeCb?: (removed?: boolean) => void): void => {
                            let pluginsToRemove: IPlugin[] = [thePlugin];
                            let unloadState: ITelemetryUnloadState = {
                                reason: TelemetryUnloadReason.PluginUnload,
                                isAsync: isAsync
                            };

                            _removePlugins(pluginsToRemove, unloadState, (removed) => {
                                if (removed) {
                                    // Re-Initialize the plugin chain
                                    _initPluginChain({
                                        reason: TelemetryUpdateReason.PluginRemoved,
                                        removed: pluginsToRemove
                                    });
                                }

                                removeCb && removeCb(removed);
                            });
                        }
                    }
                }

                return theExt;
            }

            function _getPluginChain() {
                if (!_pluginChain) {
                    // copy the collection of extensions
                    let extensions = (_extensions || []).slice();

                    // During add / remove this may get called again, so don't read if already present
                    if (arrIndexOf(extensions, _telemetryInitializerPlugin) === -1) {
                        extensions.push(_telemetryInitializerPlugin);
                    }

                    _pluginChain = createTelemetryProxyChain(sortPlugins(extensions), _configHandler.cfg, _self);
                }

                return _pluginChain;
            }

            function _removePlugins(thePlugins: IPlugin[], unloadState: ITelemetryUnloadState, removeComplete: (removed: boolean) => void) {

                if (thePlugins && thePlugins.length > 0) {
                    let unloadChain = createTelemetryProxyChain(thePlugins, _configHandler.cfg, _self);
                    let unloadCtx = createProcessTelemetryUnloadContext(unloadChain, _self);

                    unloadCtx.onComplete(() => {
                        let removed = false;

                        // Remove the listed config extensions
                        let newConfigExtensions: IPlugin[] = [];
                        arrForEach(_configExtensions, (plugin, idx) => {
                            if (!_isPluginPresent(plugin, thePlugins)) {
                                newConfigExtensions.push(plugin);
                            } else {
                                removed = true;
                            }
                        });

                        _configExtensions = newConfigExtensions;
                        _pluginVersionString = null;
                        _pluginVersionStringArr = null;

                        // Re-Create the channel config
                        let newChannelConfig: IChannelControls[][] = [];
                        if (_channelConfig) {
                            arrForEach(_channelConfig, (queue, idx) => {
                                let newQueue: IChannelControls[] = [];
                                arrForEach(queue, (channel) => {
                                    if (!_isPluginPresent(channel, thePlugins)) {
                                        newQueue.push(channel);
                                    } else {
                                        removed = true;
                                    }
                                });

                                newChannelConfig.push(newQueue);
                            });

                            _channelConfig = newChannelConfig;
                        }

                        removeComplete && removeComplete(removed);
                    });

                    unloadCtx.processNext(unloadState);
                } else {
                    removeComplete(false);
                }
            }

            function _flushInternalLogs() {
                let queue: _InternalLogMessage[] = _self.logger ? _self.logger.queue : [];
                if (queue) {
                    arrForEach(queue, (logMessage: _InternalLogMessage) => {
                        const item: ITelemetryItem = {
                            name: _internalLogsEventName ? _internalLogsEventName : "InternalMessageId: " + logMessage.messageId,
                            iKey: _instrumentationKey,
                            time: toISOString(new Date()),
                            baseType: _InternalLogMessage.dataType,
                            baseData: { message: logMessage.message }
                        };
                        _self.track(item);
                    });

                    queue.length = 0;
                }
            }

            function _flushChannels(isAsync?: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason, cbTimeout?: number) {
                // Setting waiting to one so that we don't call the callBack until we finish iterating
                let waiting = 1;
                let doneIterating = false;
                let cbTimer: ITimerHandler = null;
                cbTimeout = cbTimeout || 5000;

                function doCallback() {
                    waiting--;
                    if (doneIterating && waiting === 0) {
                        cbTimer && cbTimer.cancel();
                        cbTimer = null;
    
                        callBack && callBack(doneIterating);
                        callBack = null;
                    }
                }
                    
                if (_channels && _channels.length > 0) {
                    let flushCtx = _createTelCtx().createNew(_channels);
                    flushCtx.iterate<IChannelControls>((plugin) => {
                        if (plugin.flush) {
                            waiting ++;

                            let handled = false;
                            // Not all channels will call this callback for every scenario
                            if (!plugin.flush(isAsync, () => {
                                handled = true;
                                doCallback();
                            }, sendReason)) {
                                if (!handled) {
                                    // If any channel doesn't return true and it didn't call the callback, then we should assume that the callback
                                    // will never be called, so use a timeout to allow the channel(s) some time to "finish" before triggering any
                                    // followup function (such as unloading)
                                    if (isAsync && cbTimer == null) {
                                        cbTimer = scheduleTimeout(() => {
                                            cbTimer = null;
                                            doCallback();
                                        }, cbTimeout);
                                    } else {
                                        doCallback();
                                    }
                                }
                            }
                        }
                    });
                }

                doneIterating = true;
                doCallback();
                
                return true;
            }

            function _initDebugListener() {
                // Lazily ensure that the notification manager is created
                !_notificationManager && _self.getNotifyMgr();

                // Will get recalled if any referenced config values are changed
                _addUnloadHook(_configHandler.watch((details) => {
                    let disableDbgExt = details.cfg.disableDbgExt;

                    if (disableDbgExt === true && _debugListener) {
                        // Remove any previously loaded debug listener
                        _notificationManager.removeNotificationListener(_debugListener);
                        _debugListener = null;
                    }
    
                    if (_notificationManager && !_debugListener && disableDbgExt !== true) {
                        _debugListener = getDebugListener(details.cfg);
                        _notificationManager.addNotificationListener(_debugListener);
                    }
                }));
            }

            function _initPerfManager() {
                // Will get recalled if any referenced config values are changed
                _addUnloadHook(_configHandler.watch((details) => {
                    let enablePerfMgr = details.cfg.enablePerfMgr;

                    if (!enablePerfMgr && _cfgPerfManager) {
                        // Remove any existing config based performance manager
                        _cfgPerfManager = null;
                    }
    
                    if (enablePerfMgr) {
                        // Set the performance manager creation function if not defined
                        getSetValue(details.cfg, STR_CREATE_PERF_MGR, _createPerfManager);
                    }
                }));
            }

            function _doUpdate(updateState: ITelemetryUpdateState): void {
                let updateCtx = createProcessTelemetryUpdateContext(_getPluginChain(), _self);

                if (!_self._updateHook || _self._updateHook(updateCtx, updateState) !== true) {
                    updateCtx.processNext(updateState);
                }
            }

            function _logOrThrowError(message: string) {
                let logger = _self.logger;
                if (logger) {
                    // there should always be a logger
                    _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.PluginException, message);
                } else {
                    throwError(message);
                }
            }

            function _notifyInvalidEvent(telemetryItem: ITelemetryItem): void {
                let manager = _self.getNotifyMgr();
                if (manager) {
                    manager.eventsDiscarded([telemetryItem], eEventsDiscardedReason.InvalidEvent);
                }
            }

            function _addUnloadHook(hooks: IUnloadHook | IUnloadHook[] | Iterator<IUnloadHook> | ILegacyUnloadHook | ILegacyUnloadHook[] | Iterator<ILegacyUnloadHook>) {
                if (hooks) {
                    arrAppend(_hooks, hooks);
                }
            }
        });
    }

    public initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getChannels(): IChannelControls[] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public track(telemetryItem: ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getProcessTelContext(): IProcessTelemetryContext {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public getNotifyMgr(): INotificationManager {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
     * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
     * called.
     * @param listener - An INotificationListener object.
     */
    public addNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Removes all instances of the listener.
     * @param listener - INotificationListener to remove.
     */
    public removeNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get the current cookie manager for this instance
     */
    public getCookieMgr(): ICookieMgr {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Set the current cookie manager for this instance
     * @param cookieMgr - The manager, if set to null/undefined will cause the default to be created
     */
    public setCookieMgr(cookieMgr: ICookieMgr) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getPerfMgr(): IPerfManager {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public setPerfMgr(perfMgr: IPerfManager) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public eventCnt(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    /**
     * Periodically check logger.queue for
     */
    public pollInternalLogs(eventName?: string): ITimerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Periodically check logger.queue for
     */
    public stopPollingInternalLogs(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add a telemetry processor to decorate or drop telemetry events.
     * @param telemetryInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    public addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Unload and Tear down the SDK and any initialized plugins, after calling this the SDK will be considered
     * to be un-initialized and non-operational, re-initializing the SDK should only be attempted if the previous
     * unload call return `true` stating that all plugins reported that they also unloaded, the recommended
     * approach is to create a new instance and initialize that instance.
     * This is due to possible unexpected side effects caused by plugins not supporting unload / teardown, unable
     * to successfully remove any global references or they may just be completing the unload process asynchronously.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @param unloadComplete - An optional callback that will be called once the unload has completed
     * @param cbTimeout - An optional timeout to wait for any flush operations to complete before proceeding with the unload. Defaults to 5 seconds.
     */
    public unload(isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add a new plugin to the installation
     * @param plugin - The new plugin to add
     * @param replaceExisting - should any existing plugin be replaced, default is false
     * @param doAsync - Should the add be performed asynchronously
     * @param addCb - [Optional] callback to call after the plugin has been added
     */
    public addPlugin<T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting?: boolean, doAsync?: boolean, addCb?: (added?: boolean) => void): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Update the configuration used and broadcast the changes to all loaded plugins
     * @param newConfig - The new configuration is apply
     * @param mergeExisting - Should the new configuration merge with the existing or just replace it. Default is to true.
     */
    public updateCfg<T extends IConfiguration = IConfiguration>(newConfig: T, mergeExisting?: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Returns the unique event namespace that should be used
     */
    public evtNamespace(): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Add an unload handler that will be called when the SDK is being unloaded
     * @param handler - the handler
     */
    public addUnloadCb(handler: UnloadHandler): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Flush and send any batched / cached data immediately
     * @param async - send data asynchronously when true (defaults to true)
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @returns - true if the callback will be return after the flush is complete otherwise the caller should assume that any provided callback will never be called
     */
    public flush(isAsync?: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
        
    /**
     * Gets the current distributed trace context for this instance if available
     * @param createNew - Optional flag to create a new instance if one doesn't currently exist, defaults to true
     */
    public getTraceCtx(createNew?: boolean): IDistributedTraceContext | null {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Sets the current distributed trace context for this instance if available
     */
    public setTraceCtx(newTracectx: IDistributedTraceContext): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add this hook so that it is automatically removed during unloading
     * @param hooks - The single hook or an array of IInstrumentHook objects
     */
    public addUnloadHook(hooks: IUnloadHook | IUnloadHook[] | Iterator<IUnloadHook> | ILegacyUnloadHook | ILegacyUnloadHook[] | Iterator<ILegacyUnloadHook>): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Watches and tracks changes for accesses to the current config, and if the accessed config changes the
     * handler will be recalled.
     * @param handler
     * @returns A watcher handler instance that can be used to remove itself when being unloaded
     */
    public onCfgChange<T extends IConfiguration = IConfiguration>(handler: WatcherFunction<T>): IUnloadHook {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    protected releaseQueue() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Hook for Core extensions to allow them to update their own configuration before updating all of the plugins.
     * @param updateCtx - The plugin update context
     * @param updateState - The Update State
     * @returns boolean - True means the extension class will call updateState otherwise the Core will
     */
    protected _updateHook?(updateCtx: IProcessTelemetryUpdateContext, updateState: ITelemetryUpdateState): void | boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }
}
