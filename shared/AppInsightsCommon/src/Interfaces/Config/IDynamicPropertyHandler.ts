// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "../IConfiguration";
import { IWatcherHandler } from "./IDynamicWatcher";

export interface IDynamicPropertyHandler<T = IConfiguration> {
    /**
     * Identifies the name of the field that is handled by this handler
     */
    n: string;

    /**
     * The current collection is watcher handlers which should be called if the value changes
     */
    h: IWatcherHandler<T>[];
}
