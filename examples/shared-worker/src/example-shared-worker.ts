// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { getDocument } from "@nevware21/ts-utils";
import { ExampleMessageType, IExampleRequest } from "./interfaces/IExampleMessage";


let _logContainers = {
    log: "",
    log2: ""
};
let _worker: SharedWorker;
let _worker2: SharedWorker;


//-------------------------------------------------------------------------------------
// Main Page Helper functions
//-------------------------------------------------------------------------------------

/**
 * Log details to the named HTML Text Area
 * @param message
 * @param dest
 */
function logMessage(message: string, dest: keyof typeof _logContainers) {
    var dateTime = new Date().toLocaleString();
    var target = "_logContainer-" + dest || "log";
    var elm = document.getElementById(target);
    _logContainers[target] = dateTime + ": " + message + "\n" + (_logContainers[target] ||"");
    if (_logContainers[target].length > 4096) {
        _logContainers[target] = _logContainers[target].substring(0, 4090) + "...\n";
    }

    if (elm) {
        elm.innerHTML = _logContainers[target];
    }

    console.log(message);
}

/**
 * Clear the log and the named HTML Text Area
 * @param dest
 */
export function clearLog(dest: keyof typeof _logContainers) {
    var target = "_logContainer-" + dest || "log";
    var elm = document.getElementById(target);
    _logContainers[target] = "";

    if (elm) {
        elm.innerHTML = _logContainers[target];
    }
}

//-------------------------------------------------------------------------------------
// Worker 1 functions for main page
//-------------------------------------------------------------------------------------

/**
 * Cause Worker 1 to be loaded and started or return the previous loaded / started reference
 * @returns
 */
export function loadSharedWorker() {
    if (!_worker) {
        _worker = new SharedWorker("./browser/worker.js");
        _worker.port.onmessage = (evt) => {
            let resp = evt.data;
            if (resp) {
                logMessage(JSON.stringify(resp), "log");
            }
        }
    }

    return _worker;
}

/**
 * Send a message to Worker 1, this will initialize the worker if has not already been started
 * @param message
 */
export function sendWorkerMessage(message: IExampleRequest) {
    let worker = loadSharedWorker();
    worker.port.postMessage(message);
}

/**
 * Ask Worker 1 to initialize the SDK
 * @param connectionStringId
 */
export function loadSdk(connectionStringId: string) {
    let doc = getDocument();
    let elm = doc.getElementById(connectionStringId) as HTMLInputElement;
    let connectionString: string;

    if (elm) {
        connectionString = elm.value;
    }

    sendWorkerMessage({
        type: ExampleMessageType.Load,
        connectionString: connectionString
    });
}

/**
 * Ask Worker 1 to unload the SDK
 */
export function unloadSdk() {
    sendWorkerMessage({
        type: ExampleMessageType.Unload
    });
}

/**
 * Ask Worker 1 to fetch the provided URL (this will cause the worker fetch to trigger a Dependency Request)
 * @param urlId
 */
export function fetchUrl(urlId: string) {
    let doc = getDocument();
    let elm = doc.getElementById(urlId) as HTMLInputElement;
    let theUrl: string;

    if (elm) {
        theUrl = elm.value;
    }

    sendWorkerMessage({
        type: ExampleMessageType.Fetch,
        url: theUrl
    });
}

/**
 * Ask Worker 1 to perform a track Page view
 */
export function trackPageView() {
    sendWorkerMessage({
        type: ExampleMessageType.TrackPageView
    });
}

/**
 * Send an invalid request to Worker 1
 */
export function sendInvalidRequest() {
    sendWorkerMessage({
        type: 9999
    });
}

//-------------------------------------------------------------------------------------
// Worker 2 functions for main page
//-------------------------------------------------------------------------------------

/**
 * Cause Worker 2 to be loaded and started or return the previous loaded / started reference
 * @returns
 */
export function loadSharedWorker2() {
    if (!_worker2) {
        _worker2 = new SharedWorker("./browser/worker2.js");
        _worker2.port.onmessage = (evt) => {
            let resp = evt.data;
            if (resp) {
                logMessage(JSON.stringify(resp), "log2");
            }
        }
    }

    return _worker2;
}

/**
 * Send a message to Worker 2, this will initialize the worker if has not already been started
 * @param message
 */
export function sendWorker2Message(message: IExampleRequest) {
    let worker = loadSharedWorker2();
    worker.port.postMessage(message);
}

/**
 * Ask Worker 2 to fetch the provided URL (this will cause the worker fetch to trigger a Dependency Request)
 * @param urlId
 */
export function fetch2Url(urlId: string) {
    let doc = getDocument();
    let elm = doc.getElementById(urlId) as HTMLInputElement;
    let theUrl: string;

    if (elm) {
        theUrl = elm.value;
    }

    sendWorker2Message({
        type: ExampleMessageType.Fetch,
        url: theUrl
    });
}

/**
 * Send an invalid request to Worker 2
 */
export function sendInvalidRequest2() {
    sendWorker2Message({
        type: 9999
    });
}
