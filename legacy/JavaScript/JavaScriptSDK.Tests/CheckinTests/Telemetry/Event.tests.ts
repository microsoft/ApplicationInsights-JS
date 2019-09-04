/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../TestFramework/ContractTestHelper.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/Event.ts" />

class EventTelemetryTests extends ContractTestHelper {

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.Event("test"), "EventTelemetryTests");
    }

    /** Method called before the start of each test method */
    public testInitialize() {
        delete Microsoft.ApplicationInsights.Telemetry.Event["__extends"];
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        this.testCase({
            name: name + "Constructor initializes the name",
            test: () => {
                var eventName = "test";
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Event(eventName);
                Assert.equal(eventName, telemetry.name, "event name is set correctly");
            }
        });

        this.testCase({
            name: name + "Constructor sanitizes the name",
            test: () => {
                var char10 = "1234567890";
                var eventName = char10;

                for (var i = 0; i <= 200; i++) {
                    eventName += char10;
                }

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.Event(eventName);
                Assert.equal(1024, telemetry.name.length, "event name is too long");
            }
        });
    }
}
new EventTelemetryTests().registerTests();
