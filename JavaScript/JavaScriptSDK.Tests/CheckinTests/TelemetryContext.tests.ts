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
            properties: () => {
                return { prop1: "val1", prop2: "val2" };
            },
            measurements: () => {
                return { m1: 100, m2: 200 };
            }
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
                name: "TelemetryContext: telemetry item-specific custom properties are not touched",
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
                name: "TelemetryContext: telemetry item-specific properties are not overriden",
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

        this.testCase({
            name: "TelemetryContext: measurements initialized correctly",
            test: () => {
                // act
                var telemetryContext = new Microsoft.ApplicationInsights.TelemetryContext(this._config);

                // verify
                Assert.deepEqual(this._config.measurements(), telemetryContext.measurements);
            }
        });

        this.testCase(
            {
                name: "TelemetryContext: custom measurements applied if telemetry item's measurements are undefined",
                test: () => {
                    // setup
                    this._telemetryContext.measurements = { m1: 100 };
                    var eventEnvelope = this.getTestEventEnvelope(undefined, undefined);
                    // act
                    (<any>this._telemetryContext)._applyCustomMeasurements(eventEnvelope);

                    // verify
                    var resEvent = (<any>eventEnvelope.data).baseData;
                    Assert.equal(100, resEvent.measurements.m1);

                    // teardown
                    this._telemetryContext.measurements = null;
                }
            });


        this.testCase(
            {
                name: "TelemetryContext: telemetry item-specific measurements are not touched",
                test: () => {
                    // setup
                    this._telemetryContext.measurements = { m1: 100 };
                    var eventEnvelope = this.getTestEventEnvelope(undefined, { m2: 200 });
                    // act
                    (<any>this._telemetryContext)._applyCustomMeasurements(eventEnvelope);

                    // verify
                    var resEvent = (<any>eventEnvelope.data).baseData;
                    Assert.equal(200, resEvent.measurements.m2);

                    // teardown
                    this._telemetryContext.measurements = null;
                }
            });

        this.testCase(
            {
                name: "TelemetryContext: telemetry item-specific custom measurements are not overriden",
                test: () => {
                    // setup
                    this._telemetryContext.measurements = { m1: 100 };
                    var eventEnvelope = this.getTestEventEnvelope(undefined, { m1: 200 });
                    
                    // act
                    (<any>this._telemetryContext)._applyCustomMeasurements(eventEnvelope);

                    // verify
                    var resEvent = (<any>eventEnvelope.data).baseData;
                    Assert.equal(200, resEvent.measurements.m1);

                    // teardown
                    this._telemetryContext.measurements = null;
                }
            });

        this.testCase({
            name: "TelemetryContext: onInitializeTelemetry is called within track() and gets the envelope as an argument",
            test: () => {
                var eventEnvelope = this.getTestEventEnvelope();

                var telemetryInitializer = {
                    onInitializeTelemetry: (envelope) => { }
                }

                this._telemetryContext.onInitializeTelemetry = <any>telemetryInitializer.onInitializeTelemetry;
                var spy = sinon.spy(telemetryInitializer, "onInitializeTelemetry");
                    
                // act
                this._telemetryContext.track(eventEnvelope);

                // verify
                Assert.ok(spy.calledOnce, "telemetryInitializer was called");
                Assert.ok(eventEnvelope === spy.args[0][0]);

                // teardown
                spy.restore();
                this._telemetryContext.onInitializeTelemetry = undefined;
            }
        });

        this.testCase({
            name: "TelemetryContext: onInitializeTelemetry changes the envelope props and sender gets them",
            test: () => {
                var nameOverride = "my unique name";
                var eventEnvelope = this.getTestEventEnvelope();
                Assert.notEqual(eventEnvelope.name, nameOverride);
                var telemetryInitializer = {
                    onInitializeTelemetry: (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => {
                        envelope.name = nameOverride;
                        return true;
                    }
                }

                this._telemetryContext.onInitializeTelemetry = <any>telemetryInitializer.onInitializeTelemetry;
                var spy = sinon.spy(this._telemetryContext._sender, "send");
                    
                // act
                this._telemetryContext.track(eventEnvelope);

                // verify
                Assert.ok(spy.calledOnce, "sender was called");
                Assert.ok(eventEnvelope === spy.args[0][0]);
                Assert.equal(nameOverride,
                    (<Microsoft.ApplicationInsights.Telemetry.Common.Envelope>spy.args[0][0]).name);

                // teardown
                spy.restore();
                this._telemetryContext.onInitializeTelemetry = undefined;
            }
        });

        this.testCase({
            name: "TelemetryContext: onInitializeTelemetry is null means envelope goes straight to the sender",
            test: () => {
                var eventEnvelope = this.getTestEventEnvelope();
                var spy = sinon.spy(this._telemetryContext._sender, "send");
                    
                // act
                this._telemetryContext.track(eventEnvelope);

                // verify
                Assert.ok(spy.calledOnce, "sender was called");
                Assert.ok(eventEnvelope === spy.args[0][0]);

                // teardown
                spy.restore();
            }
        });

        this.testCase({
            name: "TelemetryContext: onInitializeTelemetry returns false means item is not sent",
            test: () => {
                var eventEnvelope = this.getTestEventEnvelope();
                var telemetryInitializer = {
                    onInitializeTelemetry: (envelope) => {
                        return false;
                    }
                }

                this._telemetryContext.onInitializeTelemetry = <any>telemetryInitializer.onInitializeTelemetry;
                var spy = sinon.spy(this._telemetryContext._sender, "send");
                    
                // act
                this._telemetryContext.track(eventEnvelope);

                // verify
                Assert.ok(spy.notCalled, "sender should not be called");
                
                // teardown
                spy.restore();
                this._telemetryContext.onInitializeTelemetry = undefined;
            }
        });

    }


    private getTestEventEnvelope(properties?: Object, measurements?: Object) {
        var event = new Microsoft.ApplicationInsights.Telemetry.Event('Test Event', properties, measurements);
        var eventData = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.Event>(Microsoft.ApplicationInsights.Telemetry.Event.dataType, event);
        var eventEnvelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(eventData, Microsoft.ApplicationInsights.Telemetry.Event.envelopeType);
        return eventEnvelope;
    }
}
new TelemetryContextTests().registerTests();