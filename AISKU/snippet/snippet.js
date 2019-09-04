var sdkInstance = "appInsightsSDK";
window[sdkInstance] = "appInsights";
var aiName = window[sdkInstance]; // provide non default instance name through key appInsightsSDK
var aisdk = window[aiName] || (function (aiConfig) {
    var appInsights = {
        config: aiConfig
    };
    appInsights.initialize = true; // initialize sdk on download

    // Assigning these to local variables allows them to be minified to save space:
    var localDocument = document, localWindow = window, scriptText = "script";
    setTimeout(function () {
        var scriptElement = localDocument.createElement(scriptText);
        scriptElement.src = aiConfig.url || "https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js";
        localDocument.getElementsByTagName(scriptText)[0].parentNode.appendChild(scriptElement);
    });

    // capture initial cookie
    try {
        appInsights.cookie = localDocument.cookie;
    } catch (e) { }

    appInsights.queue = [];
    appInsights.version = 2.0;

    function createLazyMethod(name) {
        // Define a temporary method that queues-up a the real method call
        appInsights[name] = function () {
            // Capture the original arguments passed to the method
            var originalArguments = arguments;
            // Queue-up a call to the real method
            appInsights.queue.push(function () {
                // Invoke the real method with the captured original arguments
                appInsights[name].apply(appInsights, originalArguments);
            });
        };
    }

    var method = ["Event", "PageView", "Exception", "Trace", "DependencyData", "Metric", "PageViewPerformance"];
    while (method.length) {
        createLazyMethod("track" + method.pop());
    }

    var track = "Track";
    var trackPage = track + "Page";
    createLazyMethod("start" + trackPage);
    createLazyMethod("stop" + trackPage);

    var trackEvent = track + method[0];
    createLazyMethod("start" + trackEvent);
    createLazyMethod("stop" + trackEvent);

    createLazyMethod("addTelemetryInitializer");
    createLazyMethod("setAuthenticatedUserContext");
    createLazyMethod("clearAuthenticatedUserContext");
    createLazyMethod("flush");

    // Collect global errors
    // Note: ApplicationInsightsAnalytics is the extension string identifier for
    //  AppAnalytics. It is defined in ApplicationInsights.ts:ApplicationInsights.identifer
    if (!(aiConfig.disableExceptionTracking === true ||
        (aiConfig.extensionConfig &&
        aiConfig.extensionConfig.ApplicationInsightsAnalytics &&
        aiConfig.extensionConfig.ApplicationInsightsAnalytics.disableExceptionTracking === true))) {

        method = "onerror";
        createLazyMethod("_" + method);
        var originalOnError = localWindow[method];
        localWindow[method] = function(message, url, lineNumber, columnNumber, error) {
            var handled = originalOnError && originalOnError(message, url, lineNumber, columnNumber, error);
            if (handled !== true) {
                appInsights["_" + method]({
                    message: message,
                    url: url,
                    lineNumber: lineNumber,
                    columnNumber: columnNumber,
                    error: error
                });
            }

            return handled;
        };
        aiConfig.autoExceptionInstrumented = true;
    }

    return appInsights;
})({
    instrumentationKey: "INSTRUMENTATION_KEY"
   });

// global instance must be set in this order to mitigate issues in ie8 and lower
window[aiName] = aisdk;

// if somebody calls the snippet twice, don't report page view again
if (aisdk.queue && aisdk.queue.length === 0) {
     aisdk.trackPageView({});
}
