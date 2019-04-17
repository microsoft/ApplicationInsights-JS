// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface ITelemetryConfig {
    instrumentationKey: () => string;
    accountId: () => string;
    sessionRenewalMs: () => number;
    samplingPercentage: () => number;
    sessionExpirationMs: () => number;
    cookieDomain: () => string;
    sdkExtension: () => string;
    isBrowserLinkTrackingEnabled: () => boolean;
    appId: () => string;
    namePrefix: () => string;
}