// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPartC } from "./IPartC";

export interface IEventTelemetry extends IPartC {
    /**
     * @description An event name string
     */
    name: string;

    /**
     * @description custom defined iKey
     */
    iKey?: string;
}
