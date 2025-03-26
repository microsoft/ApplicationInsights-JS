// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { getDocument, isFunction } from "@microsoft/applicationinsights-core-js";

export function createDomEvent(eventName: string): Event {
    let event: Event = null;

    if (isFunction(Event)) { // Use Event constructor when available
        event = new Event(eventName);
    } else { // Event has no constructor in IE
        let doc = getDocument();
        if (doc && doc.createEvent) {
            event = doc.createEvent("Event");
            event.initEvent(eventName, true, true);
        }
    }

    return event;
}
