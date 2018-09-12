/// <reference path="./TestFramework/Common.ts" />

import { TelemetryItemCreator } from "../JavaScriptSDK/TelemetryItemCreator";
import { PageViewPerformance, PageView } from 'applicationinsights-common';
import { IPageViewTelemetry } from "../JavascriptSDK.Interfaces/IPageViewTelemetry";
import { ApplicationInsights } from '../JavaScriptSDK/ApplicationInsights'
import { 
    IAppInsightsCore, AppInsightsCore,
    IConfiguration, IPlugin
} from 'applicationinsights-core-js';


export class TelemetryItemCreatorTests extends TestClass {
    private _core: IAppInsightsCore;
    private _appInsights: ApplicationInsights;

    public testInitialize() {
        const plugin: IPlugin = new TestPlugin();
        this._core = new AppInsightsCore();
        this._core.initialize(
            {instrumentationKey: "key"},
            [plugin]
        );
        this._appInsights = new ApplicationInsights();
        this._appInsights.initialize({ "instrumentationKey": "ikey" }, this._core, []);
    }

    public registerTests() {
        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a page view performance item",
            test: () => {
                // setup
                let name = "testName";
                let uri = "testUri";
                var pageViewPerformance = new PageViewPerformance(this._core.logger, name, uri, null);
                let properties = {
                    "propKey1": "PropVal1",
                    "propKey2": "PropVal2"
                };

                // act
                let telemetryItem = TelemetryItemCreator.createItem(this._core.logger,
                    pageViewPerformance,
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
                let telemetryItem = TelemetryItemCreator.createItem(this._core.logger,
                    pageView,
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

class TestPlugin implements IPlugin {
    private _config: IConfiguration;
    priority: number = 100;

    public initialize(config: IConfiguration) {
        this._config = config;
        // do custom one time initialization
    }
}