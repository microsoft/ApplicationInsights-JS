import { ApplicationInsights, Snippet } from "./Initialization";
import { IConfiguration } from "applicationinsights-core-js";

"use strict";

export class AppInsightsSDK {

    public static Initialize(aiConfig?: IConfiguration, aiName?: string) : ApplicationInsights {
        try {

            let appInsightsLocal: ApplicationInsights;
            // E2E sku on load initializes core and pipeline using snippet as input for configuration

            if (typeof window !== "undefined" && typeof JSON !== "undefined" && aiName) {
                // get snippet or initialize to an empty object

                
                if (window[aiName] === undefined) { // not initialized before
                    
                    // if no prior instance is present, initialize default values or with configuration passed in
                    var defaultConfig = ApplicationInsights.getDefaultConfig(aiConfig);
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