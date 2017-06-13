var appInsights = window.appInsights || (function(aiConfig) {
    var appInsights = {
        config: aiConfig
    };

    // Assigning these to local variables allows them to be minified to save space:
    var localDocument = document;
    var localWindow = window;
    var scriptText = "script";
    var userContext = "AuthenticatedUserContext";
    var start = "start";
    var stop = "stop";
    var track = "Track";
    var trackEvent = track + "Event";
    var trackPage = track + "Page";
    setTimeout(function () {
        var scriptElement = localDocument.createElement(scriptText);
        scriptElement.src = aiConfig.url || "CDN_PATH";
        localDocument.getElementsByTagName(scriptText)[0].parentNode.appendChild(scriptElement);
    });

    // capture initial cookie
    try {
        appInsights.cookie = localDocument.cookie;
    } catch (e) {}

    appInsights.queue = [];

    function createLazyMethod(name) {
        // Define a temporary method that queues-up a the real method call
        appInsights[name] = function() {
            // Capture the original arguments passed to the method
            var originalArguments = arguments;
            // Queue-up a call to the real method
            appInsights.queue.push(function() {
                // Invoke the real method with the captured original arguments
                appInsights[name].apply(appInsights, originalArguments);
            });
        }
    };

    var method = ["Event", "Exception", "Metric", "PageView", "Trace", "Dependency"];
    while (method.length) {
        createLazyMethod("track" + method.pop());
    }

    createLazyMethod("set" + userContext);
    createLazyMethod("clear" + userContext);

    createLazyMethod(start + trackEvent);
    createLazyMethod(stop + trackEvent);

    createLazyMethod(start + trackPage);
    createLazyMethod(stop + trackPage);

    createLazyMethod("flush");

    // collect global errors
    if (!aiConfig.disableExceptionTracking) {
        method = "onerror";
        createLazyMethod("_" + method);
        var originalOnError = localWindow[method];
        localWindow[method] = function(message, url, lineNumber, columnNumber, error) {
            var handled = originalOnError && originalOnError(message, url, lineNumber, columnNumber, error);
            if (handled !== true) {
                appInsights["_" + method](message, url, lineNumber, columnNumber, error);
            }

            return handled;
        };
    }

    return appInsights;
})({
    instrumentationKey: "INSTRUMENTATION_KEY"
});

// global instance must be set in this order to mitigate issues in ie8 and lower
window.appInsights = appInsights;

// if somebody calls the snippet twice, don't report page view again
if (appInsights.queue && appInsights.queue.length === 0) {
    appInsights.trackPageView();
}