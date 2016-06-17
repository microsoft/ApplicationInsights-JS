/// <reference path="..\TestFramework\Common.ts" />

import {AppInsights} from "../../JavaScriptSDK.Module/AppInsightsModule"

export default class AppInsightsModuleTests extends TestClass {

    public registerTests() {
        this.useFakeTimers = false;
        this.testCaseAsync({
            name: "AppInsightsModuleTests: downloadAndSetup",
            steps: [

                () => {
                    Assert.ok(!AppInsights.queue, "Initially, queue should be undefined");
                    // need to override the url, otherwise file:// is used for local test runs.
                    AppInsights.downloadAndSetup({ instrumentationKey: "test", url: "http://az416426.vo.msecnd.net/scripts/a/ai.0.js" });
                    Assert.ok(AppInsights.queue, "Queue should be defined after downloadAndSetup was called");
                },
                <() => void>
                PollingAssert.createPollingAssert(
                    () => !AppInsights.queue,
                    "Queue object is cleaned and removed after script loads")

            ],
            stepDelay: 0
        });

        this.testCase({
            name: "AppInsightsModuleTests: verify methods are registered",
            test: () => {
                AppInsights.downloadAndSetup({ instrumentationKey: "test" });
                var expectedMethods = [
                    "clearAuthenticatedUserContext",
                    "flush",
                    "setAuthenticatedUserContext",
                    "startTrackEvent",
                    "startTrackPage",
                    "stopTrackEvent",
                    "stopTrackPage",
                    "trackAjax",
                    "trackEvent",
                    "trackException",
                    "trackMetric",
                    "trackPageView",
                    "trackTrace"
                ];

                for (var i = 0; i < expectedMethods.length; i++) {
                    Assert.ok(AppInsights[expectedMethods[i]], expectedMethods[i] + " should be defined");
                }
            }
        });

        this.testCaseAsync({
            name: "AppInsightsModuleTests: verifying queue is flushed when loading",
            steps: [

                () => {
                    AppInsights.downloadAndSetup({ instrumentationKey: "test", url: "http://az416426.vo.msecnd.net/scripts/a/ai.0.js" });
                    AppInsights.queue.push(() => this["queueFlushed"] = true);
                    this["queueFlushed"] = false;
                },
                <() => void>
                PollingAssert.createPollingAssert(
                    () => this["queueFlushed"] === true,
                    "Actions in the queue are executed when queue is flushed")

            ],
            stepDelay: 0
        });
    }
}