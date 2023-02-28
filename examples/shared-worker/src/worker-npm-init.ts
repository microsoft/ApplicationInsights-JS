// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ApplicationInsights, IConfiguration } from "@microsoft/applicationinsights-web"

// Cache the previously initialized instance to avoid creating multiple instances
let _appInsights: ApplicationInsights;

/**
 * Initialize (or return the previously initialized) SDK instance for the worker
 * @param config
 * @returns
 */
export function initApplicationInsights(config: IConfiguration, onInitCallback: (appInsights: ApplicationInsights, port: MessagePort) => void, port: MessagePort) {
    
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
        if (_appInsights.core.isInitialized()) {
            // Call the callback before the trackPageView
            onInitCallback(_appInsights, port);
            _appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
        }

        return _appInsights;
    }

    return _appInsights;
}

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
 * @returns
 */
export function trackPageView() {
    if (_appInsights) {
        _appInsights.trackPageView();
        return true;
    }

    return false;
}