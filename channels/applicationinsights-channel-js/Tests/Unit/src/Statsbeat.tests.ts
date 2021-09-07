import { AITestClass } from "@microsoft/ai-test-framework";
import { Sender } from "../../../src/Sender";
import { Metric, IMetricTelemetry, urlParseUrl } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, _InternalMessageId } from "@microsoft/applicationinsights-core-js";
import { Statsbeat } from "../../../src/Statsbeat";
import { StatsbeatCounter } from "../../../src/Constants";

const INSTRUMENTATION_KEY = "c4a29126-a7cb-47e5-b348-11414998b11e";
var strEmpty = "";
const endpoint = "https://dc.services.visualstudio.com/v2/track";
const endpointHost = urlParseUrl(endpoint).hostname;
export class StatsbeatTests extends AITestClass {
    private _sender: Sender;
    private _statsbeat: Statsbeat;

    public testInitialize() {
        this._statsbeat = new Statsbeat();
        this._sender = new Sender(this._statsbeat);
    }

    public testCleanup() {
        this._statsbeat = null;
        this._sender = null;
    }

    public registerTests() {
        this.testCase({
            name: "Statsbeat by default is enabled and is initialized while sender is initialized.",
            test: () => {
                const spy = this.sandbox.spy(this._statsbeat, "initialize");
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                    }, new AppInsightsCore(), []
                );

                QUnit.assert.equal(true, spy.calledOnce, "Statsbeat is enabled by default.");
                QUnit.assert.equal(true, this._statsbeat.isInitialized());
            }
        });

        this.testCase({
            name: "Statsbeat is disabled if customer configured to disable statsbeat.",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        disableStatsbeat: true,
                    }, new AppInsightsCore(), []
                );

                const spy = this.sandbox.spy(this._statsbeat, "initialize");
                QUnit.assert.equal(false, spy.calledOnce, "Statsbeat is disabled with customer configuration. When disableStatsbeat sets to true, statsbeat is not initialized thus initialize method is not called.");
            }
        });

        this.testCase({
            name: "It adds correct network properties to custom metric.",
            test: () => {
                // the first xhr gets created when _sender calls initialize; the second xhr gest created when statsbeat's sender calls initialize
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                // the third xhr gets created when track is called and the current _sender creates a xhr to send data
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");

                // we only care the last object that's about to send
                const arr = JSON.parse(this._getXhrRequests()[0].requestBody);
                let fakeReq = arr[arr.length - 1];
                console.log(fakeReq);
                QUnit.assert.equal(fakeReq.name, "Microsoft.ApplicationInsights." + INSTRUMENTATION_KEY.replace(/-/g, strEmpty) + ".Metric");
                QUnit.assert.equal(fakeReq.iKey, INSTRUMENTATION_KEY);
                QUnit.assert.equal(fakeReq.data.baseType, Metric.dataType);

                let baseData: IMetricTelemetry = fakeReq.data.baseData;
                QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                QUnit.assert.equal(baseData.properties["host"], endpointHost);
            }
        });

        this.testCase({
            name: "Track duration.",
            test: () => {
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                this._statsbeat.countRequest(endpointHost, 1000, true);
                this._statsbeat.countRequest(endpointHost, 500, false);
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                
                // we only care the last object that's about to send
                const arr = JSON.parse(this._getXhrRequests()[0].requestBody);
                let fakeReq = arr[arr.length - 1];
                console.log(fakeReq);
                QUnit.assert.equal(fakeReq.name, "Microsoft.ApplicationInsights." + INSTRUMENTATION_KEY.replace(/-/g, strEmpty) + ".Metric");
                QUnit.assert.equal(fakeReq.iKey, INSTRUMENTATION_KEY);
                QUnit.assert.equal(fakeReq.data.baseType, Metric.dataType);

                let baseData: IMetricTelemetry = fakeReq.data.baseData;
                QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                QUnit.assert.equal(baseData.properties["host"], endpointHost);
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_DURATION], "750");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_SUCCESS], "1");
            }
        });

        this.testCase({
            name: "Track counts.",
            test: () => {
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                this._statsbeat.countRequest(endpointHost, 1, true);
                this._statsbeat.countRequest(endpointHost, 1, true);
                this._statsbeat.countRequest(endpointHost, 1, true);
                this._statsbeat.countRequest(endpointHost, 1, true);
                this._statsbeat.countRequest(endpointHost, 1, false);
                this._statsbeat.countRequest(endpointHost, 1, false);
                this._statsbeat.countRequest(endpointHost, 1, false);
                this._statsbeat.countRetry(endpointHost);
                this._statsbeat.countRetry(endpointHost);
                this._statsbeat.countThrottle(endpointHost);
                this._statsbeat.countException(endpointHost);
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                
                // we only care the last object that's about to send
                const arr = JSON.parse(this._getXhrRequests()[0].requestBody);
                let fakeReq = arr[arr.length - 1];
                console.log(fakeReq);
                QUnit.assert.equal(fakeReq.name, "Microsoft.ApplicationInsights." + INSTRUMENTATION_KEY.replace(/-/g, strEmpty) + ".Metric");
                QUnit.assert.equal(fakeReq.iKey, INSTRUMENTATION_KEY);
                QUnit.assert.equal(fakeReq.data.baseType, Metric.dataType);

                let baseData: IMetricTelemetry = fakeReq.data.baseData;
                
                QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                QUnit.assert.equal(baseData.properties["host"], endpointHost);
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_DURATION], "1");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_SUCCESS], "4");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_FAILURE], "3");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.RETRY_COUNT], "2");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.THROTTLE_COUNT], "1");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.EXCEPTION_COUNT], "1");
            }
        });
    }
}