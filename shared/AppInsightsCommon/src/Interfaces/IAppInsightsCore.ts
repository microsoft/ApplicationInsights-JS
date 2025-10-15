// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise } from "@nevware21/ts-async";
import { ITimerHandler } from "@nevware21/ts-utils";
import { eActiveStatus } from "../Enums/InitActiveStatusEnum";
import { SendRequestReason } from "../Enums/SendRequestReason";
import { UnloadHandler } from "../UnloadHandlerContainer";
import { WatcherFunction } from "./Config/IDynamicWatcher";
import { IChannelControls } from "./IChannelControls";
import { IConfiguration } from "./IConfiguration";
import { ICookieMgr } from "./ICookieMgr";
import { IDiagnosticLogger } from "./IDiagnosticLogger";
import { IDistributedTraceContext } from "./IDistributedTraceContext";
import { INotificationListener } from "./INotificationListener";
import { INotificationManager } from "./INotificationManager";
import { IPerfManagerProvider } from "./IPerfManager";
import { IProcessTelemetryContext } from "./IProcessTelemetryContext";
import { ITelemetryInitializerHandler, TelemetryInitializerFunction } from "./ITelemetryInitializers";
import { ITelemetryItem } from "./ITelemetryItem";
import { IPlugin, ITelemetryPlugin } from "./ITelemetryPlugin";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";
import { ILegacyUnloadHook, IUnloadHook } from "./IUnloadHook";

// import { IStatsBeat, IStatsBeatState } from "./IStatsBeat";
// import { IStatsMgr } from "./IStatsMgr";
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

export interface IAppInsightsCore<CfgType extends IConfiguration = IConfiguration> extends IPerfManagerProvider {

    /*
    * Config object used to initialize AppInsights
    */
    readonly config: CfgType;

    /**
     * The current logger instance for this instance.
     */
    readonly logger: IDiagnosticLogger;

    /**
     * An array of the installed plugins that provide a version
     */
    readonly pluginVersionStringArr: string[];
    
    /**
     * The formatted string of the installed plugins that contain a version number
     */
    readonly pluginVersionString: string;

    // TODO: Add IOTelContextManager type
    /**
     * The root {@link IOTelContextManager} for this instance of the Core.
     */
    readonly context: any;
 
    /**
     * Returns a value that indicates whether the instance has already been previously initialized.
     */
    isInitialized?: () => boolean;

    /*
    * Initialization queue. Contains functions to run when appInsights initializes
    */
    initialize(config: CfgType, extensions: IPlugin[], logger?: IDiagnosticLogger, notificationManager?: INotificationManager): void;

    /*
    * Get transmission channels for controlling transmission behavior
    */
    getChannels(): IChannelControls[];

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

    pollInternalLogs?(eventName?: string): ITimerHandler;

    // /**
    //  * Get the current stats beat instance for the provided configuration, if enabled.
    //  * @param statsBeatConfig - The configuration to use to create the stats beat instance.
    //  * @returns The stats beat instance or null if not available
    //  */
    // getStatsBeat?(statsBeatConfig: IStatsBeatState): IStatsBeat;

    // /**
    //  * Set the stats beat manager instance which will be used to create the stats beat instances
    //  * using the provided configuration. This is used to provide greater control over the stats beat
    //  * instance creation and management.
    //  * @param statsMgrCfg - The configuration to use to create the stats beat instance.
    //  * @returns The stats beat instance or null if not available
    //  */
    // setStatsMgr?(statsMgrCfg?: IStatsMgr): void;

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
     * If you pass isAsync as `true` (also the default) and DO NOT pass a callback function then an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the unload is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @param unloadComplete - An optional callback that will be called once the unload has completed
     * @param cbTimeout - An optional timeout to wait for any flush operations to complete before proceeding with the
     * unload. Defaults to 5 seconds.
     * @returns Nothing or if occurring asynchronously a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * which will be resolved once the unload is complete, the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will only be returned when no callback is provided and isAsync is true
     */
    unload(isAsync?: boolean, unloadComplete?: (unloadState: ITelemetryUnloadState) => void, cbTimeout?: number): void | IPromise<ITelemetryUnloadState>;

    /**
     * Find and return the (first) plugin with the specified identifier if present
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
    updateCfg(newConfig: CfgType, mergeExisting?: boolean): void;

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
     * Gets the current distributed trace active context for this instance
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
     * @returns A watcher handler instance that can be used to remove itself when being unloaded
     */
    onCfgChange(handler: WatcherFunction<CfgType>): IUnloadHook;

    /**
     * Function used to identify the get w parameter used to identify status bit to some channels
     */
    getWParam: () => number;

    /**
     * Watches and tracks status of initialization process
     * @returns ActiveStatus
     * @since 3.3.0
     * If returned status is active, it means initialization process is completed.
     * If returned status is pending, it means the initialization process is waiting for promieses to be resolved.
     * If returned status is inactive, it means ikey is invalid or can 't get ikey or enpoint url from promsises.
     */
    activeStatus?: () => eActiveStatus | number;

     /**
     * Set Active Status to pending, which will block the incoming changes until internal promises are resolved
     * @internal Internal use
     * @since 3.3.0
     */
    _setPendingStatus?: () => void;

}
