/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../TestFramework/ContractTestHelper.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/Metric.ts" />

var metricName = "test";
var metricValue = 42;
class MetricTelemetryTests extends ContractTestHelper {

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.Metric(metricName, metricValue), "MetricTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        this.testCase({
            name: name + "MetricTelemetry captures required data from user",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Metric(metricName, metricValue);
                Assert.equal(metricName, telemetry.metrics[0].name, "name is incorrect");
                Assert.equal(metricValue, telemetry.metrics[0].value, "value is incorrect");
            }
        });
    }
}
new MetricTelemetryTests().registerTests();
