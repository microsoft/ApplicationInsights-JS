// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ApplicationInsights, IConfiguration, IEventTelemetry, IMetricTelemetry, IPageViewTelemetry, ITraceTelemetry } from "@microsoft/applicationinsights-web";


// ***********************************************************************************************************
// NPM Initialization
// Use this section to initialize Application Insights with NPM

// Cache the previously initialized instance to avoid creating multiple instances
let _appInsights: ApplicationInsights | null;

export function initApplicationInsights(config?: IConfiguration) {
    
    if (!_appInsights) {
        // Make sure we have a configuration object
        config = config || {};
        if (!config.instrumentationKey || !config.connectionString) {
            config.connectionString = "InstrumentationKey=YOUR_INSTRUMENTATION_KEY_GOES_HERE";
        }

        _appInsights = new ApplicationInsights({
            config: config
        });
       
        _appInsights.loadAppInsights();
        _appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview

        return _appInsights;
    }

    return _appInsights;
}
// **************************************************************************************************************


/**
 * Unload the SDK if it has been initialized
 * @returns
 */
export function unloadApplicationInsights() {
    if (_appInsights) {
        _appInsights.unload();
        _appInsights = null;
        return true;
    }
    return false;
}

/**
 * Request a page view request if the SDK has been initialized
 */
export function trackPageView(pageView?: IPageViewTelemetry) {
    if (_appInsights) {
        _appInsights.trackPageView(pageView);
        return true;
    }
    return false;
}

/**
 * Log a custom event if the SDK has been initialized
 */
export function trackEvent(event: IEventTelemetry, customProperties?: {[key: string]: any;} ) {
    if (_appInsights) {
        _appInsights.trackEvent(event, customProperties);
        return true;
    }
    return false;
}

/**
 * Start timing an event with given name if the SDK has been initialized
 */
export function startTrackEvent(name?: string) {
    if (_appInsights) {
        _appInsights.startTrackEvent(name);
        return true;
    }
    return false;
}

/**
 * Stop timing an event with given name if the SDK has been initialized
 */
export function stopTrackEvent(name: string, properties?: { [key: string]: string; }, measurements?: { [key: string]: number; }) {
    if (_appInsights) {
        _appInsights.stopTrackEvent(name, properties, measurements);
        return true;
    }
    return false;
}

/**
 * Log traces if the SDK has been initialized
 * Typically used to send regular reports of performance indicators
 */
export function trackTrace(trace: ITraceTelemetry) {
    if (_appInsights) {
        _appInsights.trackTrace(trace);
        return true;
    }
    return false;
}

/**
 * Log Metric if the SDK has been initialized
 */
export function trackMetric(metric: IMetricTelemetry, customProperties?: {[name: string]: any}) {
    if (_appInsights) {
        _appInsights.trackMetric(metric, customProperties);
        return true;
    }
    return false;
}

/**
 * Adds a telemetry initializer to the collection if the SDK has been initialized
 * Telemetry initializers will be called before the telemetry item is pushed for sending
 */
export function addTelemetryInitializer(telemetryInitializer: (item: any) => boolean | void) {
    if (_appInsights) {
        
        _appInsights.addTelemetryInitializer(telemetryInitializer);
        return true;
    }
    return false;
}

/**
 * Use getCookieMgr to get cookie details if the SDK has been initialized
 * cookieMgr can be used to del, get, purge, set cookies
 */
export function getCookieMgr() {
    if (_appInsights) {
        return _appInsights.getCookieMgr();
    }
    return null;
}

/**
 * An example of customized pageview item
 */
export const pageviewItem = {
    name: "pageviewWithproperities", // Defaults to the document title
    uri: "https://pageview",
    refUri: "https://sample",
    pageType: "type",
    isLoggedIn: false,
    properties: {
        duration: 100, // pre-defined property
        prop: "prop",
        prop1: {prop1:"prop1"}
    },
    measurements: {
        metric: 1
    }
} as IPageViewTelemetry;

/**
 * An example of customized event item
 */
export const eventItem = {
    name: "eventWithproperities",
    properties: {
        prop: {prop1:"prop1"}
    },
    measurements: {
        metirc: 1
    }
} as IEventTelemetry;

/**
 * An example of customized trace item
 */
export const traceItem = {
    message: "trace",
    SeverityLevel: 1,
    properties: {
        prop: {prop1:"prop1"}
    },
    measurements: {
        metirc: 1
    }
} as ITraceTelemetry;

/**
 * An example of customized metric item
 */
export const metricItem = {
    name: "metric",
    average: 1.2,
    //default to 1
    sampleCount: 2,
    //default to average
    min: 1,
    //default to average
    max: 2,
    // default to 0
    stdDev: 1.23,
    properties: {
        prop: {prop1:"prop1"}
    },
    measurements: {
        metirc: 1
    }
} as IMetricTelemetry;


// // ******************************************************************************************************************************
// // Snippet Initialization
// let _appInsights: any;

// export function initApplicationInsights() {
    
//     if (!_appInsights) {
//         _appInsights =  (window as any).appInsights;
//         return _appInsights;
//     }

//     return _appInsights;
// }

// // ***********************************************************************************************************************************
