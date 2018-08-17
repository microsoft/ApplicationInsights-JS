var appInsights = window.appInsightsvNext || (function (aiConfig) {
    var appInsights = {
        config: aiConfig
    };

    // Assigning these to local variables allows them to be minified to save space:
    var localDocument = document;
    var localWindow = window;
    var scriptText = "script";
    var track = "Track";
    setTimeout(function () {
        var scriptElement = localDocument.createElement(scriptText);
        scriptElement.src = aiConfig.url || "https://jssdkvnext.azureedge.net/scripts/aisdk.min.0.0.9.js";
        localDocument.getElementsByTagName(scriptText)[0].parentNode.appendChild(scriptElement);
    });

    // capture initial cookie
    try {
        appInsights.cookie = localDocument.cookie;
    } catch (e) { }

    appInsights.queue = [];

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
        }
    };

    var method = ["PageView"];
    while (method.length) {
        createLazyMethod("track" + method.pop());
    }

    return appInsights;
})({
    instrumentationKey: "INSTRUMENTATION_KEY",
});

// global instance must be set in this order to mitigate issues in ie8 and lower
window.appInsightsvNext = appInsights;

// if somebody calls the snippet twice, don't report page view again
if (appInsights.queue && appInsights.queue.length === 0) {
    var pageViewItem = {
        name: document.title ? document.title : "",
        uri: document.URL ? document.URL : ""
    };
    appInsights.trackPageView(pageViewItem);
}