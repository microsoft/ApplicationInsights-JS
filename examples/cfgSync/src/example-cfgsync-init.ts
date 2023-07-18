import { IConfiguration, random32 } from "@microsoft/applicationinsights-core-js"

export function addListener() {
    window.addEventListener("ai_cfgsync", (e) => {
        console.log("new event");
        console.log(e);
    })
}

export function getConfig() {
    let newConfig = {
        instrumentationKey: `InstrumentationKey=main${random32()}`,
        cookieCfg:{domain: `domain${random32()}`}
    } as IConfiguration;
    return newConfig;
}