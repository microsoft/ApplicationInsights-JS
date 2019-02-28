// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import { ITelemetryItem } from "./ITelemetryItem";

/**
 * An interface used for the notification listener.
 * @interface
 */
export interface INotificationListener {
    /**
     * [Optional] A function called when events are sent.
     * @param {ITelemetryItem[]} events - The array of events that have been sent.
     */
    eventsSent?: (events: ITelemetryItem[]) => void;
    /**
     * [Optional] A function called when events are discarded.
     * @param {ITelemetryItem[]} events - The array of events that have been discarded.
     * @param {number} reason           - The reason for discarding the events. The EventsDiscardedReason
     * constant should be used to check the different values.
     */
    eventsDiscarded?: (events: ITelemetryItem[], reason: number) => void;
}
