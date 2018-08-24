/// <reference path="./TestFramework/Common.ts" />

import { TelemetryItemCreator } from "../JavaScriptSDK/TelemetryItemCreator";
import { PageViewPerformance } from 'applicationinsights-common';

export class TelemetryItemCreatorTests extends TestClass {
    public registerTests() {
        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a page view performance item",
            test: () => {
                // setup
                let name = "testName";
                let uri = "testUri";
                var pageViewPerformance = new PageViewPerformance(name, uri, null);
                let properties = {
                    "propKey1": "PropVal1",
                    "propKey2": "PropVal2"
                };

                // act
                let telemetryItem = TelemetryItemCreator.createItem(pageViewPerformance,
                    PageViewPerformance.dataType,
                    PageViewPerformance.envelopeType,
                    properties);

                // assert
                Assert.ok(telemetryItem);
            }
        });
    }
}