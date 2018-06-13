/// <reference path="./TestFramework/Common.ts" />
import { Sender } from "../Sender";

export class SenderTests extends TestClass {
    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Custom Event",
            test: () => {
                let sender = new Sender();
                let inputEnvelope = {
                    name: "test",
                    timestamp: new Date("2018-06-12"),
                    baseType: "EventData",
                    instrumentationKey: "iKey",
                    sytemProperties: {
                        "ai.session.id": "d041d2e5fa834b4f9eee41ac163bf402",
                        "ai.device.id": "browser",
                        "ai.device.type": "Browser",
                        "ai.internal.sdkVersion": "javascript:1.0.18",
                    },
                    domainProperties: {
                        "name": "Event Name"
                    },
                    customProperties: {
                        "property1": "val1",
                        "measurement1": 50.0,
                        "measurement2": 1.3,
                        "property2": "val2"
                    }
                };
                let appInsightsEnvelope = Sender._constructEnvelope(inputEnvelope);

                let baseData = appInsightsEnvelope.data.baseData;

                // Assert measurements
                let resultMeasurements = baseData.measurements;
                Assert.ok(resultMeasurements);
                Assert.ok(resultMeasurements["measurement1"]);
                Assert.equal(50.0, resultMeasurements["measurement1"]);
                Assert.ok(resultMeasurements["measurement2"]);
                Assert.equal(1.3, resultMeasurements["measurement2"]);

                // Assert custom properties
                Assert.ok(baseData.properties);
                Assert.equal("val1", baseData.properties["property1"]);
                Assert.equal("val2", baseData.properties["property2"]);

                // Assert Event name
                Assert.ok(baseData.name);
                Assert.equal("Event Name", baseData.name);

                // Assert ver
                Assert.ok(baseData.ver);
                Assert.equal(2, baseData.ver);

                // Assert baseType
                Assert.ok(appInsightsEnvelope.data.baseType);
                Assert.equal("EventData", appInsightsEnvelope.data.baseType);

                // Assert tags
                Assert.ok(appInsightsEnvelope.tags);
                Assert.equal("d041d2e5fa834b4f9eee41ac163bf402", appInsightsEnvelope.tags["ai.session.id"]);
                Assert.equal("browser", appInsightsEnvelope.tags["ai.device.id"]);
                Assert.equal("Browser", appInsightsEnvelope.tags["ai.device.type"]);
                Assert.equal("javascript:1.0.18", appInsightsEnvelope.tags["ai.internal.sdkVersion"]);

                // Assert name
                Assert.ok(appInsightsEnvelope.name);
                Assert.equal("Microsoft.ApplicationInsights.iKey.Event", appInsightsEnvelope.name);

                // Assert iKey
                Assert.ok(appInsightsEnvelope.iKey);
                Assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                Assert.ok(appInsightsEnvelope.time);
            }
        });
    }
}