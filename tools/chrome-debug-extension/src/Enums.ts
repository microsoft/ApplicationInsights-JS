// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


/**
 * This enum identifies the internal message type of how the event has been sent and was
 * captured via the extension, these can be background, popup and loaded page (via the pageHelper.ts)
 */
export const enum MessageType {

    /**
     * Cause the content (pageHelper) script to injected and loaded into the open tab
     */
    ContentLoad = 0,

    /**
     * The message was originated from listening to the network requests
     */
    Network = 10,

    /**
     * The message was originated via the SDK notification hooks
     */
    Notification = 20,

    /**
     * The message was originated via the sendEvt hook provided by the pageHelper.
     */
    GenericEvent = 30,

    /**
     * The message was originated via the debugMsg hook provided by the pageHelper.
     */
    DebugEvent = 31,

    /**
     * The message was originated via the SDK diagnostic log hooks
     */
    DiagnosticLog = 32
}

/**
 * Identifies the specific source (originating point) of the message.
 * There is currently a strong relationship between the MessageType (how the event enters the extension)
 * and the source of the event.
 */
export const enum MessageSource {
    /**
     * The message source is from a web request
     */
    WebRequest = 0,

    /**
     * The message source is from the sdk events sent notification.
     */
    EventSentNotification = 1,

    /**
     * The message source is from the sdk events discarded notification.
     */
    EventsDiscardedNotification = 2,

    /**
     * The message source is from the sdk events send notification
     */
    EventsSendNotification = 3,

    /**
     * The message source is from the sdk internal perf event notification.
     */
    PerfEvent = 4,

    /**
     * The message source is a generic event.
     */
    GenericEvent = 5,

    /**
     * The message source is a debug event (ApplicationInsights Debug Extension)
     */
    DebugEvent = 6,

    /**
     * The message source is from the sdk diagnostic logger
     */
    DiagnosticLog = 7
}