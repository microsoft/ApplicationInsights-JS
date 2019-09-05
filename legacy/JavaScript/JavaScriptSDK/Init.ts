// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="Initialization.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    try {
        // only initialize if we are running in a browser that supports JSON serialization (ie7<, node.js, cordova)
        if (typeof window !== "undefined" && typeof JSON !== "undefined") {
            // get snippet or initialize to an empty object
            var aiName = "appInsights";
    
            if (window[aiName] === undefined) {
                // if no snippet is present, initialize default values
                Microsoft.ApplicationInsights.AppInsights.defaultConfig = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
            } else {
                // this is the typical case for browser+snippet
                var snippet: Microsoft.ApplicationInsights.Snippet = window[aiName] || <any>{};
    
                // overwrite snippet with full appInsights
                var init = new Microsoft.ApplicationInsights.Initialization(snippet);
                var appInsightsLocal = init.loadAppInsights();

                // apply full appInsights to the global instance that was initialized in the snippet
                for (var field in appInsightsLocal) {
                    snippet[field] = appInsightsLocal[field];
                }
    
                init.emptyQueue();
    
                init.pollInteralLogs(appInsightsLocal);
    
                init.addHousekeepingBeforeUnload(appInsightsLocal);
            }
        }
    } catch (e) {
        Microsoft.ApplicationInsights._InternalLogging.warnToConsole('Failed to initialize AppInsights JS SDK: ' + e.message);
    }
}
