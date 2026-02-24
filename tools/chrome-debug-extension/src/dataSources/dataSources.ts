// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dumpObj, isArray, isString } from "@microsoft/applicationinsights-core-js";
import { IConfiguration } from "../configuration/IConfiguration";
import { IDataSource } from "./IDataSource";
import { DefaultDataSource } from "./defaultDataSource";
import { NoOpDataSource } from "./noOpDataSource";

export function createDataSource(configuration: IConfiguration): IDataSource {
    // If on localhost, assume we are doing local testing (e.g. for accessibility issues) and use the NoOpDataSource
    if (window.location.host.indexOf("localhost:9001") === 0) {
        return new NoOpDataSource();
    }

    let tabId: number = 0;
    try {
        let params = new URLSearchParams(window.location.search);
        if (params.has("tabId")) {
            tabId = parseInt(params.get("tabId") || "");
        }
        
        if (!tabId) {
            return new NoOpDataSource();
        }
    
    } catch (e) {
        console.log("Error getting URL Params: " + dumpObj(e));
    }

    let urls: string[] = [];
    if (configuration.dataSourceUrls) {
        if (isArray(configuration.dataSourceUrls)) {
            urls = configuration.dataSourceUrls as string[];
        } else if (isString(configuration.dataSourceUrls)) {
            urls = [configuration.dataSourceUrls] as string[];
        }

        if (!urls || urls.length === 0) {
            urls = ["*://*.microsoft.com/OneCollector/*", "*://*.visualstudio.com/v2/track*", "*://*.applicationinsights.azure.com/v2/track*"];
        }
    }

    switch (configuration.dataSourceType) {
    case undefined:
    case "Default":
        return new DefaultDataSource(tabId, urls, configuration.ignoreNotifications);

    default:
        console.error(`Unrecognized data source supplied in the configuration: ${configuration.dataSourceType}`);
        return new NoOpDataSource();
    }
}
