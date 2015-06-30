/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/initialization.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class DisableTelemetryTests extends TestClass {

    private errorSpy;
    private successSpy;
    private loggingSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        console.log("initialize");
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();
        this.errorSpy = sinon.spy(Microsoft.ApplicationInsights.Sender, "_onError");
        this.successSpy = sinon.stub(Microsoft.ApplicationInsights.Sender, "_onSuccess");
        this.loggingSpy = sinon.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        console.log("cleanup");
        this.useFakeServer = true;
        this.useFakeTimers = true;
        this.errorSpy.restore();
        this.successSpy.restore();
        this.loggingSpy.restore();
    }

    public registerTests() {
        var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        config.maxBatchInterval = 1000;
        config.endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        config.instrumentationKey = "89330895-7c53-4315-a242-85d136ad9c16";
        /*
        // uncomment this to target prod instead of int
        snippet.endpointUrl = "http://dc.services.visualstudio.com/v2/track";
        snippet.instrumentationKey = "89330895-7c53-4315-a242-85d136ad9c16";
        */

        var delay = config.maxBatchInterval + 10;

        var boilerPlateAsserts = () => {
            Assert.ok(this.successSpy.called, "success");
            Assert.ok(!this.errorSpy.called, "no error sending");
            var isValidCallCount = this.loggingSpy.callCount === 0;
            Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
            if (!isValidCallCount) {
                while (this.loggingSpy.args.length) {
                    Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
                }
            }
        }

        var asserts = () => {
            var message = "polling: " + new Date().toISOString();
            Assert.ok(true, message);
            console.log(message);

            if (this.successSpy.called) {
                boilerPlateAsserts();
                this.testCleanup();
            } else if (this.errorSpy.called || this.loggingSpy.called) {
                boilerPlateAsserts();
            }
        }
        
        var assertNoMessages = () => {
            var message = "polling for no messages: " + new Date().toISOString();
            Assert.ok(true, message);
            console.log(message);

            // calling start() causes sinon to resume and ends the async test
            if (this.successSpy.called) {
                Assert.ok(false, "should not have received a success");
                this.testCleanup();
            } else if (this.errorSpy.called || this.loggingSpy.called) {
                Assert.ok(false, "should not have received an error or logging");
            }
        }

        this.testCaseAsync({
            name: "TelemetryContext: master switch disables tracking",
            stepDelay: delay,
            steps: [
                () => {
                    var testAiNoMessages = new Microsoft.ApplicationInsights.AppInsights(config);
                    testAiNoMessages.config.disableTelemetry = true;

                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    testAiNoMessages.trackEvent("test");
                    testAiNoMessages.trackException(exception);
                    testAiNoMessages.trackMetric("test", Math.round(100 * Math.random()));
                    testAiNoMessages.trackTrace("test");
                    testAiNoMessages.trackPageView();
                }
            ].concat(assertNoMessages)
        });

        this.testCaseAsync({
            name: "TelemetryContext: master switch disables and enables tracking",
            stepDelay: delay,
            steps: [
                () => {
                    var testAiNoMessages = new Microsoft.ApplicationInsights.AppInsights(config);
                    testAiNoMessages.config.disableTelemetry = true;

                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    testAiNoMessages.trackEvent("test");
                    testAiNoMessages.trackException(exception);
                    testAiNoMessages.trackMetric("test", Math.round(100 * Math.random()));
                    testAiNoMessages.trackTrace("test");
                    testAiNoMessages.trackPageView();
                }
            ].concat(assertNoMessages).concat([
                () => {
                    var testAi = new Microsoft.ApplicationInsights.AppInsights(config);
                    testAi.config.disableTelemetry = false;

                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    testAi.trackEvent("test");
                    testAi.trackException(exception);
                    testAi.trackMetric("test", Math.round(100 * Math.random()));
                    testAi.trackTrace("test");
                    testAi.trackPageView();
                }
            ]).concat(asserts)
        });
    }
}
new DisableTelemetryTests().registerTests();