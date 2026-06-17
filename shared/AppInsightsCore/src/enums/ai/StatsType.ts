// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//  @skip-file-minify

export const enum eStatsType {
    SDK = 0,
    CLIENT = 1,
}

export type StatsType = number | eStatsType;

/**
 * Identifies which ingestion endpoint the SDK Stats events are sent to. This is configurable via
 * the SDK configuration (and therefore the CDN / dynamic config) so the destination can be changed
 * at runtime.
 */
export const enum eStatsEndpointType {
    /**
     * Send SDK Stats to the distro-owned SDK Stats ingestion endpoint (stats.monitor.azure.com).
     * This is the default.
     */
    SdkStats = 0,

    /**
     * Send SDK Stats to the legacy breeze ingestion endpoint (the customer's own breeze endpoint
     * host, using the Microsoft-owned SDK Stats instrumentation key).
     */
    Breeze = 1,
}

export type StatsEndpointType = number | eStatsEndpointType;

