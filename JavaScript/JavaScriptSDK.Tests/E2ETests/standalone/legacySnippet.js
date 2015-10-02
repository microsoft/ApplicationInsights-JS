window.appInsights = {
    queue: [],
    applicationInsightsId: null,
    accountId: null,
    appUserId: null,
    configUrl: null,

    start: function (appId) {

        // Assigning these to local variables allows them to be minified to save space:
        var localDocument = document;
        var localAppInsights = this;
        localAppInsights.applicationInsightsId = appId;

        function createLazyMethod(methodName) {
            // Define a temporary method that queues-up a the real method call            
            localAppInsights[methodName] = function () {
                // Capture the original arguments passed to the method
                var originalArguments = arguments;
                // Queue-up a call to the real method
                localAppInsights.queue.push(function () {
                    // Invoke the real method with the captured original arguments
                    localAppInsights[methodName].apply(localAppInsights, originalArguments);
                });
            }
        }

        // Note: you can replace this with ["logEvent", "logPageView"].forEach(createLazyMethod) once this list gets larger
        // You can also make createLazyMethod anonymous to save more space ([...].forEach(function(methodName) { ... })
        createLazyMethod("logEvent");
        createLazyMethod("logPageView");

        var scriptText = "script";
        function createScriptElement(url, loadFunc) {
            if (!url) {
                loadFunc();
            } else {
                var scriptElement = localDocument.createElement(scriptText);
                scriptElement.type = "text/javascript";
                scriptElement.src = url;
                scriptElement.async = true;
                scriptElement.onload = loadFunc;
                localDocument.getElementsByTagName(scriptText)[0].parentNode.appendChild(scriptElement);
            }
        }

        // Here's how this works: this code will first try and load the config file asynchronously.
        // If configUrl is null / undefined, it will just invoke the anonymous function instantly. Otherwise
        // it will set it as the event handler for onload and onerror. If configUrl is defined, then this 
        // function will be called after the config file is loaded. The handler just adds the ai.js file
        // to the page so that it's loaded asynchronously. Note that there is no need to pass in a loadFunc
        // because the url is set. This is a bit of a hack, but it saves some space in minification.
        createScriptElement(localAppInsights.configUrl, function () {
            createScriptElement("http://az639152.vo.msecnd.net/sdk/a/ai.0.10.js");
        });

        // Don't load a second time:
        localAppInsights.start = function () { }
    }
};

appInsights.start();
appInsights.logPageView();