// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ExampleMessageType, IExampleRequest, IExampleResponse } from "./interfaces/IExampleMessage";
import { dumpObj } from "@nevware21/ts-utils";

const EventHandlers: { [key: number]: (request: IExampleRequest, port: MessagePort) => IExampleResponse } = {
    [ExampleMessageType.Invalid]: workerInvalid,
    [ExampleMessageType.Fetch]: workerFetch
};

/**
 * The main shared worker entry point
 */
addEventListener("connect", (evt: MessageEvent) => {
    const port = evt.ports[0];

    // Add the message listener
    port.addEventListener("message", (evt: MessageEvent<IExampleRequest>) => {
        const request = evt.data;
        if (!request || !request.type) {
            // doesn't look correct
            console.log("Worker2: Invalid message received -- ignoring!");
            return;
        }
    
        console.log(`Worker2: Received message [${request.type}] from main script`);
        let handler: (request: IExampleRequest, port: MessagePort) => IExampleResponse = EventHandlers[request.type];
        if (!handler) {
            handler = workerInvalid;
        }

        try {
            let response = handler(request, port);
            if (response) {
                port.postMessage(response);
            }
        } catch (e) {
            port.postMessage({
                success: false,
                message: dumpObj(e)
            });
        }
    });

    port.start();
});

/**
 * Handle "Invalid" (Unknown) request
 * @param request
 * @returns
 */
function workerInvalid(request: IExampleRequest) {
    return {
        success: false,
        message: `Unsupported commend - ${request.type}`
    }
}

/**
 * Perform a "fetch" request for the provided URL
 * @param request
 * @param port
 * @returns
 */
function workerFetch(request: IExampleRequest, port: MessagePort) {
    function fetchFailed(reason: any) {
        port.postMessage({ success: false, message: dumpObj(reason) });
    }

    fetch(request.url).then((value) => {
        value.text().then((theResponse) => {
            port.postMessage({ success: true, resp: theResponse });
        }, fetchFailed);
    }, fetchFailed);

    // Will return message asynchronously
    return {
        success: true,
        message: "Worker2: Fetch request received"
    };
}
