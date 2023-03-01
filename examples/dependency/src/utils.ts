// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach } from "@microsoft/applicationinsights-core-js";

export const containerId = "dependency-sample-container";
export const dependencyListenerButtonId = "dependency-listener-button";
export const dependencyListenerDetailsContainerId = "dependency-listener-detail-container";
export const dependencyInitializerDetailsContainerId = "dependency-initializer-detail-container";
export const stopDependencyEventButtonId = "stop-dependency-events";
export const fetchCallId = "create-fetch-request";
export const fetchXhrId = "create-xhr-request";
export const untrackFetchRequestId = "create-untrack-fetch-request";
export const removeAllHandlersId = "remove-all-handlers";
export const buttonSectionId = "button-section";
export const clearDetailsButtonId = "clear-all-details";
export const addHandlersButtonId = "add-handlers";
export const dependencyListenerDetails: string[] = ["input","traceId","spanId","traceFlags","context"]; // check full details in console
export const dependencyInitializerDetails: string[] = ["item","properties","sysProperties","context"]; // check full details in console
export const ajaxDetails: string[] = ["disabbleFetchTracking", "disableExceptionTracking", "enableAutoRouteTracking"];
export const analyticsDetails: string[] = ["autoTrackPageVisitTime", "appId", "enableAjaxPerfTracking", "enableCorsCorrelation"];


export function createFetchRequest() {
    fetch("https://api.npms.io/v2/search?q=react&size=1").then(() =>{
        console.log("a fetch call triggered");
    });
}

export function createXhrRequest() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.npms.io/v2/search?q=react&size=1");
    xhr.onload = function() {
        console.log("a xhr call triggered");
    };
    xhr.send();
}

export function createUnTrackRequest() {
    fetch("https://api.npms.io/v2/search?q=angular&size=1").then(() =>{
        console.log("a untracked fetch call triggered");
    });
}

export function randomBoolean() {
    if (Math.random() > 0.5) {
        return true;
    }
    return false;
}

export function createDetailList(propsToWatch: string[], details: any, id: string, title: string) {
    let container = document.getElementById(id);
    let ele = document.createElement("div");
    ele.className = "list";
    let date = new Date();
    let list = "";
    if (details) {
        list += `
            <h6>Dependency ${title} Details After Modifications</h6>
            <div>Check console for details before modifications and network trace for complete details</div>
            <div class="time">Date: ${date}</div>
        `;

        arrForEach(propsToWatch, (prop) => {
            let obj = details[prop];
            if (prop === "item") {
                obj = {name: obj.name, target: obj.target};
            }
            obj = (obj === undefined)?  "undefined" : obj;
            if (typeof obj === "object") {
                obj = JSON.stringify(obj);
            }
            list += `<li>${prop}: ${obj}</li>`;

        });
        
        list += "<div>-------------------------</div>";
        ele.innerHTML = list;
        container?.appendChild(ele);
    }
}

export function createContainers() {
    let container = document.createElement("div");
    container.className = "container";
    container.id = containerId;
    let buttonSection = createSubContainer(buttonSectionId, "container");
    container.appendChild(buttonSection);
    let ListenerSection = createSubContainer(dependencyListenerDetailsContainerId);
    container.appendChild(ListenerSection);
    let initializerSection = createSubContainer(dependencyInitializerDetailsContainerId);
    container.appendChild(initializerSection);
    document.body.appendChild(container);
}

export function createSubContainer(id: string, className?: string) {
    let ele = document.createElement("div");
    ele.className =  className || "container-main";
    ele.id = id;
    return ele
}

export function createButton(buttonTextContent: string, buttonOnclickFn: any, id?: string): HTMLButtonElement {
    let btn = document.createElement("button");
    if (id) {
        btn.id = id;
    }
    btn.innerHTML = buttonTextContent
    btn.onclick = buttonOnclickFn;
    return btn;
}

export function clearEle(id: string) {
    let ele = document.getElementById(id);
    if (ele) {
        ele.innerHTML = "";
    }
}

export function clearDetailsList() {
    clearEle(dependencyListenerDetailsContainerId);
    clearEle(dependencyInitializerDetailsContainerId);
}

