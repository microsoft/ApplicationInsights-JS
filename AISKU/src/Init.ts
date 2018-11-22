// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ApplicationInsights as AppAnalytics } from "@microsoft/applicationinsights-analytics-js";
import { Initialization as ApplicationInsights, Snippet } from "./Initialization";

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
                var initialization = new ApplicationInsights(snippet);
                var appInsightsLocal = initialization.loadAppInsights();

                // apply full appInsights to the global instance that was initialized in the snippet
                for (var field in appInsightsLocal) {
                    snippet[field] = appInsightsLocal[field];
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