// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objKeys } from "@microsoft/applicationinsights-core-js";
import { MessageType } from "./Enums";
import { getPopupSettings, setPopupSize } from "./configuration/PopupConfigCache";
import { IMessage } from "./interfaces/IMessage";

const openTabs: {[key: string]: chrome.windows.Window} = { };

function setTabWindow(tabId?: number, w?: chrome.windows.Window) {
    if (tabId) {
        if (w) {
            openTabs["tab-" + tabId] = w;
        } else {
            delete openTabs["tab-" + tabId];
        }
    }
}

function getTabWindow(tabId?: number): chrome.windows.Window {
    if (tabId) {
        return openTabs["tab-" + tabId] || null;
    }

    return null as any;
}

function injectPageHelper(tabId?: number) {
    if (tabId) {
        let url = chrome.runtime.getURL("scripts/pageHelper.min.js");
        let theScript =
            "var d=document,s=d.createElement('script');" +
            "s.src='" + encodeURI(url) + "';" +
            "var el=d.head||d.documentElement;" +
            "el.appendChild(s);";

        chrome.tabs.executeScript(tabId, {
            code: theScript
        }, _=>{
            let e = chrome.runtime.lastError;
            if(e !== undefined){
                console.log(tabId, _, e);
            }
        });
    }
}

function openPopup(tab: chrome.tabs.Tab) {
    let settings = getPopupSettings();

    chrome.windows.create({
        url: "pages/popup.html?tabId=" + tab.id,
        type: "popup",
        focused: true,
        width: Math.min(Math.max(settings.width || 0, 200), screen.width),
        height: Math.min(Math.max(settings.height || 0, 320), screen.height)
    }, (value) => {
        setTabWindow(tab.id, value);
        if (value) {
            let popupId = value.id;

            let _onResize = (win: chrome.windows.Window) => {
                if (win.id === popupId) {
                    setPopupSize(win.width, win.height);
                }
            }

            let _onRemove = (windowId: number) => {
                if (popupId === windowId) {
                    setTabWindow(tab.id);
                    chrome.windows.onRemoved.removeListener(_onRemove);
                    chrome.windows.onBoundsChanged.removeListener(_onResize);
                }
            }
        
            // Track popup window size
            chrome.windows.onBoundsChanged.addListener(_onResize);

            // track popup window
            chrome.windows.onRemoved.addListener(_onRemove);
        }
    });
}

// Self running code
(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        let msg = message as IMessage;
        if (msg.id === MessageType.ContentLoad && sender && sender.tab) {
            if (objKeys(openTabs).length > 0) {
                injectPageHelper(sender.tab.id);
            }

            sendResponse();
        }
    });

    // Configure the browser action (the button next to the address bar registered in manifest.json) to
    // open the popup when clicked.
    chrome.browserAction.onClicked.addListener((tab) => {
        if (tab && tab.id) {
            // Inject the helper hook function
            injectPageHelper(tab.id);

            // Launch the popup
            let w = getTabWindow(tab.id);
            if (!w || !w.id) {
                openPopup(tab);
            } else {
                chrome.windows.get(w.id, () => {
                    if (chrome.runtime.lastError) {
                        setTabWindow(tab.id);
                        openPopup(tab);
                    } else {
                        chrome.windows.update(w.id as number, { focused: true }, () => {
                            if (chrome.runtime.lastError) {
                                openPopup(tab);
                            }
                        });
                    }
                });
            }
        }
    });
})();
