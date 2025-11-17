// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDbgExtension, INotificationListener, IPerfEvent, ITelemetryItem, arrForEach, objKeys, toISOString
} from "@microsoft/applicationinsights-core-js";
import { MessageSource, MessageType } from "./Enums";
import { IMessage } from "./interfaces/IMessage";

const theNamespace = [ "Microsoft", "ApplicationInsights", "ChromeDbgExt" ];
let isEnabled = false;

const excludeKeys = [
    "_dynInstFuncs",
    "_getTelCtx",
    "_baseTelInit",
    "diagLog",
    "isInitialized",
    "setInitialized",
    "setNextPlugin",
    "processNext"
];

function _normalizeEventDetails(object: any) {
    function _copyWithoutCircularReferences(references: any, object: any) {
        var cleanObject = {};
        arrForEach(objKeys(object), (key) => {
            if (excludeKeys.indexOf(key) === -1) {
                var value = object[key];
                if (value && typeof value === "object") {
                    if (references.indexOf(value) < 0) {
                        references.push(value);
                        cleanObject[key] = _copyWithoutCircularReferences(references, value);
                        references.pop();
                    } else {
                        cleanObject[key] = "###_Circular_###";
                    }
                } else if (typeof value !== "function") {
                    cleanObject[key] = value;
                }
            }
        });
        return cleanObject;
    }

    if (object && typeof object === "object") {
        object = _copyWithoutCircularReferences([object], object);
    }

    return object;
}

function _sendMessage(type: MessageType, msgSource: MessageSource, name: string, data: any) {
    if (isEnabled) {
        let msg: IMessage = {
            id: type,
            src: msgSource,
            details: {
                name,
                time: toISOString(new Date()),
                data
            }
        };

        window.postMessage(_normalizeEventDetails(msg), "*");
    }
}

let _notificationListener: INotificationListener = {
    /**
     * [Optional] A function called when events are sent.
     * @param events - The array of events that have been sent.
     */
    eventsSent: (theEvents: ITelemetryItem[]) => {
        _sendMessage(MessageType.Notification, MessageSource.EventSentNotification, "Notification:eventsSent", theEvents);
    },
    /**
     * [Optional] A function called when events are discarded.
     * @param events - The array of events that have been discarded.
     * @param reason - The reason for discarding the events. The EventsDiscardedReason
     * constant should be used to check the different values.
     * @param sendType - [Optional] The send type used when the events were discarded.
     */
    eventsDiscarded: (events: ITelemetryItem[], reason: number, sendType?: number) => {
        _sendMessage(MessageType.Notification, MessageSource.EventsDiscardedNotification, "Notification:eventsDiscarded", {
            reason,
            events,
            sendType
        });
    },

    /**
     * [Optional] A function called when the events have been requested to be sent to the sever.
     * @param sendReason - The reason why the event batch is being sent.
     * @param isAsync - A flag which identifies whether the requests are being sent in an async or sync manner.
     */
    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
        _sendMessage(MessageType.Notification, MessageSource.EventsSendNotification, "Notification:eventsSendRequest", {
            sendReason,
            isAsync
        });
    },
    /**
     * [Optional] This event is sent if you have enabled perf events, they are primarily used to track internal performance testing and debugging
     * the event can be displayed via the debug plugin extension.
     * @param perfEvent
     */
    perfEvent: (perfEvent: IPerfEvent) => {
        let evtName = `Notification:perfEvent[${perfEvent.name}]`;
        _sendMessage(MessageType.Notification, MessageSource.PerfEvent, evtName, perfEvent);
    }
};

function _sendEvent(name: string, data: any) {
    _sendMessage(MessageType.GenericEvent, MessageSource.GenericEvent, name, data);
}

function _debugMsg(name: string, data: any) {
    _sendMessage(MessageType.DebugEvent, MessageSource.DebugEvent, "debug:" + name, data);
}

function _diagLog(name: string, data: any) {
    _sendMessage(MessageType.DiagnosticLog, MessageSource.DiagnosticLog, "diagLog:" + name, data);
}

/**
 * This function is auto injected into the runtime of the executing page
 */
(() => {

    let target = window;
    for (let lp = 0; lp < theNamespace.length-1; lp++) {
        target = target[theNamespace[lp]] = target[theNamespace[lp]] || {};
    }
    let extName = theNamespace[theNamespace.length - 1];

    if (!target[extName]) {
        let debugExt: IDbgExtension = {
            isEnabled: () => {
                return isEnabled;
            },
            enable: () => {
                isEnabled = true;
            },
            disable: () => {
                isEnabled = false;
                // self remove
                delete target[extName];
            },
            // INotificationListener implementation
            listener: _notificationListener,
            sendEvt: _sendEvent,
            debugMsg: _debugMsg,
            diagLog: _diagLog
        };
        target[extName] = debugExt;
        debugExt.enable();
    }
})();
