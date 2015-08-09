/// <reference path="../testframework/common.ts" />
/// <reference path="../../JavaScriptSDK/telemetrycontext.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />
/// <reference path="../../JavaScriptSDK/Telemetry/Common/Envelope.ts"/>

class TelemetryContextTests extends TestClass {

    private _telemetryContext: Microsoft.ApplicationInsights.TelemetryContext;
    private _config: Microsoft.ApplicationInsights.ITelemetryConfig;

    /** Method called before the start 1of each test method */
    public testInitialize() {
        this._config = {
            instrumentationKey: () => "testKey",
            accountId: () => undefined,
            appUserId: () => undefined,
            sessionRenewalMs: () => 10,
            sessionExpirationMs: () => 10,
            endpointUrl: () => "asdf",
            emitLineDelimitedJson: () => false,
            maxBatchSizeInBytes: () => 1000000,
            maxBatchInterval: () => 1,
            disableTelemetry: () => false,
            properties: () => { return { prop1: "val1", prop2: "val2" }; }
        }

        this._telemetryContext = new Microsoft.ApplicationInsights.TelemetryContext(this._config);
    }

    /** Method called after each test method has completed */
    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "TelemtetryContect: constructor initializers sender and ikey",
            test: () => {
                var tc = new Microsoft.ApplicationInsights.TelemetryContext(this._config);
                Assert.ok(tc._sender, "sender is initialized");
                Assert.ok(tc._config.instrumentationKey(), "iKey is initialized");
            }
        });

        this.testCase({
            name: "TelemtetryContect: calling track with null or undefined fails",
            test: () => {
                var tc = new Microsoft.ApplicationInsights.TelemetryContext(this._config);
                var logSpy = sinon.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");
                tc.track(undefined);
                Assert.ok(logSpy.calledOnce, "sender throws with undefined");
                tc.track(null);
                Assert.ok(logSpy.calledTwice, "sender throws with null");
                logSpy.restore();
            }
        });

        this.testCase({
            name: "TelemtetryContect: does not overwrite user sessioncontext with defaults",
            test: () => {
                this._telemetryContext.session.id = "101";
                this._telemetryContext.session.isFirst = true;

                var env = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(null, "");
                this._telemetryContext.track(env);

                var contextKeys = new AI.ContextTagKeys();
                Assert.equal("101", env.tags[contextKeys.sessionId], "session.id");
                Assert.equal(true, env.tags[contextKeys.sessionIsFirst], "session.isFirst");
            }
        });

        this.testCase({
            name: "TelemetryContext: properties initialized correctly",
            test: () => {
                // act
                var telemetryContext = new Microsoft.ApplicationInsights.TelemetryContext(this._config);

                // verify
                Assert.deepEqual(this._config.properties(), telemetryContext.properties);
            }
        });

        this.testCase(
            {
                name: "TelemetryContext: custom properties applied if telemetry item's properties are undefined",
                test: () => {
                    // setup
                    this._telemetryContext.properties = { prop1: "val1" };
                    var eventEnvelope = this.getTestEventEnvelope(undefined);
                    // act
                    (<any>this._telemetryContext)._applyCustomProperties(eventEnvelope);

                    // verify
                    var resEvent = (<any>eventEnvelope.data).baseData;
                    Assert.equal("val1", resEvent.properties.prop1);

                    // teardown
                    this._telemetryContext.properties = null;
                }
            });


        this.testCase(
            {
                name: "TelemetryContext: existing custom properties are not touched",
                test: () => {
                    // setup
                    this._telemetryContext.properties = { prop1: "val1" };
                    var eventEnvelope = this.getTestEventEnvelope({ testProp: "testVal" });
                    // act
                    (<any>this._telemetryContext)._applyCustomProperties(eventEnvelope);

                    // verify
                    var resEvent = (<any>eventEnvelope.data).baseData;
                    Assert.equal("testVal", resEvent.properties.testProp);

                    // teardown
                    this._telemetryContext.properties = null;
                }
            });

        this.testCase(
            {
                name: "TelemetryContext: existing custom properties are not overriden",
                test: () => {
                    // setup
                    this._telemetryContext.properties = { prop1: "context wide value" };
                    var eventEnvelope = this.getTestEventEnvelope({ prop1: "item specific value" });
                    
                    // act
                    (<any>this._telemetryContext)._applyCustomProperties(eventEnvelope);

                    // verify
                    var resEvent = (<any>eventEnvelope.data).baseData;
                    Assert.equal("item specific value", resEvent.properties.prop1);

                    // teardown
                    this._telemetryContext.properties = null;
                }
            });
    }

    private getTestEventEnvelope(properties?: Object) {
        var event = new Microsoft.ApplicationInsights.Telemetry.Event('Test Event', properties);
        var eventData = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.Event>(Microsoft.ApplicationInsights.Telemetry.Event.dataType, event);
        var eventEnvelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(eventData, Microsoft.ApplicationInsights.Telemetry.Event.envelopeType);
        return eventEnvelope;
    }
}
new TelemetryContextTests().registerTests();