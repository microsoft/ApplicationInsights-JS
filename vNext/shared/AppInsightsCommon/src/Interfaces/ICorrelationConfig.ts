import { DistributedTracingModes } from '@microsoft/applicationinsights-core-js';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface ICorrelationConfig {
    enableCorsCorrelation: boolean;
    correlationHeaderExcludedDomains: string[];
    disableCorrelationHeaders: boolean;
    distributedTracingMode: DistributedTracingModes;
    maxAjaxCallsPerView: number;
    disableAjaxTracking: boolean;
    disableFetchTracking: boolean;
    appId?: string;

    correlationHeaderDomains?: string[]
}