// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


export const enum MessageType {
    ContentLoad = 0,
    PopupUnload = 1,
    Network = 2,
    Notification = 3,
    GenericEvent = 4,
    DiagnosticLog = 5
}

export const enum MessageSource {
    WebRequest = 0,
    EventSentNotification = 1,
    EventsDiscardedNotification = 2,
    EventsSendNotification = 3,
    PerfEvent = 4,
    GenericEvent = 5,
    DebugEvent = 6,
    DiagnosticLog = 7
}