// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IAppInsightsCore } from "./IAppInsightsCore";
import { IConfiguration } from "./IConfiguration";
import { IInternalSdkStats, IInternalSdkStatsState } from "./IInternalSdkStats";
import { IUnloadHook } from "./IUnloadHook";

/**
 * Creates and initializes the isolated core used to send SDK Stats.
 * @param config - The SDK Stats configuration containing the resolved iKey and endpoint.
 * Implementations must handle creation errors and return null rather than throw.
 * @returns The initialized core instance, or null when an SDK Stats pipeline cannot be created.
 * @since 3.4.4
 */
export type CreateStatsCoreFn = (config: IConfiguration) => IAppInsightsCore | null;

/**
 * The Interface which defines the InternalSdkStats manager, which is responsible for creating and
 * managing the InternalSdkStats instance.
 * @since 3.3.7
 */
export interface IStatsMgr {
    /**
     * If there is a manager instance available, this will identify if the manager is enabled or not.
     * @returns True if the manager is enabled, false otherwise.
     */
    readonly enabled: boolean;

    /**
     * Initialize and associate this manager with the provided core instance. The manager reads its
     * configuration directly from the single global config (`config.stats`) and gates itself behind
     * the SDK Stats feature flag, so any changes made via the CDN / dynamic config are picked up at
     * runtime.
     * @param core - The core instance to associate with this manager.
     * @param createStatsCore - Creates an isolated, initialized core for SDK Stats. The callback lets
     * each SKU select the appropriate channel and plugins without using the customer's pipeline.
     * @param featureName - The optional featureOptIn name used to gate the manager. Defaults to the
     * SDK Stats feature (`STATS_SDK_FEATURE`) which is enabled by default and can be opted-out via the
     * `featureOptIn` configuration.
     * @returns The unload hook for the stats beat manager, which can be used to unload
     * and disable the manager. This may return null if the manager cannot be initialized.
     * @remarks This method should be called only once, and it may throw an error if called multiple times.
     */
    init: <CfgType extends IConfiguration = IConfiguration>(
        core: IAppInsightsCore<CfgType>,
        createStatsCore: CreateStatsCoreFn,
        featureName?: string
    ) => IUnloadHook | null;
    
    /**
     * Returns a new {@link IInternalSdkStats} instance for the current state which includes the endpoint.
     * This method should be called only after the manager has been initialized and the
     * {@link IInternalSdkStatsConfig} has been set, otherwise it will return null.
     * @param state - The current state of the stats beat manager.
     * @returns A new instance of the stats beat or null if the manager or the configuration does not support
     * the {@link IInternalSdkStatsState}.
     */
    newInst: (state: IInternalSdkStatsState) => IInternalSdkStats;
}