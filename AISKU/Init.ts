import { PageView } from "applicationinsights-common";
import { AppInsightsCore, IConfiguration } from "applicationinsights-core-js";
import { Sender } from "applicationinsights-channel-js";
import { ApplicationInsights, IPageViewTelemetry } from "applicationinsights-analytics-js";
import { Initialization, Snippet } from "./Initialization";

"use strict";
//should be global function that should load as soon as SDK loads
try {

    // E2E sku on load initializes core and pipeline using snippet as input for configuration
    
    if (typeof window !== "undefined" && typeof JSON !== "undefined") {
        // get snippet or initialize to an empty object

        // appinsightsvnext should not conflict if page uses existing sdk for a layer of instrumentation
        var aiName = "appInsightsvNext";

        if (window[aiName] === undefined) {
            // if no snippet is present, initialize default values
            ApplicationInsights.appInsightsDefaultConfig = Initialization.getDefaultConfig();
        } else {
            // this is the typical case for browser+snippet
            var snippet: Snippet = window[aiName] || <any>{};

            // overwrite snippet with full appInsights
            var initialization = new Initialization(snippet);
            var appInsightsLocal = initialization.loadAppInsights();

            // apply full appInsights to the global instance that was initialized in the snippet
            for (var field in appInsightsLocal) {
                snippet[field] = appInsightsLocal[field];
            }

            // Empty queue of all api calls logged prior to sdk download
            initialization.emptyQueue();    

            initialization.addHousekeepingBeforeUnload(appInsightsLocal);
        }
    }
    // // only initialize if we are running in a browser that supports JSON serialization (ie7<, node.js, cordova)
    // if (typeof window !== "undefined" && typeof JSON !== "undefined") {

    //     // temporary for testing
    //     let config: IConfiguration = {
    //         instrumentationKey: "8e68dc94-34d1-4894-8697-be2ba6282b5b"
    //     };

    //     var core = new AppInsightsCore();
    //     let extensions = [];
    //     let appInsightsChannel : Sender = new Sender();
    //     let appInsights = new ApplicationInsights();

    //     extensions.push(appInsightsChannel);
    //     extensions.push(appInsights);

    //     // initialize core
    //     core.initialize(config, extensions);
        
    //     // initialize extensions
    //     // appInsights.initialize(config, core, extensions);
    //     // appInsightsChannel.initialize(config);

    //     let pageView: IPageViewTelemetry = {
    //         name: document.title ? document.title : "test page",
    //         uri: document.URL ? document.URL : ""
    //     };

    //     appInsights.trackPageView(pageView); // track a page view

    //     // let telemetryItem: ITelemetryItem = {
    //     //     name: "TestPageView",
    //     //     instrumentationKey: "8e68dc94-34d1-4894-8697-be2ba6282b5b",
    //     //     timestamp: new Date(),
    //     //     baseType: PageView.dataType,
    //     // }

    //     // telemetryItem.sytemProperties = {};
    //     // telemetryItem.domainProperties = {};

    //     // telemetryItem.sytemProperties["ver"] = "2";
    //     // telemetryItem.domainProperties["url"] = document.title ? document.title : "";
    //     // telemetryItem.domainProperties["id"] = "";
    //     // telemetryItem.domainProperties["name"] = "2";
    //     // telemetryItem.domainProperties["duration"] = 10;

    //     // core.track(telemetryItem);
    // }
} catch (e) {
    // _InternalLogging.warnToConsole('Failed to initialize AppInsights JS SDK: ' + e.message);
}