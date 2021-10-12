// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore"
import { BaseCore } from "./BaseCore";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IPlugin } from "../JavaScriptSDK.Interfaces/ITelemetryPlugin";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { EventsDiscardedReason } from "../JavaScriptSDK.Enums/EventsDiscardedReason";
import { NotificationManager } from "./NotificationManager";
import { doPerf } from "./PerfManager";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { _InternalLogMessage, DiagnosticLogger } from "./DiagnosticLogger";
import dynamicProto from "@microsoft/dynamicproto-js";
import { arrForEach, isNullOrUndefined, toISOString, throwError } from "./HelperFuncs";

"use strict";

export class AppInsightsCore extends BaseCore implements IAppInsightsCore {
    constructor() {
        super();
        /**
         * Internal log poller
         */
         let _internalLogPoller: number = 0;

        dynamicProto(AppInsightsCore, this, (_self, _base) => {

            _self.initialize = (config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void => {
                _base.initialize(config, extensions, logger || new DiagnosticLogger(config), notificationManager || new NotificationManager(config));
            };
        
            _self.track = (telemetryItem: ITelemetryItem) => {
                doPerf(_self.getPerfMgr(), () => "AppInsightsCore:track", () => {
                    if (telemetryItem === null) {
                        _notifyInvalidEvent(telemetryItem);
                        // throw error
                        throwError("Invalid telemetry item");
                    }
                    
                    // do basic validation before sending it through the pipeline
                    _validateTelemetryItem(telemetryItem);
            
                    _base.track(telemetryItem);
                }, () => ({ item: telemetryItem }), !((telemetryItem as any).sync));
            };
        
            /**
             * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
             * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
             * called.
             * @param {INotificationListener} listener - An INotificationListener object.
             */
            _self.addNotificationListener = (listener: INotificationListener): void => {
                let manager = _self.getNotifyMgr();
                if (manager) {
                    manager.addNotificationListener(listener);
                }
            };
        
            /**
             * Removes all instances of the listener.
             * @param {INotificationListener} listener - INotificationListener to remove.
             */
            _self.removeNotificationListener = (listener: INotificationListener): void => {
                let manager = _self.getNotifyMgr();
                if (manager) {
                    manager.removeNotificationListener(listener);
                }
            }
        
            /**
             * Periodically check logger.queue for log messages to be flushed
             */
            _self.pollInternalLogs = (eventName?: string): number => {
                let interval = _self.config.diagnosticLogInterval;
                if (!interval || !(interval > 0)) {
                    interval = 10000;
                }
                if(_internalLogPoller) {
                    _self.stopPollingInternalLogs();
                }
                _internalLogPoller = setInterval(() => {
                    const queue: _InternalLogMessage[] = _self.logger ? _self.logger.queue : [];
                    arrForEach(queue, (logMessage: _InternalLogMessage) => {
                        const item: ITelemetryItem = {
                            name: eventName ? eventName : "InternalMessageId: " + logMessage.messageId,
                            iKey: _self.config.instrumentationKey,
                            time: toISOString(new Date()),
                            baseType: _InternalLogMessage.dataType,
                            baseData: { message: logMessage.message }
                        };
                        _self.track(item);
                    });
                    queue.length = 0;
                }, interval) as any;
                return _internalLogPoller;
            }

            /**
             * Stop polling log messages from logger.queue
             */
            _self.stopPollingInternalLogs = (): void => {
                if(!_internalLogPoller) return;
                clearInterval(_internalLogPoller);
                _internalLogPoller = 0;
            }

            function _validateTelemetryItem(telemetryItem: ITelemetryItem) {
                if (isNullOrUndefined(telemetryItem.name)) {
                    _notifyInvalidEvent(telemetryItem);
                    throw Error("telemetry name required");
                }
            }
        
            function _notifyInvalidEvent(telemetryItem: ITelemetryItem): void {
                let manager = _self.getNotifyMgr();
                if (manager) {
                    manager.eventsDiscarded([telemetryItem], EventsDiscardedReason.InvalidEvent);
                }
            }
        });
    }

    public initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public track(telemetryItem: ITelemetryItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
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
}
