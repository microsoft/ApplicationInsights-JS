// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The TelemetryUnloadReason enumeration contains the possible reasons for why a plugin is being unloaded / torndown().
 */
export const enum TelemetryUnloadReason {
    /**
     * Teardown has been called without any context.
     */
    ManualTeardown = 0,

    /**
     * Just this plugin is being removed
     */
    PluginUnload = 1,

    /**
     * This instance of the plugin is being removed and replaced
     */
    PluginReplace = 2,

    /**
     * The entire SDK is being unloaded
     */
    SdkUnload = 50
}
