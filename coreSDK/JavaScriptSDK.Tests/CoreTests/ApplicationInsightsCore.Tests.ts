/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsightsCore.ts" />

class ApplicationInsightsCoreTests extends TestClass {

    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "ApplicationInsightsCore: test initialize",
            test: () => {
                Assert.ok(true, "first test");
            }
        });

    }

}