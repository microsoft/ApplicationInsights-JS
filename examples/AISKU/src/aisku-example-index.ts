// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { addTelemetryInitializer, eventItem, getCookieMgr, initApplicationInsights, metricItem, pageviewItem, startTrackEvent, stopTrackEvent, traceItem, trackEvent, trackMetric, trackPageView, trackTrace } from "./aisku-init";
import { ai_session, ai_user, buttonSectionId, clearDetailsList, cookieWatchList, createButton, createContainers, createDetailList, detailsContainerId, detailsWatchList, manual_event, triggerException } from "./utils";
import { arrForEach } from "@microsoft/applicationinsights-core-js";

function createPageviewTracks() {
    trackPageView(pageviewItem);
}

function createEventTracks() {
    trackEvent(eventItem, {prop2: "prop2"});
}

function startEvent() {
    startTrackEvent(manual_event);
}


function stopEvent() {
    stopTrackEvent(manual_event, {prop:"prop"}, {metric: 1});
}

function createTraceTracks() {
    trackTrace(traceItem);
}

function createMetricTracks() {
    trackMetric(metricItem, {prop2: "prop2"});
}

function getCookieMgrdetails() {
    let cookieMgr = getCookieMgr();
    if(cookieMgr) {
        let details =  {
            isEnabled: cookieMgr.isEnabled(),
            ai_session: cookieMgr.get(ai_session),
            ai_user: cookieMgr.get(ai_user)
        } as any;
        createDetailList(cookieWatchList, details, detailsContainerId, "Cookie");
    }
}

function addTelemetryListener() {
    addTelemetryInitializer((env: any) => {
        console.log("The following Event is triggered.");
        console.log(env);

        createDetailList(detailsWatchList, env, detailsContainerId, "Telemetry");
    });
}

function createButtonSection() {
    let container = document.getElementById(buttonSectionId);
    let pageviewButton = createButton("Create Pageview", createPageviewTracks);
    let eventButton = createButton("Create Event", createEventTracks);
    let startButton = createButton("Start Tracking Event", startEvent);
    let stopButton = createButton("Stop Tracking Event", stopEvent);
    let traceButton = createButton("Create Trace", createTraceTracks);
    let metricButton = createButton("Create Metric", createMetricTracks);
    let exceptionButton = createButton("Create Exception", triggerException);
    let cookieButton = createButton("Get Cookie", getCookieMgrdetails);
    let clearButton = createButton("Clear Details", clearDetailsList);
    let buttons = [pageviewButton, eventButton, traceButton, metricButton, startButton, stopButton, exceptionButton, cookieButton, clearButton];
    arrForEach(buttons, (button) => {
        container?.appendChild(button);

    });
}

function analyticsSample() {
    initApplicationInsights();
    createContainers();
    addTelemetryListener();
    createButtonSection();
}
analyticsSample();


