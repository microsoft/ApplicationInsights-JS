import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import {
    PageViewPerformance,
    PageView,
    TelemetryItemCreator,
    IPageViewTelemetry,
    IEventTelemetry,
    Event as EventTelemetry,
    Trace,
    ITraceTelemetry,
    Metric,
    IMetricTelemetry,
    RemoteDependencyData,
    IDependencyTelemetry,
    PageViewPerformanceDataType,
    PageViewDataType,
    EventDataType,
    TraceDataType,
    MetricDataType,
    RemoteDependencyDataType,
    PageViewPerformanceEnvelopeType,
    PageViewEnvelopeType,
    EventEnvelopeType,
    TraceEnvelopeType,
    MetricEnvelopeType,
    RemoteDependencyEnvelopeType,
} from '@microsoft/applicationinsights-core-js';
import { AnalyticsPlugin } from '../../../src/JavaScriptSDK/AnalyticsPlugin'
import { 
    IAppInsightsCore, AppInsightsCore,
    ITelemetryItem,
    IConfiguration, IPlugin
} from '@microsoft/applicationinsights-core-js';



export class TelemetryItemCreatorTests extends AITestClass {
    private _core: IAppInsightsCore;
    private _appInsights: AnalyticsPlugin;

    constructor(name?: string, emulateIe?: boolean) {
        super(name, emulateIe);
        this.assertNoEvents = true;
        this.assertNoHooks = true;
    }

    public testInitialize() {
        const plugin: IPlugin = new ChannelPlugin();
        this._core = new AppInsightsCore();
        this._core.initialize(
            {instrumentationKey: "ikey"},
            [plugin]
        );
        this._appInsights = new AnalyticsPlugin();
        this._core.addPlugin(this._appInsights);
    }

    public testFinishedCleanup(): void {
        if (this._core) {
            this._core.unload(false);
        }    
    }

    public registerTests() {
        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a page view performance item",
            test: () => {
                // setup
                const name = "testName";
                const uri = "testUri";
                const pageViewPerformance = new PageViewPerformance(this._core.logger, name, uri, null);
                const properties = {
                    "propKey1": "PropVal1",
                    "propKey2": "PropVal2"
                };

                // act
                const telemetryItem = TelemetryItemCreator.create<PageViewPerformance>(
                    pageViewPerformance,
                    PageViewPerformanceDataType,
                    PageViewPerformanceEnvelopeType,
                    this._core.logger,
                    properties);

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.PageviewPerformance", telemetryItem.name, "telemtryItem.name");
                Assert.equal("Microsoft.ApplicationInsights.{0}.PageviewPerformance", telemetryItem.name, "telemtryItem.name");
                Assert.equal("", telemetryItem.iKey, "telemetryItem.iKey");
                Assert.deepEqual({"propKey1":"PropVal1","propKey2":"PropVal2"},telemetryItem.data, "telemetryItem.data");
            }
        });

        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a page view item",
            test: () => {
                // setup
                const name = "testName";
                const uri = "testUri";
                const pageView: IPageViewTelemetry = {
                    name,
                    uri
                };
                const properties = {
                    "propKey1": "PropVal1",
                    "propKey2": "PropVal2"
                };

                // act
                const telemetryItem = TelemetryItemCreator.create<IPageViewTelemetry>(
                    pageView,
                    PageViewDataType,
                    PageViewEnvelopeType,
                    this._core.logger,
                    properties);

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.Pageview", telemetryItem.name, "telemtryItem.name");
                Assert.equal("PageviewData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.equal("",telemetryItem.iKey,"telemetryItem.iKey");
                Assert.deepEqual({"propKey1":"PropVal1","propKey2":"PropVal2"},telemetryItem.data, "telemetryItem.data");
            }
        });

        
        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid TelemetryItem for trackEvent with iKey",
            test: () => {
                // setup
                const event: IEventTelemetry = {
                    name: "trackEventNewtTest",
                    iKey: "newTestIkey",
                    properties: { "prop1": "value1" },
                    measurements: { "measurement1": 200 }
                }
                const customProperties = {"propKey1":"PropVal1"};
                
                // act
                const telemetryItem = TelemetryItemCreator.create<ITelemetryItem>(
                    event,
                    EventDataType,
                    EventEnvelopeType,
                    this._appInsights.diagLog(),
                    customProperties);

                // assert
                Assert.equal("Microsoft.ApplicationInsights.{0}.Event", telemetryItem.name, "telemtryItem.name");
                Assert.equal("EventData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.equal("newTestIkey", telemetryItem.iKey, "telemtryItem.iKey");
                Assert.deepEqual({"propKey1":"PropVal1"},telemetryItem.data, "telemetryItem.data");
                Assert.deepEqual( "trackEventNewtTest",telemetryItem.baseData.name, "telemetryItem.baseData.name");
                Assert.deepEqual({ "prop1": "value1" },telemetryItem.baseData.properties, "telemetryItem.baseData.properties");
                Assert.deepEqual({ "measurement1": 200 },telemetryItem.baseData.measurements, "telemetryItem.baseData.measurements");
            }
        });

        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a page view item with iKey",
            test: () => {
                // setup
                const name = "testName";
                const uri = "testUri";
                const pageView: IPageViewTelemetry = {
                    name: name,
                    uri: uri,
                    iKey: "newIkey"
                };
                const properties = {
                    "propKey1": "PropVal1"
                };

                // act
                const telemetryItem = TelemetryItemCreator.create<IPageViewTelemetry>(
                    pageView,
                    PageViewDataType,
                    PageViewEnvelopeType,
                    this._core.logger,
                    properties);

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.Pageview", telemetryItem.name, "telemtryItem.name");
                Assert.equal("newIkey", telemetryItem.iKey, "telemtryItem.iKey");
                Assert.equal("PageviewData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.equal("testUri", telemetryItem.baseData.uri, "telemetryItem.baseData.uri");
                Assert.equal("testName", telemetryItem.baseData.name, "telemetryItem.baseData.name");
                Assert.deepEqual({ "propKey1": "PropVal1" }, telemetryItem.data, "telemetryItem.data");
            }
        });

        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a trace item with iKey",
            test: () => {
                // setup
                const trace: ITraceTelemetry = {
                    message:"traceMessage",
                    iKey: "newIkey"
                };
                const  customProperties = {
                    "propKey1": "PropVal1"
                };

                // act
                const telemetryItem = TelemetryItemCreator.create<ITraceTelemetry>(
                    trace,
                    TraceDataType,
                    TraceEnvelopeType,
                    this._core.logger,
                    customProperties);

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.Message", telemetryItem.name, "telemtryItem.name");
                Assert.equal("newIkey", telemetryItem.iKey, "telemtryItem.iKey");
                Assert.equal("MessageData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.equal("traceMessage", telemetryItem.baseData.message, "telemetryItem.baseData.message");
                Assert.deepEqual({"propKey1":"PropVal1"},telemetryItem.data, "telemetryItem.data");
            }
        });

        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a metric item with iKey",
            test: () => {
                // setup
                const metric: IMetricTelemetry = {
                    name:"metricName",
                    average: 5,
                    iKey: "newIkey"
                };

                // act
                const telemetryItem = TelemetryItemCreator.create<IMetricTelemetry>(
                    metric,
                    MetricDataType,
                    MetricEnvelopeType,
                    this._core.logger
                );

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.Metric", telemetryItem.name, "telemtryItem.name");
                Assert.equal("newIkey", telemetryItem.iKey, "telemtryItem.iKey");
                Assert.equal("MetricData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.equal("metricName",telemetryItem.baseData.name, "telemetryItem.baseData.name");
                Assert.equal(5,telemetryItem.baseData.average, "telemetryItem.baseData.average");
            }
        });

        this.testCase({
            name: "TelemetryItemCreatorTests: create a valid ITelemetryItem for a dependency item with iKey",
            test: () => {
                // setup
                const dependency: IDependencyTelemetry = {
                    name:"dependencyName",
                    id:"id",
                    responseCode: 200,
                    iKey: "newIkey"
                };

                // act
                const telemetryItem = TelemetryItemCreator.create<IDependencyTelemetry>(
                    dependency,
                    RemoteDependencyDataType,
                    RemoteDependencyEnvelopeType,
                    this._core.logger,
                );

                // assert
                Assert.ok(telemetryItem);
                Assert.equal("Microsoft.ApplicationInsights.{0}.RemoteDependency", telemetryItem.name, "telemtryItem.name");
                Assert.equal("newIkey", telemetryItem.iKey, "telemtryItem.iKey");
                Assert.equal("RemoteDependencyData", telemetryItem.baseType, "telemetryItem.baseType");
                Assert.equal("dependencyName",telemetryItem.baseData.name, "telemetryItem.baseData.name");
                Assert.equal(200,telemetryItem.baseData.responseCode, "telemetryItem.baseData.responseCode");
                Assert.equal("id",telemetryItem.baseData.id, "telemetryItem.baseData.id");
                
            }
        });
    }
}

class ChannelPlugin implements IPlugin {

    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public processTelemetry;

    public identifier = "Sender";

    public priority: number = 1001;

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
    
    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration) => {
    }

    private _processTelemetry(env: ITelemetryItem) {

    }
}