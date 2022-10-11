// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { IConfigDefaults } from "./IConfigDefaults";
import { IWatcherHandler, WatcherFunction } from "./IDynamicWatcher";

/**
 * This interface identifies the config which can track changes
 */
export interface IDynamicConfigHandler<T extends IConfiguration> {
    /**
     * Unique Id for this config handler
     */
    readonly uid: string;

    /**
     * Link back to the configuration object that should be used to get/set values
     */
    cfg: T;

    /**
     * The logger instance to use to loger any issues
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
}

/**
 * @internal
 * @ignore
 */
export interface _IInternalDynamicConfigHandler<T extends IConfiguration> extends IDynamicConfigHandler<T> {
    /**
     * @ignore
     * Internal function to explicitly block watching for any config updates
     */
    _block: (configHandler: WatcherFunction<T>) => void;
}