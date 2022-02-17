// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { objCreateFn } from "@microsoft/applicationinsights-shims";
import dynamicProto from "@microsoft/dynamicproto-js";
import { IAppInsightsCore, ILoadedPlugin } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { IProcessTelemetryContext } from "../JavaScriptSDK.Interfaces/IProcessTelemetryContext";
import { createProcessTelemetryContext, createTelemetryProxyChain } from "./ProcessTelemetryContext";
import { initializePlugins, sortPlugins } from "./TelemetryHelpers";
import { LoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { IPerfManager } from "../JavaScriptSDK.Interfaces/IPerfManager";
import { getGblPerfMgr, PerfManager } from "./PerfManager";
import { ICookieMgr } from "../JavaScriptSDK.Interfaces/ICookieMgr";
import { createCookieMgr } from "./CookieMgr";
import { arrForEach, isNullOrUndefined, toISOString, getSetValue, setValue, throwError, isNotTruthy, isFunction, objFreeze, proxyFunctions } from "./HelperFuncs";
import { strExtensionConfig, strIKey } from "./Constants";
import { DiagnosticLogger, _InternalLogMessage } from "./DiagnosticLogger";
import { getDebugListener } from "./DbgExtensionUtils";
import { ITelemetryPluginChain } from "../JavaScriptSDK.Interfaces/ITelemetryPluginChain";
import { ChannelControllerPriority, createChannelControllerPlugin, createChannelQueues, IChannelController, _IInternalChannels } from "./ChannelController";
import { ITelemetryInitializerHandler, TelemetryInitializerFunction } from "../JavaScriptSDK.Interfaces/ITelemetryInitializers";
import { TelemetryInitializerPlugin } from "./TelemetryInitializerPlugin";

const strValidationError = "Plugins must provide initialize method";
const strNotificationManager = "_notificationManager";

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
        if (isNullOrUndefined(ext) || isNullOrUndefined(ext.initialize)) {
            throwError(strValidationError);
        }

        const extPriority = ext.priority;
        const identifier = ext.identifier;

        if (ext && extPriority) {
            if (!isNullOrUndefined(extPriorities[extPriority])) {
                logger.warnToConsole("Two extensions have same priority #" + extPriority + " - " + extPriorities[extPriority] + ", " + identifier);
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

export class BaseCore implements IAppInsightsCore {
    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: IPlugin[];
    public isInitialized: () => boolean;

    constructor() {
        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _isInitialized: boolean;
        let _eventQueue: ITelemetryItem[];
        let _notificationManager: INotificationManager;
        let _perfManager: IPerfManager;
        let _cfgPerfManager: IPerfManager;
        let _cookieManager: ICookieMgr;
        let _pluginChain: ITelemetryPluginChain;
        let _configExtensions: IPlugin[];
        let _coreExtensions: ITelemetryPlugin[];
        let _channelControl: IChannelController;
        let _channelConfig: IChannelControls[][];
        let _channelQueue: _IInternalChannels[];
        let _telemetryInitializerPlugin: TelemetryInitializerPlugin;
        let _internalLogsEventName: string;
        let _debugListener: INotificationListener;

        /**
         * Internal log poller
         */
        let _internalLogPoller: number = 0;

        dynamicProto(BaseCore, this, (_self) => {

            // Set the default values (also called during teardown)
            _initDefaults();

            _self.isInitialized = () => _isInitialized;

            _self.initialize = (config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                // Make sure core is only initialized once
                if (_self.isInitialized()) {
                    throwError("Core should not be initialized more than once");
                }

                if (!config || isNullOrUndefined(config.instrumentationKey)) {
                    throwError("Please provide instrumentation key");
                }

                _notificationManager = notificationManager;

                // For backward compatibility only
                _self[strNotificationManager] = notificationManager;
                _self.config = config || {};

                _initDebugListener(config);
                _initPerfManager(config);

                config.extensions = isNullOrUndefined(config.extensions) ? [] : config.extensions;
        
                // add notification to the extensions in the config so other plugins can access it
                let extConfig = getSetValue(config, strExtensionConfig);
                extConfig.NotificationManager = notificationManager;

                if (logger) {
                    _self.logger = logger;
                }

                // Extension validation
                _configExtensions = [];
                _configExtensions.push(...extensions, ...config.extensions);
                _channelConfig = (config||{}).channels;

                _initPluginChain(config);

                if (_self.getTransmissionControls().length === 0) {
                    throwError("No channels available");
                }
        
                _isInitialized = true;
                _self.releaseQueue();
            };
        
            _self.getTransmissionControls = (): IChannelControls[][] => {
                let controls: IChannelControls[][] = [];
                arrForEach(_channelQueue, (channels) => {
                    controls.push(channels.queue);
                });

                return objFreeze(controls);
            };
        
            _self.track = (telemetryItem: ITelemetryItem) => {
                // setup default iKey if not passed in
                setValue(telemetryItem, strIKey, _self.config.instrumentationKey, null, isNotTruthy);

                // add default timestamp if not passed in
                setValue(telemetryItem, "time", toISOString(new Date()), null, isNotTruthy);

                // Common Schema 4.0
                setValue(telemetryItem, "ver", "4.0", null, isNullOrUndefined);
        
                if (_self.isInitialized()) {
                    // Process the telemetry plugin chain
                    _self.getProcessTelContext().processNext(telemetryItem);
                } else {
                    // Queue events until all extensions are initialized
                    _eventQueue.push(telemetryItem);
                }
            };
        
            _self.getProcessTelContext = (): IProcessTelemetryContext => {
                return createProcessTelemetryContext(_getPluginChain(), _self.config, _self);
            };

            _self.getNotifyMgr = (): INotificationManager => {
                if (!_notificationManager) {
                    // Create Dummy notification manager
                    _notificationManager = objCreateFn({
                        addNotificationListener: (listener: INotificationListener) => { },
                        removeNotificationListener: (listener: INotificationListener) => { },
                        eventsSent: (events: ITelemetryItem[]) => { },
                        eventsDiscarded: (events: ITelemetryItem[], reason: number) => { },
                        eventsSendRequest: (sendReason: number, isAsync: boolean) => { }
                    });

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
                    _cookieManager = createCookieMgr(_self.config, _self.logger);
                }

                return _cookieManager;
            };

            _self.setCookieMgr = (cookieMgr: ICookieMgr) => {
                _cookieManager = cookieMgr;
            };

            _self.getPerfMgr = (): IPerfManager => {
                if (!_perfManager && !_cfgPerfManager) {
                    if (_self.config && _self.config.enablePerfMgr && isFunction(_self.config.createPerfMgr)) {
                        _cfgPerfManager = _self.config.createPerfMgr(_self, _self.getNotifyMgr());
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
                        _self.getProcessTelContext().processNext(event);
                    });
                }
            };

            /**
             * Periodically check logger.queue for log messages to be flushed
             */
             _self.pollInternalLogs = (eventName?: string): number => {
                 _internalLogsEventName = eventName;

                let interval = _self.config.diagnosticLogInterval;
                if (!interval || !(interval > 0)) {
                    interval = 10000;
                }
                if(_internalLogPoller) {
                    clearInterval(_internalLogPoller);
                }
                _internalLogPoller = setInterval(() => {
                    _flushInternalLogs();
                }, interval) as any;

                return _internalLogPoller;
            }

            /**
             * Stop polling log messages from logger.queue
             */
            _self.stopPollingInternalLogs = (): void => {
                if(_internalLogPoller) {
                    clearInterval(_internalLogPoller);
                    _internalLogPoller = 0;
                    _flushInternalLogs();
                }
            }

            // Add addTelemetryInitializer
            proxyFunctions(_self, () => _telemetryInitializerPlugin, [ "addTelemetryInitializer" ]);

            _self.getPlugin = _getPlugin;

            function _initDefaults() {
                _isInitialized = false;

                // Use a default logger so initialization errors are not dropped on the floor with full logging
                _self.logger = new DiagnosticLogger({ loggingLevelConsole: LoggingSeverity.CRITICAL });
                _self.config = null;
                _self._extensions = [];

                _telemetryInitializerPlugin = new TelemetryInitializerPlugin();
                _eventQueue = [];
                _notificationManager = null;
                _perfManager = null;
                _cfgPerfManager = null;
                _cookieManager = null;
                _pluginChain = null;
                _coreExtensions = null;
                _configExtensions = null;
                _channelControl = null;
                _channelConfig = null;
                _channelQueue = null;
                _internalLogsEventName = null;
            }

            // Initialize or Re-initialize the plugins
            function _initPluginChain(config: IConfiguration) {
                // Extension validation
                let theExtensions = _validateExtensions(_self.logger, ChannelControllerPriority, _configExtensions);
            
                _coreExtensions = theExtensions.core;
                _pluginChain = null;
            
                // Sort the complete set of extensions by priority
                let allExtensions = theExtensions.all;

                // Initialize the Channel Queues and the channel plugins first
                _channelQueue = objFreeze(createChannelQueues(_channelConfig, allExtensions, config, _self));
                _channelControl = createChannelControllerPlugin(_channelQueue, _self);

                // Add on "channelController" as the last "plugin"
                allExtensions.push(_channelControl);
                _coreExtensions.push(_channelControl);

                // Required to allow plugins to call core.getPlugin() during their own initialization
                _self._extensions = sortPlugins(allExtensions);

                // Initialize the controls
                _channelControl.initialize(config, _self, allExtensions);
                
                initializePlugins(_self.getProcessTelContext(), allExtensions);

                // Now reset the extensions to just those being managed by Basecore
                _self._extensions = objFreeze(sortPlugins(_coreExtensions || [])).slice();
            }

            function _getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
                let theExt: ILoadedPlugin<T> = null;
                let thePlugin: IPlugin = null;

                arrForEach(_self._extensions, (ext: any) => {
                    if (ext.identifier === pluginIdentifier) {
                        thePlugin = ext;
                        return -1;
                    }
                });

                if (thePlugin) {
                    theExt = {
                        plugin: thePlugin as T
                    }
                }

                return theExt;
            }

            function _getPluginChain() {
                if (!_pluginChain) {
                    // copy the collection of extensions
                    let extensions = (_coreExtensions || []).slice();
            
                    extensions.push(_telemetryInitializerPlugin);

                    _pluginChain = createTelemetryProxyChain(sortPlugins(extensions), _self.config, _self);
                }

                return _pluginChain;
            }

            function _flushInternalLogs() {
                let queue: _InternalLogMessage[] = _self.logger ? _self.logger.queue : [];
                if (queue) {
                    arrForEach(queue, (logMessage: _InternalLogMessage) => {
                        const item: ITelemetryItem = {
                            name: _internalLogsEventName ? _internalLogsEventName : "InternalMessageId: " + logMessage.messageId,
                            iKey: _self.config.instrumentationKey,
                            time: toISOString(new Date()),
                            baseType: _InternalLogMessage.dataType,
                            baseData: { message: logMessage.message }
                        };
                        _self.track(item);
                    });

                    queue.length = 0;
                }
            }

            function _initDebugListener(config: IConfiguration) {

                if (config.disableDbgExt === true && _debugListener) {
                    // Remove any previously loaded debug listener
                    _notificationManager.removeNotificationListener(_debugListener);
                    _debugListener = null;
                }

                if (_notificationManager && !_debugListener && config.disableDbgExt !== true) {
                    _debugListener = getDebugListener(config);
                    _notificationManager.addNotificationListener(_debugListener);
                }
            }

            function _initPerfManager(config: IConfiguration) {
                if (!config.enablePerfMgr && _cfgPerfManager) {
                    // Remove any existing config based performance manager
                    _cfgPerfManager = null;
                }

                if (config.enablePerfMgr) {
                    // Set the performance manager creation function if not defined
                    setValue(_self.config, "createPerfMgr", _createPerfManager);
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
     * Periodically check logger.queue for
     */
    public pollInternalLogs(eventName?: string): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
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
    public addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler | void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
    protected releaseQueue() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
