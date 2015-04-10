/// <reference path="../../testframework/common.ts" />
/// <reference path="../../testframework/contracttesthelper.ts" />
/// <reference path="../../../JavaScriptSDK/telemetry/pageviewperformance.ts" />

class PageViewPerformanceTelemetryTests extends ContractTestHelper {

    constructor() {
        super(() => new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0), "PageViewPerformanceTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";
        
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
                    var check = Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.checkPageLoad();
                    Assert.equal(undefined, check, "checkPageLoad returns undefined when not available");
            }
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry has correct serialization contract",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);

                Assert.equal("boolean", typeof telemetry.aiDataContract.perfTotal, "perfTotal is set in data contract");
                Assert.equal("boolean", typeof telemetry.aiDataContract.networkConnect, "networkConnect is set in data contract");
                Assert.equal("boolean", typeof telemetry.aiDataContract.receivedResponse, "receivedResponse is set in data contract");
                Assert.equal("boolean", typeof telemetry.aiDataContract.sentRequest, "sentRequest is set in data contract");
                Assert.equal("boolean", typeof telemetry.aiDataContract.domProcessing, "domProcessing is set in data contract");
            }
        });


        this.testCase({
            name: name + "PageViewPerformanceTelemetry measurements are correct",
            test: () => {

                var timing = <PerformanceTiming>{};
                timing.navigationStart = 1;
                timing.connectEnd = 10;
                timing.requestStart = 11;
                timing.responseStart = 30;
                timing.responseEnd = 42;
                timing.domLoading = 52;
                timing.loadEventEnd = 60;

                var timingSpy = sinon.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming",() => {
                    return timing;                  
                });


                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);
                var data = telemetry;

                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(59), data.perfTotal);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(9), data.networkConnect);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(19), data.sentRequest);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(12), data.receivedResponse);
                Assert.equal(Microsoft.ApplicationInsights.Util.msToTimeSpan(8), data.domProcessing);

                timingSpy.restore();
            }
        });

        this.testCase({
            name: name + "PageViewPerformanceTelemetry detects when perf data is sent by the browser incorrectly and doesn't send it",
            test: () => {

                var timing = <PerformanceTiming>{};
                timing.navigationStart = 1;
                timing.connectEnd = 40;
                timing.requestStart = 11;
                timing.responseStart = 30;
                timing.responseEnd = 42;
                timing.domLoading = 52;
                timing.loadEventEnd = 60;

                var timingSpy = sinon.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming",() => {
                    return timing;
                });

                var actualLoggedMessage = null;
                var loggingSpy = sinon.stub(Microsoft.ApplicationInsights._InternalLogging, "warn",(m) => actualLoggedMessage = m);


                var telemetry = new Microsoft.ApplicationInsights.Telemetry.PageViewPerformance("name", "url", 0);
                var data = telemetry;

                Assert.equal(undefined, data.perfTotal);
                Assert.equal(undefined, data.networkConnect);
                Assert.equal(undefined, data.sentRequest);
                Assert.equal(undefined, data.receivedResponse);
                Assert.equal(undefined, data.domProcessing);
                Assert.equal("client performance math error:59 < 39 + 19 + 12 + 8", actualLoggedMessage);

                timingSpy.restore();
                loggingSpy.restore();
               
            }
        });

    }
}
new PageViewPerformanceTelemetryTests().registerTests();
