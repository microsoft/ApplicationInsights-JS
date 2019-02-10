// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface ICorrelationConfig {
    enableCorsCorrelation: boolean;
    correlationHeaderExcludedDomains:  string[];
    disableCorrelationHeaders: boolean;
    maxAjaxCallsPerView: number;
    disableAjaxTracking: boolean;
    disableFetchTracking: boolean;
    appId?: string;
}