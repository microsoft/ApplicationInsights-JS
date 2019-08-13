// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DistributedTracingModes } from '../Enums';

export interface ICorrelationConfig {
    enableCorsCorrelation: boolean;
    correlationHeaderExcludedDomains: string[];
    disableCorrelationHeaders: boolean;
    distributedTracingMode: DistributedTracingModes;
    maxAjaxCallsPerView: number;
    disableAjaxTracking: boolean;
    disableFetchTracking: boolean;
    appId?: string;
    enableRequestHeaderTracking?: boolean;
    enableResponseHeaderTracking?: boolean;

    correlationHeaderDomains?: string[]
}