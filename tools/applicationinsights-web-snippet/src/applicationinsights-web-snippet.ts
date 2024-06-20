import { ISnippetConfig, SdkLoaderConfig } from "./type";

const originSnippet = "##replaceOriginSnippet##";
const webSnippet = "##replaceIKeySnippet##";
const webSnippetCs = "##replaceConnStringSnippet##";

function webSnippetVersion() {
    let parse = /sv:\"([^\"]+)\"/.exec(webSnippet);
    if (parse) {
        return parse[1];
    }

    return "";
}

function getSdkLoaderScript(config: SdkLoaderConfig) {
    let snippetConfig: ISnippetConfig = {
        src: config.src? config.src : "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js",
        crossOrigin: config.crossOrigin ? config.crossOrigin : "anonymous",
        cfg: {},
        name: config.name ? config.name : "appInsights",
        ld: config.ld,
        useXhr: config.useXhr,
        onInit: config.onInit,
        cr: config.cr,
        dle: config.dle,
        sri: config.sri
    };

    if (config.instrumentationKey) {
        snippetConfig.cfg.instrumentationKey = config.instrumentationKey;
    } else if (config.connectionString) {
        snippetConfig.cfg.connectionString = config.connectionString;
    }

    let configString = JSON.stringify(snippetConfig);
    let userSnippet = `!(function (cfg){${originSnippet}})(\n${configString}\n);`;
    return userSnippet;
}


export { webSnippet, webSnippetCs, webSnippetVersion, getSdkLoaderScript }