import { ApplicationInsights, Snippet } from "./Initialization";

"use strict";

export class AppInsightsSDK {

    public static Initialize(instanceName: string) : ApplicationInsights {
        try {

            let appInsightsLocal: ApplicationInsights;
            // E2E sku on load initializes core and pipeline using snippet as input for configuration

            if (typeof window !== "undefined" && typeof JSON !== "undefined") {
                // get snippet or initialize to an empty object

                // appinsights should not conflict if page uses existing sdk for a layer of instrumentation
                var aiName = window[instanceName]; // const variable that defines the aiName to use

                if (window[aiName] === undefined) { // not initialized before
                    // if no snippet is present, initialize default values
                    var defaultConfig = ApplicationInsights.getDefaultConfig();
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
            } else {
                // need to address non dom scenario to create SDK instance
            }
            return appInsightsLocal;
            
        } catch (e) {
            if (console) {
                console.warn('Failed to initialize AppInsights JS SDK: ' + e.message);
            }
        }
    }
}