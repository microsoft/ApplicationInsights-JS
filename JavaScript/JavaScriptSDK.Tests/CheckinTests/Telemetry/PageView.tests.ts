/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../TestFramework/ContractTestHelper.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/PageView.ts" />

class PageViewTelemetryTests extends ContractTestHelper {

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.PageView("name", "url", 0), "PageViewTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        var testValues = {
            name: "name",
            url: "url",
            duration: 1000,
            properties: {
                "property1": 5,
                "property2": 10
            },
            measurements: {
                "measurement": 300
            }
        };

        this.testCase({
            name: name + "PageviewData is initialized in constructor with 5 parameters (name, url, durationMs, properties, measurements) and valid",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageView(testValues.name, testValues.url, testValues.duration, testValues.properties, testValues.measurements);

                Assert.equal(testValues.name, telemetry.name);
                Assert.equal(testValues.url, telemetry.url);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(testValues.duration), telemetry.duration);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);
                this.checkSerializableObject(() => telemetry, "PageviewData");
            }
        });
    }
}
new PageViewTelemetryTests().registerTests();
