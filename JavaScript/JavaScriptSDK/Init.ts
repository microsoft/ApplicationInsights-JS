/// <reference path="initialization.ts" />

function initializeAppInsights() {
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

            // Add callback to push events when the user navigates away
            // Note: This approach tries to push an async request with all the pending events onbeforeunload.
            //       Firefox does not respect this. Other browsers DO push out the call with < 100% hit rate.
            //       Telemetry here will help us analyze how effective this approach is.
            //       Another approach would be to make this call sync with a acceptable timeout to reduce the 
            //       impact on user experience.
            if ('onbeforeunload' in window) {                
                // Callback to flush all events
                var flushAllEvents = function() {
                    appInsightsLocal.trackEvent('AI (Internal): Flushing all events onbeforeunload');
                    appInsightsLocal.context._sender.triggerSend();
                };
                
                if (!Microsoft.ApplicationInsights.Util.addEventHandler('beforeunload', flushAllEvents)) {
                    Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 'Could not add handler for beforeunload');
                }
            }
        }
    }
}

initializeAppInsights();