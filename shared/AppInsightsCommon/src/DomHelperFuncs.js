"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDomEvent = createDomEvent;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
function createDomEvent(eventName) {
    var event = null;
    if ((0, applicationinsights_core_js_1.isFunction)(Event)) { // Use Event constructor when available
        event = new Event(eventName);
    }
    else { // Event has no constructor in IE
        var doc = (0, applicationinsights_core_js_1.getDocument)();
        if (doc && doc.createEvent) {
            event = doc.createEvent("Event");
            event.initEvent(eventName, true, true);
        }
    }
    return event;
}
