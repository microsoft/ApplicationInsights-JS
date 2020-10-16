// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { CoreUtils } from "./CoreUtils";
import { INotificationManager } from '../JavaScriptSDK.Interfaces/INotificationManager';
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { ChannelController } from './ChannelController';
import { IProcessTelemetryContext } from '../JavaScriptSDK.Interfaces/IProcessTelemetryContext';
import { ProcessTelemetryContext } from './ProcessTelemetryContext';
import { initializePlugins, sortPlugins } from './TelemetryHelpers';
import { _InternalMessageId, LoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import dynamicProto from '@microsoft/dynamicproto-js';
import { IPerfManager } from "../JavaScriptSDK.Interfaces/IPerfManager";
import { PerfManager } from "./PerfManager";

const validationError = "Extensions must provide callback to initialize";

const _arrForEach = CoreUtils.arrForEach;
const _isNullOrUndefined = CoreUtils.isNullOrUndefined;
const strNotificationManager = "_notificationManager";

export class BaseCore implements IAppInsightsCore {
    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: IPlugin[];
    public isInitialized: () => boolean;

    constructor() {
        let _isInitialized = false;
        let _eventQueue: ITelemetryItem[];
        let _channelController: ChannelController;
        let _notificationManager: INotificationManager;
        let _perfManager: IPerfManager;
    
        dynamicProto(BaseCore, this, (_self) => {
            _self._extensions = new Array<IPlugin>();
            _channelController = new ChannelController();
            _self.logger = CoreUtils.objCreate({
                throwInternal: (severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) => { },
                warnToConsole: (message: string) => { },
                resetInternalMessageCount: () => { }
            });
            
            _eventQueue = [];
            _self.isInitialized = () => _isInitialized;

            _self.initialize = (config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                // Make sure core is only initialized once
                if (_self.isInitialized()) {
                    throw Error("Core should not be initialized more than once");
                }
        
                if (!config || _isNullOrUndefined(config.instrumentationKey)) {
                    throw Error("Please provide instrumentation key");
                }
        
                _notificationManager = notificationManager;

                // For backward compatibility only
                _self[strNotificationManager] = notificationManager;
               
                _self.config = config || {};
        
                config.extensions = _isNullOrUndefined(config.extensions) ? [] : config.extensions;
        
                // add notification to the extensions in the config so other plugins can access it
                let extConfig = config.extensionConfig = _isNullOrUndefined(config.extensionConfig) ? {} : config.extensionConfig;
                extConfig.NotificationManager = notificationManager;

                if (logger) {
                    _self.logger = logger;
                }
        
                // Concat all available extensions
                let allExtensions = [];
                allExtensions.push(...extensions, ...config.extensions);
                allExtensions = sortPlugins(allExtensions);
        
                let coreExtensions: any[] = [];
                let channelExtensions: any[] = [];
        
                // Check if any two extensions have the same priority, then warn to console
                // And extract the local extensions from the 
                const extPriorities = {};
        
                // Extension validation
                _arrForEach(allExtensions, (ext: ITelemetryPlugin) => {
                    if (_isNullOrUndefined(ext) || _isNullOrUndefined(ext.initialize)) {
                        throw Error(validationError);
                    }
        
                    const extPriority = ext.priority;
                    const identifier = ext.identifier;
        
                    if (ext && extPriority) {
                        if (!_isNullOrUndefined(extPriorities[extPriority])) {
                            logger.warnToConsole("Two extensions have same priority #" + extPriority + " - " + extPriorities[extPriority] + ", " + identifier);
                        } else {
                            // set a value
                            extPriorities[extPriority] = identifier;
                        }
                    }
        
                    // Split extensions to core and channelController
                    if (!extPriority || extPriority < _channelController.priority) {
                        // Add to core extension that will be managed by BaseCore
                        coreExtensions.push(ext);
                    } else {
                        // Add all other extensions to be managed by the channel controller
                        channelExtensions.push(ext);
                    }
                });
                // Validation complete
        
                // Add the channelController to the complete extension collection and
                // to the end of the core extensions
                allExtensions.push(_channelController);
                coreExtensions.push(_channelController);
        
                // Sort the complete set of extensions by priority
                allExtensions = sortPlugins(allExtensions);
                _self._extensions = allExtensions;
        
                // initialize channel controller first, this will initialize all channel plugins
                initializePlugins(new ProcessTelemetryContext([_channelController], config, _self), allExtensions);
                initializePlugins(new ProcessTelemetryContext(coreExtensions, config, _self), allExtensions);
        
                // Now reset the extensions to just those being managed by Basecore
                _self._extensions = coreExtensions;
        
                if (_self.getTransmissionControls().length === 0) {
                    throw new Error("No channels available");
                }
        
                _isInitialized = true;
                _self.releaseQueue();
            };
        
            _self.getTransmissionControls = (): IChannelControls[][] => {
                return _channelController.getChannelControls();
            };
        
            _self.track = (telemetryItem: ITelemetryItem) => {
                if (!telemetryItem.iKey) {
                    // setup default iKey if not passed in
                    telemetryItem.iKey = _self.config.instrumentationKey;
                }
                if (!telemetryItem.time) {
                    // add default timestamp if not passed in
                    telemetryItem.time = CoreUtils.toISOString(new Date());
                }
                if (_isNullOrUndefined(telemetryItem.ver)) {
                    // CommonSchema 4.0
                    telemetryItem.ver = "4.0";
                }
        
                if (_self.isInitialized()) {
                    // Process the telemetry plugin chain
                    _self.getProcessTelContext().processNext(telemetryItem);
                } else {
                    // Queue events until all extensions are initialized
                    _eventQueue.push(telemetryItem);
                }
            };
        
            _self.getProcessTelContext = (): IProcessTelemetryContext => {
                let extensions = _self._extensions;
                let thePlugins: IPlugin[] = extensions;
        
                // invoke any common telemetry processors before sending through pipeline
                if (!extensions || extensions.length === 0) {
                    // Pass to Channel controller so data is sent to correct channel queues
                    thePlugins = [_channelController];
                }
        
                return new ProcessTelemetryContext(thePlugins, _self.config, _self);
            };

            _self.getNotifyMgr = (): INotificationManager => {
                if (!_notificationManager) {
                    // Create Dummy notification manager
                    _notificationManager = CoreUtils.objCreate({
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
        
            _self.getPerfMgr = (): IPerfManager => {
                if (!_perfManager) {
                    if (_self.config &&  _self.config.enablePerfMgr) {
                        _perfManager = new PerfManager(_self.getNotifyMgr());
                    }
                }

                return _perfManager;
            };

            _self.setPerfMgr = (perfMgr: IPerfManager) => {
                _perfManager = perfMgr;
            };

            _self.eventCnt = (): number => {
                return _eventQueue.length;
            };

            _self.releaseQueue = () => {
                if (_eventQueue.length > 0) {
                    _arrForEach(_eventQueue, (event: ITelemetryItem) => {
                        _self.getProcessTelContext().processNext(event);
                    });

                    _eventQueue = [];
                }
            };
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

    protected releaseQueue() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

}
