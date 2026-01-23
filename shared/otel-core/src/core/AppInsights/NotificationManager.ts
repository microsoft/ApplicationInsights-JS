// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import dynamicProto from "@microsoft/dynamicproto-js";
import { IPromise, createAllPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import { ITimerHandler, arrForEach, arrIndexOf, objDefine, safe, scheduleTimeout } from "@nevware21/ts-utils";
import { createDynamicConfig } from "../../config/AppInsights/DynamicConfig";
import {
    STR_EVENTS_DISCARDED, STR_EVENTS_SEND_REQUEST, STR_EVENTS_SENT, STR_OFFLINE_DROP, STR_OFFLINE_SENT, STR_OFFLINE_STORE, STR_PERF_EVENT
} from "../../constants/InternalConstants";
import { IConfiguration } from "../../interfaces/AppInsights/IConfiguration";
import { INotificationListener } from "../../interfaces/AppInsights/INotificationListener";
import { INotificationManager } from "../../interfaces/AppInsights/INotificationManager";
import { IPerfEvent } from "../../interfaces/AppInsights/IPerfEvent";
import { ITelemetryItem } from "../../interfaces/AppInsights/ITelemetryItem";
import { IUnloadHook } from "../../interfaces/AppInsights/IUnloadHook";
import { IPayloadData } from "../../interfaces/AppInsights/IXHROverride";

const defaultValues = {
    perfEvtsSendAll: false
};

interface IAsyncNotifications {
    h: ITimerHandler;
    cb: Array<{ fn: (listener: INotificationListener) => void, arg: INotificationListener }>
}

function _runScheduledListeners(asyncNotifications: IAsyncNotifications) {
    asyncNotifications.h = null;
    let callbacks = asyncNotifications.cb;
    asyncNotifications.cb = [];
    arrForEach(callbacks, (cb) => {
        // Run the listener in a try-catch to ensure that a single listener failing doesn't prevent the others from running
        safe(cb.fn, [cb.arg]);
    });
}

// This function is used to combine the logic of running the listeners and handling the async notifications so that they don't
// create multiple timers if there are multiple async listeners.
function _runListeners(listeners: INotificationListener[], name: string, asyncNotifications: IAsyncNotifications | null, callback: (listener: INotificationListener) => void) {
    arrForEach(listeners, (listener) => {
        if (listener && listener[name]) {
            if (asyncNotifications) {
                // Schedule the callback to be called after the current call stack has cleared.
                asyncNotifications.cb.push({
                    fn: callback,
                    arg: listener
                });

                asyncNotifications.h = asyncNotifications.h || scheduleTimeout(_runScheduledListeners, 0, asyncNotifications);
            } else {
                // Run the listener in a try-catch to ensure that a single listener failing doesn't prevent the others from running
                safe(callback, [listener]);
            }
        }
    });
}

/**
 * Class to manage sending notifications to all the listeners.
 */
export class NotificationManager implements INotificationManager {
    public readonly listeners: INotificationListener[] = [];

    constructor(config?: IConfiguration) {
        let perfEvtsSendAll: boolean;
        let unloadHandler: IUnloadHook;
        let _listeners: INotificationListener[] = [];
        let _asyncNotifications: IAsyncNotifications = {
            h: null,
            cb: []
        };

        let cfgHandler = createDynamicConfig(config, defaultValues);

        unloadHandler = cfgHandler.watch((details) => {
            perfEvtsSendAll = !!details.cfg.perfEvtsSendAll;
        });

        dynamicProto(NotificationManager, this, (_self) => {
            objDefine(_self, "listeners", {
                g: () => _listeners
            });
    
            _self.addNotificationListener = (listener: INotificationListener): void => {
                _listeners.push(listener);
            };

            /**
             * Removes all instances of the listener.
             * @param listener - AWTNotificationListener to remove.
             */
            _self.removeNotificationListener = (listener: INotificationListener): void => {
                let index: number = arrIndexOf(_listeners, listener);
                while (index > -1) {
                    _listeners.splice(index, 1);
                    index = arrIndexOf(_listeners, listener);
                }
            };

            /**
             * Notification for events sent.
             * @param events - The array of events that have been sent.
             */
            _self.eventsSent = (events: ITelemetryItem[]): void => {
                _runListeners(_listeners, STR_EVENTS_SENT, _asyncNotifications, (listener) => {
                    listener.eventsSent(events);
                });
            };

            /**
             * Notification for events being discarded.
             * @param events - The array of events that have been discarded by the SDK.
             * @param reason - The reason for which the SDK discarded the events. The EventsDiscardedReason
             * constant should be used to check the different values.
             * @param sendType - [Optional] The send type used when the events were discarded.
             */
            _self.eventsDiscarded = (events: ITelemetryItem[], reason: number, sendType?: number): void => {
                _runListeners(_listeners, STR_EVENTS_DISCARDED, _asyncNotifications, (listener) => {
                    listener.eventsDiscarded(events, reason, sendType);
                });
            };

            /**
             * [Optional] A function called when the events have been requested to be sent to the sever.
             * @param sendReason - The reason why the event batch is being sent.
             * @param isAsync - A flag which identifies whether the requests are being sent in an async or sync manner.
             */
            _self.eventsSendRequest = (sendReason: number, isAsync: boolean): void => {
                _runListeners(_listeners, STR_EVENTS_SEND_REQUEST, isAsync ? _asyncNotifications : null, (listener) => {
                    listener.eventsSendRequest(sendReason, isAsync);
                });
            };

            _self.perfEvent = (perfEvent?: IPerfEvent): void => {
                if (perfEvent) {

                    // Send all events or only parent events
                    if (perfEvtsSendAll || !perfEvent.isChildEvt()) {
                        _runListeners(_listeners, STR_PERF_EVENT, null, (listener) => {
                            if (perfEvent.isAsync) {
                                scheduleTimeout(() => listener.perfEvent(perfEvent), 0);
                            } else {
                                listener.perfEvent(perfEvent);
                            }
                        });
                    }
                }
            };

            _self.offlineEventsStored = (events: ITelemetryItem[]): void => {
                if (events && events.length) {
                    _runListeners(_listeners, STR_OFFLINE_STORE, _asyncNotifications, (listener) => {
                        listener.offlineEventsStored(events);
                    });
                }
            }

            _self.offlineBatchSent = (batch: IPayloadData): void => {
                if (batch && batch.data) {
                    _runListeners(_listeners, STR_OFFLINE_SENT, _asyncNotifications, (listener) => {
                        listener.offlineBatchSent(batch);
                    });
                }
            }

            _self.offlineBatchDrop = (cnt: number, reason?: number): void => {
                if (cnt > 0) {
                    let rn = reason || 0; // default is unknown
                    _runListeners(_listeners, STR_OFFLINE_DROP, _asyncNotifications, (listener) => {
                        listener.offlineBatchDrop(cnt, rn);
                    });
                }
            }

            _self.unload = (isAsync?: boolean) => {

                const _finishUnload = () => {
                    unloadHandler && unloadHandler.rm();
                    unloadHandler = null;
                    _listeners = [];
                    
                    // Clear any async listener
                    _asyncNotifications.h && _asyncNotifications.h.cancel();
                    _asyncNotifications.h = null;
                    _asyncNotifications.cb = [];
                };

                let waiting: IPromise<void>[];
                _runListeners(_listeners, "unload", null, (listener) => {
                    let asyncUnload = listener.unload(isAsync);
                    if (asyncUnload) {
                        if (!waiting) {
                            waiting = [];
                        }

                        waiting.push(asyncUnload);
                    }
                });

                if (waiting) {
                    return createPromise((resolve) => {
                        return doAwaitResponse(createAllPromise(waiting), () => {
                            _finishUnload();
                            resolve();
                        });
                    });
                } else {
                    _finishUnload();
                }
            };
        });
    }
    
    /**
     * Adds a notification listener.
     * @param listener - The notification listener to be added.
     */
    addNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Removes all instances of the listener.
     * @param listener - AWTNotificationListener to remove.
     */
    removeNotificationListener(listener: INotificationListener): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Notification for events sent.
     * @param events - The array of events that have been sent.
     */
    eventsSent(events: ITelemetryItem[]): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Notification for events being discarded.
     * @param events - The array of events that have been discarded by the SDK.
     * @param reason - The reason for which the SDK discarded the events. The EventsDiscardedReason
     * constant should be used to check the different values.
     */
    eventsDiscarded(events: ITelemetryItem[], reason: number): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] A function called when the events have been requested to be sent to the sever.
     * @param sendReason - The reason why the event batch is being sent.
     * @param isAsync - A flag which identifies whether the requests are being sent in an async or sync manner.
     */
    eventsSendRequest?(sendReason: number, isAsync: boolean): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] This event is sent if you have enabled perf events, they are primarily used to track internal performance testing and debugging
     * the event can be displayed via the debug plugin extension.
    * @param perfEvent - The performance event object containing relevant performance data.
    */
    perfEvent?(perfEvent: IPerfEvent): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Unload and remove any state that this INotificationManager may be holding, this is generally called when the
     * owning SDK is being unloaded.
     * @param isAsync - Can the unload be performed asynchronously (default)
     * @returns If the unload occurs synchronously then nothing should be returned, if happening asynchronously then
     * the function should return an [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
     * / Promise to allow any listeners to wait for the operation to complete.
     */
    unload?(isAsync?: boolean): void | IPromise<void> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] A function called when the offline events have been stored to the persistent storage
     * @param events - events that are stored in the persistent storage
     */
    offlineEventsStored?(events: ITelemetryItem[]): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] A function called when the offline events have been sent from the persistent storage
     * @param batch - payload data that is sent from the persistent storage
     */
    offlineBatchSent?(batch: IPayloadData): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * [Optional] A function called when the offline events have been dropped from the persistent storage
     * @param cnt - count of batches dropped
     * @param reason - the reason why the batches is dropped
     * @since v3.1.1
     */
    offlineBatchDrop?(cnt: number, reason?: number): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
