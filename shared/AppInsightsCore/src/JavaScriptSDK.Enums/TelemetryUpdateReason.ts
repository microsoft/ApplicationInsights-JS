// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The TelemetryUpdateReason enumeration contains a set of bit-wise values that specify the reason for update request.
 */
export const enum TelemetryUpdateReason {
    /**
     * Unknown.
     */
    Unknown = 0,

    /**
     * The configuration has ben updated or changed
     */
    //ConfigurationChanged = 0x01,

    /**
     * One or more plugins have been added
     */
    PluginAdded = 0x10,

    /**
     * One or more plugins have been removed
     */
    PluginRemoved = 0x20,
}
