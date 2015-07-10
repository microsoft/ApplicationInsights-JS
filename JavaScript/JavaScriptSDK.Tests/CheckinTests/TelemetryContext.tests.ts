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
            name: "TelemtetryContext: constructor initializers sender and ikey",
            test: () => {
                var tc = new Microsoft.ApplicationInsights.TelemetryContext(this._config);
                Assert.ok(tc._sender, "sender is initialized");
                Assert.ok(tc._config.instrumentationKey(), "iKey is initialized");
            }
        });

        this.testCase({
            name: "TelemtetryContext: calling track with null or undefined fails",
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
            name: "TelemtetryContext: does not overwrite user sessioncontext with defaults",
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

        function getEnvelope<T>(item, dataType: string, envelopeType: string) {
            var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data<T>(dataType, item);
            return new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, envelopeType);
        }
        
        this.testCase({
            name: "TelemetryContext: some telemetry types get sampled and some do not",
            test: () => {
                var pageViewCallsCount = 0;
                var eventCallsCount = 0;
                var exceptionCallsCount = 0;
                var metricCallsCount = 0;
                var pageViewPerformanceCallsCount = 0;
                var sessionCallsCount = 0;
                var traceCallsCount = 0;
                var isSampledInSpy = sinon.stub(this._telemetryContext.sample, "isSampledIn",
                    (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => {
                        switch (envelope.name) {
                            case Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType:
                                pageViewCallsCount++;
                                break;
                            case Microsoft.ApplicationInsights.Telemetry.Event.envelopeType:
                                eventCallsCount++;
                                break;
                            case Microsoft.ApplicationInsights.Telemetry.Exception.envelopeType:
                                exceptionCallsCount++;
                                break;
                            case Microsoft.ApplicationInsights.Telemetry.Metric.envelopeType:
                                metricCallsCount++;
                                break;
                            case Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.envelopeType:
                                pageViewPerformanceCallsCount++;
                                break;
                            case Microsoft.ApplicationInsights.Telemetry.SessionTelemetry.envelopeType:
                                sessionCallsCount++;
                                break;
                            case Microsoft.ApplicationInsights.Telemetry.Trace.envelopeType:
                                traceCallsCount++;
                                break;
                            default:
                                break;
                        }
                    });

                var pageViewEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.PageView>(
                    new Microsoft.ApplicationInsights.Telemetry.PageView("asdf", "asdf", 10),
                    Microsoft.ApplicationInsights.Telemetry.PageView.dataType,
                    Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType);
                this._telemetryContext.track(pageViewEnvelope);
                Assert.equal(1, pageViewCallsCount);

                var eventEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.Event>(
                    new Microsoft.ApplicationInsights.Telemetry.Event("asdf"),
                    Microsoft.ApplicationInsights.Telemetry.Event.dataType,
                    Microsoft.ApplicationInsights.Telemetry.Event.envelopeType);
                this._telemetryContext.track(eventEnvelope);                                
                Assert.equal(1, eventCallsCount);

                var exception;
                try {
                    throw new Error("asdf");
                } catch (e) {
                    exception = e;
                }

                var exceptionEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.Exception>(
                    new Microsoft.ApplicationInsights.Telemetry.Exception(exception),
                    Microsoft.ApplicationInsights.Telemetry.Exception.dataType,
                    Microsoft.ApplicationInsights.Telemetry.Exception.envelopeType);
                this._telemetryContext.track(exceptionEnvelope);
                Assert.equal(1, exceptionCallsCount);

                var metricEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.Metric>(
                    new Microsoft.ApplicationInsights.Telemetry.Metric("asdf", 1234),
                    Microsoft.ApplicationInsights.Telemetry.Metric.dataType,
                    Microsoft.ApplicationInsights.Telemetry.Metric.envelopeType);
                this._telemetryContext.track(metricEnvelope);
                Assert.equal(0, metricCallsCount);

                var pageViewPerformanceEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.PageViewPerformance>(
                    new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("adsf", "asdf", 10),
                    Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.dataType,
                    Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.envelopeType);
                this._telemetryContext.track(pageViewPerformanceEnvelope);
                Assert.equal(1, pageViewPerformanceCallsCount);
                
                var sessionEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.SessionTelemetry>(
                    new Microsoft.ApplicationInsights.Telemetry.SessionTelemetry(AI.SessionState.Start),
                    Microsoft.ApplicationInsights.Telemetry.SessionTelemetry.dataType,
                    Microsoft.ApplicationInsights.Telemetry.SessionTelemetry.envelopeType);
                this._telemetryContext.track(sessionEnvelope);
                Assert.equal(0, sessionCallsCount);

                var traceEnvelope = getEnvelope<Microsoft.ApplicationInsights.Telemetry.Trace>(
                    new Microsoft.ApplicationInsights.Telemetry.Trace("afd"),
                    Microsoft.ApplicationInsights.Telemetry.Trace.dataType,
                    Microsoft.ApplicationInsights.Telemetry.Trace.envelopeType);
                this._telemetryContext.track(traceEnvelope);
                Assert.equal(1, traceCallsCount);

                isSampledInSpy.restore();
            }
        });
    }
}
new TelemetryContextTests().registerTests();