// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../ai/IConfiguration";
import { IUnloadHook } from "../ai/IUnloadHook";
import { IConfigDefaults } from "./IConfigDefaults";
import { IDynamicPropertyHandler } from "./IDynamicPropertyHandler";

export interface IWatchDetails<T = IConfiguration> {
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

    /**
     * Set this named property of the target as referenced, which will cause any object or array instance
     * to be updated in-place rather than being entirely replaced. All other values will continue to be replaced.
     * @returns The referenced properties current value
     */
    ref: <C, V = any>(target: C, name: string) => V;

    /**
     * Set this named property of the target as read-only, which will block this single named property from
     * ever being changed for the target instance.
     * This does NOT freeze or seal the instance, it just stops the direct re-assignment of the named property,
     * if the value is a non-primitive (ie. an object or array) it's properties will still be mutable.
     * @returns The referenced properties current value
     */
    rdOnly: <C, V = any>(target: C, name: string) => V;
}

export type WatcherFunction<T = IConfiguration> = (details: IWatchDetails<T>) => void;

/**
 * @internal
 */
export interface _WatcherChangeDetails<T = IConfiguration> {
    d: _IDynamicDetail<T>;
}

/**
 * @internal
 */
export interface _IDynamicDetail<T = IConfiguration> extends IDynamicPropertyHandler<T> {

    /**
     * Add the watcher for monitoring changes
     */
    trk: (handler: IWatcherHandler<T>) => void;

    /**
     * Clear all of the watchers from monitoring changes
     */
    clr: (handler: IWatcherHandler<T>) => void;
}

export interface IWatcherHandler<T = IConfiguration> extends IUnloadHook {
    fn: WatcherFunction<T>;
    rm: () => void;
}
