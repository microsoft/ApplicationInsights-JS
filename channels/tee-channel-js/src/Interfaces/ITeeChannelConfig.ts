// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IChannelControls } from "@microsoft/applicationinsights-core-js";

export interface ITeeChannelConfig {
    /**
     * Channel queues that is setup by caller in desired order.
     * If channels are provided here, core will ignore any channels that are already setup, example if there is a SKU with an initialized channel
     */
    teeChannels?: IChannelControls[][];

    /**
     * By default the TeeChannel will use the core configuration `channels` (starting at index 1 `channels[1.xxx]`) as separate tee'd channel chains
     * for processing events. This configuration allow you to ignore any additional core channels and only use the `teeChannels`
     * Defaults to false
     */
    ignoreCoreChannels?: boolean;
}