// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import { objCreateFn } from "@microsoft/applicationinsights-shims";
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
import {
    ChannelControllerPriority, IChannelController, IInternalChannelController, _IInternalChannels, createChannelControllerPlugin,
    createChannelQueues
} from "./ChannelController";
import { createCookieMgr } from "./CookieMgr";
import { createUniqueNamespace } from "./DataCacheHelper";
import { getDebugListener } from "./DbgExtensionUtils";
import { DiagnosticLogger, _InternalLogMessage, _throwInternal, _warnToConsole } from "./DiagnosticLogger";
import {
    arrForEach, arrIndexOf, getCfgValue, getSetValue, isFunction, isNullOrUndefined, objExtend, objFreeze, proxyFunctionAs, proxyFunctions,
    throwError, toISOString
} from "./HelperFuncs";
import { STR_CHANNELS, STR_CREATE_PERF_MGR, STR_DISABLED, STR_EXTENSIONS, STR_EXTENSION_CONFIG } from "./InternalConstants";
import { PerfManager, getGblPerfMgr } from "./PerfManager";
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

const defaultInitConfig = {
    // Have the Diagnostic Logger default to log critical errors to the console
    loggingLevelConsole: eLoggingSeverity.CRITICAL
};

/**
 * Helper to create the default performance manager
 * @param core
 * @param notificationMgr
 */
function _createPerfManager (core: IAppInsightsCore, notificationMgr: INotificationManager) {
    return new PerfManager(notificationMgr);
}

function _validateExtensions(logger: IDiagnosticLogger, channelPriority: number, allExtensions: IPlugin[]): { all: IPlugin[]; core: ITelemetryPlugin[] } {
    // Concat all available extensions
    let coreExtensions: ITelemetryPlugin[] = [];

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

        // Split extensions to core and channelController
        if (!extPriority || extPriority < channelPriority) {
            // Add to core extension that will be managed by BaseCore
            coreExtensions.push(ext);
        }
    });

    return {
        all: allExtensions,
        core: coreExtensions
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

function _createDummyNotificationManager(): INotificationManager {
    return objCreateFn({
        addNotificationListener: (listener: INotificationListener) => { },
        removeNotificationListener: (listener: INotificationListener) => { },
        eventsSent: (events: ITelemetryItem[]) => { },
        eventsDiscarded: (events: ITelemetryItem[], reason: number) => { },
        eventsSendRequest: (sendReason: number, isAsync: boolean) => { }
    });
}

export class BaseCore implements IAppInsightsCore {
    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: IPlugin[];
    public isInitialized: () => boolean;

    constructor() {
        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _config: IConfiguration;
        let _isInitialized: boolean;
        let _eventQueue: ITelemetryItem[];
        let _notificationManager: INotificationManager | null | undefined;
        let _perfManager: IPerfManager | null;
        let _cfgPerfManager: IPerfManager | null;
        let _cookieManager: ICookieMgr | null;
        let _pluginChain: ITelemetryPluginChain | null;
        let _configExtensions: IPlugin[];
        let _coreExtensions: ITelemetryPlugin[] | null;
        let _channelControl: IChannelController | null;
        let _channelConfig: IChannelControls[][] | null | undefined;
        let _channelQueue: _IInternalChannels[] | null;
        let _isUnloading: boolean;
        let _telemetryInitializerPlugin: TelemetryInitializerPlugin;
        let _internalLogsEventName: string | null;
        let _evtNamespace: string;
        let _unloadHandlers: IUnloadHandlerContainer;
        let _debugListener: INotificationListener | null;
        let _traceCtx: IDistributedTraceContext | null;

        /**
         * Internal log poller
         */
        let _internalLogPoller: number = 0;
        let _forceStopInternalLogPoller = false;

        dynamicProto(BaseCore, this, (_self) => {

            // Set the default values (also called during teardown)
            _initDefaults();

            _self.isInitialized = () => _isInitialized;

            // Creating the self.initialize = ()
            _self.initialize = (config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                if (_isUnloading) {
                    throwError(strSdkUnloadingError);
                }
        
                // Make sure core is only initialized once
                if (_self.isInitialized()) {
                    throwError("Core should not be initialized more than once");
                }

                _config = config || {};
                _self.config = _config;

                if (isNullOrUndefined(config.instrumentationKey)) {
                    throwError("Please provide instrumentation key");
                }

                _notificationManager = notificationManager;

                // For backward compatibility only
                _self[strNotificationManager] = notificationManager;

                _initDebugListener();
                _initPerfManager();

                // add notification to the extensions in the config so other plugins can access it
                _initExtConfig();

                if (logger) {
                    _self.logger = logger;
                }

                let cfgExtensions = getSetValue(_config, STR_EXTENSIONS, []);

                // Extension validation
                _configExtensions = [];
                _configExtensions.push(...extensions, ...cfgExtensions);
                _channelConfig = getSetValue(_config, STR_CHANNELS, []);

                _initPluginChain(null);

                if (!_channelQueue || _channelQueue.length === 0) {
                    throwError("No " + STR_CHANNELS + " available");
                }
        
                _isInitialized = true;
                _self.releaseQueue();
            };
        
            _self.getTransmissionControls = (): IChannelControls[][] => {
                let controls: IChannelControls[][] = [];
                if (_channelQueue) {
                    arrForEach(_channelQueue, (channels) => {
                        controls.push(channels.queue);
                    });
                }

                return objFreeze(controls);
            };
        
            _self.track = (telemetryItem: ITelemetryItem) => {
                // setup default iKey if not passed in
                telemetryItem.iKey = telemetryItem.iKey || _config.instrumentationKey;

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
            };
        
            _self.getProcessTelContext = _createTelCtx;

            _self.getNotifyMgr = (): INotificationManager => {
                if (!_notificationManager) {
                    // Create Dummy notification manager
                    _notificationManager = _createDummyNotificationManager();

                    // For backward compatibility only
                    _self[strNotificationManager] = _notificationManager;
                }

                return _notificationManager;
            };

            /**
             * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
             * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
             * called.
             * @param {INotificationListener} listener - An INotificationListener object.
             */
            _self.addNotificationListener = (listener: INotificationListener): void => {
                if (_notificationManager) {
                    _notificationManager.addNotificationListener(listener);
                }
            };
        
            /**
             * Removes all instances of the listener.
             * @param {INotificationListener} listener - INotificationListener to remove.
             */
            _self.removeNotificationListener = (listener: INotificationListener): void => {
                if (_notificationManager) {
                    _notificationManager.removeNotificationListener(listener);
                }
            }
        
            _self.getCookieMgr = (): ICookieMgr => {
                if (!_cookieManager) {
                    _cookieManager = createCookieMgr(_config, _self.logger);
                }

                return _cookieManager;
            };

            _self.setCookieMgr = (cookieMgr: ICookieMgr) => {
                _cookieManager = cookieMgr;
            };

            _self.getPerfMgr = (): IPerfManager => {
                if (!_perfManager && !_cfgPerfManager) {
                    if (getCfgValue(_config.enablePerfMgr)) {
                        let createPerfMgr = getCfgValue(_config.createPerfMgr);
                        if (isFunction(createPerfMgr)) {
                            _cfgPerfManager = createPerfMgr(_self, _self.getNotifyMgr());
                        }
                    }
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

            _self.pollInternalLogs = (eventName?: string): number => {
                _internalLogsEventName = eventName || null;
                _forceStopInternalLogPoller = false;
                if(_internalLogPoller) {
                    clearInterval(_internalLogPoller);
                    _internalLogPoller = null;
                }

                return _startInternalLogTimer(true);
            }

            function _startInternalLogTimer(alwaysStart?: boolean) {
                if (!_internalLogPoller && !_forceStopInternalLogPoller) {
                    let shouldStart = alwaysStart || (_self.logger && _self.logger.queue.length > 0);
                    if (shouldStart) {
                        let interval: number = getCfgValue(_config.diagnosticLogInterval);
                        if (!interval || !(interval > 0)) {
                            interval = 10000;
                        }
    
                        // Keeping as an interval timer for backward compatibility as it returns the result
                        _internalLogPoller = setInterval(() => {
                            clearInterval(_internalLogPoller);
                            _internalLogPoller = 0;
                            _flushInternalLogs();
                        }, interval) as any;
                    }
                }

                return _internalLogPoller;
            }

            _self.stopPollingInternalLogs = (): void => {
                _forceStopInternalLogPoller = true;
                if(_internalLogPoller) {
                    clearInterval(_internalLogPoller);
                    _internalLogPoller = 0;
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

                _flushInternalLogs();

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

            // Create the addUnloadCb
            proxyFunctionAs(_self, "addUnloadCb", () => _unloadHandlers, "add");

            function _initDefaults() {
                _isInitialized = false;

                // Use a default logger so initialization errors are not dropped on the floor with full logging
                _config = objExtend(true, {}, defaultInitConfig);
                _self.config = _config;
                _self.logger = new DiagnosticLogger(_config);
                _self._extensions = [];

                _telemetryInitializerPlugin = new TelemetryInitializerPlugin();
                _eventQueue = [];
                _notificationManager = null;
                _perfManager = null;
                _cfgPerfManager = null;
                _cookieManager = null;
                _pluginChain = null;
                _coreExtensions = null;
                _configExtensions = [];
                _channelControl = null;
                _channelConfig = null;
                _channelQueue = null;
                _isUnloading = false;
                _internalLogsEventName = null;
                _evtNamespace = createUniqueNamespace("AIBaseCore", true);
                _unloadHandlers = createUnloadHandlerContainer();
                _traceCtx = null;
            }

            function _createTelCtx(): IProcessTelemetryContext {
                let theCtx = createProcessTelemetryContext(_getPluginChain(), _config, _self);
                theCtx.onComplete(_startInternalLogTimer);

                return theCtx;
            }

            // Initialize or Re-initialize the plugins
            function _initPluginChain(updateState: ITelemetryUpdateState | null) {
                // Extension validation
                let theExtensions = _validateExtensions(_self.logger, ChannelControllerPriority, _configExtensions);
            
                _coreExtensions = theExtensions.core;
                _pluginChain = null;
            
                // Sort the complete set of extensions by priority
                let allExtensions = theExtensions.all;

                // Initialize the Channel Queues and the channel plugins first
                _channelQueue = objFreeze(createChannelQueues(_channelConfig, allExtensions, _self));
                if (_channelControl) {
                    // During add / remove of a plugin this may get called again, so don't re-add if already present
                    // But we also want the controller as the last, so remove if already present
                    // And reusing the existing instance, just in case an installed plugin has a reference and
                    // is using it.
                    let idx = arrIndexOf(allExtensions, _channelControl);
                    if (idx !== -1) {
                        allExtensions.splice(idx, 1);
                    }

                    idx = arrIndexOf(_coreExtensions, _channelControl);
                    if (idx !== -1) {
                        _coreExtensions.splice(idx, 1);
                    }

                    (_channelControl as IInternalChannelController)._setQueue(_channelQueue);
                } else {
                    _channelControl = createChannelControllerPlugin(_channelQueue, _self);
                }

                // Add on "channelController" as the last "plugin"
                allExtensions.push(_channelControl);
                _coreExtensions.push(_channelControl);

                // Required to allow plugins to call core.getPlugin() during their own initialization
                _self._extensions = sortPlugins(allExtensions);

                // Initialize the controls
                _channelControl.initialize(_config, _self, allExtensions);
                
                let initCtx = _createTelCtx();
                initializePlugins(initCtx, allExtensions);

                // Now reset the extensions to just those being managed by Basecore
                _self._extensions = objFreeze(sortPlugins(_coreExtensions || [])).slice();

                if (updateState) {
                    _doUpdate(updateState);
                }
            }

            function _getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
                let theExt: ILoadedPlugin<T> = null;
                let thePlugin: IPlugin = null;

                arrForEach(_self._extensions, (ext: any) => {
                    if (ext.identifier === pluginIdentifier && ext !== _channelControl && ext !== _telemetryInitializerPlugin) {
                        thePlugin = ext;
                        return -1;
                    }
                });

                if (!thePlugin && _channelControl) {
                    // Check the channel Controller
                    thePlugin = _channelControl.getChannel(pluginIdentifier);
                }

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
                    let extensions = (_coreExtensions || []).slice();

                    // During add / remove this may get called again, so don't readd if already present
                    if (arrIndexOf(extensions, _telemetryInitializerPlugin) === -1) {
                        extensions.push(_telemetryInitializerPlugin);
                    }

                    _pluginChain = createTelemetryProxyChain(sortPlugins(extensions), _config, _self);
                }

                return _pluginChain;
            }

            function _removePlugins(thePlugins: IPlugin[], unloadState: ITelemetryUnloadState, removeComplete: (removed: boolean) => void) {

                if (thePlugins && thePlugins.length > 0) {
                    let unloadChain = createTelemetryProxyChain(thePlugins, _config, _self);
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
                        _startInternalLogTimer();
                    });

                    unloadCtx.processNext(unloadState);
                } else {
                    removeComplete(false);
                }
            }

            function _flushInternalLogs() {
                if (_self.logger && _self.logger.queue) {
                    let queue: _InternalLogMessage[] = _self.logger.queue.slice(0);
                    _self.logger.queue.length = 0;

                    arrForEach(queue, (logMessage: _InternalLogMessage) => {
                        const item: ITelemetryItem = {
                            name: _internalLogsEventName ? _internalLogsEventName : "InternalMessageId: " + logMessage.messageId,
                            iKey: getCfgValue(_config.instrumentationKey),
                            time: toISOString(new Date()),
                            baseType: _InternalLogMessage.dataType,
                            baseData: { message: logMessage.message }
                        };
                        _self.track(item);
                    });
                }
            }

            function _flushChannels(isAsync?: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason, cbTimeout?: number) {
                if (_channelControl) {
                    return _channelControl.flush(isAsync, callBack, sendReason || SendRequestReason.SdkUnload, cbTimeout);
                }

                callBack && callBack(false);
                return true;
            }

            function _initDebugListener() {
                let disableDbgExt = getCfgValue(_config.disableDbgExt);

                if (disableDbgExt === true && _debugListener) {
                    // Remove any previously loaded debug listener
                    _notificationManager.removeNotificationListener(_debugListener);
                    _debugListener = null;
                }

                if (_notificationManager && !_debugListener && disableDbgExt !== true) {
                    _debugListener = getDebugListener(_config);
                    _notificationManager.addNotificationListener(_debugListener);
                }
            }

            function _initPerfManager() {
                let enablePerfMgr = getCfgValue(_config.enablePerfMgr);

                if (!enablePerfMgr && _cfgPerfManager) {
                    // Remove any existing config based performance manager
                    _cfgPerfManager = null;
                }

                if (enablePerfMgr) {
                    // Set the performance manager creation function if not defined
                    getSetValue(_config, STR_CREATE_PERF_MGR, _createPerfManager);
                }
            }

            function _initExtConfig() {
                let extConfig = getSetValue(_config, STR_EXTENSION_CONFIG, {});
                extConfig.NotificationManager = _notificationManager;
            }

            function _doUpdate(updateState: ITelemetryUpdateState): void {
                let updateCtx = createProcessTelemetryUpdateContext(_getPluginChain(), _self);
                updateCtx.onComplete(_startInternalLogTimer);

                if (!_self._updateHook || _self._updateHook(updateCtx, updateState) !== true) {
                    updateCtx.processNext(updateState);
                }
            }

            function _logOrThrowError(message: string) {
                let logger = _self.logger;
                if (logger) {
                    // there should always be a logger
                    _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.PluginException, message);
                    _startInternalLogTimer();
                } else {
                    throwError(message);
                }
            }
        });
    }

    public initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getTransmissionControls(): IChannelControls[][] {
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
     * @param {INotificationListener} listener - An INotificationListener object.
     */
    public addNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Removes all instances of the listener.
     * @param {INotificationListener} listener - INotificationListener to remove.
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
     * Enable the timer that checks the logger.queue for log messages to be flushed.
     * Note: Since 3.0.1 and 2.8.13 this is no longer an interval timer but is a normal
     * timer that is only started when this function is called and then subsequently
     * only _if_ there are any logger.queue messages to be sent.
     */
    public pollInternalLogs(eventName?: string): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    /**
     * Stop the timer that log messages from logger.queue when available
     */
    public stopPollingInternalLogs(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Add a telemetry processor to decorate or drop telemetry events.
     * @param telemetryInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    public addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler | void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
