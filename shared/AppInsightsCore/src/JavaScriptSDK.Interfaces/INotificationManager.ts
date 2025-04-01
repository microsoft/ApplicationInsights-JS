// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IPromise } from "@nevware21/ts-async";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { IPerfEvent } from "./IPerfEvent";
import { IPayloadData } from "./IXHROverride";

/**
 * Class to manage sending notifications to all the listeners.
 */
export interface INotificationManager {
    listeners: INotificationListener[];

    /**
     * Adds a notification listener.
     * @param listener - The notification listener to be added.
     */
    addNotificationListener(listener: INotificationListener): void;

    /**
     * Removes all instances of the listener.
     * @param listener - AWTNotificationListener to remove.
     */
    removeNotificationListener(listener: INotificationListener): void;

    /**
     * Notification for events sent.
     * @param events - The array of events that have been sent.
     */
    eventsSent(events: ITelemetryItem[]): void;

    /**
     * Notification for events being discarded.
     * @param events - The array of events that have been discarded by the SDK.
     * @param reason - The reason for which the SDK discarded the events. The EventsDiscardedReason
     * constant should be used to check the different values.
     */
    eventsDiscarded(events: ITelemetryItem[], reason: number): void;

    /**
     * [Optional] A function called when the events have been requested to be sent to the sever.
     * @param sendReason - The reason why the event batch is being sent.
     * @param isAsync - A flag which identifies whether the requests are being sent in an async or sync manner.
     */
    eventsSendRequest?(sendReason: number, isAsync: boolean): void;

    /**
     * [Optional] This event is sent if you have enabled perf events, they are primarily used to track internal performance testing and debugging
     * the event can be displayed via the debug plugin extension.
     * @param perfEvent - The perf event details
     */
    perfEvent?(perfEvent: IPerfEvent): void;

    /**
     * Unload and remove any state that this INotificationManager may be holding, this is generally called when the
     * owning SDK is being unloaded.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @returns If the unload occurs synchronously then nothing should be returned, if happening asynchronously then
     * the function should return an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * / Promise to allow any listeners to wait for the operation to complete.
     */
    unload?(isAsync?: boolean): void | IPromise<void>;

    /**
     * [Optional] A function called when the offline events have been stored to the persistent storage
     * @param events - items that are stored in the persistent storage
     * @since v3.1.1
     */
    offlineEventsStored?(events: ITelemetryItem[]): void;

    /**
     * [Optional] A function called when the offline events have been sent from the persistent storage
     * @param batch - payload data that is sent from the persistent storage
     * @since v3.1.1
     */
    offlineBatchSent?(batch: IPayloadData): void;

    /**
     * [Optional] A function called when the offline events have been dropped from the persistent storage
     * @param cnt - count of batches dropped
     * @param reason - the reason why the batches is dropped
     * @since v3.1.1
     */
    offlineBatchDrop?(cnt: number, reason?: number): void;
}
