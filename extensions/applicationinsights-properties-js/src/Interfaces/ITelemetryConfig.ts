// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDistributedTraceContext } from "@microsoft/applicationinsights-core-js";

export interface ITelemetryConfig {
    instrumentationKey: () => string;
    accountId: () => string;
    sessionRenewalMs: () => number;
    samplingPercentage: () => number;
    sessionExpirationMs: () => number;
    cookieDomain: () => null,
    sdkExtension: () => string;
    isBrowserLinkTrackingEnabled: () => boolean;
    appId: () => string;
    getSessionId: () => string;
    namePrefix: () => string;
    sessionCookiePostfix: () => string;
    userCookiePostfix: () => string;
    idLength: () => number;
    getNewId: () => (idLength?: number) => string;
    disableTraceParent: () => boolean;
    distributedTraceCtx: () => IDistributedTraceContext;
}