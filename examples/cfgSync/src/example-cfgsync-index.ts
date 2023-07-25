// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { addListener, getConfig } from "./example-cfgsync-init";
import { initListenerInstance1 } from "./listener1";
import { initListenerInstance2 } from "./listener2";
import { initMainInstance } from "./main";

export function createButton(inst: ApplicationInsights): HTMLButtonElement {
    let ele = document.createElement("div");
    let btn = document.createElement("button");
    btn.className = "button";
    btn.innerHTML = "Change Config";
    btn.onclick = () => {
        inst.updateCfg(getConfig());
    }
    ele.appendChild(btn);
    document.body.appendChild(ele);
    return btn;
}

export function createGetCfgButton(inst: ApplicationInsights, name?: string): HTMLButtonElement {
    let ele = document.createElement("div");
    let btn = document.createElement("button");
    btn.className = "button";
    btn.innerHTML = `Get ${name} Config`;
    btn.onclick = () => {
        console.log(`${name} config`);
        console.log(inst.config);
    }
    ele.appendChild(btn);
    document.body.appendChild(ele);
    return btn;
}


function start() {
    addListener();
    let mainInst = initMainInstance();
    let listener1 = initListenerInstance1();
    let listener2 = initListenerInstance2();
    createButton(mainInst);
    createGetCfgButton(listener1, "listener1");
    createGetCfgButton(listener2, "listener2");
}
start();




