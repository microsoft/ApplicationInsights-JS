// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach } from "@microsoft/applicationinsights-core-js";

export const detailsContainerId = "details-container";
export const detailsWatchList = ["baseType", "name", "time", "properties"];
export const ajaxDetails: string[] = ["disabbleFetchTracking", "disableExceptionTracking", "enableAutoRouteTracking"];
export const analyticsDetails: string[] = ["autoTrackPageVisitTime", "appId", "enableAjaxPerfTracking", "enableCorsCorrelation"];
export const buttonSectionId = "button-section";
export const containerId = "aisku-container";
export const ai_session = "ai_session";
export const ai_user = "ai_user";
export const manual_event = "manual_record_event";
export const cookieWatchList = ["isEnabled", ai_session, ai_user];


export function randomBoolean() {
    if (Math.random() > 0.5) {
        return true;
    }
    return false;
}

export function clearEle(id: string) {
    let ele = document.getElementById(id);
    if (ele) {
        ele.innerHTML = "";
    }
}

export function clearDetailsList() {
    clearEle(detailsContainerId);
}

export function createSubContainer(id: string, className?: string) {
    let ele = document.createElement("div");
    ele.className =  className || "container-main";
    ele.id = id;
    return ele;
}

export function createButton(buttontextContent: string, buttobuttononclickFn: any, id?: string): HTMLButtonElement {
    let btn = document.createElement("button");
    if (id) {
        btn.id = id;
    }
    btn.innerHTML = buttontextContent;
    btn.onclick = buttobuttononclickFn;
    return btn;
}

export function createDetailList(propsToWatch: string[], details: any, id: string, title: string) {
    let container = document.getElementById(id);
    let ele = document.createElement("div");
    ele.className = "list";
    let list = "";
    if (details) {
        list += `
            <h6>${title} Details</h6>
            <p>Not all auto-captured events and details are displayed here.</p>
            <p>Check console and network trace for complete details</p>
        `;
        arrForEach(propsToWatch, (prop) => {
            let obj;
            
            if (details["baseData"]) {
                obj =  details["baseData"][prop] || details[prop] || details["baseData"];
            } else {
                obj =  details[prop] || details["baseData"];
            }
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
    let detailsSection = createSubContainer(detailsContainerId);
    container.appendChild(detailsSection);
    document.body.append(container);
}

export function triggerException() {
    // This will trigger exception telemetry automatically
    throw new Error("error is triggered");
}
