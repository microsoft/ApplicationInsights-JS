/// <reference path="../../testframework/common.ts" />
/// <reference path="../../testframework/contracttesthelper.ts" />
/// <reference path="../../../JavaScriptSDK/telemetry/pageviewperformance.ts" />

class PageViewPerformanceTelemetryTests extends ContractTestHelper {

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0), "PageViewPerformanceTelemetryTests");
    }

    public testCleanup() {
        // Reset verboseLogging to the default value
        Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => false;
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        this.testCase({
            name: name + "getDuration() calculates a correct duration",
            test: () => {
                var duration = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.getDuration(10, 20);
                Assert.equal(10, duration, "20 - 10 == 10");

                duration = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.getDuration(1, 1);
                Assert.equal(0, duration, "1 - 1 == 0");

                duration = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.getDuration(100, 99);
                Assert.equal(0, duration, "99 - 100 -> 0");
            }
        });

        this.testCase({
            name: name + "getDuration() returns undefined for invalid inputs",
            test: () => {
                var duration = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.getDuration(10, undefined);
                Assert.equal(undefined, duration);

                duration = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.getDuration("ab", 123);
                Assert.equal(undefined, duration);

                duration = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.getDuration(undefined, null);
                Assert.equal(undefined, duration);
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry correct timing data",
            test: () => {

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);

                var isAvailable = window.performance && window.performance.timing; // safari doesn't support this
                if (isAvailable) {
                    Assert.equal(typeof telemetry.perfTotal, "string");
                    Assert.equal(typeof telemetry.networkConnect, "string");
                    Assert.equal(typeof telemetry.receivedResponse, "string");
                    Assert.equal(typeof telemetry.sentRequest, "string");
                    Assert.equal(typeof telemetry.domProcessing, "string");
                } else {
                    var check = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.isPerformanceTimingSupported();
                    Assert.equal(false, check, "isPerformanceTimingSupported returns false when not performance timing is not supported");
                }
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry has correct serialization contract",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);

                Assert.equal(Microsoft.ApplicationInsights.FieldType.Required, telemetry.aiDataContract.ver, "version fields is required");

                // all other fields are optional
                for (var field in telemetry.aiDataContract) {

                    if (field == "ver") {
                        continue;
                    }

                    var contract = telemetry.aiDataContract[field];
                    Assert.notEqual(true, contract.isRequired, field + " is not required");
                }
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry measurements are correct",
            test: () => {

                var timing = {
                    navigationStart: 1,
                    connectEnd: 10,
                    requestStart: 11,
                    responseStart: 30,
                    responseEnd: 42,
                    loadEventEnd: 60,
                };

                var timingSpy = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming", () => {
                    return timing;
                });

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);
                Assert.equal(true, telemetry.getIsValid());

                var data = telemetry;

                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(59), data.perfTotal);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(9), data.networkConnect);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(19), data.sentRequest);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(12), data.receivedResponse);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(18), data.domProcessing);
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry detects when perf data is sent by the browser incorrectly and doesn't send it",
            test: () => {

                var timing = {
                    navigationStart: 1,
                    connectEnd: 40,
                    requestStart: 11,
                    responseStart: 30,
                    responseEnd: 42,
                    loadEventEnd: 60,
                };

                var timingSpy = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming", () => {
                    return timing;
                });

                var actualLoggedMessage = null;
                Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
                var loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "warnToConsole", (m) => actualLoggedMessage = m);

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);
                Assert.equal(false, telemetry.getIsValid());

                var data = telemetry;

                Assert.equal(undefined, data.perfTotal);
                Assert.equal(undefined, data.networkConnect);
                Assert.equal(undefined, data.sentRequest);
                Assert.equal(undefined, data.receivedResponse);
                Assert.equal(undefined, data.domProcessing);

                Assert.equal("AI (Internal): ClientPerformanceMathError message:\"client performance math error.\" props:\"{total:59,network:39,request:19,response:12,dom:18}\"", actualLoggedMessage);
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry is not reporting duration if a request is comming from a Googlebot",
            test: () => {
                // mock user agent
                let originalUserAgent = navigator.userAgent;
                try {
                    this.setUserAgent("Googlebot/2.1");
                } catch (ex) {
                    Assert.ok(true, 'cannot run this test in the current setup - try Chrome');
                    return;
                }

                var timing = {
                    navigationStart: 1,
                    connectEnd: 2,
                    requestStart: 3,
                    responseStart: 30,
                    responseEnd: 42,
                    loadEventEnd: 60,
                };

                var timingSpy = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming", () => {
                    return timing;
                });

                var actualLoggedMessage: string = "";
                Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
                var loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "warnToConsole", (m) => actualLoggedMessage = m);

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);
                Assert.equal(false, telemetry.getIsValid());

                var data = telemetry;

                Assert.equal(undefined, data.perfTotal);
                Assert.equal(undefined, data.networkConnect);
                Assert.equal(undefined, data.sentRequest);
                Assert.equal(undefined, data.receivedResponse);
                Assert.equal(undefined, data.domProcessing);

                timingSpy.restore();
                loggingSpy.restore();

                // restore original user agent
                this.setUserAgent(originalUserAgent);
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry checks if any duration exceeds 1h and don't send it",
            test: () => {
                // see comment PageViewPerformance constructor on how timing data is calculated
                // here we set values, so each metric will be exactly 3600000 (1h).
                let timingModifiers = [(timing) => timing.loadEventEnd = 3600001,
                (timing) => timing.connectEnd = 3600001,
                (timing) => timing.responseStart = 3600003,
                (timing) => timing.responseEnd = 3600030,
                (timing) => timing.loadEventEnd = 3600042];

                for (var i = 0; i < timingModifiers.length; i++) {

                    var timing = {
                        navigationStart: 1,
                        connectEnd: 2,
                        requestStart: 3,
                        responseStart: 30,
                        responseEnd: 42,
                        loadEventEnd: 60,
                    };

                    // change perf timing value
                    timingModifiers[i](timing);

                    var timingSpy = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming", () => {
                        return timing;
                    });

                    var actualLoggedMessage: string = "";
                    Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
                    var loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "warnToConsole", (m) => actualLoggedMessage = m);

                    var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);
                    Assert.equal(false, telemetry.getIsValid());

                    var data = telemetry;

                    Assert.equal(undefined, data.perfTotal);
                    Assert.equal(undefined, data.networkConnect);
                    Assert.equal(undefined, data.sentRequest);
                    Assert.equal(undefined, data.receivedResponse);
                    Assert.equal(undefined, data.domProcessing);

                    if (i === 0) {
                        // check props only for the first timingModifier
                        Assert.equal("AI (Internal): InvalidDurationValue message:\"Invalid page load duration value. Browser perf data won't be sent.\" props:\"{total:3600000,network:1,request:27,response:12,dom:3599959}\"", actualLoggedMessage);
                    } else {
                        Assert.ok(actualLoggedMessage.lastIndexOf("AI (Internal): InvalidDurationValue message:\"Invalid page load duration value. Browser perf data won't be sent.", 0) === 0);
                    }

                    timingSpy.restore();
                    loggingSpy.restore();
                }
            }
        });
    }
}
new PageViewPerformanceTelemetryTests().registerTests();
