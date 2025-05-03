// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The interface for the network stats beat plugin, which is responsible for collecting
 * and sending statistics about network requests. It is used to track the performance
 * and usage of network requests, and to identify any issues or errors that may occur.
 */
export interface INetworkStatsbeat {
    host: string;
    totalRequest: number;
    success: number;
    throttle: Record<number, number>;
    failure: Record<number, number>;
    retry: Record<number, number>;
    exception: Record<string, number>;
    requestDuration: number;
}
