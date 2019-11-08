// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { CoreUtils } from "./CoreUtils";
import { INotificationManager } from '../JavaScriptSDK.Interfaces/INotificationManager';
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { ChannelController } from './ChannelController';

"use strict";

const validationError = "Extensions must provide callback to initialize";

export class BaseCore implements IAppInsightsCore {

    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: IPlugin[];
    protected _notificationManager: INotificationManager;
    private _isInitialized: boolean = false;
    private _channelController: ChannelController;

    constructor() {
        this._extensions = new Array<IPlugin>();
        this._channelController = new ChannelController();
    }

    initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
        let _this = this;
        // Make sure core is only initialized once
        if (_this._isInitialized) {
            throw Error("Core should not be initialized more than once");
        }

        if (!config || CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
            throw Error("Please provide instrumentation key");
        }

        _this.config = config;

        _this._notificationManager = notificationManager;
        if (!_this._notificationManager) {
            _this._notificationManager = CoreUtils.objCreate({
                addNotificationListener: (listener) => {},
                removeNotificationListener: (listener) => {},
                eventsSent: (events) => {},
                eventsDiscarded: (events: ITelemetryItem[], reason: number) => {}
            })
        }

        _this.config.extensions = CoreUtils.isNullOrUndefined(_this.config.extensions) ? [] : _this.config.extensions;

        // add notification to the extensions in the config so other plugins can access it
        _this.config.extensionConfig = CoreUtils.isNullOrUndefined(_this.config.extensionConfig) ? {} : _this.config.extensionConfig;
        if (_this._notificationManager) {
            _this.config.extensionConfig.NotificationManager = _this._notificationManager;
        }

        _this.logger = logger;
        if (!_this.logger) {
            _this.logger = CoreUtils.objCreate({
                throwInternal: (severity, msgId, msg: string, properties?: Object, isUserAct = false) => {},
                warnToConsole: (message: string) => {},
                resetInternalMessageCount: () => {}
            })
        }

        // Concat all available extensions 
        _this._extensions.push(...extensions, ..._this.config.extensions);

        // Initial validation 
        CoreUtils.arrForEach(_this._extensions, (extension: ITelemetryPlugin) => {
            let isValid = true;
            if (CoreUtils.isNullOrUndefined(extension) || CoreUtils.isNullOrUndefined(extension.initialize)) {
                isValid = false;
            }
            if (!isValid) {
                throw Error(validationError);
            }
        });

        // Initial validation complete

        _this._extensions.push(_this._channelController);
        // Sort by priority
        _this._extensions = _this._extensions.sort((a, b) => {
            const extA = (a as ITelemetryPlugin);
            const extB = (b as ITelemetryPlugin);
            const typeExtA = CoreUtils.isFunction(extA.processTelemetry);
            const typeExtB = CoreUtils.isFunction(extB.processTelemetry);
            if (typeExtA && typeExtB) {
                return extA.priority - extB.priority;
            }

            if (typeExtA && !typeExtB) {
                // keep non telemetryplugin specific extensions at start
                return 1;
            }

            if (!typeExtA && typeExtB) {
                return -1;
            }
        });
        // sort complete

        // Check if any two extensions have the same priority, then warn to console
        const priority = {};
        CoreUtils.arrForEach(_this._extensions, ext => {
            const t = (ext as ITelemetryPlugin);
            if (t && t.priority) {
                if (!CoreUtils.isNullOrUndefined(priority[t.priority])) {
                    if (_this.logger) {
                        _this.logger.warnToConsole("Two extensions have same priority" + priority[t.priority] + ", " + t.identifier);
                    }
                } else {
                    priority[t.priority] = t.identifier; // set a value
                }
            }
        });

        let c = -1;
        // Set next plugin for all until channel controller
        for (let idx = 0; idx < _this._extensions.length - 1; idx++) {
            const curr = (_this._extensions[idx]) as ITelemetryPlugin;
            if (curr && !CoreUtils.isFunction(curr.processTelemetry)) {
                // these are initialized only, allowing an entry point for extensions to be initialized when SDK initializes
                continue;
            }

            if (curr.priority === _this._channelController.priority) {
                c = idx + 1;
                break; // channel controller will set remaining pipeline
            }

            (_this._extensions[idx] as any).setNextPlugin(_this._extensions[idx + 1]); // set next plugin
        }

        // initialize channel controller first, this will initialize all channel plugins
        _this._channelController.initialize(_this.config, _this, _this._extensions);

        // initialize remaining regular plugins
        CoreUtils.arrForEach(_this._extensions, ext => {
            const e = ext as ITelemetryPlugin;
            if (e && e.priority < _this._channelController.priority) {
                ext.initialize(_this.config, _this, _this._extensions); // initialize
            }
        });

        // Remove sender channels from main list
        if (c < _this._extensions.length) {
            _this._extensions.splice(c);
        }

        if (_this.getTransmissionControls().length === 0) {
            throw new Error("No channels available");
        }
        _this._isInitialized = true;
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
        if (CoreUtils.isNullOrUndefined(telemetryItem.ver)) {
            // CommonSchema 4.0
            telemetryItem.ver = "4.0";
        }

        // invoke any common telemetry processors before sending through pipeline
        if (_this._extensions.length === 0) {
            _this._channelController.processTelemetry(telemetryItem); // Pass to Channel controller so data is sent to correct channel queues
        }
        let i = 0;
        while (i < _this._extensions.length) {
            if ((_this._extensions[i] as any).processTelemetry) {
                (_this._extensions[i] as any).processTelemetry(telemetryItem); // pass on to first extension that can support processing
                break;
            }

            i++;
        }
    }
}
