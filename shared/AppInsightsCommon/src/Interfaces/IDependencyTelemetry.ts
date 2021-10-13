// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPartC } from "./IPartC";

/**
 * DependencyTelemetry telemetry interface
 */

export interface IDependencyTelemetry extends IPartC {
    id: string;
    name?: string;
    duration?: number;
    success?: boolean;
    startTime?: Date;
    responseCode: number;
    correlationContext?: string;
    type?: string;
    data?: string;
    target?: string;
    iKey?: string;
}
