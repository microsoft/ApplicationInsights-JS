// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { StatsType } from "../../enums/ai/StatsType";
import { IPayloadData } from "./IXHROverride";

/**
 * The interface for the stats beat plugin, which is responsible for collecting and sending statistics about the SDK.
 * It is used to track the performance and usage of the SDK, and to identify any issues or errors that may occur.
 * @since 3.3.7
 */
export interface IStatsBeat {
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
export interface IStatsBeatState {
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
export interface IStatsBeatKeyMap {
    /**
     * The key to used to for any matching endpoints.
     */
    key?: string;

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
    keyMap?: IStatsBeatKeyMap[]
}

/**
 * The configuration for the stats beat definition
 * @since 3.3.7
 */
export interface IStatsBeatConfig {
    /**
     * The short collection interval in seconds to send the stats beat events.
     * Default: 15 min
     */
    shrtInt?: number;
    
    /**
     * The Endpoint configurations for the stats beat plugin.
     * This is used to identify the endpoints that are supported by the stats beat plugin.
     */
    endCfg?: IStatsEndpointConfig[];
}
