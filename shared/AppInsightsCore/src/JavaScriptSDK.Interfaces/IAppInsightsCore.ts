// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryItem } from "./ITelemetryItem";
import { IChannelControls } from "./IChannelControls";
import { IPlugin } from "./ITelemetryPlugin";
import { IConfiguration } from "./IConfiguration";
import { INotificationManager } from "./INotificationManager";
import { INotificationListener } from "./INotificationListener";
import { IDiagnosticLogger } from "./IDiagnosticLogger";
import { IProcessTelemetryContext } from "./IProcessTelemetryContext";
import { IPerfManagerProvider } from "./IPerfManager";
import { ICookieMgr } from "./ICookieMgr";
import { ITelemetryInitializerHandler, TelemetryInitializerFunction } from "./ITelemetryInitializers";

export interface ILoadedPlugin<T extends IPlugin> {
    plugin: T;

    /**
     * Identifies whether the plugin is enabled and can process events. This is slightly different from isInitialized as the plugin may be initialized but disabled
     * via the setEnabled() or it may be a shared plugin which has had it's teardown function called from another instance..
     * @returns boolean = true if the plugin is in a state where it is operational.
     */
    isEnabled: () => boolean;

    /**
     * You can optionally enable / disable a plugin from processing events.
     * Setting enabled to true will not necessarily cause the `isEnabled()` to also return true
     * as the plugin must also have been successfully initialized and not had it's `teardown` method called
     * (unless it's also been re-initialized)
     */
    setEnabled: (isEnabled: boolean) => void;
}

export interface IAppInsightsCore extends IPerfManagerProvider {

    /*
    * Config object used to initialize AppInsights
    */
    config: IConfiguration;

    logger: IDiagnosticLogger;

    /**
     * Returns a value that indicates whether the instance has already been previously initialized.
     */
    isInitialized?: () => boolean;

    /*
    * Initialization queue. Contains functions to run when appInsights initializes
    */
    initialize(config: IConfiguration, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void;

    /*
    * Get transmission controls for controlling transmission behavior
    */
    getTransmissionControls(): IChannelControls[][];

    /*
    * Core track API
    */
    track(telemetryItem: ITelemetryItem): void;

    /**
     * Get the current notification manager
     */
    getNotifyMgr(): INotificationManager;

    /**
     * Get the current cookie manager for this instance
     */
    getCookieMgr(): ICookieMgr;

    /**
     * Set the current cookie manager for this instance
     * @param cookieMgr - The manager, if set to null/undefined will cause the default to be created
     */
    setCookieMgr(cookieMgr: ICookieMgr): void;

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

    /**
     * Add a telemetry processor to decorate or drop telemetry events.
     * @param telemetryInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler | void;

    pollInternalLogs?(eventName?: string): number;

    stopPollingInternalLogs?(): void;

    /**
     * Return a new instance of the IProcessTelemetryContext for processing events
     */
    getProcessTelContext() : IProcessTelemetryContext;

    /**
     * Find and return the (first) plugin with the specified identifier if present
     * @param pluginIdentifier
     */
    getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T>;
  
    /**
     * Returns the unique event namespace that should be used when registering events
     */
    evtNamespace(): string;
}
