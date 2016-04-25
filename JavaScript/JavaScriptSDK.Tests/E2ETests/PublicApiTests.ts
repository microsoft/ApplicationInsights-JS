/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />
/// <reference path="../../javascriptsdk/initialization.ts" />

class PublicApiTests extends TestClass {

    public errorSpy;
    public successSpy;
    public loggingSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();
        this.errorSpy = this.sandbox.spy(Microsoft.ApplicationInsights.Sender, "_onError");
        this.successSpy = this.sandbox.stub(Microsoft.ApplicationInsights.Sender, "_onSuccess");
        this.loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {
        var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        config.maxBatchInterval = 100;
        config.endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        config.instrumentationKey = "3e6a441c-b52b-4f39-8944-f81dd6c2dc46";

        var delay = config.maxBatchInterval + 100;
        var testAi = new Microsoft.ApplicationInsights.AppInsights(config);        

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

        var asserts = [];
        asserts.push(() => {
            var message = "polling: " + new Date().toISOString();
            Assert.ok(true, message);
            console.log(message);

            if (this.successSpy.called) {
                boilerPlateAsserts();
                this.testCleanup();
            } else if (this.errorSpy.called || this.loggingSpy.called) {
                boilerPlateAsserts();
            }
        });
        
        asserts.push(PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "* checking success spy " + new Date().toISOString());
                return this.successSpy.called;
            }, "sender succeeded")
        );

        this.testCaseAsync({
            name: "TelemetryContext: track event",
            stepDelay: delay,
            steps: [
                () => {
                    testAi.trackEvent("test");
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track exception",
            stepDelay: delay,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                        testAi.trackException(e);
                    }

                    Assert.ok(exception);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track metric",
            stepDelay: delay,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (var i = 0; i < 100; i++) {
                        testAi.trackMetric("test" + i, Math.round(100 * Math.random()));
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track trace",
            stepDelay: delay,
            steps: [
                () => {
                    testAi.trackTrace("test");
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view",
            stepDelay: delay,
            steps: [
                () => {
                    testAi.trackPageView();
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: delay,
            steps: [
                () => {
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
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: delay,
            steps: [
                () => {
                    for (var i = 0; i < 100; i++) {
                        testAi.trackMetric("test", Math.round(100 * Math.random()));
                    }
                }
            ].concat(asserts)
        });
    }
}
new PublicApiTests().registerTests();