// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * This interface contains details of stats beat event(s) that are sent to the server.
 * It contains the start time of the event and the duration of the event.
 */
export interface IStatsEventData {
    startTime: number;
    duration?: number;
}
