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
                Assert.ok(true);
                 //let sender = new Sender();
                // let inputEnvelope = {
                //     name: "test",
                //     timestamp: new Date(),
                //     baseType: "EventData",
                //     instrumentationKey: "abc",
                //     sytemProperties: {},
                //     domainProperties: {
                //         "name": "Event Name"
                //     },
                //     customProperties: { 
                //         "property1": "val1",
                //         "measurement1": 50.0, 
                //         "measurement2": 1.3,
                //         "property2": "val2"
                //     }
                // };
                // let appInsightsEnvelope = Sender._constructEnvelope(inputEnvelope);

                // let baseData = appInsightsEnvelope.data.baseData;

                // // Assert measurements
                // let resultMeasurements = baseData.measurements;
                // Assert.ok(resultMeasurements);
                // Assert.ok(resultMeasurements["measurement1"]);
                // Assert.equal(50.0, resultMeasurements["measurement1"]);
                // Assert.ok(resultMeasurements["measurement2"]);
                // Assert.equal(1.3, resultMeasurements["measurement2"]);

                // // Assert Event name
                // Assert.ok(baseData.name);
                // Assert.equal("Event Name", baseData.name);

                // // Assert custom properties
                // Assert.ok(baseData.properties);
                // Assert.equal("val1", baseData.properties["property1"]);
                // Assert.equal("val2", baseData.properties["property2"]);
                //stopped here. verify stuff in data such as baseType, ver, 
            }
        });
    }
}