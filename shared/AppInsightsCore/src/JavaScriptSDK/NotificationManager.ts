// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { IPerfEvent } from "../JavaScriptSDK.Interfaces/IPerfEvent";
import dynamicProto from "@microsoft/dynamicproto-js";
import { arrForEach, arrIndexOf } from "./HelperFuncs";

/**
 * Class to manage sending notifications to all the listeners.
 */
export class NotificationManager implements INotificationManager {
    listeners: INotificationListener[] = [];

    constructor(config?: IConfiguration) {
        let perfEvtsSendAll = !!(config ||{}).perfEvtsSendAll;

        dynamicProto(NotificationManager, this, (_self) => {
            _self.addNotificationListener = (listener: INotificationListener): void => {
                _self.listeners.push(listener);
            };

            /**
             * Removes all instances of the listener.
             * @param {INotificationListener} listener - AWTNotificationListener to remove.
             */
            _self.removeNotificationListener = (listener: INotificationListener): void => {
                let index: number = arrIndexOf(_self.listeners, listener);
                while (index > -1) {
                    _self.listeners.splice(index, 1);
                    index = arrIndexOf(_self.listeners, listener);
                }
            };

            /**
             * Notification for events sent.
             * @param {ITelemetryItem[]} events - The array of events that have been sent.
             */
            _self.eventsSent = (events: ITelemetryItem[]): void => {
                arrForEach(_self.listeners, (listener) => {
                    if (listener && listener.eventsSent) {
                        setTimeout(() => listener.eventsSent(events), 0);
                    }
                });
            };

            /**
             * Notification for events being discarded.
             * @param {ITelemetryItem[]} events - The array of events that have been discarded by the SDK.
             * @param {number} reason           - The reason for which the SDK discarded the events. The EventsDiscardedReason
             * constant should be used to check the different values.
             */
            _self.eventsDiscarded = (events: ITelemetryItem[], reason: number): void => {
                arrForEach(_self.listeners, (listener) => {
                    if (listener && listener.eventsDiscarded) {
                        setTimeout(() => listener.eventsDiscarded(events, reason), 0);
                    }
                });
            };

            /**
             * [Optional] A function called when the events have been requested to be sent to the sever.
             * @param {number} sendReason - The reason why the event batch is being sent.
             * @param {boolean} isAsync   - A flag which identifies whether the requests are being sent in an async or sync manner.
             */
            _self.eventsSendRequest = (sendReason: number, isAsync: boolean): void => {
                arrForEach(_self.listeners, (listener) => {
                    if (listener && listener.eventsSendRequest) {
                        if (isAsync) {
                            setTimeout(() => listener.eventsSendRequest(sendReason, isAsync), 0);
                        } else {
                            try {
                                listener.eventsSendRequest(sendReason, isAsync);
                            } catch (e) {
                                // Catch errors to ensure we don't block sending the requests
                            }
                        }
                    }
                });
            };

            _self.perfEvent = (perfEvent?: IPerfEvent): void => {
                if (perfEvent) {

                    // Send all events or only parent events
                    if (perfEvtsSendAll || !perfEvent.isChildEvt()) {
                        arrForEach(_self.listeners, (listener) => {
                            if (listener && listener.perfEvent) {
                                if (perfEvent.isAsync) {
                                    setTimeout(() => listener.perfEvent(perfEvent), 0);
                                } else {
                                    try {
                                        listener.perfEvent(perfEvent);
                                    } catch (e) {
                                        // Catch errors to ensure we don't block sending the requests
                                    }
                                }
                            }
                        });
                    }
                }
            }
        });
    }
    
    /**
     * Adds a notification listener.
     * @param {INotificationListener} listener - The notification listener to be added.
     */
    addNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Removes all instances of the listener.
     * @param {INotificationListener} listener - AWTNotificationListener to remove.
     */
    removeNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Notification for events sent.
     * @param {ITelemetryItem[]} events - The array of events that have been sent.
     */
    eventsSent(events: ITelemetryItem[]): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Notification for events being discarded.
     * @param {ITelemetryItem[]} events - The array of events that have been discarded by the SDK.
     * @param {number} reason           - The reason for which the SDK discarded the events. The EventsDiscardedReason
     * constant should be used to check the different values.
     */
    eventsDiscarded(events: ITelemetryItem[], reason: number): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] A function called when the events have been requested to be sent to the sever.
     * @param {number} sendReason - The reason why the event batch is being sent.
     * @param {boolean} isAsync   - A flag which identifies whether the requests are being sent in an async or sync manner.
     */
    eventsSendRequest?(sendReason: number, isAsync: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] This event is sent if you have enabled perf events, they are primarily used to track internal performance testing and debugging
     * the event can be displayed via the debug plugin extension.
     * @param perfEvent
     */
    perfEvent?(perfEvent: IPerfEvent): void;
}
