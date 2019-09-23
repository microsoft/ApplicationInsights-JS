// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { BaseCore } from './BaseCore';
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { IChannelControls } from "../JavaScriptSDK.Interfaces/IChannelControls";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { EventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { NotificationManager } from "./NotificationManager";
import { CoreUtils } from "./CoreUtils";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { _InternalLogMessage, DiagnosticLogger } from "./DiagnosticLogger";

"use strict";

export class AppInsightsCore extends BaseCore implements IAppInsightsCore {
    public baseCore: BaseCore;
    public config: IConfiguration;
    public logger: IDiagnosticLogger;

    protected _notificationManager: NotificationManager;

    constructor() {
        super();
    }

    initialize(config: IConfiguration, extensions: IPlugin[]): void {
        this._notificationManager = new NotificationManager();
        this.logger = new DiagnosticLogger(config);
        this.config = config;
        
        super.initialize(config, extensions, this.logger, this._notificationManager);
    }

    getTransmissionControls(): IChannelControls[][] {
        return super.getTransmissionControls();
    }

    track(telemetryItem: ITelemetryItem) {
        if (telemetryItem === null) {
            this._notifyInvalidEvent(telemetryItem);
            // throw error
            throw Error("Invalid telemetry item");
        }
        
        // do basic validation before sending it through the pipeline
        this._validateTelemetryItem(telemetryItem);

        super.track(telemetryItem);
    }

    /**
     * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
     * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
     * called.
     * @param {INotificationListener} listener - An INotificationListener object.
     */
    addNotificationListener(listener: INotificationListener): void {
        if (this._notificationManager) {
            this._notificationManager.addNotificationListener(listener);
        }
    }

    /**
     * Removes all instances of the listener.
     * @param {INotificationListener} listener - INotificationListener to remove.
     */
    removeNotificationListener(listener: INotificationListener): void {
        if (this._notificationManager) {
            this._notificationManager.removeNotificationListener(listener);
        }
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
            const queue: _InternalLogMessage[] = this.logger ? this.logger.queue : [];

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

    private _validateTelemetryItem(telemetryItem: ITelemetryItem) {

        if (CoreUtils.isNullOrUndefined(telemetryItem.name)) {
            this._notifyInvalidEvent(telemetryItem);
            throw Error("telemetry name required");
        }
    }

    private _notifyInvalidEvent(telemetryItem: ITelemetryItem): void {
        if (this._notificationManager) {
            this._notificationManager.eventsDiscarded([telemetryItem], EventsDiscardedReason.InvalidEvent);
        }
    }
}
