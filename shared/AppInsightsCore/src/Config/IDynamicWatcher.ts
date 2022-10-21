// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IUnloadHook } from "../JavaScriptSDK.Interfaces/IUnloadHook";
import { IConfigDefaults } from "./IConfigDefaults";
import { IDynamicPropertyHandler } from "./IDynamicPropertyHandler";

export interface IWatchDetails<T extends IConfiguration> {
    /**
     * The current config object
     */
    cfg: T;

    /**
     * Set the value against the provided config/name with the value, the property
     * will be converted to be dynamic (if not already) as long as the provided config
     * is already a tracked dynamic object.
     * @throws TypeError if the provided config is not a monitored dynamic config
     */
    set: <C, V>(theConfig: C, name: string, value: V) => V;

    /**
     * Set default values for the config if not present.
     * @param theConfig - The configuration object to set default on (if missing)
     * @param defaultValues - The default values to apply to the config
     */
    setDf: <C>(theConfig: C, defaultValues: IConfigDefaults<C>) => C;
}

export type WatcherFunction<T extends IConfiguration> = (details: IWatchDetails<T>) => void;

/**
 * @internal
 */
export interface _WatcherChangeDetails<T extends IConfiguration> {
    d: _IDynamicDetail<T>;
}

/**
 * @internal
 */
export interface _IDynamicDetail<T extends IConfiguration> extends IDynamicPropertyHandler<T> {

    /**
     * Add the watcher for monitoring changes
     */
    trk: (handler: IWatcherHandler<T>) => void;

    /**
     * Clear all of the watchers from monitoring changes
     */
    clr: (handler: IWatcherHandler<T>) => void;
}

export interface IWatcherHandler<T extends IConfiguration> extends IUnloadHook {
    fn: WatcherFunction<T>;
    rm: () => void;
}