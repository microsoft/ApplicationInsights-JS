/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts" />
/// <reference path="../../JavaScriptSDK/SplitTest.ts" />

class SplitTestTests extends TestClass {

    public registerTests() {

        var getGuids = (count: number): Array<string> => {
            var guids = [];
            for (var i = 0; i < count; ++i) {
                guids.push(Microsoft.ApplicationInsights.Util.newId());
            }
            return guids;
        }

        this.testCase({
            name: "SplitTestTests: ",
            test: () => {
                var sut = new Microsoft.ApplicationInsights.SplitTest();
                var guids = getGuids(10000);
                var enabledPercent = 20;
                var acceptedErrorPercent = 2;

                // Act
                var totalCount = guids.length;
                var enabledCount = 0;
                guids.forEach((guid) => {
                    if (sut.isEnabled(guid, enabledPercent))
                        ++enabledCount;
                });

                // Assert.ok(false);

                // Validate
                var actualEnabledPercent = (enabledCount / totalCount) * 100;
                Assert.ok(
                    (actualEnabledPercent < enabledPercent + acceptedErrorPercent) &&
                    (actualEnabledPercent > enabledPercent - acceptedErrorPercent),
                    "Enabled percent does not fall into expected range (" + enabledPercent + " +- " + acceptedErrorPercent + "): " + actualEnabledPercent);

            }
        });
    }

}
new SplitTestTests().registerTests();