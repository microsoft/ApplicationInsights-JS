import { AITestClass } from "@microsoft/ai-test-framework";
import { Sender } from "../../../src/Sender";
import { Offline } from '../../../src/Offline';
import { EnvelopeCreator } from '../../../src/EnvelopeCreator';
import { Exception, CtxTagKeys, Util, IMetricTelemetry } from "@microsoft/applicationinsights-common";
import { ITelemetryItem, AppInsightsCore, ITelemetryPlugin, DiagnosticLogger, NotificationManager, SendRequestReason, _InternalMessageId, LoggingSeverity, getGlobalInst, getGlobal } from "@microsoft/applicationinsights-core-js";
import { Statsbeat } from "../../../src/Statsbeat";

Statsbeat.INSTRUMENTATION_KEY = "2aa22222-bbbb-1ccc-8ddd-eeeeffff3333";

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
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                    }, new AppInsightsCore(), []
                );

                QUnit.assert.equal(this._statsbeat["_isEnabled"], true, "By default, statsbeat is enabled.");
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

                QUnit.assert.equal(this._statsbeat["_isEnabled"], false, "Statsbeat is disabled with customer configuration.");
            }
        });

        this.testCase({
            name: "It adds correct network properties to custom metric.",
            test: () => {
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                const spy = this.sandbox.spy(this._statsbeat["_sender"], "triggerSend");
                this._statsbeat.countRequest("https://dc.services.visualstudio.com/v2/track", 123, true);
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(spy.callCount, 1, "should call sender");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                let test = this._getXhrRequests();
                console.log(test);
                // let envelope = spy.args[1][0][0];
                // QUnit.assert.equal(envelope.name, "Statsbeat");
                // QUnit.assert.equal(envelope.iKey, "2aa22222-bbbb-1ccc-8ddd-eeeeffff3333");
                // QUnit.assert.equal(envelope.data.baseType, "MetricData");
                // let baseData: IMetricTelemetry = envelope.data.baseData;
                // QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                // QUnit.assert.equal(baseData.properties["host"], "testEndpointHost");
            }
        })
    }
}