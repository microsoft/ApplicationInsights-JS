// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * DependencyTelemetry telemetry interface
 */

export interface IDependencyTelemetry {
    id: string;
    absoluteUrl: string;
    name?: string;
    duration?: number;
    success?: boolean;
    responseCode: number;
    correlationContext?: string;
    type?: string;
    data?: string;
    target?: string;
    properties?: {[key: string]: string};
    measurements?: {[key: string]: string};
}