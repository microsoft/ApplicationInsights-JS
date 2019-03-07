// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryPlugin, IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls, MinChannelPriorty } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { EventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { CoreUtils } from "./CoreUtils";
import { NotificationManager } from "./NotificationManager";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { _InternalLogMessage, DiagnosticLogger } from "./DiagnosticLogger";

"use strict";

export class AppInsightsCore implements IAppInsightsCore {

    public config: IConfiguration;
    public static defaultConfig: IConfiguration;
    public logger: IDiagnosticLogger;

    public _extensions: Array<IPlugin>;
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

        // Initial validation
        extensions.forEach((extension: ITelemetryPlugin) => {
            if (CoreUtils.isNullOrUndefined(extension.initialize)) {
                throw Error(validationError);
            }
        });

        if (this.config.extensions.length > 0) {
            let isValid = true;
            let containsChannels = false;
            this.config.extensions.forEach(item =>
            {
                if (CoreUtils.isNullOrUndefined(item)) {
                    isValid = false;
                }

                if (item.priority > ChannelControllerPriority) {
                    containsChannels = true;
                }
            });

            if (!isValid) {
                throw Error(validationError);
            }

            if (containsChannels) {
                throw Error(validationErrorInExt);
            }
        }
        // Initial validation complete

        // Concat all available extensions before sorting by priority
        this._extensions.push(this._channelController, ...extensions, ...this.config.extensions);
        this._extensions = this._extensions.sort((a, b) => {
            let extA = (<ITelemetryPlugin>a);
            let extB = (<ITelemetryPlugin>b);
            let typeExtA = typeof extA.processTelemetry;
            let typeExtB = typeof extB.processTelemetry;
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
        let priority = {};
        this._extensions.forEach(ext => {
            let t = (<ITelemetryPlugin>ext);
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
            let curr = <ITelemetryPlugin>(this._extensions[idx]);
            if (curr && typeof curr.processTelemetry !== 'function') {
                // these are initialized only, allowing an entry point for extensions to be initialized when SDK initializes
                continue;
            }

            if (curr.priority === ChannelControllerPriority) {
                c = idx + 1;
                break; // channel controller will set remaining pipeline
            }

            (<any>this._extensions[idx]).setNextPlugin(this._extensions[idx + 1]); // set next plugin
        }

        // initialize channel controller first, this will initialize all channel plugins
        this._channelController.initialize(this.config, this, this._extensions);

        // initialize remaining regular plugins
        this._extensions.forEach(ext => {
            let e = ext as ITelemetryPlugin;
            if (e && e.priority < ChannelControllerPriority) {
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

    getTransmissionControls(): Array<IChannelControls[]> {
       return this._channelController.ChannelControls;
    }

    track(telemetryItem: ITelemetryItem) {
        if (telemetryItem === null) {
            this._notifiyInvalidEvent(telemetryItem);
            // throw error
            throw Error("Invalid telemetry item");
        }

        if (telemetryItem.baseData && !telemetryItem.baseType) {
            this._notifiyInvalidEvent(telemetryItem);
            throw Error("Provide data.baseType for data.baseData");
        }

        if (!telemetryItem.baseType) {
            // Hard coded from Common::Event.ts::Event.dataType
            telemetryItem.baseType = "EventData";
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

        this._updateSdkVersion(telemetryItem);

        // invoke any common telemetry processors before sending through pipeline
        let i = 0;
        while (i < this._extensions.length) {
            if ((<any>this._extensions[i]).processTelemetry) {
                (<any>this._extensions[i]).processTelemetry(telemetryItem); // pass on to first extension that can support processing
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
    pollInternalLogs(): number {
        let interval = this.config.diagnosticLogInterval;
        if (!(interval > 0)) {
            interval = 10000;
        }

        return <any>setInterval(() => {
            const queue: Array<_InternalLogMessage> = this.logger.queue;

            queue.forEach((logMessage: _InternalLogMessage) => {
                const item: ITelemetryItem = {
                    name: "InternalMessageId: " + logMessage.messageId,
                    iKey: this.config.instrumentationKey,
                    time: new Date().toISOString(),
                    baseType: _InternalLogMessage.dataType,
                    baseData: { message: logMessage.message }
                };

                this.track(item);
            });
            queue.length = 0;
        }, interval);
    }

    private _validateTelmetryItem(telemetryItem: ITelemetryItem) {

        if (CoreUtils.isNullOrUndefined(telemetryItem.name)) {
            this._notifiyInvalidEvent(telemetryItem);
            throw Error("telemetry name required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.time)) {
            this._notifiyInvalidEvent(telemetryItem);
            throw Error("telemetry timestamp required");
        }

        if (CoreUtils.isNullOrUndefined(telemetryItem.iKey)) {
            this._notifiyInvalidEvent(telemetryItem);
            throw Error("telemetry instrumentationKey required");
        }
    }

    private _updateSdkVersion(telemetryItem: ITelemetryItem) {

        if (!telemetryItem.ext) {
            telemetryItem.ext = {};
        }

        if (!telemetryItem.ext.sdk) {
            telemetryItem.ext.sdk = {};
        }

        let version = "";
        for(let i = 0; i < this._extensions.length; i++ ) {
            let ext = this._extensions[i];
            if (ext.identifier && ext.version) {
                let str = `${ext.identifier}:${ext.version};`;
                version = version.concat(str);
            }
        }

        if (version != "") {
            telemetryItem.ext.sdk['libVer'] = version;
        }
    }

    private _notifiyInvalidEvent(telemetryItem: ITelemetryItem): void {
        this._notificationManager.eventsDiscarded([telemetryItem], EventsDiscardedReason.InvalidEvent);
    }
}

class ChannelController implements ITelemetryPlugin {

    private channelQueue: Array<IChannelControls[]>;

    public processTelemetry (item: ITelemetryItem) {
        this.channelQueue.forEach(queues => {
            // pass on to first item in queue
            if (queues.length > 0) {
                queues[0].processTelemetry(item);
            }
        });
    }

    public get ChannelControls(): Array<IChannelControls[]> {
        return this.channelQueue;
    }

    identifier: string = "ChannelControllerPlugin";

    setNextPlugin: (next: ITelemetryPlugin) => {}; // channel controller is last in pipeline

    priority: number = ChannelControllerPriority; // in reserved range 100 to 200

    initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        this.channelQueue = new Array<IChannelControls[]>();
        if (config.channels) {
            let invalidChannelIdentifier = undefined;
            config.channels.forEach(queue => {

                if(queue && queue.length > 0) {
                    queue = queue.sort((a,b) => { // sort based on priority within each queue
                        return a.priority - b.priority;
                    });

                    // Initialize each plugin
                    queue.forEach(queueItem => {
                        if (queueItem.priority < ChannelControllerPriority) {
                            invalidChannelIdentifier = queueItem.identifier;
                        }
                        queueItem.initialize(config, core, extensions)
                    });

                    if (invalidChannelIdentifier) {
                        throw Error(ChannelValidationMessage + invalidChannelIdentifier);
                    }

                    for (let i = 1; i < queue.length; i++) {
                        queue[i - 1].setNextPlugin(queue[i]); // setup processing chain
                    }

                    this.channelQueue.push(queue);
                }
            });
        } else {
            let arr = new Array<IChannelControls>();

            for (let i = 0; i < extensions.length; i++) {
                let plugin = <IChannelControls>extensions[i];
                if (plugin.priority > ChannelControllerPriority) {
                    arr.push(plugin);
                }
            }

            if (arr.length > 0) {
                // sort if not sorted
                arr = arr.sort((a,b) => {
                    return a.priority - b.priority;
                });

                // Initialize each plugin
                arr.forEach(queueItem => queueItem.initialize(config, core, extensions));

                // setup next plugin
                for (let i = 1; i < arr.length; i++) {
                    arr[i - 1].setNextPlugin(arr[i]);
                }

                               this.channelQueue.push(arr);
            }
        }
    }
}

const validationError = "Extensions must provide callback to initialize";
const validationErrorInExt = "Channels must be provided through config.channels only";
const ChannelControllerPriority = 500;
const ChannelValidationMessage = "Channel has invalid priority";
