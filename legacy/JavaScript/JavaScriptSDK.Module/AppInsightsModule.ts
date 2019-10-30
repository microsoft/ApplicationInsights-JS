// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../JavaScriptSDK.Interfaces/IConfig.ts"/>
/// <reference path="../JavaScriptSDK.Interfaces/IAppInsights.ts"/>
/// <reference path="../JavaScriptSDK/UtilHelpers.ts"/>

"use strict";

class AppInsightsModule {

    private static appInsightsInitialized: boolean = false;
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
                // otherwise execute the function
                aiObject[name].apply(aiObject, originalArguments);
            }
        }
    };

    private static _defineLazyMethods() {
        var aiObject = window[AppInsightsModule.appInsightsName];

        // capture initial cookie if possible
        try {
            (<any>aiObject).cookie = document.cookie;
        }
        catch (e) {
        }

        aiObject.queue = [];

        var method = [
            "clearAuthenticatedUserContext",
            "flush",
            "setAuthenticatedUserContext",
            "startTrackEvent",
            "startTrackPage",
            "stopTrackEvent",
            "stopTrackPage",
            "trackDependency",
            "trackEvent",
            "trackException",
            "trackMetric",
            "trackPageView",
            "trackTrace"
        ];

        while (method.length) {
            AppInsightsModule._createLazyMethod(method.pop());
        }
    }

    private static _download(aiConfig: Microsoft.ApplicationInsights.IConfig) {
        AppInsightsModule.getAppInsightsInstance().config = aiConfig;
        var aiObject = window[AppInsightsModule.appInsightsName];

        // if script was previously downloaded and initialized, queue will be deleted, reinitialize it
        if (!aiObject.queue) {
            aiObject.queue = [];
        }

        setTimeout(function () {
            var scriptElement = document.createElement("script");
            scriptElement.src = aiConfig.url || "https://az416426.vo.msecnd.net/scripts/a/ai.0.js";
            document.head.appendChild(scriptElement);
        });

        // collect global errors by wrapping the window.onerror method
        if (!aiConfig.disableExceptionTracking) {
            let method = "onerror";
            AppInsightsModule._createLazyMethod("_" + method);
            var originalOnError = window[method];
            window[method] = function (message, url, lineNumber, columnNumber, error) {
                var handled = originalOnError && originalOnError(message, url, lineNumber, columnNumber, error);
                if (handled !== true) {
                    aiObject["_" + method](message, url, lineNumber, columnNumber, error);
                }

                return handled;
            };
        }

    }

    /**
     * This property returns the current instance of the appInsights, the property is optional as
     * it will only defined when running in an ES5+ browser, if your users are using an ES3 browser 
     * (IE8) you should use the function getter(getAppInsightsInstance()) instead.
     * This change was added in Nov'19 and may not be published -- check your deployed version
     */
    public static readonly appInsightsInstance?: Microsoft.ApplicationInsights.IAppInsights;

    public static getAppInsightsInstance(): Microsoft.ApplicationInsights.IAppInsights {
        if (typeof window === 'undefined') {
            return;
        }
        if (!window[AppInsightsModule.appInsightsName]) {
            window[AppInsightsModule.appInsightsName] = {
                downloadAndSetup: AppInsightsModule._download,
                // exposing it for unit tests only, not part of interface
                _defineLazyMethods: AppInsightsModule._defineLazyMethods
            };
            AppInsightsModule._defineLazyMethods();
        }
        return window[AppInsightsModule.appInsightsName];
    }

    /**
     * Static constructor, attempt to ES5 get accessor
     */
    private static _staticInit = (() => {
        // Dynamically create get/set property accessors

        let defineProp = Object["defineProperty"];
        try {
            defineProp && defineProp(AppInsightsModule.prototype, "appInsightsInstance", {
                get: AppInsightsModule.getAppInsightsInstance,
                enumerable: true,
                configurable: true
            });
        } catch (e) {
            // IE8 Defines a defineProperty on Object but it's only supported for DOM elements so it will throw
            // We will just ignore this here.
        }
    })();
}

export var AppInsights: Microsoft.ApplicationInsights.IAppInsights = AppInsightsModule.getAppInsightsInstance();
export var Util: typeof Microsoft.ApplicationInsights.UtilHelpers;
