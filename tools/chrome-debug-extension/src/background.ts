// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

function registerEventHandlers(): void {
    const windowId: number = -1;

    chrome.browserAction.onClicked.addListener(function(tab) {
        // No tabs or host permissions needed!
        console.log("Turning " + tab.url + " blue!");
        if (tab && tab.id) {
            console.log(tab.id);
            chrome.tabs.executeScript(tab.id, {
                code: "document.body.style.backgroundColor=\"lightblue\";  window.addEventListener(\"message\", (event) => { if (event.source != window) { return; } chrome.runtime.sendMessage(event.data); }, false);"
            }, _=>{
                let e = chrome.runtime.lastError;
                if(e !== undefined){
                    console.log(tab.id, _, e);
                }
            });
        }
    });

    // Configure the browser action (the button next to the address bar registered in manifest.json) to
    // open the popup when clicked.
    chrome.browserAction.onClicked.addListener((tab) => {
        // Launch the popup
        chrome.windows.update(windowId, { focused: true }, () => {
            if (chrome.runtime.lastError) {
                chrome.windows.create({
                    url: "pages/popup.html",
                    type: "popup",
                    focused: true,
                    width: 750,
                    height: screen.height
                });
            }
        });
    });
}

// Self running code
(() => {
    registerEventHandlers();
})();
