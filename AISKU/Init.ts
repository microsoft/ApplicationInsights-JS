/// <reference types="applicationinsights-common" />
/// <reference types="applicationinsights-core-js" />
/// <reference types="applicationinsights-channel-js" />
/// <reference types="applicationinsights-analytics-js" />

import { _InternalLogging, PageView } from "applicationinsights-common";
import { AppInsightsCore, IConfiguration, ITelemetryItem } from "applicationinsights-core-js";
import { Sender } from "Sender";
import { ApplicationInsights, IPageViewTelemetry } from "applicationinsights-analytics-js";

"use strict";
export function init() {
    try {
        // only initialize if we are running in a browser that supports JSON serialization (ie7<, node.js, cordova)
        if (typeof window !== "undefined" && typeof JSON !== "undefined") {

            let config: IConfiguration = {
                instrumentationKey: "8e68dc94-34d1-4894-8697-be2ba6282b5b"
            };

            var core = new AppInsightsCore();
            let extensions = [];
            let appInsightsChannel : Sender = new Sender();
            let appInsights = new ApplicationInsights(config);

            extensions.push(appInsightsChannel);
            extensions.push(appInsights);

            // initialize core
            core.initialize(config, extensions);
            
            // initialize extensions
            appInsights.initialize(config, core, extensions);
            appInsightsChannel.initialize(config);

           let pageView: IPageViewTelemetry = {
               name: document.title ? document.title : "test page",
               url: document.URL ? document.URL : "",
               id: "661addf3-c2c6-4bab-ac64-157962e231ba"
           };

           appInsights.trackPageView(pageView); // track a page view

            // let telemetryItem: ITelemetryItem = {
            //     name: "TestPageView",
            //     instrumentationKey: "8e68dc94-34d1-4894-8697-be2ba6282b5b",
            //     timestamp: new Date(),
            //     baseType: PageView.dataType,
            // }

            // telemetryItem.sytemProperties = {};
            // telemetryItem.domainProperties = {};

            // telemetryItem.sytemProperties["ver"] = "2";
            // telemetryItem.domainProperties["url"] = document.title ? document.title : "";
            // telemetryItem.domainProperties["id"] = "";
            // telemetryItem.domainProperties["name"] = "2";
            // telemetryItem.domainProperties["duration"] = 10;

            // core.track(telemetryItem);
        }
    } catch (e) {
        _InternalLogging.warnToConsole('Failed to initialize AppInsights JS SDK: ' + e.message);
    }

}