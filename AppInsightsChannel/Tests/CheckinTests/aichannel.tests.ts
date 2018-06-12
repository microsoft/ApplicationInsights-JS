/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../Sender.ts" />

class AppInsightsChannelTests extends TestClass {
    public testInitialize() {
        this.clock.reset();
    }

    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: () => {
                Assert.ok(true);
            }
        });
    }
}
new AppInsightsChannelTests().registerTests();