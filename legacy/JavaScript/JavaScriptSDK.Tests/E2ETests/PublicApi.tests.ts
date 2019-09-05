/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Initialization.ts" />

class PublicApiTests extends TestClass {

    public errorSpy: SinonSpy;
    public successSpy: SinonSpy;
    public loggingSpy: SinonSpy;

    private delay: number;
    private testAi: Microsoft.ApplicationInsights.AppInsights;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();

        this.errorSpy = this.sandbox.spy(this.testAi.context._sender, "_onError");
        this.successSpy = this.sandbox.stub(this.testAi.context._sender, "_onSuccess");
        this.loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
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
        config.instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";

        this.delay = config.maxBatchInterval + 100;
        this.testAi = new Microsoft.ApplicationInsights.AppInsights(config);

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
            stepDelay: this.delay,
            steps: [
                () => {
                    this.testAi.trackEvent("test");
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track exception",
            stepDelay: this.delay,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                        this.testAi.trackException(e);
                    }

                    Assert.ok(exception);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track metric",
            stepDelay: this.delay,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (var i = 0; i < 100; i++) {
                        this.testAi.trackMetric("test" + i, Math.round(100 * Math.random()));
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track trace",
            stepDelay: this.delay,
            steps: [
                () => {
                    this.testAi.trackTrace("test");
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view",
            stepDelay: this.delay,
            steps: [
                () => {
                    this.testAi.trackPageView();
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: this.delay,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    this.testAi.trackEvent("test");
                    this.testAi.trackException(exception);
                    this.testAi.trackMetric("test", Math.round(100 * Math.random()));
                    this.testAi.trackTrace("test");
                    this.testAi.trackPageView();
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: this.delay,
            steps: [
                () => {
                    for (var i = 0; i < 100; i++) {
                        this.testAi.trackMetric("test", Math.round(100 * Math.random()));
                    }
                }
            ].concat(asserts)
        });
    }
}
new PublicApiTests().registerTests();