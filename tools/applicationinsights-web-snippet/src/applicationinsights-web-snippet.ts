// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ISnippetConfig, SdkLoaderConfig } from "./type";
import { _ensureBoolean, _ensureNumber, _escapeUnsupportedChars, _getSourceMap } from "./common/utils";

const originSnippet = "##replaceOriginSnippet##";
export const webSnippet = "##replaceIKeySnippet##";
export const webSnippetCs = "##replaceConnStringSnippet##";

export function webSnippetVersion() {
    let parse = /sv:\"([^\"]+)\"/.exec(webSnippet);
    if (parse) {
        return parse[1];
    }

    return "";
}

export function getSdkLoaderScript(config: SdkLoaderConfig): string {
    let snippetConfig: ISnippetConfig = {
        src: _escapeUnsupportedChars(config.src? config.src : "https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js"),
        crossOrigin: _escapeUnsupportedChars(config.crossOrigin ? config.crossOrigin : "anonymous"),
        cfg: {},
        name: _escapeUnsupportedChars(config.name ? config.name : "appInsights"),
        ld: _ensureNumber(config.ld),
        useXhr: _ensureBoolean(config.useXhr),
        cr: _ensureBoolean(config.cr),
        dle: _ensureBoolean(config.dle),
        sri: _ensureBoolean(config.sri)
    };

    if (config.instrumentationKey) {
        snippetConfig.cfg.instrumentationKey = _escapeUnsupportedChars(config.instrumentationKey);
    } else if (config.connectionString) {
        snippetConfig.cfg.connectionString = _escapeUnsupportedChars(config.connectionString);
    }

    let sourceMap = _getSourceMap(originSnippet);
    let sourcemapComment = sourceMap[0];
    let cleanedSnippet = sourceMap[1];
   
    let configString: string = JSON.stringify(snippetConfig);
    let result = "!(function (cfg){" + cleanedSnippet + "})(\n" + configString + "\n);";
    
    // Append sourcemap comment at the end if it exists
    if (sourcemapComment) {
        result += "\n" + sourcemapComment;
    }
    return result;
}
