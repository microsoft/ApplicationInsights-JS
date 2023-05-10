// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TelemetryUpdateReason } from "../JavaScriptSDK.Enums/TelemetryUpdateReason";
import { IPlugin } from "./ITelemetryPlugin";

//import { IConfiguration } from "./IConfiguration";
export interface ITelemetryUpdateState {

    /**
     * Identifies the reason for the update notification, this is a bitwise numeric value
     */
    reason: TelemetryUpdateReason;

    /**
     * If this is a configuration update this was the previous configuration that was used
     */
    //prvCfg?: IConfiguration,

    /**
     * If this is a configuration update is the new configuration that is being used
     */
    //newCfg?: IConfiguration,

    /**
     * This holds a collection of plugins that have been added (if the reason identifies that one or more plugins have been added)
     */
    added?: IPlugin[];

    /**
     * This holds a collection of plugins that have been removed (if the reason identifies that one or more plugins have been removed)
     */
     removed?: IPlugin[]
}
