// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { objKeys } from "@microsoft/applicationinsights-core-js";
import { MessageType } from "./Enums";
import { getPopupSettings, setPopupSize } from "./configuration/PopupConfigCache";
import { IMessage } from "./interfaces/IMessage";
import { mathMax, mathMin } from "@nevware21/ts-utils";

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

function injectScript(url: string) {
    const d = document;
    const s = d.createElement("script");
    s.src = encodeURI(url);
    const el = d.head || d.documentElement;
    el.appendChild(s);
}

function injectPageHelper(tabId?: number) {
    if (tabId) {
        let url = chrome.runtime.getURL("scripts/pageHelper.min.js");
        chrome.scripting.executeScript({
            target: { tabId },
            func: injectScript,
            args: [url]
        }, (result) => {
            if (chrome.runtime.lastError) {
                console.log(`Error injecting script into tab ${tabId}:`, chrome.runtime.lastError);
            }
        });
    }
}

function openPopup(tab: chrome.tabs.Tab) {
    let settings = getPopupSettings();

    chrome.system.display.getInfo((displays) => {
        const primaryDisplay = displays[0]; // Typically, the primary display is the first in the list
        const screenWidth = primaryDisplay.workArea.width;
        const screenHeight = primaryDisplay.workArea.height;
        chrome.windows.create({
            url: "pages/popup.html?tabId=" + tab.id,
            type: "popup",
            focused: true,
            width: mathMin(mathMax(settings.width || 0, 200), screenWidth),
            height: mathMin(mathMax(settings.height || 0, 320), screenHeight)
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
    });

    
}

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
chrome.action.onClicked.addListener((tab) => {
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

