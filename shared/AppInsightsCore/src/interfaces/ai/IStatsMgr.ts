// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IAppInsightsCore } from "./IAppInsightsCore";
import { IConfiguration } from "./IConfiguration";
import { IStatsBeat, IStatsBeatConfig, IStatsBeatState } from "./IStatsBeat";
import { IUnloadHook } from "./IUnloadHook";

/**
 * The interface for the Stats manager, which is passed to the StatsBeat instance
 * during initialization. It provides an abstractions to allow the StatsBeat instance to
 * access the configuration and state of the StatsBeat manager.
 */
export interface IStatsMgrConfig<CfgType extends IConfiguration = IConfiguration> {

    /**
     * Identifies the feature name used for this instance to determine if the StatsBeat instance
     * should be initialized or not. This is used to identify the feature that this instance of the
     */
    feature: string;

    /**
     * A function to obtain the current configuration for the StatsBeat instance, this callback
     * is called in a dynamic config context, so when any of the configuration values change,
     * tis function will be called again to obtain the latest configuration values.
     * This should also evaluate any throttling level and other settings for the statsbeat instance
     * to determine if it should be enabled or not and return the appropriate configuration object.
     * @param cfg - The current configuration object for the StatsBeat instance.
     * @returns The configuration object that should be used to initialize / reinitialize the StatsBeat instance.
     * It may return null if the StatsBeat instance should not be initialized or reinitialized, if the manager
     * is already initialized and null is returned, the StatsBeat instance will be disabled.
     */
    getCfg: (core: IAppInsightsCore<CfgType>, cfg: CfgType) => IStatsBeatConfig | undefined | null;
}

/**
 * The Interface which defines the StatsBeat manager, which is responsible for creating and
 * managing the StatsBeat instance.
 * @since 3.3.7
 */
export interface IStatsMgr {
    /**
     * If there is a manager instance available, this will identify if the manager is enabled or not.
     * @returns True if the manager is enabled, false otherwise.
     */
    readonly enabled: boolean;

    /**
     * Initialize and associate this manager with the provided core instance and configuration.
     * @param core - The core instance to associate with this manager.
     * @param isEnabled -
     * @returns The unload hook for the stats beat manager, which can be used to unload
     * and disable the manager. This may return null if the manager cannot be initialized.
     * @remarks This method should be called only once, and it may throw an error if called multiple times.
     */
    init: <CfgType extends IConfiguration = IConfiguration>(core: IAppInsightsCore<CfgType>, cfg: IStatsMgrConfig<CfgType>) => IUnloadHook | null;
    
    /**
     * Returns a new {@link IStatsBeat} instance for the current state which includes the endpoint.
     * This method should be called only after the manager has been initialized and the
     * {@link IStatsBeatConfig} has been set, otherwise it will return null.
     * @param state - The current state of the stats beat manager.
     * @returns A new instance of the stats beat or null if the manager or the configuration does not support
     * the {@link IStatsBeatState}.
     */
    newInst: (state: IStatsBeatState) => IStatsBeat;
}