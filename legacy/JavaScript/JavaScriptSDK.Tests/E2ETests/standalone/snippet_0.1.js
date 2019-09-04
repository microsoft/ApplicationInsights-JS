window.appInsights = window.appInsights || (function (aiConfig) {

    // Assigning these to local variables allows them to be minified to save space:
    var localDocument = document;
    var localWindow = window;
    var scriptText = "script";
    var scriptElement = localDocument.createElement(scriptText);
    scriptElement.src = aiConfig.url || "CDN_PATH";
    localDocument.getElementsByTagName(scriptText)[0].parentNode.appendChild(scriptElement);

    // capture initial cookie
    aiConfig.cookie = localDocument.cookie;

    aiConfig.queue = [];
    function createLazyMethod(name) {
        // Define a temporary method that queues-up a the real method call
        aiConfig[name] = function () {
            // Capture the original arguments passed to the method
            var originalArguments = arguments;
            // Queue-up a call to the real method
            aiConfig.queue.push(function () {
                // Invoke the real method with the captured original arguments
                aiConfig[name].apply(aiConfig, originalArguments);
            });
        }
    };

    var method = ["Event", "Exception", "Metric", "PageView", "Trace"];
    while (method.length) {
        createLazyMethod("track" + method.pop());
    }

    return aiConfig;
})({
    iKey: "INSTRUMENTATION_KEY"
});

appInsights.trackPageView();
