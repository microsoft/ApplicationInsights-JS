// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * DependencyTelemetry telemetry interface
 */

export interface IDependencyTelemetry {
    absoluteUrl: string;
    commandName?: string;
    duration?: number;
    success?: boolean;
    resultCode: number;
    method: string;
    id: string;
    correlationContext?: string;
}