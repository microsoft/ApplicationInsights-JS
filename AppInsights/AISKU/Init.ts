/// <reference types="applicationinsights-common" />
/// <reference types="applicationinsights-analytics-js" />

import { AppInsights } from "AppInsights/applicationinsights-analytics-js";
import { _InternalLogging } from "applicationinsights-common";
import { AppInsightsCore } from "applicationinsights-core-js";

"use strict";

try {
    // only initialize if we are running in a browser that supports JSON serialization (ie7<, node.js, cordova)
    if (typeof window !== "undefined" && typeof JSON !== "undefined") {
        // get snippet or initialize to an empty object
        var aiName = "applicationInsights";


        var core = new AppInsightsCore();
        core.initialize(null, null);
        let appInsights = new AppInsights(null);

    }
} catch (e) {
    _InternalLogging.warnToConsole('Failed to initialize AppInsights JS SDK: ' + e.message);
}
