/// <reference path="../TestFramework/Common.ts" />

import {AppInsights, Util} from "../../JavaScriptSDK.Module/AppInsightsModule"

export default class AppInsightsModuleTests extends TestClass {

    private static expectedMethods = [
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

    private static getUncachedScriptUrl() {
        return "https://az416426.vo.msecnd.net/scripts/a/ai.0.js?s=" + (new Date()).getTime().toString();
    }

    public testInitialize() {
        // this is a workaround to force re-initialized of imported variable
        AppInsights["_defineLazyMethods"]();
    }

    public registerTests() {
        this.useFakeTimers = false;
        this.testCaseAsync({
            name: "AppInsightsModuleTests: downloadAndSetup",
            steps: [

                () => {
                    Assert.ok(AppInsights.queue, "Queue should initially be defined");
                    // need to override the url, otherwise file:// is used for local test runs.
                    AppInsights.downloadAndSetup({ instrumentationKey: "test", url: AppInsightsModuleTests.getUncachedScriptUrl()});
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
                for (var i = 0; i < AppInsightsModuleTests.expectedMethods.length; i++) {
                    Assert.ok(AppInsights[AppInsightsModuleTests.expectedMethods[i]], AppInsightsModuleTests.expectedMethods[i] + " should be defined");
                }
            }
        });

        this.testCaseAsync({
            name: "AppInsightsModuleTests: verifying queue is flushed when loading",
            steps: [

                () => {
                    AppInsights.downloadAndSetup({ instrumentationKey: "test", url: AppInsightsModuleTests.getUncachedScriptUrl() });
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

        this.testCase({
            name: "AppInsightsModuleTests: verify track* methods are defined before calling downloadAndSetup",
            test: () => {             
                for (var i = 0; i < AppInsightsModuleTests.expectedMethods.length; i++) {
                    Assert.ok(AppInsights[AppInsightsModuleTests.expectedMethods[i]], AppInsightsModuleTests.expectedMethods[i] + " should be defined");
                }
            }
        });

        this.testCase({
            name: "AppInsightsModuleTests: verify track* method calls called before downloadAndSetup end up in the queue",
            test: () => {
                AppInsights.trackTrace("");
                AppInsights.trackEvent("");
                AppInsights.trackTrace("");
                Assert.equal(3, AppInsights.queue.length);
                AppInsights.downloadAndSetup({ instrumentationKey: "test", url: AppInsightsModuleTests.getUncachedScriptUrl() });
                Assert.equal(3, AppInsights.queue.length);
            }
        });

        this.testCase({
            name: "UtilHelpers: exposed Util.newId() generates unique GUIDs",
            test: () => {
                var results = [];
                for (var i = 0; i < 100; i++) {
                    var newId = Util.newId();
                    for (var j = 0; j < results.length; j++) {
                        Assert.notEqual(newId, results[j]);
                    }
                    results.push(newId);
                }
            }
        });
    }
}