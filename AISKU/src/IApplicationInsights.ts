// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { AnalyticsPlugin } from "@microsoft/applicationinsights-analytics-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { IAppInsights, IPropertiesPlugin, IRequestHeaders } from "@microsoft/applicationinsights-common";
import { IConfiguration, ILoadedPlugin, IPlugin, ITelemetryPlugin, UnloadHandler } from "@microsoft/applicationinsights-core-js";
import { IDependenciesPlugin } from "@microsoft/applicationinsights-dependencies-js";

export { IRequestHeaders };

export interface IApplicationInsights extends IAppInsights, IDependenciesPlugin, IPropertiesPlugin {
    appInsights: AnalyticsPlugin;
    flush: (async?: boolean) => void;
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
     */
    unload(isAsync?: boolean, unloadComplete?: () => void): void;

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
}
