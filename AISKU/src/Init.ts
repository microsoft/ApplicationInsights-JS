// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Initialization as ApplicationInsights, Snippet, IApplicationInsights } from "./Initialization";
import { ApplicationInsightsContainer } from "./ApplicationInsightsContainer";

export { Initialization as ApplicationInsights, Snippet } from "./Initialization";

"use strict";
//should be global function that should load as soon as SDK loads
try {

    // E2E sku on load initializes core and pipeline using snippet as input for configuration
    var aiName;
    if (typeof window !== "undefined" && typeof JSON !== "undefined") {
        // get snippet or initialize to an empty object

        // get sdk instance name should not conflict if page uses existing sdk for a layer of instrumentation
        aiName = window["appInsightsSDK"];

        if (window[aiName] !== undefined) {
            if (window[aiName].initialize) { // initialize if required
                // this is the typical case for browser+snippet
                var snippet: Snippet = window[aiName] || <any>{};
                // overwrite snippet with full appInsights

                let appInsightsContainer = new ApplicationInsightsContainer();
                var initialization = appInsightsContainer.getAppInsights(snippet, snippet.version);
                
                // apply full appInsights to the global instance that was initialized in the snippet
                for (var field in initialization) {
                    snippet[field] = initialization[field];
                }                
            }
        }
    }
} catch (e) {
    // TODO: Find better place to warn to console when SDK initialization fails
    if (console) {
        console.warn('Failed to initialize AppInsights JS SDK for instance ' + aiName + e.message);
    }
}
