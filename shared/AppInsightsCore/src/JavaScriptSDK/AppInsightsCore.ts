// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin, ITelemetryPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { EventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { CoreUtils } from "./CoreUtils";
import { NotificationManager } from "./NotificationManager";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { _InternalLogMessage, DiagnosticLogger } from "./DiagnosticLogger";
import { ChannelController } from './ChannelController';

"use strict";

const validationError = "Extensions must provide callback to initialize";

export class AppInsightsCore implements IAppInsightsCore {

    public static defaultConfig: IConfiguration;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: IPlugin[];
    private _notificationManager: NotificationManager;
    private _isInitialized: boolean = false;
    private _channelController: ChannelController;

    constructor() {
        this._extensions = new Array<IPlugin>();
        this._channelController = new ChannelController();
    }

    initialize(config: IConfiguration, extensions: IPlugin[]): void {

        // Make sure core is only initialized once
        if (this._isInitialized) {
            throw Error("Core should not be initialized more than once");
        }

        if (!config || CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
            throw Error("Please provide instrumentation key");
        }

        this.config = config;

        this._notificationManager = new NotificationManager();
        this.config.extensions = CoreUtils.isNullOrUndefined(this.config.extensions) ? [] : this.config.extensions;

        // add notification to the extensions in the config so other plugins can access it
        this.config.extensionConfig = CoreUtils.isNullOrUndefined(this.config.extensionConfig) ? {} : this.config.extensionConfig;
        this.config.extensionConfig.NotificationManager = this._notificationManager;

        this.logger = new DiagnosticLogger(config);

        // Concat all available extensions 
        this._extensions.push(...extensions, ...this.config.extensions);

        // Initial validation 
        this._extensions.forEach((extension: ITelemetryPlugin) => {
            let isValid = true;
            if (CoreUtils.isNullOrUndefined(extension) || CoreUtils.isNullOrUndefined(extension.initialize)) {
                isValid = false;
            }
            if (!isValid) {
                throw Error(validationError);
            }
        });

        // Initial validation complete

        this._extensions.push(this._channelController);
        // Sort by priority
        this._extensions = this._extensions.sort((a, b) => {
            const extA = (a as ITelemetryPlugin);
            const extB = (b as ITelemetryPlugin);
            const typeExtA = typeof extA.processTelemetry;
            const typeExtB = typeof extB.processTelemetry;
            if (typeExtA === 'function' && typeExtB === 'function') {
                return extA.priority - extB.priority;
            }

            if (typeExtA === 'function' && typeExtB !== 'function') {
                // keep non telemetryplugin specific extensions at start
                return 1;
            }

            if (typeExtA !== 'function' && typeExtB === 'function') {
                return -1;
            }
        });
        // sort complete

        // Check if any two extensions have the same priority, then warn to console
        const priority = {};
        this._extensions.forEach(ext => {
            const t = (ext as ITelemetryPlugin);
            if (t && t.priority) {
                if (!CoreUtils.isNullOrUndefined(priority[t.priority])) {
                    this.logger.warnToConsole("Two extensions have same priority" + priority[t.priority] + ", " + t.identifier);
                } else {
                    priority[t.priority] = t.identifier; // set a value
                }
            }
        });

        let c = -1;
        // Set next plugin for all until channel controller
        for (let idx = 0; idx < this._extensions.length - 1; idx++) {
            const curr = (this._extensions[idx]) as ITelemetryPlugin;
            if (curr && typeof curr.processTelemetry !== 'function') {
                // these are initialized only, allowing an entry point for extensions to be initialized when SDK initializes
                continue;
            }

            if (curr.priority === this._channelController.priority) {
                c = idx + 1;
                break; // channel controller will set remaining pipeline
            }

            (this._extensions[idx] as any).setNextPlugin(this._extensions[idx + 1]); // set next plugin
        }

        // initialize channel controller first, this will initialize all channel plugins
        this._channelController.initialize(this.config, this, this._extensions);

        // initialize remaining regular plugins
        this._extensions.forEach(ext => {
            const e = ext as ITelemetryPlugin;
            if (e && e.priority < this._channelController.priority) {
                ext.initialize(this.config, this, this._extensions); // initialize
            }
        });

        // Remove sender channels from main list
        if (c < this._extensions.length) {
            this._extensions.splice(c);
        }

        if (this.getTransmissionControls().length === 0) {
            throw new Error("No channels available");
        }
        this._isInitialized = true;
    }

    getTransmissionControls(): IChannelControls[][] {
        return this._channelController.ChannelControls;
    }

    track(telemetryItem: ITelemetryItem) {
        if (telemetryItem === null) {
            this._notifyInvalidEvent(telemetryItem);
            // throw error
            throw Error("Invalid telemetry item");
        }

        if (!telemetryItem.iKey) {
            // setup default iKey if not passed in
            telemetryItem.iKey = this.config.instrumentationKey;
        }
        if (!telemetryItem.time) {
            // add default timestamp if not passed in
            telemetryItem.time = new Date().toISOString();
        }
        if (CoreUtils.isNullOrUndefined(telemetryItem.ver)) {
            // CommonSchema 4.0
            telemetryItem.ver = "4.0";
        }

        // do basic validation before sending it through the pipeline
        this._validateTelmetryItem(telemetryItem);

        // invoke any common telemetry processors before sending through pipeline
        if (this._extensions.length === 0) {
            this._channelController.processTelemetry(telemetryItem); // Pass to Channel controller so data is sent to correct channel queues
        }
        let i = 0;
        while (i < this._extensions.length) {
            if ((this._extensions[i] as any).processTelemetry) {
                (this._extensions[i] as any).processTelemetry(telemetryItem); // pass on to first extension that can support processing
                break;
            }

            i++;
        }
    }

    /**
     * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
     * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
     * called.
     * @param {INotificationListener} listener - An INotificationListener object.
     */
    addNotificationListener(listener: INotificationListener): void {
        this._notificationManager.addNotificationListener(listener);
    }

    /**
     * Removes all instances of the listener.
     * @param {INotificationListener} listener - INotificationListener to remove.
     */
    removeNotificationListener(listener: INotificationListener): void {
        this._notificationManager.removeNotificationListener(listener);
    }

    /**
     * Periodically check logger.queue for
     */
    pollInternalLogs(eventName?: string): number {
        let interval = this.config.diagnosticLogInterval;
        if (!(interval > 0)) {
            interval = 10000;
        }

        return setInterval(() => {
            const queue: _InternalLogMessage[] = this.logger.queue;

            queue.forEach((logMessage: _InternalLogMessage) => {
                const item: ITelemetryItem = {
                    name: eventName ? eventName : "InternalMessageId: " + logMessage.messageId,
                    iKey: this.config.instrumentationKey,
                    time: new Date().toISOString(),
                    baseType: _InternalLogMessage.dataType,
                    baseData: { message: logMessage.message }
                };

                this.track(item);
            });
            queue.length = 0;
        }, interval) as any;
    }

    private _validateTelmetryItem(telemetryItem: ITelemetryItem) {

        if (CoreUtils.isNullOrUndefined(telemetryItem.name)) {
            this._notifyInvalidEvent(telemetryItem);
            throw Error("telemetry name required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.time)) {
            this._notifyInvalidEvent(telemetryItem);
            throw Error("telemetry timestamp required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.iKey)) {
            this._notifyInvalidEvent(telemetryItem);
            throw Error("telemetry instrumentationKey required");
        }
    }

    private _notifyInvalidEvent(telemetryItem: ITelemetryItem): void {
        this._notificationManager.eventsDiscarded([telemetryItem], EventsDiscardedReason.InvalidEvent);
    }
}

