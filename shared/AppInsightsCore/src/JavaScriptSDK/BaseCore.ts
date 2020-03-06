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

const validationError = "Extensions must provide callback to initialize";

const _arrForEach = CoreUtils.arrForEach;
const _isNullOrUndefined = CoreUtils.isNullOrUndefined;

export class BaseCore implements IAppInsightsCore {
    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: IPlugin[];
    public isInitialized: () => boolean;
    protected _notificationManager: INotificationManager;
    private _eventQueue: ITelemetryItem[];
    private _channelController: ChannelController;
    private _setInit: (value: boolean) => void;

    constructor() {
        let _isInitialized = false;
        let _this = this;
        _this._extensions = new Array<IPlugin>();
        _this._channelController = new ChannelController();
        _this.isInitialized = () => _isInitialized;
        _this._setInit = (value: boolean) => { _isInitialized = value; }
        _this._eventQueue = [];
    }

    initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
        let _this = this;

        // Make sure core is only initialized once
        if (_this.isInitialized()) {
            throw Error("Core should not be initialized more than once");
        }

        if (!config || _isNullOrUndefined(config.instrumentationKey)) {
            throw Error("Please provide instrumentation key");
        }

        _this.config = config;
        let channelController = _this._channelController;

        if (!notificationManager) {
            // Create Dummy notification manager
            notificationManager = CoreUtils.objCreate({
                addNotificationListener: (listener: INotificationListener) => { },
                removeNotificationListener: (listener: INotificationListener) => { },
                eventsSent: (events: ITelemetryItem[]) => { },
                eventsDiscarded: (events: ITelemetryItem[], reason: number) => { }
            })
        }

        _this._notificationManager = notificationManager as INotificationManager;
        config.extensions = _isNullOrUndefined(config.extensions) ? [] : config.extensions;

        // add notification to the extensions in the config so other plugins can access it
        let extConfig = config.extensionConfig = _isNullOrUndefined(config.extensionConfig) ? {} : config.extensionConfig;
        extConfig.NotificationManager = notificationManager;

        if (!logger) {
            logger = CoreUtils.objCreate({
                throwInternal: (severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct = false) => { },
                warnToConsole: (message: string) => { },
                resetInternalMessageCount: () => { }
            });
        }
        _this.logger = logger;

        // Concat all available extensions
        let allExtensions = [];
        allExtensions.push(...extensions, ...config.extensions);
        allExtensions = sortPlugins(allExtensions);

        let coreExtensions:any[] = [];
        let channelExtensions:any[] = [];

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
            if (!extPriority || extPriority < channelController.priority) {
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
        allExtensions.push(channelController);
        coreExtensions.push(channelController);

        // Sort the complete set of extensions by priority
        allExtensions = sortPlugins(allExtensions);
        _this._extensions = allExtensions;

        // initialize channel controller first, this will initialize all channel plugins
        initializePlugins(new ProcessTelemetryContext([channelController], config, _this), allExtensions);
        initializePlugins(new ProcessTelemetryContext(coreExtensions, config, _this), allExtensions);

        // Now reset the extensions to just those being managed by Basecore
        _this._extensions = coreExtensions;

        if (_this.getTransmissionControls().length === 0) {
            throw new Error("No channels available");
        }

        _this._setInit(true);
    }

    getTransmissionControls(): IChannelControls[][] {
        return this._channelController.getChannelControls();
    }

    track(telemetryItem: ITelemetryItem) {
        let _this = this;
        if (!telemetryItem.iKey) {
            // setup default iKey if not passed in
            telemetryItem.iKey = _this.config.instrumentationKey;
        }
        if (!telemetryItem.time) {
            // add default timestamp if not passed in
            telemetryItem.time = CoreUtils.toISOString(new Date());
        }
        if (_isNullOrUndefined(telemetryItem.ver)) {
            // CommonSchema 4.0
            telemetryItem.ver = "4.0";
        }

        if (_this.isInitialized()) {
            // Release queue
            if (_this._eventQueue.length > 0) {
                _arrForEach(_this._eventQueue, (event: ITelemetryItem) => {
                    _this.getProcessTelContext().processNext(event);
                });
                _this._eventQueue = [];
            }
            // Process the telemetry plugin chain
            _this.getProcessTelContext().processNext(telemetryItem);
        } else {
            // Queue events until all extensions are initialized
            _this._eventQueue.push(telemetryItem);
        }
    }

    getProcessTelContext(): IProcessTelemetryContext {
        let _this = this;
        let extensions = _this._extensions;
        let thePlugins: IPlugin[] = extensions;

        // invoke any common telemetry processors before sending through pipeline
        if (!extensions || extensions.length === 0) {
            // Pass to Channel controller so data is sent to correct channel queues
            thePlugins = [_this._channelController];
        }

        return new ProcessTelemetryContext(thePlugins, _this.config, _this);
    }
}
