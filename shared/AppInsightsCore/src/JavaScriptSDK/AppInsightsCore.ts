// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import dynamicProto from "@microsoft/dynamicproto-js";
import { IPromise, createAllSettledPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import {
    ITimerHandler, arrAppend, arrForEach, arrIndexOf, createTimeout, deepExtend, hasDocument, isFunction, isNullOrUndefined, isPlainObject,
    isPromiseLike, objDeepFreeze, objDefine, objForEachKey, objFreeze, objHasOwn, scheduleTimeout, throwError
} from "@nevware21/ts-utils";
import { createDynamicConfig, onConfigChange } from "../Config/DynamicConfig";
import { IConfigDefaults } from "../Config/IConfigDefaults";
import { IDynamicConfigHandler, _IInternalDynamicConfigHandler } from "../Config/IDynamicConfigHandler";
import { IWatchDetails, WatcherFunction } from "../Config/IDynamicWatcher";
import { eEventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { ActiveStatus, eActiveStatus } from "../JavaScriptSDK.Enums/InitActiveStatusEnum";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { TelemetryUnloadReason } from "../JavaScriptSDK.Enums/TelemetryUnloadReason";
import { TelemetryUpdateReason } from "../JavaScriptSDK.Enums/TelemetryUpdateReason";
import { IAppInsightsCore, ILoadedPlugin } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { IChannelControlsHost } from "../JavaScriptSDK.Interfaces/IChannelControlsHost";
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
import { doUnloadAll, runTargetUnload } from "./AsyncUtils";
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
import { IUnloadHookContainer, createUnloadHookContainer } from "./UnloadHookContainer";

const strValidationError = "Plugins must provide initialize method";
const strNotificationManager = "_notificationManager";
const strSdkUnloadingError = "SDK is still unloading...";
const strSdkNotInitialized = "SDK is not initialized";
const maxQueueSize = 500;
// const strPluginUnloadFailed = "Failed to unload plugin";

/**
 * The default settings for the config.
 * WE MUST include all defaults here to ensure that the config is created with all of the properties
 * defined as dynamic.
 */
const defaultConfig: IConfigDefaults<IConfiguration> = objDeepFreeze({
    cookieCfg: {},
    [STR_EXTENSIONS]: { rdOnly: true, ref: true, v: [] },
    [STR_CHANNELS]: { rdOnly: true, ref: true, v:[] },
    [STR_EXTENSION_CONFIG]: { ref: true, v: {} },
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
        theListener = {
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

// Moved this outside of the closure to reduce the retained memory footprint
function _initDebugListener(configHandler: IDynamicConfigHandler<IConfiguration>, unloadContainer: IUnloadHookContainer, notificationManager: INotificationManager, debugListener: INotificationListener) {
    // Will get recalled if any referenced config values are changed
    unloadContainer.add(configHandler.watch((details) => {
        let disableDbgExt = details.cfg.disableDbgExt;

        if (disableDbgExt === true && debugListener) {
            // Remove any previously loaded debug listener
            notificationManager.removeNotificationListener(debugListener);
            debugListener = null;
        }

        if (notificationManager && !debugListener && disableDbgExt !== true) {
            debugListener = getDebugListener(details.cfg);
            notificationManager.addNotificationListener(debugListener);
        }
    }));

    return debugListener
}

// Moved this outside of the closure to reduce the retained memory footprint
function _createUnloadHook(unloadHook: IUnloadHook): IUnloadHook {
    return objDefine<IUnloadHook | any>({
        rm: () => {
            unloadHook.rm();
        }
    }, "toJSON", { v: () => "aicore::onCfgChange<" + JSON.stringify(unloadHook) + ">" });
}

/**
 * @group Classes
 * @group Entrypoint
 */
export class AppInsightsCore<CfgType extends IConfiguration = IConfiguration> implements IAppInsightsCore<CfgType> {
    public config: CfgType;
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
        let _configHandler: IDynamicConfigHandler<CfgType>;
        let _isInitialized: boolean;
        let _logger: IDiagnosticLogger;
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
        let _hookContainer: IUnloadHookContainer;
        let _debugListener: INotificationListener | null;
        let _traceCtx: IDistributedTraceContext | null;
        let _instrumentationKey: string | null;
        let _cfgListeners: { rm: () => void, w: WatcherFunction<CfgType>}[];
        let _extensions: IPlugin[];
        let _pluginVersionStringArr: string[];
        let _pluginVersionString: string;
        let _activeStatus: eActiveStatus; // to indicate if ikey or endpoint url promised is resolved or not
        let _endpoint: string;
    
        /**
         * Internal log poller
         */
        let _internalLogPoller: ITimerHandler;
        let _internalLogPollerListening: boolean;
        let _forceStopInternalLogPoller: boolean;

        dynamicProto(AppInsightsCore, this, (_self) => {

            // Set the default values (also called during teardown)
            _initDefaults();

            // Special internal method to allow the unit tests and DebugPlugin to hook embedded objects
            _self["_getDbgPlgTargets"] = () => {
                return [_extensions, _eventQueue];
            };

            _self.isInitialized = () => _isInitialized;

            // version 3.3.0
            _self.activeStatus = () => _activeStatus;

            // version 3.3.0
            // internal
            _self._setPendingStatus = () => {
                _activeStatus = eActiveStatus.PENDING;  // allow set pending under NONE?
            };

            // Creating the self.initialize = ()
            _self.initialize = (config: CfgType, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                if (_isUnloading) {
                    throwError(strSdkUnloadingError);
                }
        
                // Make sure core is only initialized once
                if (_self.isInitialized()) {
                    throwError("Core cannot be initialized more than once");
                }

                _configHandler = createDynamicConfig<CfgType>(config, defaultConfig as any, logger || _self.logger, false);

                // Re-assigning the local config property so we don't have any references to the passed value and it can be garbage collected
                config = _configHandler.cfg;

                // This will be "re-run" if the referenced config properties are changed
                _addUnloadHook(_configHandler.watch((details) => {
                

                  

                    // app Insights core only handle ikey and endpointurl
                
                    let ikey = details.cfg.instrumentationKey;
                    let endpointUrl = details.cfg.endpointUrl; // do not need to validate endpoint url
                    let isPending = _activeStatus === eActiveStatus.PENDING;
                    
                    if (isPending){
                        // mean waiting for previous promises to be resolved, won't apply new changes
                        return;
                    }

                    if (isNullOrUndefined(ikey)) {
                        _activeStatus = ActiveStatus.INACTIVE;
                        if (!_isInitialized) {
                            // only throw error during initial initialization
                            _throwIKeyErrMsg();
                        } else {
                            _throwInternal(_logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.InvalidInstrumentationKey, "ikey can't be null");
                        }
                        
                        // if ikey is null, should we release queue?
                        _eventQueue = [];
                        return;
                      
                    }

                    let promises: IPromise<string>[] = [];
                    if (isPromiseLike(ikey)) {
                        promises.push(ikey);
                    } else {
                        _instrumentationKey = ikey;
                    }

                    if (isPromiseLike(endpointUrl)) {
                        promises.push(endpointUrl);
                    } else {
                        _endpoint = endpointUrl;
                    }

                    // have at least one promise
                    if (promises.length) {
                        _activeStatus = eActiveStatus.PENDING;
                        let allPromises = createAllSettledPromise<string>(promises);
                        doAwaitResponse(allPromises, (response) => {
                            try {
                                _instrumentationKey = null; // set current local ikey variable
                                if (!response.rejected) {
                                    let values = response.value;
                                    if (values && values.length) {
                                        let ikeyRes = values[0];
                                        let ikeyVal = ikeyRes.value;
                                        if (ikeyVal) {
                                            _instrumentationKey = ikeyVal;
                                            config.instrumentationKey = _instrumentationKey; // should not be set to null
                                        }
                                        
                                        if (values.length > 1) {
                                            let endpointRes = values[1];
                                            _endpoint = endpointRes.value;
                                            config.endpointUrl = _endpoint;
                                        }

                                    }

                                }

                                if (isNullOrUndefined(_instrumentationKey)) {
                                    _activeStatus = ActiveStatus.INACTIVE;
                                    _throwInternal(_logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.InvalidInstrumentationKey, "ikey can't be resolved from promises");
                                } else {
                                    _activeStatus = ActiveStatus.ACTIVE;
                                    _self.releaseQueue();
                                    _self.pollInternalLogs();
                                }

                            } catch (e) {
                                // eslint-disable-next-line
                                _activeStatus = ActiveStatus.INACTIVE;
                            }

                        });
                    } else {
                        // means no promises
                        _activeStatus = ActiveStatus.ACTIVE;
                        _self.releaseQueue();
                        _self.pollInternalLogs();
                        
                       
                    }

                    //_instrumentationKey = details.cfg.instrumentationKey;
                    // Mark the extensionConfig and all first level keys as referenced
                    // This is so that calls to getExtCfg() will always return the same object
                    // Even when a user may "re-assign" the plugin properties (or it's unloaded/reloaded)
                    let extCfg = details.ref(details.cfg, STR_EXTENSION_CONFIG);
                    objForEachKey(extCfg, (key) => {
                        details.ref(extCfg, key);
                    });

                  
                }));

                _notificationManager = notificationManager;

                // Initialize the debug listener outside of the closure to reduce the retained memory footprint
                _debugListener = _initDebugListener(_configHandler, _hookContainer, _notificationManager && _self.getNotifyMgr(), _debugListener);
                _initPerfManager();

                _self.logger = logger;

                let cfgExtensions = config.extensions;

                // Extension validation
                _configExtensions = [];
                _configExtensions.push(...extensions, ...cfgExtensions);
                _channelConfig = config.channels;

                _initPluginChain(null);

                if (!_channels || _channels.length === 0) {
                    throwError("No " + STR_CHANNELS + " available");
                }
                
                if (_channelConfig && _channelConfig.length > 1) {
                    let teeController = _self.getPlugin("TeeChannelController");
                    if (!teeController || !teeController.plugin) {
                        _throwInternal(_logger, eLoggingSeverity.CRITICAL, _eInternalMessageId.SenderNotInitialized, "TeeChannel required");
                    }
                }

                _registerDelayedCfgListener(config, _cfgListeners, _logger);
                _cfgListeners = null;

                _isInitialized = true;
                if (_activeStatus === ActiveStatus.ACTIVE) {
                    _self.releaseQueue();
                    _self.pollInternalLogs();
                }
                
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
            
                    if (!_isUnloading && _self.isInitialized() && _activeStatus === ActiveStatus.ACTIVE) {
                        // Process the telemetry plugin chain
                        _createTelCtx().processNext(telemetryItem);
                    } else if (_activeStatus !== ActiveStatus.INACTIVE){
                        // Queue events until all extensions are initialized
                        if (_eventQueue.length <= maxQueueSize) {
                            // set limit, 500, if full, stop adding new events
                            _eventQueue.push(telemetryItem);
                        }
                     
                    }
                }, () => ({ item: telemetryItem }), !((telemetryItem as any).sync));
            };
        
            _self.getProcessTelContext = _createTelCtx;

            _self.getNotifyMgr = (): INotificationManager => {
                if (!_notificationManager) {
                    _notificationManager = new NotificationManager(_configHandler.cfg);
                    // For backward compatibility only
                    _self[strNotificationManager] = _notificationManager;
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
                    _cookieManager = createCookieMgr(_configHandler.cfg, _self.logger);
                }

                return _cookieManager;
            };

            _self.setCookieMgr = (cookieMgr: ICookieMgr) => {
                if (_cookieManager !== cookieMgr) {
                    runTargetUnload(_cookieManager, false);
    
                    _cookieManager = cookieMgr;
                }
            };

            _self.getPerfMgr = (): IPerfManager => {
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
                        event.iKey = event.iKey || _instrumentationKey;
                        _createTelCtx().processNext(event);
                    });
                }
            };

            _self.pollInternalLogs = (eventName?: string): ITimerHandler => {
                _internalLogsEventName = eventName || null;
                _forceStopInternalLogPoller = false;
                _internalLogPoller && _internalLogPoller.cancel();

                return _startLogPoller(true);
            };

            function _throwIKeyErrMsg() {
                throwError("Please provide instrumentation key");
            }

            function _startLogPoller(alwaysStart?: boolean): ITimerHandler {
                if ((!_internalLogPoller || !_internalLogPoller.enabled) && !_forceStopInternalLogPoller) {
                    let shouldStart = alwaysStart || (_logger && _logger.queue.length > 0);
                    if (shouldStart) {
                        if (!_internalLogPollerListening) {
                            _internalLogPollerListening = true;

                            // listen for any configuration changes so that changes to the
                            // interval will cause the timer to be re-initialized
                            _addUnloadHook(_configHandler.watch((details) => {
                                let interval: number = details.cfg.diagnosticLogInterval;
                                if (!interval || !(interval > 0)) {
                                    interval = 10000;
                                }

                                let isRunning = false;
                                if (_internalLogPoller) {
                                    // It was already created so remember it's running and cancel
                                    isRunning = _internalLogPoller.enabled;
                                    _internalLogPoller.cancel();
                                }

                                // Create / reconfigure
                                _internalLogPoller = createTimeout(_flushInternalLogs, interval) as any;
                                _internalLogPoller.unref();

                                // Restart if previously running
                                _internalLogPoller.enabled = isRunning;
                            }));
                        }

                        _internalLogPoller.enabled = true;
                    }
                }

                return _internalLogPoller;
            }

            _self.stopPollingInternalLogs = (): void => {
                _forceStopInternalLogPoller = true;
                _internalLogPoller && _internalLogPoller.cancel();
                _flushInternalLogs();
            }

            // Add addTelemetryInitializer
            proxyFunctions(_self, () => _telemetryInitializerPlugin, [ "addTelemetryInitializer" ]);

            _self.unload = (isAsync: boolean = true, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void | IPromise<ITelemetryUnloadState> => {
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

                let result: IPromise<ITelemetryUnloadState>;
                if (isAsync && !unloadComplete) {
                    result = createPromise<ITelemetryUnloadState>((resolve) => {
                        // Set the callback to the promise resolve callback
                        unloadComplete = resolve;
                    });
                }

                let processUnloadCtx = createProcessTelemetryUnloadContext(_getPluginChain(), _self);
                processUnloadCtx.onComplete(() => {
                    _hookContainer.run(_self.logger);

                    // Run any "unload" functions for the _cookieManager, _notificationManager and _logger
                    doUnloadAll([_cookieManager, _notificationManager, _logger], isAsync, () => {
                        _initDefaults();
                        unloadComplete && unloadComplete(unloadState);
                    });
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

                return result;
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

            _self.updateCfg = (newConfig: CfgType, mergeExisting: boolean = true) => {
                let updateState: ITelemetryUpdateState;
                if (_self.isInitialized()) {
                    updateState = {
                        reason: TelemetryUpdateReason.ConfigurationChanged,
                        cfg: _configHandler.cfg,
                        oldCfg: deepExtend({}, _configHandler.cfg),
                        newConfig: deepExtend({}, newConfig),
                        merge: mergeExisting
                    };

                    newConfig = updateState.newConfig as CfgType;
                    let cfg =  _configHandler.cfg;

                    // replace the immutable (if initialized) values
                    // We don't currently allow updating the extensions and channels via the update config
                    // So overwriting any user provided values to reuse the existing values
                    (newConfig as any).extensions = cfg.extensions;
                    (newConfig as any).channels = cfg.channels;
                }

                // Explicitly blocking any previous config watchers so that they don't get called because
                // of this bulk update (Probably not necessary)
                (_configHandler as _IInternalDynamicConfigHandler<CfgType>)._block((details) => {

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
                }, true);

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

            _self.onCfgChange = (handler: WatcherFunction<CfgType>): IUnloadHook => {
                let unloadHook: IUnloadHook;
                if (!_isInitialized) {
                    unloadHook = _addDelayedCfgListener(_cfgListeners, handler);
                } else {
                    unloadHook = onConfigChange(_configHandler.cfg, handler, _self.logger);
                }

                return _createUnloadHook(unloadHook);
            };

            _self.getWParam = () => {
                return (hasDocument() || !!_configHandler.cfg.enableWParam) ? 0 : -1;
            };


            function _setPluginVersions() {
                let thePlugins: { [key: string]: IPlugin } = {};

                _pluginVersionStringArr = [];

                const _addPluginVersions = (plugins: IPlugin[]) => {
                    if (plugins) {
                        arrForEach(plugins, (plugin) => {
                            if (plugin.identifier && plugin.version && !thePlugins[plugin.identifier]) {
                                let ver = plugin.identifier + "=" + plugin.version;
                                _pluginVersionStringArr.push(ver);
                                thePlugins[plugin.identifier] = plugin;
                            }
                        });
                    }
                }

                _addPluginVersions(_channels);
                if (_channelConfig) {
                    arrForEach(_channelConfig, (channels) => {
                        _addPluginVersions(channels);
                    });
                }

                _addPluginVersions(_configExtensions);
            }

            function _initDefaults() {
                _isInitialized = false;

                // Use a default logger so initialization errors are not dropped on the floor with full logging
                _configHandler = createDynamicConfig({} as CfgType, defaultConfig as any, _self.logger);

                // Set the logging level to critical so that any critical initialization failures are displayed on the console
                _configHandler.cfg.loggingLevelConsole = eLoggingSeverity.CRITICAL;

                // Define _self.config
                objDefine(_self, "config", {
                    g: () => _configHandler.cfg,
                    s: (newValue) => {
                        _self.updateCfg(newValue, false);
                    }
                });

                objDefine(_self, "pluginVersionStringArr", {
                    g: () => {
                        if (!_pluginVersionStringArr) {
                            _setPluginVersions();
                        }

                        return _pluginVersionStringArr;
                    }
                });

                objDefine(_self, "pluginVersionString", {
                    g: () => {
                        if (!_pluginVersionString) {
                            if (!_pluginVersionStringArr) {
                                _setPluginVersions();
                            }

                            _pluginVersionString = _pluginVersionStringArr.join(";");
                        }

                        return _pluginVersionString || STR_EMPTY;
                    }
                });

                objDefine(_self, "logger", {
                    g: () => {
                        if (!_logger) {
                            _logger = new DiagnosticLogger(_configHandler.cfg);
                            _configHandler.logger = _logger;
                        }

                        return _logger;
                    },
                    s: (newLogger) => {
                        _configHandler.logger = newLogger;
                        if (_logger !== newLogger) {
                            runTargetUnload(_logger, false);
                            _logger = newLogger;
                        }
                    }
                });

                _self.logger = new DiagnosticLogger(_configHandler.cfg);
                _extensions = [];
                let cfgExtensions = _self.config.extensions || [];
                cfgExtensions.splice(0, cfgExtensions.length);
                arrAppend(cfgExtensions, _extensions);

                _telemetryInitializerPlugin = new TelemetryInitializerPlugin();
                _eventQueue = [];
                runTargetUnload(_notificationManager, false);
                _notificationManager = null;
                _perfManager = null;
                _cfgPerfManager = null;
                runTargetUnload(_cookieManager, false);
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
                _hookContainer = createUnloadHookContainer();
                _cfgListeners = [];
                _pluginVersionString = null;
                _pluginVersionStringArr = null;
                _forceStopInternalLogPoller = false;
                _internalLogPoller = null;
                _internalLogPollerListening = false;
                _activeStatus = eActiveStatus.NONE; // default is None
                _endpoint = null;
            }

            function _createTelCtx(): IProcessTelemetryContext {
                let theCtx = createProcessTelemetryContext(_getPluginChain(), _configHandler.cfg, _self);
                theCtx.onComplete(_startLogPoller);

                return theCtx;
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

                // This has a side effect of adding the extensions passed during initialization
                // into the config.extensions, so you can see all of the extensions loaded.
                // This will also get updated by the addPlugin() and remove plugin code.
                let cfgExtensions = _self.config.extensions || [];
                cfgExtensions.splice(0, cfgExtensions.length);
                arrAppend(cfgExtensions, _extensions);

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
                let channelHosts: IChannelControlsHost[] = [];

                arrForEach(_extensions, (ext: any) => {
                    if (ext.identifier === pluginIdentifier && ext !== _telemetryInitializerPlugin) {
                        thePlugin = ext;
                        return -1;
                    }

                    if ((ext as IChannelControlsHost).getChannel) {
                        channelHosts.push(ext as IChannelControlsHost);
                    }
                });

                if (!thePlugin && channelHosts.length > 0) {
                    arrForEach(channelHosts, (host) => {
                        thePlugin = host.getChannel(pluginIdentifier);
                        if (!thePlugin) {
                            return -1;
                        }
                    });
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
                        _startLogPoller();
                    });

                    unloadCtx.processNext(unloadState);
                } else {
                    removeComplete(false);
                }
            }

            function _flushInternalLogs() {
                if (_logger && _logger.queue) {
                    let queue: _InternalLogMessage[] = _logger.queue.slice(0);
                    _logger.queue.length = 0;

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

            function _initPerfManager() {
                // Save the previous config based performance manager creator to avoid creating new perf manager instances if unchanged
                let prevCfgPerfMgr: (core: IAppInsightsCore, notificationManager: INotificationManager) => IPerfManager;

                // Will get recalled if any referenced config values are changed
                _addUnloadHook(_configHandler.watch((details) => {
                    let enablePerfMgr = details.cfg.enablePerfMgr;
                    if (enablePerfMgr) {
                        let createPerfMgr = details.cfg.createPerfMgr;
                        if (prevCfgPerfMgr !== createPerfMgr) {
                            if (!createPerfMgr) {
                                createPerfMgr = _createPerfManager;
                            }

                            // Set the performance manager creation function if not defined
                            getSetValue(details.cfg, STR_CREATE_PERF_MGR, createPerfMgr);
                            prevCfgPerfMgr = createPerfMgr;

                            // Remove any existing config based performance manager
                            _cfgPerfManager = null;
                        }

                        // Only create the performance manager if it's not already created or manually set
                        if (!_perfManager && !_cfgPerfManager && isFunction(createPerfMgr)) {
                            // Create a new config based performance manager
                            _cfgPerfManager = createPerfMgr(_self, _self.getNotifyMgr());
                        }
                    } else {
                        // Remove any existing config based performance manager
                        _cfgPerfManager = null;

                        // Clear the previous cached value so it can be GC'd
                        prevCfgPerfMgr = null;
                    }
                }));
            }

            function _doUpdate(updateState: ITelemetryUpdateState): void {
                let updateCtx = createProcessTelemetryUpdateContext(_getPluginChain(), _self);
                updateCtx.onComplete(_startLogPoller);

                if (!_self._updateHook || _self._updateHook(updateCtx, updateState) !== true) {
                    updateCtx.processNext(updateState);
                }
            }

            function _logOrThrowError(message: string) {
                let logger = _self.logger;
                if (logger) {
                    // there should always be a logger
                    _throwInternal(logger, eLoggingSeverity.WARNING, _eInternalMessageId.PluginException, message);
                    _startLogPoller();
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
                _hookContainer.add(hooks);
            }
        });
    }

    public initialize(config: CfgType, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
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
     * Enable the timer that checks the logger.queue for log messages to be flushed.
     * Note: Since 3.0.1 and 2.8.13 this is no longer an interval timer but is a normal
     * timer that is only started when this function is called and then subsequently
     * only _if_ there are any logger.queue messages to be sent.
     */
    public pollInternalLogs(eventName?: string): ITimerHandler {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
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
     * If you pass isAsync as `true` (also the default) and DO NOT pass a callback function then an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the unload is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @param unloadComplete - An optional callback that will be called once the unload has completed
     * @param cbTimeout - An optional timeout to wait for any flush operations to complete before proceeding with the
     * unload. Defaults to 5 seconds.
     * @return Nothing or if occurring asynchronously a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * which will be resolved once the unload is complete, the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will only be returned when no callback is provided and isAsync is true
     */
    public unload(isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void | IPromise<ITelemetryUnloadState> {
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
    public updateCfg(newConfig: CfgType, mergeExisting?: boolean): void {
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
    public onCfgChange(handler: WatcherFunction<CfgType>): IUnloadHook {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Watches and tracks status of initialization process
     * @returns ActiveStatus
     * @since 3.3.0
     * If returned status is active, it means initialization process is completed.
     * If returned status is pending, it means the initialization process is waiting for promieses to be resolved.
     * If returned status is inactive, it means ikey is invalid or can 't get ikey or enpoint url from promsises.
     */
    public activeStatus(): eActiveStatus | number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Set Active Status to pending, which will block the incoming changes until internal promises are resolved
     * @internal Internal use
     * @since 3.3.0
     */
    public _setPendingStatus(): void {
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
