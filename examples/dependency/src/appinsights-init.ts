// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    ApplicationInsights, IConfiguration,
    DependencyListenerFunction, DependencyInitializerFunction, IDependencyInitializerHandler, IDependencyListenerHandler
} from "@microsoft/applicationinsights-web";

// Cache the previously initialized instance to avoid creating multiple instances
let _appInsights: ApplicationInsights;

export function initApplicationInsights(config?: IConfiguration) {
    
    if (!_appInsights) {
        // Make sure we have a configuration object
        config = config || {};
        if (!config.connectionString) {
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

/**
 * Use addDependencyListener to modify dependencyDetails if the SDK has been initialized
 */
export function addDependencyListener(dependencyListener: DependencyListenerFunction): IDependencyListenerHandler | null {
    if (_appInsights) {
        return _appInsights.addDependencyListener(dependencyListener);
    }
    return null;
}

/**
 * Use addDependencyInitializer to modify dependencyInitializerDetails if the SDK has been initialized
 */
export function addDependencyInitializer(dependencyInitializer: DependencyInitializerFunction): IDependencyInitializerHandler | null {
    if (_appInsights) {
        return _appInsights.addDependencyInitializer(dependencyInitializer);
    }
    return null;
}

/**
 * Use addDependencyInitializer to block any event from being reported
 */
export function stopDependencyEvent() {
    if (_appInsights) {
        _appInsights.addDependencyInitializer((details: any) => {
            // Check console to view details
            console.log("dependency event tracking is stopped, the following event will not be reported");
            console.log(details);
            // To stop any event from being reported
            return false;
        });
        return true;
    }
    return false;
   
}


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


