/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class PublicApiTests extends TestClass {

    private errorSpy;
    private successSpy;
    private loggingSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
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
        this.useFakeServer = true;
        this.useFakeTimers = true;
        this.errorSpy.restore();
        this.successSpy.restore();
        this.loggingSpy.restore();
    }

    public registerTests() {
        var snippet = window["appInsights"];

        /*
        // uncomment this to target prod instead of int
        snippet.endpointUrl = "http://dc.services.visualstudio.com/v2/track";
        snippet.instrumentationKey = "89330895-7c53-4315-a242-85d136ad9c16";
        */

        var delay = snippet.config.maxBatchInterval + 100;
        var testAi = new Microsoft.ApplicationInsights.AppInsights(snippet.config);
        // disable session state event:
        testAi.context._sessionManager._sessionHandler = null;

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
        var pollingCount = 100;
        for (var i = 0; i < pollingCount; i++) {
            asserts.push(() => {
                var message = "polling: " + new Date().toISOString();
                Assert.ok(true, message);
                console.log(message);

                // calling start() causes sinon to resume and ends the async test
                if (this.successSpy.called) {
                    boilerPlateAsserts();
                    this.testCleanup();
                    start();
                } else if (this.errorSpy.called || this.loggingSpy.called) {
                    boilerPlateAsserts();
                    start();
                }
            });
        }

        asserts.push(() => Assert.ok(this.successSpy.called, "success"));

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
                    for (var i = 0; i < 100; i++) {
                        testAi.trackMetric("test" + i, Math.round(100 * Math.random()));
                    }
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