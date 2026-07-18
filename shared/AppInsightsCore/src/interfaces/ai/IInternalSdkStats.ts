// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StatsEndpointType, StatsType } from "../../enums/ai/StatsType";
import { IPayloadData } from "./IXHROverride";

/**
 * The interface for the stats beat plugin, which is responsible for collecting and sending statistics about the SDK.
 * It is used to track the performance and usage of the SDK, and to identify any issues or errors that may occur.
 * @since 3.3.7
 */
export interface IInternalSdkStats {
    /**
     * Returns whether this instance of the stats beat is enabled or not.
     * @returns True if the stats beat is enabled, false otherwise.
     */
    enabled: boolean;

    /**
     * Return the current endpoint where the stats beat is sending events.
     * @returns The current endpoint URL.
     */
    endpoint: string;

    /**
     * Returns the StatsType for this instance of the stats beat.
     * @returns The current stats type.
     */
    type: StatsType;

    /**
     * Count the number of events sent to the endpoint with the given status code.
     * @param status - The status code of the event.
     * @param payloadData - The payload data of the event.
     * @param endpoint - The endpoint where the event was sent.
     */
    count(status: number, payloadData: IPayloadData, endpoint: string): void;

    /**
     * Record an exception for the given endpoint and exception type.
     * @param endpoint  - The endpoint where the exception occurred.
     * @param exceptionType - The type of the exception.
     */
    countException(endpoint: string, exceptionType: string): void;
}

/**
 * The configuration passed to the stats beat plugin to record statistics about the SDK
 * @since 3.3.7
 */
export interface IInternalSdkStatsState {
    /**
     * The current instrumentation key.
     */
    cKey: string;

    /**
     * The current endpoint where the events are sent.
     */
    endpoint: string;

    /**
     * The current Sdk version.
     */
    sdkVer?: string;

    /**
     * The type of the stats event.
     */
    type?: StatsType;
}

/**
 * The configuration for the collection of supported endpoints
 * @since 3.3.7
 */
export interface IInternalSdkStatsKeyMap {
    /**
     * The key to used to for any matching endpoints.
     */
    key?: string;

    /**
     * The SDK Stats ingestion endpoint URL that matching events should be redirected to. When
     * omitted, matching events are sent to the customer's configured (breeze) endpoint instead.
     */
    url?: string;

    /**
     * An array of string URLs that are supported by the endpoint,
     * the string values are used to compar against the endpoint URL
     * in a case insensitive manner. The values may also contain wildcards
     * characters "*", "**" and "?" to match any number of characters using
     * a glob style pattern.
     */
    match: string[];
}

/**
 * The configuration for the stats beat plugin, which is used to track the performance and usage of the SDK.
 * It is used to identify any issues or errors that may occur, and to provide insights into the usage of the SDK.
 * @since 3.3.7
 */
export interface IStatsEndpointConfig {
    /**
     * Identifies the key(s) associated with the endpoints for the type of stats event.
     */
    type: StatsType;

    /**
     * The matching endpoints.
     */
    keyMap?: IInternalSdkStatsKeyMap[]
}

/**
 * The parsed result of the remote SDK Stats configuration (`cfg/v1.json`). It identifies whether
 * SDK Stats collection is currently enabled and the host that matching events should be sent to.
 * @since 3.3.7
 */
export interface IInternalSdkStatsCfgResult {
    /**
     * Identifies whether SDK Stats collection is enabled. When false the SDK Stats events are not
     * sent (the feature is effectively disabled by the distro-owned configuration).
     */
    enabled: boolean;

    /**
     * The host (or full URL) that the SDK Stats events should be sent to. The ingestion path (e.g.
     * `/v2/track`) is appended by the SDK, so this generally only carries the host (for example
     * `data.stats.monitor.azure.com`).
     */
    url: string;
}

/**
 * The signature of the function used to fetch (and parse) the remote SDK Stats configuration. It is
 * primarily used to allow the fetch implementation to be overridden (for testing or advanced
 * scenarios) via {@link IInternalSdkStatsConfig.overrideCfgFn}.
 * @param cfgUrl - The SDK Stats configuration URL (`cfg/v1.json`) to fetch.
 * @param oncomplete - The callback to invoke with the parsed configuration, or null on any failure.
 * @since 3.3.7
 */
export type InternalSdkStatsCfgFetchFn = (cfgUrl: string, oncomplete: (result: IInternalSdkStatsCfgResult | null) => void) => void;

/**
 * The configuration for the stats beat definition
 * @since 3.3.7
 */
export interface IInternalSdkStatsConfig {
    /**
     * The short collection interval in seconds to send the stats beat events.
     * Default: 15 min
     */
    shrtInt?: number;

    /**
     * Identifies which ingestion endpoint the SDK Stats events are sent to. When set to
     * {@link eStatsEndpointType.Breeze} the events are sent to the legacy breeze endpoint, otherwise
     * they are sent to the distro-owned SDK Stats endpoint. This is configurable via the CDN /
     * dynamic config so the destination can be changed at runtime.
     * Default: {@link eStatsEndpointType.SdkStats}
     */
    mode?: StatsEndpointType;

    /**
     * The Endpoint configurations for the stats beat plugin.
     * This is used to identify the endpoints that are supported by the stats beat plugin.
     */
    endCfg?: IStatsEndpointConfig[];

    /**
     * Optional override for the function used to fetch the remote SDK Stats configuration
     * (`cfg/v1.json`). When not provided the default fetch / XHR based implementation is used. This
     * is primarily intended for testing or advanced scenarios where the configuration needs to be
     * resolved through a custom mechanism.
     */
    overrideCfgFn?: InternalSdkStatsCfgFetchFn;
}
