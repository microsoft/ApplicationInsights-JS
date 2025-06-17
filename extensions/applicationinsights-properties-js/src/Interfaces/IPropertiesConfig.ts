// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IPropertiesConfig {
    readonly accountId: string;
    readonly sessionRenewalMs: number;
    readonly samplingPercentage: number;
    readonly sessionExpirationMs: number;
    readonly cookieDomain: string,
    readonly sdkExtension: string;
    readonly isBrowserLinkTrackingEnabled: boolean;
    readonly appId: string;
    readonly getSessionId: string;
    readonly namePrefix: string;
    readonly sessionCookiePostfix: string;
    readonly userCookiePostfix: string;
    readonly idLength: number;
    readonly getNewId: (idLength?: number) => string;
}