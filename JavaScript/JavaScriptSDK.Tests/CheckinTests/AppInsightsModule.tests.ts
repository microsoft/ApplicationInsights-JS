/// <reference path="..\TestFramework\Common.ts" />>

import {AppInsights} from "../../JavaScriptSDK/AppInsightsModule"

class AppInsightsModuleTests extends TestClass {

    public registerTests() {
        this.testCase({
            name: "AppInsightsModuleTests: downloadAndSetup",
            test: () => {
                // setup
                AppInsights.config = null;
                // act

                // Validate
                Assert.ok(false);
            }
        });
    }
}