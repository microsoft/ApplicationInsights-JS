/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../TestFramework/ContractTestHelper.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/Trace.ts" />

class TraceTelemetryTests extends ContractTestHelper {

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.Trace("test"), "TraceTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";
        
        this.testCase({
            name: name + "Trace captures required data from user",
            test: () => {
                var message = "test";
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Trace(message);
                Assert.equal(message, telemetry.message, "message is set correctly");
            }
        });
    }
}
new TraceTelemetryTests().registerTests();
