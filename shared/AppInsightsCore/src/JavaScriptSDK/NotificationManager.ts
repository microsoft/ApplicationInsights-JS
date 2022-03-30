// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationListener } from "../JavaScriptSDK.Interfaces/INotificationListener";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { IPerfEvent } from "../JavaScriptSDK.Interfaces/IPerfEvent";
import dynamicProto from "@microsoft/dynamicproto-js";
import { arrForEach, arrIndexOf } from "./HelperFuncs";
import { strAddNotificationListener, strEventsDiscarded, strEventsSendRequest, strEventsSent, strPerfEvent, strRemoveNotificationListener } from "./InternalConstants";

function _runListeners(listeners: INotificationListener[], name: string, isAsync: boolean, callback: (listener: INotificationListener) => void) {
    arrForEach(listeners, (listener) => {
        if (listener && listener[name]) {
            if (isAsync) {
                setTimeout(() => callback(listener), 0);
            } else {
                try {
                    callback(listener);
                } catch (e) {
                    // Catch errors to ensure we don't block sending the requests
                }
            }
        }
    });
}

/**
 * Class to manage sending notifications to all the listeners.
 */
export class NotificationManager implements INotificationManager {
    listeners: INotificationListener[] = [];

    constructor(config?: IConfiguration) {
        let perfEvtsSendAll = !!(config ||{}).perfEvtsSendAll;

        dynamicProto(NotificationManager, this, (_self) => {
            _self[strAddNotificationListener] = (listener: INotificationListener): void => {
                _self.listeners.push(listener);
            };

            /**
             * Removes all instances of the listener.
             * @param {INotificationListener} listener - AWTNotificationListener to remove.
             */
            _self[strRemoveNotificationListener] = (listener: INotificationListener): void => {
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
            _self[strEventsSent] = (events: ITelemetryItem[]): void => {
                _runListeners(_self.listeners, strEventsSent, true, (listener) => {
                    listener[strEventsSent](events);
                });
            };

            /**
             * Notification for events being discarded.
             * @param {ITelemetryItem[]} events - The array of events that have been discarded by the SDK.
             * @param {number} reason           - The reason for which the SDK discarded the events. The EventsDiscardedReason
             * constant should be used to check the different values.
             */
            _self[strEventsDiscarded] = (events: ITelemetryItem[], reason: number): void => {
                _runListeners(_self.listeners, strEventsDiscarded, true, (listener) => {
                    listener[strEventsDiscarded](events, reason);
                });
            };

            /**
             * [Optional] A function called when the events have been requested to be sent to the sever.
             * @param {number} sendReason - The reason why the event batch is being sent.
             * @param {boolean} isAsync   - A flag which identifies whether the requests are being sent in an async or sync manner.
             */
            _self[strEventsSendRequest] = (sendReason: number, isAsync: boolean): void => {
                _runListeners(_self.listeners, strEventsSendRequest, isAsync, (listener) => {
                    listener[strEventsSendRequest](sendReason, isAsync);
                });
            };

            _self[strPerfEvent] = (perfEvent?: IPerfEvent): void => {
                if (perfEvent) {

                    // Send all events or only parent events
                    if (perfEvtsSendAll || !perfEvent.isChildEvt()) {
                        _runListeners(_self.listeners, strPerfEvent, false, (listener) => {
                            if (perfEvent.isAsync) {
                                setTimeout(() => listener[strPerfEvent](perfEvent), 0);
                            } else {
                                listener[strPerfEvent](perfEvent);
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
