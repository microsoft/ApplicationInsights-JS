/// <reference path="./AppInsights.ts"/>
/// <reference path="./IAppInsights.ts"/>

class AppInsightsModule {
    private static appInsightsName = "appInsights";

    private static _createLazyMethod(name) {
        var aiObject = window[AppInsightsModule.appInsightsName];

        // Define a temporary method that queues-up a the real method call
        aiObject[name] = function () {
            // Capture the original arguments passed to the method
            var originalArguments = arguments;
            // If the queue is available, it means that the function wasn't yet replaced with actual function value
            if (aiObject.queue) {
                aiObject.queue.push(() => aiObject[name].apply(aiObject, originalArguments));
            }
            else {
                // otheriwse execute the function
                aiObject[name].apply(aiObject, originalArguments);
            }
        }

        //AppInsightsModule.appInsightsInstance[name] = aiObject[name];
    };

    public static get appInsightsInstance():Microsoft.ApplicationInsights.IAppInsights {
        return window[AppInsightsModule.appInsightsName];
    }

    public static initialize(aiConfig: Microsoft.ApplicationInsights.IConfig) {


        if (!window[AppInsightsModule.appInsightsName]) {
            window[AppInsightsModule.appInsightsName] = {
                config: aiConfig
            };

            var scriptElement = document.createElement("script");
            scriptElement.src = "http://az416426.vo.msecnd.net/scripts/a/ai.0.js";
            document.head.appendChild(scriptElement);

            var aiObject = window[AppInsightsModule.appInsightsName];

            // capture initial cookie
            aiObject.cookie = document.cookie;
            aiObject.queue = [];

            var method = ["trackEvent", "trackException", "trackMetric", "trackPageView", "trackTrace", "trackAjax", "setAuthenticatedUserContext", "clearAuthenticatedUserContext"];
            while (method.length) {
                AppInsightsModule._createLazyMethod(method.pop());
            }

            // collect global errors
            if (!aiConfig.disableExceptionTracking) {
                AppInsightsModule._createLazyMethod("_onerror");
                var originalOnError = window["_onerror"];
                window["_onerror"] = function (message, url, lineNumber, columnNumber, error) {
                    var handled = originalOnError && originalOnError(message, url, lineNumber, columnNumber, error);
                    if (handled !== true) {
                        aiObject["_onerror"](message, url, lineNumber, columnNumber, error);
                    }

                    return handled;
                };
            }
        }
    }
}

export var initialize: (config: Microsoft.ApplicationInsights.IConfig) => void = AppInsightsModule.initialize;
export var AppInsights: Microsoft.ApplicationInsights.IAppInsights = AppInsightsModule.appInsightsInstance;