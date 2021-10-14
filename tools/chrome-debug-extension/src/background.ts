// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

function registerEventHandlers(): void {
  const windowId: number = -1;
  // Configure the browser action (the button next to the address bar registered in manifest.json) to
  // open the popup when clicked.
  chrome.browserAction.onClicked.addListener(() => {
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
