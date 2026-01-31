// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../ai/IConfiguration";
import { IDiagnosticLogger } from "../ai/IDiagnosticLogger";
import { IConfigDefaults } from "./IConfigDefaults";
import { IWatcherHandler, WatcherFunction } from "./IDynamicWatcher";

/**
 * This interface identifies the config which can track changes
 */
export interface IDynamicConfigHandler<T = IConfiguration> {
    /**
     * Unique Id for this config handler
     */
    readonly uid: string;

    /**
     * Link back to the configuration object that should be used to get/set values
     */
    cfg: T;

    /**
     * The logger instance to use to logger any issues
     */
    logger: IDiagnosticLogger,

    /**
     * Helper to call any listeners that are waiting to be notified
     */
    notify: () => void;

    /**
     * Watch and track changes for accesses to the current config anb
     */
    watch: (configHandler: WatcherFunction<T>) => IWatcherHandler<T>;

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
    setDf: <C>(theConfig: C, defaultValues: IConfigDefaults<C, T>) => C;

    /**
     * Set this named property of the target as referenced, which will cause any object or array instances
     * to be updated in-place rather than being entirely replaced. All other values will continue to be replaced.
     * @param target - The object which has (or will have) the named property
     * @param name - The name of the property in the target
     * @returns The referenced properties current value.
     */
    ref: <C, V = any>(target: C, name: string) => V;

    /**
     * Set this named property of the target as read-only, which will block this single named property from
     * ever being changed for the target instance.
     * This does NOT freeze or seal the instance, it just stops the direct re-assignment of the named property,
     * if the value is a non-primitive (ie. an object or array) it's properties will still be mutable.
     * @param target - The object which has (or will have) the named property
     * @param name - The name of the property in the target
     * @returns The referenced properties current value.
     */
    rdOnly: <C, V = any>(target: C, name: string) => V;

    /**
     * Set the `value` that is or will be assigned to this named property of the target will not have it's
     * properties converted into dynamic properties, this means that any changes the values properties will
     * not be monitored for changes and therefore will not cause any listeners to be notified in any value
     * is changed. If the value associated with the `target[name]` is change this is still dynamic and will
     * cause listeners to be notified.
     * @param target - The object which has (or will have) the named property
     * @param name - The name of the property in the target
     * @returns The referenced properties current value.
     * @example
     * ```ts
     * let localValue = target[name];   // If within a listener this will cause the listener to be called again
     * target[name] = newValue;         // This will notify listeners that accessed target[name]
     *
     * // This will not cause lsiteners to be called because propa is not converted and value of target[name]
     * // did not change.
     * target[name].propa = 1;
     * target[name].propb = 2;
     *
     * // If within a listener this will caused the listener to be called again only if target[name] is reassigned
     * // not if the value associated with propa is changed.
     * let localValue = target[name].propa;
     * ```
     */
    blkVal: <C, V = any>(target: C, name: string) => V;
}

/**
 * @internal
 * @ignore
 */
export interface _IInternalDynamicConfigHandler<T = IConfiguration> extends IDynamicConfigHandler<T> {
    /**
     * @ignore
     * Internal function to explicitly block watching for any config updates
     * @param configHandler - The Callback function to call after blocking update listening
     * @param allowUpdate - An optional flag to enable updating config properties marked as readonly
     */
    _block: (configHandler: WatcherFunction<T>, allowUpdate?: boolean) => void;
}
