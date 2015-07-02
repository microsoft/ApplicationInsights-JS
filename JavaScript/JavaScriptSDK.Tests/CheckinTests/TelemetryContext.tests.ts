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
            sampleRate: () => 100
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
    }
}
new TelemetryContextTests().registerTests();