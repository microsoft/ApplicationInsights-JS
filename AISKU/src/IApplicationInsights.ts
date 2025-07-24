// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { AnalyticsPlugin } from "@microsoft/applicationinsights-analytics-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { IAppInsights, IPropertiesPlugin, IRequestHeaders } from "@microsoft/applicationinsights-common";
import {
    IConfiguration, IDistributedTraceContext, ILoadedPlugin, IOTelApi, IOTelSpan, IOTelSpanOptions, IOTelTraceApi, IPlugin, ITelemetryPlugin,
    ITelemetryUnloadState, UnloadHandler
} from "@microsoft/applicationinsights-core-js";
import { IDependenciesPlugin } from "@microsoft/applicationinsights-dependencies-js";
import { IPromise } from "@nevware21/ts-async";

export { IRequestHeaders };

export interface IApplicationInsights extends IAppInsights, IDependenciesPlugin, IPropertiesPlugin {
    appInsights: AnalyticsPlugin;

    /**
     * The OpenTelemetry API instance associated with this instance
     * Unlike OpenTelemetry, this API does not return a No-Op implementation and returns null if the SDK has been torn
     * down or not yet initialized.
     */
    readonly otelApi: IOTelApi | null;

    /**
     * OpenTelemetry trace API for creating spans.
     * Unlike OpenTelemetry, this API does not return a No-Op implementation and returns null if the SDK has been torn
     * down or not yet initialized.
     */
    readonly trace: IOTelTraceApi | null;

    /**
     * Attempt to flush data immediately; If executing asynchronously (the default) and
     * you DO NOT pass a callback function then a [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * will be returned which will resolve once the flush is complete. The actual implementation of the `IPromise`
     * will be a native Promise (if supported) or the default as supplied by [ts-async library](https://github.com/nevware21/ts-async)
     * @param async - send data asynchronously when true
     * @param callBack - if specified, notify caller when send is complete, the channel should return true to indicate to the caller that it will be called.
     * If the caller doesn't return true the caller should assume that it may never be called.
     * @returns - If a callback is provided `true` to indicate that callback will be called after the flush is complete otherwise the caller
     * should assume that any provided callback will never be called, Nothing or if occurring asynchronously a
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) which will be resolved once the unload is complete,
     * the [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) will only be returned when no callback is provided
     * and async is true.
     */
    flush: (async?: boolean, callBack?: () => void) => void | IPromise<void>;

    onunloadFlush: (async?: boolean) => void;
    getSender: () => Sender;
    setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): void;
    clearAuthenticatedUserContext(): void;

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
     * @param pluginIdentifier
     */
    getPlugin<T extends IPlugin = IPlugin>(pluginIdentifier: string): ILoadedPlugin<T>;
  
    /**
     * Add a new plugin to the installation
     * @param plugin - The new plugin to add
     * @param replaceExisting - should any existing plugin be replaced
     * @param doAsync - Should the add be performed asynchronously
     */
    addPlugin<T extends IPlugin = ITelemetryPlugin>(plugin: T, replaceExisting: boolean, doAsync: boolean, addCb?: (added?: boolean) => void): void;
  
    /**
     * Update the configuration used and broadcast the changes to all loaded plugins, this does NOT support updating, adding or removing
     * any the plugins. It will notify (if supported) that the configuration has changed but it will not remove or add any new plugins
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
     * Start a new span with the given name and optional parent context.
     *
     * Note: This method only creates and returns the span. It does not automatically
     * set the span as the active trace context. Context management should be handled
     * separately using setTraceCtx() if needed.
     *
     * @param name - The name of the span
     * @param options - Options for creating the span (kind, attributes, startTime)
     * @param parent - Optional parent context. If not provided, uses the current active trace context
     * @returns A new span instance, or null if no trace provider is available
     * @since 3.4.0
     */
    startSpan(name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IOTelSpan | null;
}
