// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IChannelControls } from "./IChannelControls";
import { IPlugin } from "./ITelemetryPlugin";

export interface IChannelControlsHost extends IChannelControls {
    /**
     * Get and return the named channel instance (if present) from the queues
     * @param pluginIdentifier - The identifier name of the plugin
     */
    getChannel<T extends IPlugin = IPlugin>(pluginIdentifier: string): T;
}
