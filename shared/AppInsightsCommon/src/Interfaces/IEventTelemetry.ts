import { IPartC } from './IPartC';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IEventTelemetry extends IPartC {
    /**
     * @description An event name string
     * @type {string}
     * @memberof IEventTelemetry
     */
    name: string;
}
