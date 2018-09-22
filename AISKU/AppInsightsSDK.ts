import { ApplicationInsights, Snippet } from "./Initialization";
import { IConfiguration } from "applicationinsights-core-js";

"use strict";

export class AppInsightsSDK {

    public static Initialize(aiConfig?: IConfiguration) : ApplicationInsights {
        try {
            let appInsightsLocal: ApplicationInsights;            
            if (typeof window !== "undefined" && typeof JSON !== "undefined") {                
                var appInsightsSDK = "appInsightsSDK";
                let aiName = window[appInsightsSDK]; // get variable name

                if (!aiName || !window[aiName]) {
                    // if no prior instance is present, initialize default values or with configuration passed in
                    var defaultConfig = ApplicationInsights.getDefaultConfig(aiConfig); // get config from input or default if nothing is passed in
                    appInsightsLocal = new ApplicationInsights(<Snippet>{ config: defaultConfig });

                } else {
                    // this is the typical case for browser+snippet
                    var snippet: Snippet = window[aiName] || <any>{};

                    // overwrite snippet with full appInsights
                    appInsightsLocal = new ApplicationInsights(snippet);

                    // apply full appInsights to the global instance that was initialized in the snippet
                    for (var field in appInsightsLocal) {
                        snippet[field] = appInsightsLocal[field];
                    }

                    // Empty queue of all api calls logged prior to sdk download
                    appInsightsLocal.emptyQueue();
                    appInsightsLocal.addHousekeepingBeforeUnload();
                }
            }

            return appInsightsLocal; // for testing

        } catch (e) {
            if (console) {
                console.warn('Failed to initialize AppInsights JS SDK: ' + e.message);
            }
        }
    }
}

AppInsightsSDK.Initialize();