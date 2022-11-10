// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryItem } from "./ITelemetryItem";
import { IChannelControls } from "./IChannelControls";
import { IPlugin, ITelemetryPlugin } from "./ITelemetryPlugin";
import { IConfiguration } from "./IConfiguration";
import { INotificationManager } from "./INotificationManager";
import { INotificationListener } from "./INotificationListener";
import { IDiagnosticLogger } from "./IDiagnosticLogger";
import { IProcessTelemetryContext } from "./IProcessTelemetryContext";
import { IPerfManagerProvider } from "./IPerfManager";
import { ICookieMgr } from "./ICookieMgr";
import { ITelemetryInitializerHandler, TelemetryInitializerFunction } from "./ITelemetryInitializers";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";
import { UnloadHandler } from "../JavaScriptSDK/UnloadHandlerContainer";
import { SendRequestReason } from "../JavaScriptSDK.Enums/SendRequestReason";
import { IDistributedTraceContext } from "./IDistributedTraceContext";
import { ILegacyUnloadHook, IUnloadHook } from "./IUnloadHook";
import { WatcherFunction } from "../Config/IDynamicWatcher";

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

    remove: (isAsync?: boolean, removeCb?: (removed?: boolean) => void) => void;
}

export interface IAppInsightsCore extends IPerfManagerProvider {

    /*
    * Config object used to initialize AppInsights
    */
    config: IConfiguration;

    logger: IDiagnosticLogger;

    /**
     * An array of the installed plugins that provide a version
     */
    readonly pluginVersionStringArr: string[];
    
    /**
     * The formatted string of the installed plugins that contain a version number
     */
    readonly pluginVersionString: string;
 
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
     * @param listener - An INotificationListener object.
     */
    addNotificationListener?(listener: INotificationListener): void;

    /**
     * Removes all instances of the listener.
     * @param listener - INotificationListener to remove.
     */
    removeNotificationListener?(listener: INotificationListener): void;

    /**
     * Add a telemetry processor to decorate or drop telemetry events.
     * @param telemetryInitializer - The Telemetry Initializer function
     * @returns - A ITelemetryInitializerHandler to enable the initializer to be removed
     */
    addTelemetryInitializer(telemetryInitializer: TelemetryInitializerFunction): ITelemetryInitializerHandler;

    pollInternalLogs?(eventName?: string): number;

    stopPollingInternalLogs?(): void;

    /**
     * Return a new instance of the IProcessTelemetryContext for processing events
     */
    getProcessTelContext() : IProcessTelemetryContext;

    /**
     * Unload and Tear down the SDK and any initialized plugins, after calling this the SDK will be considered
     * to be un-initialized and non-operational, re-initializing the SDK should only be attempted if the previous
     * unload call return `true` stating that all plugins reported that they also unloaded, the recommended
     * approach is to create a new instance and initialize that instance.
     * This is due to possible unexpected side effects caused by plugins not supporting unload / teardown, unable
     * to successfully remove any global references or they may just be completing the unload process asynchronously.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @param unloadComplete - An optional callback that will be called once the unload has completed
     * @param cbTimeout - An optional timeout to wait for any flush operations to complete before proceeding with the unload. Defaults to 5 seconds.
     */
    unload(isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void;

    /**
     * Find and return the (first) plugin with the specified identifier if present
     * @param pluginIdentifier
     */
    getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T>;
  
    /**
     * Add a new plugin to the installation
     * @param plugin - The new plugin to add
     * @param replaceExisting - should any existing plugin be replaced, default is false
     * @param doAsync - Should the add be performed asynchronously
     * @param addCb - [Optional] callback to call after the plugin has been added
     */
    addPlugin<T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting?: boolean, doAsync?: boolean, addCb?: (added?: boolean) => void): void;
  
    /**
     * Update the configuration used and broadcast the changes to all loaded plugins, this does NOT support updating, adding or removing
     * any the plugins (extensions or channels). It will notify each plugin (if supported) that the configuration has changed but it will
     * not remove or add any new plugins, you need to call addPlugin or getPlugin(identifier).remove();
     * @param newConfig - The new configuration is apply
     * @param mergeExisting - Should the new configuration merge with the existing or just replace it. Default is to merge.
     */
    updateCfg<T extends IConfiguration = IConfiguration>(newConfig: T, mergeExisting?: boolean): void;

    /**
     * Returns the unique event namespace that should be used when registering events
     */
    evtNamespace(): string;
  
    /**
     * Add a handler that will be called when the SDK is being unloaded
     * @param handler - the handler
     */
    addUnloadCb(handler: UnloadHandler): void;

    /**
     * Add this hook so that it is automatically removed during unloading
     * @param hooks - The single hook or an array of IInstrumentHook objects
     */
    addUnloadHook(hooks: IUnloadHook | IUnloadHook[] | Iterator<IUnloadHook> | ILegacyUnloadHook | ILegacyUnloadHook[] | Iterator<ILegacyUnloadHook>): void;

    /**
     * Flush and send any batched / cached data immediately
     * @param async - send data asynchronously when true (defaults to true)
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @param sendReason - specify the reason that you are calling "flush" defaults to ManualFlush (1) if not specified
     * @param cbTimeout - An optional timeout to wait for any flush operations to complete before proceeding with the unload. Defaults to 5 seconds.
     * @returns - true if the callback will be return after the flush is complete otherwise the caller should assume that any provided callback will never be called
     */
    flush(isAsync?: boolean, callBack?: (flushComplete?: boolean) => void, sendReason?: SendRequestReason, cbTimeout?: number): boolean | void;

    /**
     * Gets the current distributed trace context for this instance if available
     * @param createNew - Optional flag to create a new instance if one doesn't currently exist, defaults to true
     */
    getTraceCtx(createNew?: boolean): IDistributedTraceContext | null;

    /**
     * Sets the current distributed trace context for this instance if available
     */
    setTraceCtx(newTraceCtx: IDistributedTraceContext | null | undefined): void;

    /**
     * Watches and tracks changes for accesses to the current config, and if the accessed config changes the
     * handler will be recalled.
     * @param handler
     * @returns A watcher handler instance that can be used to remove itself when being unloaded
     */
    onCfgChange<T extends IConfiguration = IConfiguration>(handler: WatcherFunction<T>): IUnloadHook;

    /**
     * Function used to identify the get w parameter used to identify status bit to some channels
     */
    getWParam: () => number;
}
