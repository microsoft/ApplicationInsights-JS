/// <reference path="./TestFramework/Common.ts" />

import { TelemetryItemCreator } from "../JavaScriptSDK/TelemetryItemCreator";
import { PageViewPerformance, PageView } from 'applicationinsights-common';
import { IPageViewTelemetry } from "../JavascriptSDK.Interfaces/IPageViewTelemetry";

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
                Assert.equal("Microsoft.ApplicationInsights.{0}.PageviewPerformance", telemetryItem.name, "telemtryItem.name");;
                Assert.equal("PageviewPerformanceData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.deepEqual({"propKey1":"PropVal1","propKey2":"PropVal2"},telemetryItem.data, "telemetryItem.data");
            }
        });

        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a page view item",
            test: () => {
                // setup
                let name = "testName";
                let uri = "testUri";
                var pageView: IPageViewTelemetry = {
                    name: name,
                    uri: uri
                };
                let properties = {
                    "propKey1": "PropVal1",
                    "propKey2": "PropVal2"
                };

                // act
                let telemetryItem = TelemetryItemCreator.createItem(pageView,
                    PageView.dataType,
                    PageView.envelopeType,
                    properties);

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.Pageview", telemetryItem.name, "telemtryItem.name");;
                Assert.equal("PageviewData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.deepEqual({"propKey1":"PropVal1","propKey2":"PropVal2"},telemetryItem.data, "telemetryItem.data");
            }
        });
    }
}