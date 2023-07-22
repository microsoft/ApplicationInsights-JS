// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { addListener, getConfig } from "./example-cfgsync-init";
import { initListenerInstance1 } from "./listener1";
import { initListenerInstance2 } from "./listener2";
import { initMainInstance } from "./main";
import { ICfgSyncPlugin } from "@microsoft/applicationinsights-cfgsync-js";

export function createButton(item: [inst: ApplicationInsights, cfgSyncPlugin: ICfgSyncPlugin]): HTMLButtonElement {
    let ele = document.createElement("div");
    let btn = document.createElement("button");
    btn.className = "button";
    btn.innerHTML = "Change Config";
    btn.onclick = () => {
        let newConfig = getConfig();
        let cfgsyncplugin = item[1];
        cfgsyncplugin.setCfg(newConfig);
    }
    ele.appendChild(btn);
    document.body.appendChild(ele);
    return btn;
}

export function createGetCfgButton(item: [inst: ApplicationInsights, cfgSyncPlugin: ICfgSyncPlugin], name?: string): HTMLButtonElement {
    let ele = document.createElement("div");
    let btn = document.createElement("button");
    btn.className = "button";
    btn.innerHTML = `Get ${name} CfgSync Plugin Current Config`;
    btn.onclick = () => {
        console.log(`${name} config`);
        let curCfg = item[1].getCfg();
        console.log(curCfg);
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
    createButton(mainInst as any);
    createGetCfgButton(listener1 as any, "listener1");
    createGetCfgButton(listener2 as any, "listener2");
}
start();



