// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "./IConfiguration";
import { IPlugin } from "./ITelemetryPlugin";

export interface ITelemetryUpdateState {

    /**
     * Identifies the reason for the update notification, this is a bitwise numeric value
     */
    reason: TelemetryUpdateReason;

    /**
     * This is a new active configuration that should be used
     */
    cfg?: IConfiguration,

    /**
     * The detected changes
     */
    oldCfg?: IConfiguration,

     /**
     * If this is a configuration update this was the previous configuration that was used
     */
    newConfig?: IConfiguration,

    /**
     * Was the new config requested to be merged with the existing config
     */
    merge?: boolean,

    /**
     * This holds a collection of plugins that have been added (if the reason identifies that one or more plugins have been added)
     */
    added?: IPlugin[];

    /**
     * This holds a collection of plugins that have been removed (if the reason identifies that one or more plugins have been removed)
     */
    removed?: IPlugin[]
}