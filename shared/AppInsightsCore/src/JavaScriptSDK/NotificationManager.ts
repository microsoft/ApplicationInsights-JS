// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { INotificationManager } from './../JavaScriptSDK.Interfaces/INotificationManager';
import { CoreUtils } from "./CoreUtils";

/**
 * Class to manage sending notifications to all the listeners.
 */
export class NotificationManager implements INotificationManager {
    listeners: INotificationListener[] = [];

    /**
     * Adds a notification listener.
     * @param {INotificationListener} listener - The notification listener to be added.
     */
    addNotificationListener(listener: INotificationListener): void {
        this.listeners.push(listener);
    }

    /**
     * Removes all instances of the listener.
     * @param {INotificationListener} listener - AWTNotificationListener to remove.
     */
    removeNotificationListener(listener: INotificationListener): void {
        let index: number = CoreUtils.arrIndexOf(this.listeners, listener);
        while (index > -1) {
            this.listeners.splice(index, 1);
            index = CoreUtils.arrIndexOf(this.listeners, listener);
        }
    }

    /**
     * Notification for events sent.
     * @param {ITelemetryItem[]} events - The array of events that have been sent.
     */
    eventsSent(events: ITelemetryItem[]): void {
        for (let i: number = 0; i < this.listeners.length; ++i) {
            if (this.listeners[i].eventsSent) {
                setTimeout(() => this.listeners[i].eventsSent(events), 0);
            }
        }
    }

    /**
     * Notification for events being discarded.
     * @param {ITelemetryItem[]} events - The array of events that have been discarded by the SDK.
     * @param {number} reason           - The reason for which the SDK discarded the events. The EventsDiscardedReason
     * constant should be used to check the different values.
     */
    eventsDiscarded(events: ITelemetryItem[], reason: number): void {
        for (let i: number = 0; i < this.listeners.length; ++i) {
            if (this.listeners[i].eventsDiscarded) {
                setTimeout(() => this.listeners[i].eventsDiscarded(events, reason), 0);
            }
        }
    }
}
