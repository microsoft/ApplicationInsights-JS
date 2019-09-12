// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryItem } from "./ITelemetryItem";
import { IChannelControls } from "./IChannelControls";
import { IPlugin } from "./ITelemetryPlugin";
import { IConfiguration } from "./IConfiguration";
import { INotificationListener } from "./INotificationListener";
import { IDiagnosticLogger } from './IDiagnosticLogger';

"use strict";

export interface IAppInsightsCore {

    /*
    * Config object used to initialize AppInsights
    */
    config: IConfiguration;

    logger: IDiagnosticLogger;

    /*
    * Initialization queue. Contains functions to run when appInsights initializes
    */        
    initialize(config: IConfiguration, extensions: IPlugin[]): void;

    /*
    * Get transmission controls for controlling transmission behavior
    */
    getTransmissionControls(): IChannelControls[][];

    /*
    * Core track API
    */
    track(telemetryItem: ITelemetryItem): void;

    /**
     * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
     * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
     * called.
     * @param {INotificationListener} listener - An INotificationListener object.
     */
    addNotificationListener?(listener: INotificationListener): void;

    /**
     * Removes all instances of the listener.
     * @param {INotificationListener} listener - INotificationListener to remove.
     */
    removeNotificationListener?(listener: INotificationListener): void;

    pollInternalLogs?(eventName?: string): number;
}
