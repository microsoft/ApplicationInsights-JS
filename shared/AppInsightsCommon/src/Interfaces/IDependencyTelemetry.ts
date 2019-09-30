// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IProperties } from './IProperties';

/**
 * DependencyTelemetry telemetry interface
 */

export interface IDependencyTelemetry extends IProperties {
    id: string;
    name?: string;
    duration?: number;
    success?: boolean;
    responseCode: number;
    correlationContext?: string;
    type?: string;
    data?: string;
    target?: string;
}