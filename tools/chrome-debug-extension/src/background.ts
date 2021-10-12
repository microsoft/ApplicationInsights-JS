// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

function convertToStringArray(buf: chrome.webRequest.UploadData[] | undefined): string[] {
  if (buf !== undefined) {
    const data = buf[0].bytes;
    if (data) {
      const decoder = new TextDecoder();
      return decoder.decode(new Uint8Array(data)).split('\n');
    }
  }
  return [''];
}

let windowId: number = -1;
function registerEventHandlers(): void {
  // Monitor network traffic for telemetry
  chrome.webRequest.onBeforeRequest.addListener(
    (details: chrome.webRequest.WebRequestBodyDetails) => {
      if (details.type === 'xmlhttprequest') {
        const events = details.requestBody && convertToStringArray(details.requestBody.raw);
        if (events) {
          for (let i = events.length - 1; i >= 0; i--) {
            const event = JSON.parse(events[i]);
            if (event !== undefined) {
              chrome.runtime.sendMessage({ event });
            }
          }
        }
      }
    },
    // filters
    {
      urls: ['*://*.microsoft.com/OneCollector/*']
    },
    ['requestBody']
  );

  // Configure the browser action (the button next to the address bar registered in manifest.json) to
  // open the popup when clicked.
  chrome.browserAction.onClicked.addListener(() => {
    chrome.windows.update(windowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        chrome.windows.create(
          {
            url: 'pages/popup.html',
            type: 'popup',
            focused: true,
            width: 750,
            height: screen.height
          },
          // tslint:disable-next-line:no-any
          (chromeWindow: any) => {
            windowId = (chromeWindow && chromeWindow.id) || -1;
          }
        );
      }
    });
  });
}

// Self running code
(() => {
  registerEventHandlers();
})();

export default registerEventHandlers;