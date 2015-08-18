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
            name: "TelemetryContext: onBeforeSendTelemetry is called within track() and gets the envelope as an argument",
            test: () => {
                var eventEnvelope = this.getTestEventEnvelope();

                var telemetryInitializer = {
                    initializer: (envelope) => { }
                }
                var spy = sinon.spy(telemetryInitializer, "onBeforeSendTelemetry");
                this._telemetryContext.addTelemetryInitializer(<any>telemetryInitializer.initializer);
                    
                // act
                (<any>this._telemetryContext)._track(eventEnvelope);

                // verify
                Assert.ok(spy.calledOnce, "telemetryInitializer was called");
                Assert.ok(eventEnvelope === spy.args[0][0]);

                // teardown
                spy.restore();
                (<any>this._telemetryContext).telemetryInitializers = undefined;
            }
        });

        this.testCase({
            name: "TelemetryContext: onBeforeSendTelemetry changes the envelope props and sender gets them",
            test: () => {
                var nameOverride = "my unique name";
                var eventEnvelope = this.getTestEventEnvelope();
                Assert.notEqual(eventEnvelope.name, nameOverride);
                var telemetryInitializer = {
                    initializer: (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => {
                        envelope.name = nameOverride;
                        return true;
                    }
                }

                this._telemetryContext.addTelemetryInitializer(<any>telemetryInitializer.initializer);
                var stub = sinon.stub(this._telemetryContext._sender, "send");
                    
                // act
                (<any>this._telemetryContext)._track(eventEnvelope);

                // verify
                Assert.ok(stub.calledOnce, "sender was called");
                Assert.ok(eventEnvelope === stub.args[0][0]);
                Assert.equal(nameOverride,
                    (<Microsoft.ApplicationInsights.Telemetry.Common.Envelope>stub.args[0][0]).name);

                // teardown
                stub.restore();
                (<any>this._telemetryContext).telemetryInitializers = undefined;
            }
        });

        this.testCase({
            name: "TelemetryContext: telemetryInitializers array is null (not initialized) means envelope goes straight to the sender",
            test: () => {
                var eventEnvelope = this.getTestEventEnvelope();
                var stub = sinon.stub(this._telemetryContext._sender, "send");
                    
                // act
                (<any>this._telemetryContext)._track(eventEnvelope);

                // verify
                Assert.ok(stub.calledOnce, "sender was called");
                Assert.ok(eventEnvelope === stub.args[0][0]);

                // teardown
                stub.restore();
            }
        });
        
        this.testCase({
            name: "TelemetryContext: telemetry initializer can modify the contents of an envelope",
            test: () => {
                var eventEnvelope = this.getTestEventEnvelope();
                var telemetryInitializer = {
                    // This illustrates how to use telemetry initializer (onBeforeSendTelemetry) 
                    // to access/ modify the contents of an envelope.
                    init: (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => {
                        envelope.deviceId = "my device id";
                        if (envelope.name ==
                            Microsoft.ApplicationInsights.Telemetry.Event.envelopeType) {
                            var telemetryItem = (<any>envelope.data).baseData;
                            telemetryItem.name = "my name";
                            telemetryItem.properties["prop1"] = "val1";
                        }
                    }
                }

                this._telemetryContext.addTelemetryInitializer(<any>telemetryInitializer.init);
                var stub = sinon.stub(this._telemetryContext._sender, "send");
                    
                // act
                (<any>this._telemetryContext)._track(eventEnvelope);

                // verify
                Assert.ok(stub.calledOnce, "sender should be called");
                Assert.equal("my device id", (<any>stub.args[0][0]).deviceId);
                Assert.equal("my name", (<any>stub.args[0][0]).baseData.name);
                Assert.equal("val1", (<any>stub.args[0][0]).baseData.properties["prop1"]);
                
                // teardown
                stub.restore();
                (<any>this._telemetryContext).telemetryInitializers = undefined;
            }
        });

        this.testCase({
            name: "TelemetryContext: all added telemetry initializers get invoked",
            test: () => {
                // prepare
                var eventEnvelope = this.getTestEventEnvelope();                
                var initializer1 = { init: () => { } };                
                var initializer2 = { init: () => { } };
                var spy1 = sinon.spy(initializer1, "init");
                var spy2 = sinon.spy(initializer2, "init");

                // act
                this._telemetryContext.addTelemetryInitializer(<any>initializer1.init);
                this._telemetryContext.addTelemetryInitializer(<any>initializer2.init);
                
                (<any>this._telemetryContext)._track(eventEnvelope);

                // verify
                Assert.ok(spy1.calledOnce);
                Assert.ok(spy2.calledOnce);

                // tear down
                (<any>this._telemetryContext).telemetryInitializers = undefined;
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