/// <reference path="./TestFramework/Common.ts" />

import {
    PageViewPerformance,
    PageView,
    TelemetryItemCreator,
    IPageViewTelemetry
} from '@microsoft/applicationinsights-common';
import { ApplicationInsights } from '../src/JavaScriptSDK/ApplicationInsights'
import { 
    IAppInsightsCore, AppInsightsCore,
    ITelemetryItem,
    IConfiguration, IPlugin
} from '@microsoft/applicationinsights-core-js';


export class TelemetryItemCreatorTests extends TestClass {
    private _core: IAppInsightsCore;
    private _appInsights: ApplicationInsights;

    public testInitialize() {
        const plugin: IPlugin = new ChannelPlugin();
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
                let telemetryItem = TelemetryItemCreator.create<PageViewPerformance>(
                    pageViewPerformance,
                    PageViewPerformance.dataType,
                    PageViewPerformance.envelopeType,
                    this._core.logger,
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
                let telemetryItem = TelemetryItemCreator.create<IPageViewTelemetry>(
                    pageView,
                    PageView.dataType,
                    PageView.envelopeType,
                    this._core.logger,
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

class ChannelPlugin implements IPlugin {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    public pause(): void {
        this.isPauseInvoked = true;
    }    
    
    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry;

    public identifier = "Sender";
    
    setNextPlugin(next: any) {
        // no next setup
    }

    public priority: number = 201;

    public initialize = (config: IConfiguration) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}