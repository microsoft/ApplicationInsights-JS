// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPartC } from "./IPartC";

/**
 * DependencyTelemetry telemetry interface
 */

export interface IDependencyTelemetry extends IPartC { // siyu this one is related to dependency and has key word starttime
    id: string;
    name?: string;
    duration?: number;
    success?: boolean;
    startTime?: Date; // thisone
    responseCode: number;
    correlationContext?: string;
    type?: string;
    data?: string;
    target?: string;
    iKey?: string;
}
