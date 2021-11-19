// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { MessageType } from "./Enums";

// Send a message to the background task to cause the auto-inject script to be added if the
// extension is open for this tab
chrome.runtime.sendMessage({ id: MessageType.ContentLoad });

/**
 * Listen to page events
 */
window.addEventListener("message", (event) => {
    if (event.source != window) {
        return;
    }
    
    chrome.runtime.sendMessage(event.data);
}, false);
